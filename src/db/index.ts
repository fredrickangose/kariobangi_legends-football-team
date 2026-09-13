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

      await pool.query(`
        CREATE TABLE IF NOT EXISTS press_accounts (
          id serial PRIMARY KEY,
          username text NOT NULL UNIQUE,
          password_hash text NOT NULL,
          display_name text NOT NULL,
          updated_at timestamp DEFAULT now() NOT NULL
        );
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS team_highlights (
          id serial PRIMARY KEY,
          title text NOT NULL,
          description text DEFAULT '',
          video_url text NOT NULL,
          thumbnail_url text,
          category text DEFAULT 'Match Highlights' NOT NULL,
          created_at timestamp DEFAULT now() NOT NULL
        );
      `);

      await pool.query(`
        ALTER TABLE merchandise
        ADD COLUMN IF NOT EXISTS stock_status text DEFAULT 'available';
      `);

      await pool.query(`
        UPDATE merchandise
        SET stock_status = 'available'
        WHERE stock_status IS NULL OR stock_status = '';
      `);

      await pool.query(`
        ALTER TABLE merchandise
        ALTER COLUMN stock_status SET DEFAULT 'available';
      `);

      await pool.query(`
        ALTER TABLE orders
        ADD COLUMN IF NOT EXISTS admin_seen_at timestamp;
      `);

      await pool.query(`
        ALTER TABLE orders
        ADD COLUMN IF NOT EXISTS archived_at timestamp;
      `);

      await pool.query(`
        UPDATE orders
        SET admin_seen_at = created_at
        WHERE admin_seen_at IS NULL;
      `);

      schemaEnsured = true;
    })().catch((error) => {
      schemaEnsurePromise = null;
      throw error;
    });
  }

  await schemaEnsurePromise;
}
