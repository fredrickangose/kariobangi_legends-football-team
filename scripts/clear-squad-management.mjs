import "dotenv/config";
import pg from "pg";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set in .env");
  process.exit(1);
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });

try {
  await client.connect();

  const playersBefore = await client.query(`SELECT COUNT(*)::int AS count FROM players`);
  const managementBefore = await client.query(
    `SELECT COUNT(*)::int AS count FROM management`
  );

  await client.query(`DELETE FROM players`);
  await client.query(`DELETE FROM management`);

  await client.query(`ALTER SEQUENCE IF EXISTS players_id_seq RESTART WITH 1`);
  await client.query(`ALTER SEQUENCE IF EXISTS management_id_seq RESTART WITH 1`);

  console.log("Squad and management cleared successfully.");
  console.log(`Removed ${playersBefore.rows[0].count} player(s).`);
  console.log(`Removed ${managementBefore.rows[0].count} management official(s).`);
  console.log("You can now add fresh entries from the Admin Panel.");
} catch (error) {
  console.error("Clear failed:", error.message);
  process.exit(1);
} finally {
  await client.end();
}
