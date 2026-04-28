import 'dotenv/config';
import { Pool } from 'pg';

type UserRow = { id: string };
type RoomRow = { id: string };

const EXISTING_EMAIL = 'youssefelmelegy999@gmail.com';

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function upsertUser(pool: Pool, email: string, fullName: string) {
  const res = await pool.query<UserRow>('SELECT id FROM users WHERE email = $1', [email]);
  if (res.rows.length > 0) return res.rows[0].id;

  const insert = await pool.query<UserRow>(
    `INSERT INTO users (email, password, full_name, is_email_verified, xp, level, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, now(), now()) RETURNING id`,
    [email, 'password', fullName, true, 0, 1],
  );
  return insert.rows[0].id;
}

async function createRoom(
  pool: Pool,
  code: string,
  hostUserId: string,
  mode: 'SOLO' | 'TEAM' = 'SOLO',
) {
  const res = await pool.query<RoomRow>(
    `INSERT INTO rooms (code, status, host_user_id, game_mode, grid_size, duration_seconds, max_players, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, now()) RETURNING id`,
    [code, 'FINISHED', hostUserId, mode, 12, 60, 6],
  );
  return res.rows[0].id;
}

async function createMatchRecord(
  pool: Pool,
  userId: string,
  roomId: string | null,
  playerStatus: 'WAITING' | 'READY' | 'LEFT',
  gameMode: 'SOLO' | 'TEAM',
  won: boolean,
  blocksClaimed: number,
  xpEarned: number,
  playedAt: string,
) {
  await pool.query(
    `INSERT INTO match_player_records (user_id, room_id, player_status, selected_color, game_mode, grid_size, won, blocks_claimed, xp_earned, played_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
    [
      userId,
      roomId,
      playerStatus,
      randInt(0, 9),
      gameMode,
      12,
      won,
      blocksClaimed,
      xpEarned,
      playedAt,
    ],
  );
}

async function seed() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    console.log('Seeding demo data...');

    // Ensure existing user is present
    const mainUserId = await upsertUser(pool, EXISTING_EMAIL, 'YouSsefel Melegy');

    // Create 5 additional demo players (total 6)
    const demoUsers: { email: string; name: string; id?: string }[] = [];
    for (let i = 1; i <= 5; i++) {
      demoUsers.push({ email: `demo-player-${i}@example.com`, name: `Demo Player ${i}` });
    }

    for (const u of demoUsers) {
      u.id = await upsertUser(pool, u.email, u.name);
    }

    const allUserIds = [mainUserId, ...demoUsers.map((d) => d.id!)];

    // Create a handful of finished rooms to attach history to
    const roomIds: string[] = [];
    for (let r = 1; r <= 6; r++) {
      const host = allUserIds[randInt(0, allUserIds.length - 1)];
      const mode: 'SOLO' | 'TEAM' = r % 3 === 0 ? 'TEAM' : 'SOLO';
      const code = `ROOM${1000 + r}`;
      const rid = await createRoom(pool, code, host, mode);
      roomIds.push(rid);
    }

    // Create 12 match_player_records distributed across rooms and users
    const now = Date.now();
    const playerStatuses = ['WAITING', 'READY', 'LEFT'] as const;
    for (let i = 0; i < 12; i++) {
      const userId = allUserIds[i % allUserIds.length];
      const roomId = roomIds[i % roomIds.length];
      const playerStatus = playerStatuses[randInt(0, playerStatuses.length - 1)];
      const gameMode: 'SOLO' | 'TEAM' = Math.random() > 0.6 ? 'TEAM' : 'SOLO';
      const won = Math.random() > 0.6;
      const blocks = randInt(0, 50);
      const xp = Math.max(5, Math.floor(blocks / 2) + (won ? 10 : 0));
      const playedAt = new Date(now - i * 1000 * 60 * 60).toISOString();

      await createMatchRecord(
        pool,
        userId!,
        roomId,
        playerStatus,
        gameMode,
        won,
        blocks,
        xp,
        playedAt,
      );
    }

    console.log('Seeding completed: 6 users, 6 rooms, 12 match records created/ensured.');
    console.log(`Main demo user: ${EXISTING_EMAIL}`);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

void seed();
