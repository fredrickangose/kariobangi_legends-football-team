import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

export const pool =
  globalForDb.__arenaNextJsPostgresqlPool ??
  new Pool({
    connectionString: databaseUrl,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__arenaNextJsPostgresqlPool = pool;
}

export const db = drizzle(pool);

let schemaEnsured = false;
let schemaEnsurePromise: Promise<void> | null = null;

/**
 * Applies lightweight, idempotent schema patches for columns added after initial deploy.
 * Prevents runtime failures when Drizzle schema is ahead of the live PostgreSQL table.
 */
export async function ensureDatabaseSchema() {
  if (schemaEnsured) return;

  if (!schemaEnsurePromise) {
    schemaEnsurePromise = (async () => {
      await pool.query(`
        ALTER TABLE fixtures
        ADD COLUMN IF NOT EXISTS opponent_logo_url text;
      `);

      await pool.query(`
        ALTER TABLE fixtures
        ADD COLUMN IF NOT EXISTS match_type text DEFAULT 'league';
      `);

      await pool.query(`
        UPDATE fixtures
        SET match_type = 'league'
        WHERE match_type IS NULL OR match_type = '';
      `);

      await pool.query(`
        ALTER TABLE fixtures
        ALTER COLUMN match_type SET DEFAULT 'league';
      `);

      await pool.query(`
        ALTER TABLE donations
        ADD COLUMN IF NOT EXISTS currency text DEFAULT 'KES';
      `);

      await pool.query(`
        UPDATE donations
        SET currency = 'KES'
        WHERE currency IS NULL OR currency = '';
      `);

      await pool.query(`
        ALTER TABLE donations
        ALTER COLUMN currency SET DEFAULT 'KES';
      `);

      schemaEnsured = true;
    })().catch((error) => {
      schemaEnsurePromise = null;
      throw error;
    });
  }

  await schemaEnsurePromise;
}
