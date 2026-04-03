import path from "node:path";
import { loadMonorepoEnv } from "./load-monorepo-env.js";

loadMonorepoEnv();
import { fileURLToPath } from "node:url";
import postgres from "postgres";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { drizzle } from "drizzle-orm/postgres-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const url = process.env.DATABASE_URL ?? "postgres://we4labs:we4labs@localhost:5433/we4labs";

async function main() {
  const client = postgres(url, { max: 1 });
  const db = drizzle(client);
  await migrate(db, { migrationsFolder: path.join(__dirname, "../drizzle") });
  console.log("Migrations aplicadas.");
  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
