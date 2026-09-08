import "dotenv/config";
import pg from "pg";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set in .env");
  process.exit(1);
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });

try {
  await client.connect();

  await client.query(`
    ALTER TABLE fixtures
    ADD COLUMN IF NOT EXISTS match_type text NOT NULL DEFAULT 'league';
  `);

  await client.query(`
    UPDATE fixtures
    SET match_type = 'league'
    WHERE match_type IS NULL OR match_type = '';
  `);

  const result = await client.query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'fixtures'
    ORDER BY ordinal_position
  `);

  console.log("Migration complete.");
  console.log("fixtures columns:", result.rows.map((row) => row.column_name).join(", "));
} catch (error) {
  console.error("Migration failed:", error.message);
  process.exit(1);
} finally {
  await client.end();
}
