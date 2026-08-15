import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import dotenv from "dotenv";
import pg from "pg";

const dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(dirname, "..", ".env.local") });
const sql = readFileSync(path.join(dirname, "..", "supabase", "schema.sql"), "utf8");

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set (check .env.local)");
  process.exit(1);
}

const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });

try {
  await client.connect();
  await client.query(sql);
  console.log("Schema applied successfully.");
} catch (err) {
  console.error("Failed to apply schema:", err.message);
  process.exit(1);
} finally {
  await client.end();
}
