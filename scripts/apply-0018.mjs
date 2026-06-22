/**
 * Migration 0018: Add clerk_user_id to tenants
 * Run: node scripts/apply-0018.mjs
 */
import postgres from "postgres";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env
const envPath = resolve(__dirname, "../.env");
const env = readFileSync(envPath, "utf8");
for (const line of env.split("\n")) {
  const [k, ...v] = line.split("=");
  if (k && !k.startsWith("#")) process.env[k.trim()] = v.join("=").trim();
}

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL not set");

// Use direct (non-pooled) URL for DDL
const directUrl = url.replace("-pooler", "");
const sql = postgres(directUrl, { ssl: "require", max: 1 });

try {
  console.log("→ Adding clerk_user_id to tenants...");
  await sql`
    ALTER TABLE tenants
    ADD COLUMN IF NOT EXISTS clerk_user_id VARCHAR(200) UNIQUE;
  `;

  // Update existing tenant with the current DEV_TENANT_ID (for local dev)
  const devTenantId = process.env.DEV_TENANT_ID;
  if (devTenantId) {
    console.log(`→ Existing tenant ${devTenantId} will keep null clerk_user_id (local dev mode)`);
  }

  console.log("✓ Migration 0018 applied successfully");
} finally {
  await sql.end();
}
