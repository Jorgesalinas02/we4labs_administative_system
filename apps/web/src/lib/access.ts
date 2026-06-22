import "server-only";
import { cache } from "react";
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { UserRole } from "@we4labs/shared";
import { getUserRole, isEmailAllowed } from "./data";

export async function getCurrentUserEmail(): Promise<string | null> {
  if (isDevBypass()) return null;
  const user = await currentUser();
  return user?.emailAddresses[0]?.emailAddress ?? null;
}

/** true en desarrollo local con DEV_TENANT_ID */
export function isDevBypass(): boolean {
  return Boolean(process.env.DEV_TENANT_ID);
}

/** Rol del usuario actual. Dev bypass ⇒ "admin"; sin sesión/no autorizado ⇒ null. */
export const resolveUserRole = cache(async (): Promise<UserRole | null> => {
  if (isDevBypass()) return "admin";
  const email = await getCurrentUserEmail();
  if (!email) return null;
  return getUserRole(email);
});

/** Atajo: ¿el usuario actual es admin? */
export async function isCurrentUserAdmin(): Promise<boolean> {
  return (await resolveUserRole()) === "admin";
}

export async function checkEmailAccess(email: string | null): Promise<boolean> {
  if (isDevBypass()) return true;
  if (!email) return false;
  return isEmailAllowed(email);
}

/** Para Route Handlers: devuelve 401/403 o el email autorizado */
export async function requireAllowedAccess(): Promise<
  { ok: true; email: string } | { ok: false; response: NextResponse }
> {
  if (isDevBypass()) return { ok: true, email: "dev@local" };

  const email = await getCurrentUserEmail();
  if (!email) {
    return { ok: false, response: NextResponse.json({ error: "No autenticado" }, { status: 401 }) };
  }
  if (!(await isEmailAllowed(email))) {
    return { ok: false, response: NextResponse.json({ error: "Acceso no autorizado" }, { status: 403 }) };
  }
  return { ok: true, email };
}

/**
 * Para Route Handlers que MUTAN datos: exige rol admin.
 * Devuelve 401 si no hay sesión, 403 si está autenticado pero no es admin (p. ej. consultor).
 */
export async function requireAdminAccess(): Promise<
  { ok: true; email: string } | { ok: false; response: NextResponse }
> {
  if (isDevBypass()) return { ok: true, email: "dev@local" };

  const email = await getCurrentUserEmail();
  if (!email) {
    return { ok: false, response: NextResponse.json({ error: "No autenticado" }, { status: 401 }) };
  }
  if ((await getUserRole(email)) !== "admin") {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Acción solo permitida para administradores" },
        { status: 403 },
      ),
    };
  }
  return { ok: true, email };
}
