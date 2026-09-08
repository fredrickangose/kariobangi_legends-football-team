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
    CREATE TABLE IF NOT EXISTS account_messages (
      id serial PRIMARY KEY,
      customer_id integer NOT NULL,
      sender_type text NOT NULL,
      message text NOT NULL,
      is_read_by_customer boolean NOT NULL DEFAULT false,
      is_read_by_admin boolean NOT NULL DEFAULT false,
      created_at timestamp NOT NULL DEFAULT now()
    );
  `);

  console.log("account_messages table is ready.");
} catch (error) {
  console.error("Migration failed:", error.message);
  process.exit(1);
} finally {
  await client.end();
}
