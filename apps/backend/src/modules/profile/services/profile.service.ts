import { ConflictException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { eq, desc, count, sql } from 'drizzle-orm';
import { db } from '@/db';
import { users, matchPlayerRecords, rooms } from '@/db/schema';
import { errorResponse, successResponse } from '@/utils';
import { PaginationQueryDto } from '@/common/dto';
import type { SuccessResponse, PaginatedResponse, PaginatedData } from '@/types';
import type { Results } from '@zonite/shared';
import { EmailService } from '@/common/services';
import {
  DeleteProfileResponseDto,
  GetProfileInfoDto,
  UpdateProfileEmailDto,
  UpdateProfileInfoDto,
} from '../dto';

type MatchPlayerRecordsItem = {
  id: string;
  won: boolean;
  mode: 'SOLO' | 'TEAM';
  gridSize: number;
  roomCode: string | null;
  blocksClaimed: number;
  xpEarned: number;
  playedAt: string;
};

@Injectable()
export class ProfileService {
  constructor(private readonly emailService: EmailService) {}

  // async getProfile(userId: string): Promise<SuccessResponse<ProfileResponse>> {
  //   const userRows = await db.select().from(users).where(eq(users.id, userId)).limit(1);

  //   const user = userRows[0];
  //   if (!user) throw new Error('User not found');

  //   const [statsRows, streakRows] = await Promise.all([
  //     db
  //       .select({
  //         matches: count(),
  //         wins: sum(sql<number>`CASE WHEN ${matchPlayerRecords.won} THEN 1 ELSE 0 END`),
  //         blocksClaimed: sum(matchPlayerRecords.blocksClaimed),
  //       })
  //       .from(matchPlayerRecords)
  //       .where(eq(matchPlayerRecords.userId, userId)),
  //     db
  //       .select({ won: matchPlayerRecords.won })
  //       .from(matchPlayerRecords)
  //       .where(eq(matchPlayerRecords.userId, userId))
  //       .orderBy(desc(matchPlayerRecords.playedAt))
  //       .limit(100),
  //   ]);

  //   const statsRow = statsRows[0];
  //   const matches = statsRow?.matches ?? 0;
  //   const wins = Number(statsRow?.wins ?? 0);
  //   const blocksClaimed = Number(statsRow?.blocksClaimed ?? 0);

  //   let currentStreak = 0;
  //   for (const row of streakRows) {
  //     if (row.won) currentStreak++;
  //     else break;
  //   }

  //   return successResponse({
  //     id: user.id,
  //     fullName: user.fullName,
  //     email: user.email,
  //     xp: user.xp,
  //     joinedAt: user.createdAt.toISOString(),
  //     stats: { matches, wins, blocksClaimed, currentStreak },
  //   });
  // }

  async getmatchPlayerRecords(
    userId: string,
    query: PaginationQueryDto,
  ): Promise<PaginatedResponse<MatchPlayerRecordsItem>> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const offset = (page - 1) * pageSize;

    const [countRows, items] = await Promise.all([
      db
        .select({ total: count() })
        .from(matchPlayerRecords)
        .where(eq(matchPlayerRecords.userId, userId)),
      db
        .select({
          id: matchPlayerRecords.id,
          won: matchPlayerRecords.won,
          gameMode: matchPlayerRecords.gameMode,
          gridSize: matchPlayerRecords.gridSize,
          roomCode: rooms.code,
          blocksClaimed: matchPlayerRecords.blocksClaimed,
          xpEarned: matchPlayerRecords.xpEarned,
          playedAt: matchPlayerRecords.playedAt,
        })
        .from(matchPlayerRecords)
        .leftJoin(rooms, eq(matchPlayerRecords.roomId, rooms.id))
        .where(eq(matchPlayerRecords.userId, userId))
        .orderBy(desc(matchPlayerRecords.playedAt))
        .limit(pageSize)
        .offset(offset),
    ]);

    const total = countRows[0]?.total ?? 0;
    const paginatedData: PaginatedData<MatchPlayerRecordsItem> = {
      items: items.map((row) => ({
        id: row.id,
        won: row.won,
        mode: row.gameMode,
        gridSize: row.gridSize,
        roomCode: row.roomCode ?? null,
        blocksClaimed: row.blocksClaimed,
        xpEarned: row.xpEarned,
        playedAt: row.playedAt.toISOString(),
      })),
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize) || 1,
    };

    return successResponse(paginatedData, 'Match history fetched');
  }

  async recordMatchResults(results: Results, roomId: string): Promise<void> {
    if (results.playerRankings.length === 0) return;

    const insertions = results.playerRankings.map((player) => {
      const won =
        results.gameMode === 'SOLO'
          ? player.rank === 1
          : results.teamRankings !== null &&
            results.teamRankings[0]?.teamColor === player.teamColor;

      const xpEarned = 10 * player.score + (won ? 50 : 0);

      return {
        userId: player.playerId,
        roomId,
        gameMode: results.gameMode as 'SOLO' | 'TEAM',
        gridSize: results.size,
        playerStatus: 'READY' as const,
        won,
        blocksClaimed: player.score,
        xpEarned,
      };
    });

    await db.insert(matchPlayerRecords).values(insertions);

    for (const row of insertions) {
      await db
        .update(users)
        .set({ xp: sql`${users.xp} + ${row.xpEarned}` })
        .where(eq(users.id, row.userId));
    }
  }

  async getProfileInfo(userId: string): Promise<SuccessResponse<GetProfileInfoDto>> {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      throw new NotFoundException(
        errorResponse('User not found', HttpStatus.NOT_FOUND, 'NotFoundException'),
      );
    }

    const data: GetProfileInfoDto = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      profileImage: user.profileImage ?? undefined,
      xp: user.xp,
      level: user.level,
      totalWins: user.totalWins ?? 0,
      totalBlocksMined: user.totalBlocksMined ?? 0,
      totalMatchesPlayed: user.totalMatchesPlayed ?? 0,
      currentWinStreak: user.currentWinStreak ?? 0,
      dateOfBirth: user.dateOfBirth ? user.dateOfBirth.split('T')[0] : '',
    };

    const response = successResponse(data, 'Profile retrieved successfully', HttpStatus.OK);
    return response;
  }

  async updateProfileInfo(
    userId: string,
    dto: UpdateProfileInfoDto,
  ): Promise<SuccessResponse<GetProfileInfoDto>> {
    const { profileImage, ...userFields } = dto;

    const userUpdates: Record<string, unknown> = {};
    if (userFields.fullName !== undefined) userUpdates.fullName = userFields.fullName;
    if (userFields.dateOfBirth !== undefined) userUpdates.dateOfBirth = userFields.dateOfBirth;
    if (profileImage !== undefined) userUpdates.profileImage = profileImage;

    await Promise.all([
      Object.keys(userUpdates).length > 0
        ? db
            .update(users)
            .set({ ...userUpdates, updatedAt: new Date() })
            .where(eq(users.id, userId))
        : Promise.resolve(),
    ]);

    return this.getProfileInfo(userId);
  }

  async updateEmail(
    userId: string,
    dto: UpdateProfileEmailDto,
  ): Promise<SuccessResponse<{ message: string }>> {
    const taken = await db.query.users.findFirst({
      where: eq(users.email, dto.newEmail),
    });
    if (taken) {
      throw new ConflictException(
        errorResponse('Email already in use', HttpStatus.CONFLICT, 'ConflictException'),
      );
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });
    if (!user) {
      throw new NotFoundException(
        errorResponse('User not found', HttpStatus.NOT_FOUND, 'NotFoundException'),
      );
    }

    const otp = this.emailService.generateOtp();
    const otpExpiresAt = this.emailService.getOtpExpirationTime();

    await db
      .update(users)
      .set({
        email: dto.newEmail,
        isEmailVerified: false,
        otp,
        otpExpiresAt,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    await this.emailService.sendOtpEmail(dto.newEmail, otp, user.fullName);

    return successResponse(
      { message: 'Verification OTP sent to new email' },
      'Verification OTP sent to new email',
      HttpStatus.OK,
    );
  }

  async deleteAccount(userId: string): Promise<SuccessResponse<DeleteProfileResponseDto>> {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });
    if (!user) {
      throw new NotFoundException(
        errorResponse('User not found', HttpStatus.NOT_FOUND, 'NotFoundException'),
      );
    }

    await db.delete(users).where(eq(users.id, userId));

    return successResponse(
      { message: 'Account deleted successfully' },
      'Account deleted successfully',
      HttpStatus.OK,
    );
  }
}
