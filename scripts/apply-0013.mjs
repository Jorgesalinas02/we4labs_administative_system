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
  `CREATE TABLE IF NOT EXISTS "business_categories" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "tenant_id" uuid NOT NULL,
    "kind" varchar(16) NOT NULL,
    "parent_code" varchar(100) NOT NULL,
    "parent_label" varchar(200) NOT NULL,
    "code" varchar(100) NOT NULL,
    "label" varchar(200) NOT NULL,
    "asks_client" varchar(16) NOT NULL DEFAULT 'none',
    "sort_order" integer NOT NULL DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT now()
  )`,
  `ALTER TABLE "business_categories" ADD CONSTRAINT "biz_cat_tenant_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE`,
  `ALTER TABLE "business_categories" ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE "business_categories" FORCE ROW LEVEL SECURITY`,
  `CREATE POLICY "tenant_isolation_biz_cat" ON "business_categories" AS PERMISSIVE FOR ALL TO public USING (tenant_id::text = current_setting('app.tenant_id', true))`,
];

for (const stmt of stmts) {
  try {
    await sql.unsafe(stmt);
    console.log("OK:", stmt.trim().slice(0, 70).replace(/\s+/g, " ") + "…");
  } catch (e) {
    const msg = e?.message ?? String(e);
    if (
      msg.includes("already exists") ||
      msg.includes("duplicate") ||
      msg.includes("ya existe")
    ) {
      console.log("Ya existe:", msg);
    } else {
      console.error("Error:", msg);
    }
  }
}

await sql.end();
console.log("Migración 0013 aplicada.");
