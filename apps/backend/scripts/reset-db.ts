import 'dotenv/config';
import { Pool } from 'pg';

interface TableRow {
  tablename: string;
}

async function resetDatabase() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Starting database reset...');

    // Get all table names
    const result = await pool.query<TableRow>(`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public'
    `);

    const tables: string[] = result.rows.map((row: TableRow) => row.tablename);

    if (tables.length === 0) {
      console.log('Database is already empty');
      process.exit(0);
    }

    // Drop all tables
    for (const table of tables) {
      await pool.query(`DROP TABLE IF EXISTS "${table}" CASCADE`);
      console.log(`  ✓ Dropped table: ${table}`);
    }

    console.log('Database reset successfully!');
    console.log('\nTo restore schema, run: npm run db:push');
    console.log('To seed data, run: npm run seed');

    process.exit(0);
  } catch (error) {
    console.error('Error resetting database:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

void resetDatabase();
