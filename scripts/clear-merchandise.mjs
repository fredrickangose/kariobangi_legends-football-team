import "dotenv/config";
import pg from "pg";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set in .env");
  process.exit(1);
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });

try {
  await client.connect();

  const before = await client.query(`SELECT COUNT(*)::int AS count FROM merchandise`);

  await client.query(`DELETE FROM merchandise`);
  await client.query(`ALTER SEQUENCE IF EXISTS merchandise_id_seq RESTART WITH 1`);

  console.log("Merchandise shop cleared successfully.");
  console.log(`Removed ${before.rows[0].count} product(s).`);
  console.log("You can now add fresh items from the Admin Panel.");
} catch (error) {
  console.error("Clear failed:", error.message);
  process.exit(1);
} finally {
  await client.end();
}
