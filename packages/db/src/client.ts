import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { sql } from "drizzle-orm";
import * as schema from "./schema.js";

export type Db = ReturnType<typeof drizzle<typeof schema>>;

export function createSql(connectionString: string) {
  return postgres(connectionString, { max: 10 });
}

export function createDb(client: postgres.Sql) {
  return drizzle(client, { schema });
}

export async function withTenant<T>(
  client: postgres.Sql,
  tenantId: string,
  fn: (db: Db) => Promise<T>,
): Promise<T> {
  const db = drizzle(client, { schema });
  return db.transaction(async (tx) => {
    await tx.execute(sql`select set_config('app.tenant_id', ${tenantId}, true)`);
    return fn(tx as unknown as Db);
  });
}
