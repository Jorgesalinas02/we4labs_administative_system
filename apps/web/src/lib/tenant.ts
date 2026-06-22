import "server-only";
import { cache } from "react";
import { auth } from "@clerk/nextjs/server";
import { getDb } from "./db";
import { tenants } from "@we4labs/db";
import { asc } from "drizzle-orm";
import { checkEmailAccess, getCurrentUserEmail } from "./access";

/**
 * Tenant único del sistema. El acceso por usuario se controla vía email_allowlist.
 */
export const resolveTenantId = cache(async (): Promise<string | null> => {
  const fromEnv = process.env.DEV_TENANT_ID;
  if (fromEnv) return fromEnv;

  if (!process.env.DATABASE_URL) return null;

  const { userId } = await auth();
  if (!userId) return null;

  const email = await getCurrentUserEmail();
  if (!(await checkEmailAccess(email))) return null;

  const db = getDb();
  const row = await db
    .select({ id: tenants.id })
    .from(tenants)
    .orderBy(asc(tenants.createdAt))
    .limit(1);

  return row[0]?.id ?? null;
});
