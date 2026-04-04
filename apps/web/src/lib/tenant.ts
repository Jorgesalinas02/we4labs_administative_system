import "server-only";
import { cache } from "react";
import { getDb } from "./db";
import { getCognitoTenantId } from "./cognito";

/**
 * Orden: DEV_TENANT_ID → JWT Cognito (custom:tenant_id) → primer tenant en BD (solo dev con BYPASSRLS).
 * Memoizado por petición HTTP: layout + cada loader no repiten consulta ni trabajo de JWT.
 */
export const resolveTenantId = cache(async (): Promise<string | null> => {
  const fromEnv = process.env.DEV_TENANT_ID;
  if (fromEnv) return fromEnv;
  const fromCognito = await getCognitoTenantId();
  if (fromCognito) return fromCognito;
  try {
    const db = getDb();
    const row = await db.query.tenants.findFirst({
      orderBy: (t, { asc }) => [asc(t.createdAt)],
    });
    return row?.id ?? null;
  } catch {
    return null;
  }
});
