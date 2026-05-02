import {
  BadRequestException,
  ConflictException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, inArray } from 'drizzle-orm';
import { db } from '@/db';
import { matchPlayerRecords, rooms, users } from '@/db/schema';
import type { TournamentRosterTeam } from '@/db/schema';
import { errorResponse, successResponse } from '@/utils';
import type { SuccessResponse } from '@/types';
import { GameGateway } from '@/modules/gateway/game.gateway';
import { env } from '@/env';
import {
  CheckUserDataDto,
  CreateMatchDataDto,
  CreateMatchDto,
  MatchResultsDataDto,
  MatchStatus,
  MatchTeamDto,
  StartMatchDataDto,
} from '../dto';

const ROOM_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const ROOM_CODE_LENGTH = 6;

@Injectable()
export class YalgamersService {
  constructor(private readonly gameGateway: GameGateway) {}

  async checkUserExists(userName: string): Promise<SuccessResponse<CheckUserDataDto>> {
    const user = await db.query.users.findFirst({
      where: eq(users.userName, userName),
      columns: { id: true },
    });

    return successResponse(
      { exists: Boolean(user) },
      'User existence checked successfully',
      HttpStatus.OK,
    );
  }

  async createMatch(dto: CreateMatchDto): Promise<SuccessResponse<CreateMatchDataDto>> {
    if (dto.matchType === 'solo') {
      const offending = dto.teams.filter((t) => t.players.length !== 1);
      if (offending.length > 0) {
        throw new BadRequestException(
          errorResponse(
            'Solo matches must have exactly one player per team',
            HttpStatus.BAD_REQUEST,
            'BadRequestException',
            { teamIds: offending.map((t) => t.teamId) },
          ),
        );
      }
    } else if (dto.matchType === 'squad') {
      if (dto.teams.length !== 2) {
        throw new BadRequestException(
          errorResponse(
            'Squad matches must have exactly two teams (Red and Blue)',
            HttpStatus.BAD_REQUEST,
            'BadRequestException',
            { received: dto.teams.length },
          ),
        );
      }
    }

    const seenTeamIds = new Set<string>();
    for (const team of dto.teams) {
      if (seenTeamIds.has(team.teamId)) {
        throw new BadRequestException(
          errorResponse(
            `Duplicate teamId "${team.teamId}"`,
            HttpStatus.BAD_REQUEST,
            'BadRequestException',
          ),
        );
      }
      seenTeamIds.add(team.teamId);
    }

    const allUserNames = dto.teams.flatMap((t) => t.players);
    const uniqueUserNames = Array.from(new Set(allUserNames));
    // if (uniqueUserNames.length !== allUserNames.length) {
    //   const duplicates = allUserNames.filter((u, i) => allUserNames.indexOf(u) !== i);
    //   throw new BadRequestException(
    //     errorResponse(
    //       'A player cannot appear on more than one team',
    //       HttpStatus.BAD_REQUEST,
    //       'BadRequestException',
    //       { duplicates: Array.from(new Set(duplicates)) },
    //     ),
    //   );
    // }

    // const existingMatch = await db.query.rooms.findFirst({
    //   where: and(
    //     eq(rooms.tournamentId, dto.tournamentId),
    //     eq(rooms.roundNumber, dto.roundNumber),
    //     isNotNull(rooms.tournamentId),
    //   ),
    //   columns: { id: true },
    // });
    // if (existingMatch) {
    //   throw new ConflictException(
    //     errorResponse(
    //       'Match already exists for this tournament/round combination',
    //       HttpStatus.CONFLICT,
    //       'ConflictException',
    //       { tournamentId: dto.tournamentId, roundNumber: dto.roundNumber },
    //     ),
    //   );
    // }

    const foundUsers = await db
      .select({
        id: users.id,
        userName: users.userName,
        fullName: users.fullName,
        profileImage: users.profileImage,
      })
      .from(users)
      .where(inArray(users.userName, uniqueUserNames));

    const userMap = new Map(foundUsers.map((u) => [u.userName, u]));
    const missing = uniqueUserNames.filter((u) => !userMap.has(u));
    if (missing.length > 0) {
      throw new BadRequestException(
        errorResponse(
          'One or more usernames were not found',
          HttpStatus.BAD_REQUEST,
          'BadRequestException',
          { unknownUsernames: missing },
        ),
      );
    }

    const hostUserId = userMap.get(dto.teams[0].players[0])!.id;
    const gameMode: 'SOLO' | 'TEAM' = dto.matchType === 'solo' ? 'SOLO' : 'TEAM';
    const maxPlayers = allUserNames.length;

    const roster: TournamentRosterTeam[] = dto.teams.map((team, idx) => ({
      teamId: team.teamId,
      teamName: team.teamName,
      color: dto.matchType === 'squad' ? (idx === 0 ? 'RED' : 'BLUE') : null,
      players: team.players.map((userName) => {
        const u = userMap.get(userName)!;
        return {
          userId: u.id,
          userName: u.userName,
          displayName: u.fullName?.trim() ? u.fullName : u.userName,
          avatarUrl: u.profileImage ?? null,
        };
      }),
    }));

    const code = await this.generateUniqueRoomCode();

    let createdRoom;
    try {
      const inserted = await db
        .insert(rooms)
        .values({
          code,
          hostUserId,
          gameMode,
          maxPlayers,
          status: 'LOBBY',
          tournamentId: dto.tournamentId,
          roundNumber: dto.roundNumber,
          tournamentRoster: roster,
        })
        .returning();
      createdRoom = inserted[0];
    } catch (err) {
      const isUniqueViolation =
        typeof err === 'object' &&
        err !== null &&
        'code' in err &&
        (err as { code: string }).code === '23505';
      if (isUniqueViolation) {
        throw new ConflictException(
          errorResponse(
            'Match already exists for this tournament/round combination',
            HttpStatus.CONFLICT,
            'ConflictException',
          ),
        );
      }
      throw err;
    }
    if (!createdRoom) {
      throw new InternalServerErrorException(errorResponse('Failed to create tournament match'));
    }

    const responseTeams: MatchTeamDto[] = roster.map((team) => ({
      teamId: team.teamId,
      teamName: team.teamName,
      players: team.players.map((p) => ({
        userName: p.userName,
        displayName: p.displayName,
        avatarUrl: p.avatarUrl,
      })),
    }));

    const data: CreateMatchDataDto = {
      matchId: createdRoom.id,
      status: 'pending',
      matchType: dto.matchType,
      matchUrl: `${env.CLIENT_URL}/lobby/${createdRoom.code}`,
      teams: responseTeams,
    };

    return successResponse(data, 'Match created successfully', HttpStatus.CREATED);
  }

  async startMatch(matchId: string): Promise<SuccessResponse<StartMatchDataDto>> {
    const room = await this.findTournamentRoom(matchId);

    if (room.status !== 'LOBBY') {
      throw new BadRequestException(
        errorResponse(
          `Match cannot be started — current status is "${this.statusToWire(room.status)}"`,
          HttpStatus.BAD_REQUEST,
          'BadRequestException',
        ),
      );
    }

    try {
      await this.gameGateway.startTournamentMatch(room as never);
    } catch (err) {
      throw new BadRequestException(
        errorResponse(
          (err as Error).message ?? 'Match cannot be started',
          HttpStatus.BAD_REQUEST,
          'BadRequestException',
        ),
      );
    }

    return successResponse(
      { success: true, message: 'Match started successfully' },
      'Match started successfully',
      HttpStatus.OK,
    );
  }

  async getMatchResults(matchId: string): Promise<SuccessResponse<MatchResultsDataDto>> {
    const room = await this.findTournamentRoom(matchId);
    const status = this.statusToWire(room.status);

    if (status !== 'completed') {
      return successResponse(
        { matchId: room.id, status, winner: null },
        'Match results fetched',
        HttpStatus.OK,
      );
    }

    const winnerRows = await db
      .select({ userId: matchPlayerRecords.userId })
      .from(matchPlayerRecords)
      .where(and(eq(matchPlayerRecords.roomId, room.id), eq(matchPlayerRecords.outcome, 'WIN')));

    if (winnerRows.length === 0) {
      return successResponse(
        { matchId: room.id, status, winner: null },
        'Match results fetched',
        HttpStatus.OK,
      );
    }

    const winnerUserId = winnerRows[0].userId;
    const winningTeam = (room.tournamentRoster ?? []).find((t) =>
      t.players.some((p) => p.userId === winnerUserId),
    );
    if (!winningTeam) {
      throw new InternalServerErrorException(
        errorResponse('Winner could not be mapped back to a roster team'),
      );
    }

    return successResponse(
      {
        matchId: room.id,
        status,
        winner: {
          teamId: winningTeam.teamId,
          teamName: winningTeam.teamName,
          players: winningTeam.players.map((p) => p.userName),
        },
      },
      'Match results fetched',
      HttpStatus.OK,
    );
  }

  private async findTournamentRoom(matchId: string): Promise<typeof rooms.$inferSelect> {
    if (!this.isUuid(matchId)) {
      throw new NotFoundException(
        errorResponse('Match not found', HttpStatus.NOT_FOUND, 'NotFoundException'),
      );
    }
    const room = await db.query.rooms.findFirst({ where: eq(rooms.id, matchId) });
    if (!room || !room.tournamentRoster) {
      throw new NotFoundException(
        errorResponse('Match not found', HttpStatus.NOT_FOUND, 'NotFoundException'),
      );
    }
    return room;
  }

  private statusToWire(status: 'LOBBY' | 'PLAYING' | 'FINISHED'): MatchStatus {
    if (status === 'LOBBY') return 'pending';
    if (status === 'PLAYING') return 'running';
    return 'completed';
  }

  private isUuid(v: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
  }

  private async generateUniqueRoomCode(): Promise<string> {
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = Array.from({ length: ROOM_CODE_LENGTH }, () =>
        ROOM_CODE_CHARS.charAt(Math.floor(Math.random() * ROOM_CODE_CHARS.length)),
      ).join('');

      const existing = await db
        .select({ id: rooms.id })
        .from(rooms)
        .where(eq(rooms.code, code))
        .limit(1);

      if (existing.length === 0) return code;
    }
    throw new InternalServerErrorException(
      errorResponse('Could not generate a unique room code — try again'),
    );
  }
}
