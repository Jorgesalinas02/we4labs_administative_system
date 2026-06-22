import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, "../.env");
const envContent = readFileSync(envPath, "utf-8");
const envVars = Object.fromEntries(
  envContent.split("\n")
    .filter(l => l.includes("=") && !l.startsWith("#"))
    .map(l => {
      const idx = l.indexOf("=");
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
    })
);

const url = envVars.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL no encontrada en .env");
const directUrl = url.replace(/-pooler(\.[^/]+)/, "$1");
console.log("Conectando a:", directUrl.split("@")[1]);

const { default: postgres } = await import(
  "/Users/jorgesalinas/Desktop/Proyectos/we4labs_sistema_administrativo/packages/db/node_modules/postgres/src/index.js"
);

const sql = postgres(directUrl, { max: 1 });

const stmts = [
  `CREATE TABLE IF NOT EXISTS "clients" (
    "id"          uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "tenant_id"   uuid NOT NULL,
    "name"        varchar(200) NOT NULL,
    "nit"         varchar(30),
    "client_type" varchar(80),
    "notes"       text,
    "created_at"  timestamp with time zone DEFAULT now(),
    "updated_at"  timestamp with time zone DEFAULT now()
  )`,
  `ALTER TABLE "clients" ADD CONSTRAINT "clients_tenant_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE`,
  `ALTER TABLE "clients" ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE "clients" FORCE ROW LEVEL SECURITY`,
  `CREATE POLICY "tenant_isolation_clients" ON "clients" AS PERMISSIVE FOR ALL TO public USING (tenant_id::text = current_setting('app.tenant_id', true))`,
];

for (const stmt of stmts) {
  try {
    await sql.unsafe(stmt);
    console.log("OK:", stmt.trim().slice(0, 80).replace(/\s+/g, " ") + "…");
  } catch (e) {
    const msg = e?.message ?? String(e);
    if (msg.includes("already exists") || msg.includes("duplicate") || msg.includes("ya existe")) {
      console.log("Ya existe:", msg);
    } else {
      console.error("Error:", msg);
    }
  }
}

await sql.end();
console.log("Migración 0016 aplicada.");
