import { pgTable, uuid, text, integer, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users';
import { gameModeEnum } from './match-history';

export type TournamentRosterTeam = {
  teamId: string;
  teamName: string;
  color: 'RED' | 'BLUE' | null;
  players: Array<{
    userId: string;
    userName: string;
    displayName: string;
    avatarUrl: string | null;
  }>;
};

export const rooms = pgTable(
  'rooms',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    code: text('code').notNull().unique(),
    status: text('status').$type<'LOBBY' | 'PLAYING' | 'FINISHED'>().notNull().default('LOBBY'),
    hostUserId: uuid('host_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    gameMode: gameModeEnum('game_mode').notNull().default('SOLO'),
    gridSize: integer('grid_size').notNull().default(12),
    durationSeconds: integer('duration_seconds').notNull().default(60),
    maxPlayers: integer('max_players').notNull().default(6),
    tournamentId: text('tournament_id'),
    roundNumber: integer('round_number'),
    tournamentRoster: jsonb('tournament_roster').$type<TournamentRosterTeam[]>(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    startedAt: timestamp('started_at', { withTimezone: true }),
    endedAt: timestamp('ended_at', { withTimezone: true }),
  },
  (t) => ({
    statusIdx: index('rooms_status_idx').on(t.status),
    hostIdx: index('rooms_host_user_id_idx').on(t.hostUserId),
    // tournamentRoundUnique: uniqueIndex('rooms_tournament_round_unique')
    //   .on(t.tournamentId, t.roundNumber)
    //   .where(sql`${t.tournamentId} IS NOT NULL`),
  }),
);

export type DbRoom = typeof rooms.$inferSelect;
export type NewDbRoom = typeof rooms.$inferInsert;
