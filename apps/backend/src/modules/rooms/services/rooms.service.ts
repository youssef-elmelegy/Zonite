import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, desc, sql } from 'drizzle-orm';
import type { SuccessResponse, PaginatedResponse, PaginatedData } from '@/types';
import { successResponse } from '@/utils';
import * as dbSchema from '@/db/schema';
import { rooms } from '@/db/schema';
import { GameMode, GameStatus } from '@zonite/shared';
import { PaginationQueryDto } from '@/common/dto';
import type { CreateRoomDto } from '../dto/create-room.dto';
import type { UpdateRoomDto } from '../dto/update-room.dto';
import { RoomResponseDto } from '../dto/room-response.dto';

@Injectable()
export class RoomsService {
  private static readonly CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  private static readonly CODE_LENGTH = 6;

  constructor(@Inject('DB') private readonly db: NodePgDatabase<typeof dbSchema>) {}

  async create(hostUserId: string, dto: CreateRoomDto): Promise<SuccessResponse<RoomResponseDto>> {
    const code = await this.generateUniqueCode();
    const rows = await this.db
      .insert(rooms)
      .values({
        code,
        hostUserId,
        gameMode: (dto.gameMode ?? GameMode.SOLO) as 'SOLO' | 'TEAM',
        gridSize: dto.gridSize ?? 12,
        durationSeconds: dto.durationSeconds ?? 60,
        maxPlayers: dto.maxPlayers ?? 6,
      })
      .returning();
    const created = rows.at(0);
    if (!created) throw new InternalServerErrorException('Failed to create room');
    return successResponse(this.toDto(created), 'Room created', 201);
  }

  async findByCode(code: string): Promise<SuccessResponse<RoomResponseDto>> {
    const room = await this.getRoom(code);
    return successResponse(this.toDto(room), 'Room fetched');
  }

  async list(query: PaginationQueryDto): Promise<PaginatedResponse<RoomResponseDto>> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const offset = (page - 1) * pageSize;

    const [countRows, items] = await Promise.all([
      this.db
        .select({ total: sql<number>`count(*)::int` })
        .from(rooms)
        .where(eq(rooms.status, 'LOBBY')),
      this.db
        .select()
        .from(rooms)
        .where(eq(rooms.status, 'LOBBY'))
        .orderBy(desc(rooms.createdAt))
        .limit(pageSize)
        .offset(offset),
    ]);

    const total = countRows.at(0)?.total ?? 0;
    const paginatedData: PaginatedData<RoomResponseDto> = {
      items: items.map((r) => this.toDto(r)),
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize) || 1,
    };

    return successResponse(paginatedData, 'Rooms fetched');
  }

  async update(
    code: string,
    hostUserId: string,
    dto: UpdateRoomDto,
  ): Promise<SuccessResponse<RoomResponseDto>> {
    const room = await this.getRoom(code);

    if (room.hostUserId !== hostUserId) {
      throw new ForbiddenException('Only the host can modify this room');
    }
    if (room.status !== GameStatus.LOBBY) {
      throw new BadRequestException('Room config can only be changed while in LOBBY status');
    }

    const updateData: Partial<{
      gameMode: 'SOLO' | 'TEAM';
      gridSize: number;
      durationSeconds: number;
      maxPlayers: number;
    }> = {};

    if (dto.gameMode !== undefined) updateData.gameMode = dto.gameMode as 'SOLO' | 'TEAM';
    if (dto.gridSize !== undefined) updateData.gridSize = dto.gridSize;
    if (dto.durationSeconds !== undefined) updateData.durationSeconds = dto.durationSeconds;
    if (dto.maxPlayers !== undefined) updateData.maxPlayers = dto.maxPlayers;

    if (Object.keys(updateData).length === 0) {
      return successResponse(this.toDto(room), 'Nothing to update');
    }

    const rows = await this.db
      .update(rooms)
      .set(updateData)
      .where(eq(rooms.code, code.toUpperCase()))
      .returning();

    const updated = rows.at(0);
    if (!updated) throw new NotFoundException(`Room ${code} not found`);
    return successResponse(this.toDto(updated), 'Room updated');
  }

  async getRoomRow(code: string): Promise<typeof rooms.$inferSelect> {
    return this.getRoom(code);
  }

  async transitionToPlaying(code: string): Promise<typeof rooms.$inferSelect> {
    const rows = await this.db
      .update(rooms)
      .set({ status: 'PLAYING', startedAt: new Date() })
      .where(eq(rooms.code, code.toUpperCase()))
      .returning();
    const room = rows.at(0);
    if (!room) throw new NotFoundException(`Room "${code}" not found`);
    return room;
  }

  async transitionToFinished(code: string): Promise<void> {
    await this.db
      .update(rooms)
      .set({ status: 'FINISHED', endedAt: new Date() })
      .where(eq(rooms.code, code.toUpperCase()));
  }

  async resetToLobby(code: string, hostUserId: string): Promise<void> {
    const room = await this.getRoom(code);
    if (room.hostUserId !== hostUserId) {
      throw new ForbiddenException('Only the host can reset the room');
    }
    await this.db
      .update(rooms)
      .set({ status: 'LOBBY', startedAt: null, endedAt: null })
      .where(eq(rooms.code, code.toUpperCase()));
  }

  async remove(code: string, hostUserId: string): Promise<SuccessResponse<null>> {
    const room = await this.getRoom(code);

    if (room.hostUserId !== hostUserId) {
      throw new ForbiddenException('Only the host can close this room');
    }

    await this.db.delete(rooms).where(eq(rooms.code, code.toUpperCase()));
    return successResponse(null, 'Room closed');
  }

  private async getRoom(code: string): Promise<typeof rooms.$inferSelect> {
    const rows = await this.db
      .select()
      .from(rooms)
      .where(eq(rooms.code, code.toUpperCase()))
      .limit(1);
    const room = rows.at(0);
    if (!room) throw new NotFoundException(`Room "${code}" not found`);
    return room;
  }

  private async generateUniqueCode(): Promise<string> {
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = Array.from({ length: RoomsService.CODE_LENGTH }, () =>
        RoomsService.CODE_CHARS.charAt(Math.floor(Math.random() * RoomsService.CODE_CHARS.length)),
      ).join('');

      const existing = await this.db
        .select({ id: rooms.id })
        .from(rooms)
        .where(eq(rooms.code, code))
        .limit(1);

      if (existing.length === 0) return code;
    }
    throw new InternalServerErrorException('Could not generate a unique room code — try again');
  }

  private toDto(room: typeof rooms.$inferSelect): RoomResponseDto {
    const dto = new RoomResponseDto();
    dto.id = room.id;
    dto.code = room.code;
    dto.status = room.status as GameStatus;
    dto.hostUserId = room.hostUserId;
    dto.gameMode = room.gameMode as GameMode;
    dto.gridSize = room.gridSize;
    dto.durationSeconds = room.durationSeconds;
    dto.maxPlayers = room.maxPlayers;
    dto.createdAt = room.createdAt.toISOString();
    dto.startedAt = room.startedAt?.toISOString() ?? null;
    dto.endedAt = room.endedAt?.toISOString() ?? null;
    return dto;
  }
}
