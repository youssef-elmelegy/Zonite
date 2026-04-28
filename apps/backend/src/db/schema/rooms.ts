import { pgTable, uuid, text, integer, timestamp, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users';
import { gameModeEnum } from './match-history';

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
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    startedAt: timestamp('started_at', { withTimezone: true }),
    endedAt: timestamp('ended_at', { withTimezone: true }),
  },
  (t) => ({
    statusIdx: index('rooms_status_idx').on(t.status),
    hostIdx: index('rooms_host_user_id_idx').on(t.hostUserId),
  }),
);

export type DbRoom = typeof rooms.$inferSelect;
export type NewDbRoom = typeof rooms.$inferInsert;
