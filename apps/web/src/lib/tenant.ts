import "server-only";
import { cache } from "react";
import { auth } from "@clerk/nextjs/server";
import { getDb } from "./db";
import { tenants } from "@we4labs/db";
import { eq } from "drizzle-orm";

/**
 * Resolves the tenantId for the current request.
 *
 * Priority:
 * 1. DEV_TENANT_ID env var (local dev / seed data)
 * 2. Clerk userId → look up or auto-create tenant in DB
 *
 * Memoized per request via React cache().
 */
export const resolveTenantId = cache(async (): Promise<string | null> => {
  // Local dev shortcut
  const fromEnv = process.env.DEV_TENANT_ID;
  if (fromEnv) return fromEnv;

  if (!process.env.DATABASE_URL) return null;

  // Clerk auth
  const { userId } = await auth();
  if (!userId) return null;

  const db = getDb();

  // Look for existing tenant linked to this Clerk user
  const existing = await db
    .select({ id: tenants.id })
    .from(tenants)
    .where(eq(tenants.clerkUserId, userId))
    .limit(1);

  if (existing[0]) return existing[0].id;

  // First login: auto-provision a new tenant for this user
  const slug = `user-${userId.slice(-8).toLowerCase()}`;
  const [newTenant] = await db
    .insert(tenants)
    .values({
      name: "Mi empresa",
      slug,
      clerkUserId: userId,
    })
    .returning({ id: tenants.id });

  return newTenant?.id ?? null;
});
