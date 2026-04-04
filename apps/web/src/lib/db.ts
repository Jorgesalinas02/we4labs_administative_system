import "server-only";
import { createSql, createDb, type Db } from "@we4labs/db";

const url = process.env.DATABASE_URL;

let _sql: ReturnType<typeof createSql> | null = null;
let _db: Db | null = null;

export function getSql() {
  if (!url) throw new Error("DATABASE_URL no configurada");
  if (!_sql) _sql = createSql(url);
  return _sql;
}

/** Una instancia Drizzle por proceso (evita recrear el wrapper en cada llamada). */
export function getDb(): Db {
  if (!_db) _db = createDb(getSql());
  return _db;
}
