/**
 * Migration 0019: Add role (admin | consultor) to email_allowlist
 * Run: node scripts/apply-0019-email-allowlist-role.mjs
 *
 * Los correos ya autorizados conservan acceso total (role = 'admin').
 * Los nuevos usuarios se crean como 'consultor' por defecto (ver app).
 */
import { readFileSync } from "fs";
import { fileURLToPath, pathToFileURL } from "url";
import { dirname, resolve } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// `postgres` vive en el workspace @we4labs/db (pnpm no lo iza a la raíz).
const pgPath = resolve(__dirname, "../packages/db/node_modules/postgres/src/index.js");
const { default: postgres } = await import(pathToFileURL(pgPath).href);

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
  console.log("→ Adding role to email_allowlist (idempotente)...");
  // Solo la primera vez: añade la columna y marca a los correos ya autorizados
  // como admin para que NO pierdan acceso. En reejecuciones no hace nada.
  await sql`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'email_allowlist' AND column_name = 'role'
      ) THEN
        ALTER TABLE email_allowlist
          ADD COLUMN role varchar(32) NOT NULL DEFAULT 'consultor';
        UPDATE email_allowlist SET role = 'admin';
      END IF;
    END $$;
  `;

  console.log("✓ Migration 0019 applied successfully");
} finally {
  await sql.end();
}
