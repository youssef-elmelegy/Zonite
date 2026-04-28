import { pgTable, date, uuid, text, integer, timestamp, index, boolean } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const users = pgTable(
  'users',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    email: text('email').notNull().unique(),
    password: text('password').notNull(),
    // role: text('role').notNull().default('user'),
    fullName: text('full_name').notNull().default(''),
    xp: integer('xp').notNull().default(0),
    // refreshTokenNonce: text('refresh_token_nonce'),
    otp: text('otp'),
    otpExpiresAt: timestamp('otp_expires_at', { withTimezone: true }),
    isEmailVerified: boolean('is_email_verified').default(false).notNull(),
    profileImage: text('profile_image'),
    level: integer('level').notNull().default(1),
    totalWins: integer('total_wins').notNull().default(0),
    totalBlocksMined: integer('total_blocks_mined').notNull().default(0),
    totalMatchesPlayed: integer('total_matches_played').notNull().default(0),
    currentWinStreak: integer('current_win_streak').notNull().default(0),
    dateOfBirth: date('date_of_birth'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    otpExpiresAtIdx: index('users_otp_expires_at_idx').on(t.otpExpiresAt),
  }),
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
