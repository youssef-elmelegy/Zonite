import { pgTable, uuid, integer, timestamp, index, pgEnum } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users';
import { rooms } from './rooms';

export const playerStatusEnum = pgEnum('player_status_enum', ['WAITING', 'READY', 'LEFT']);
export const gameModeEnum = pgEnum('game_mode_enum', ['SOLO', 'TEAM']);
export const matchOutcomeEnum = pgEnum('match_outcome_enum', ['WIN', 'LOSS', 'DRAW']);

export const matchPlayerRecords = pgTable(
  'match_player_records',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    roomId: uuid('room_id').references(() => rooms.id, { onDelete: 'set null' }),
    playerStatus: playerStatusEnum('player_status').notNull(),
    selectedColor: integer('selected_color'), // may be enum in the future
    gameMode: gameModeEnum('game_mode').notNull(),
    gridSize: integer('grid_size').notNull(),
    outcome: matchOutcomeEnum('outcome').notNull(),
    blocksClaimed: integer('blocks_claimed').notNull().default(0),
    xpEarned: integer('xp_earned').notNull().default(0),
    playedAt: timestamp('played_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    userPlayedAtIdx: index('match_player_records_user_played_at_idx').on(t.userId, t.playedAt),
    roomIdx: index('match_player_records_room_id_idx').on(t.roomId),
  }),
);

export type matchPlayerRecords = typeof matchPlayerRecords.$inferSelect;
export type NewmatchPlayerRecords = typeof matchPlayerRecords.$inferInsert;
