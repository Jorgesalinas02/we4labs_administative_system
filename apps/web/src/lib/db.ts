import "server-only";
import { createSql, createDb, type Db } from "@we4labs/db";

const url = process.env.DATABASE_URL;

let _sql: ReturnType<typeof createSql> | null = null;

export function getSql() {
  if (!url) throw new Error("DATABASE_URL no configurada");
  if (!_sql) _sql = createSql(url);
  return _sql;
}

export function getDb(): Db {
  return createDb(getSql());
}
