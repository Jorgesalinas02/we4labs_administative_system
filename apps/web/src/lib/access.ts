import "server-only";
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { isEmailAllowed } from "./data";

export async function getCurrentUserEmail(): Promise<string | null> {
  const user = await currentUser();
  return user?.emailAddresses[0]?.emailAddress ?? null;
}

/** true en desarrollo local con DEV_TENANT_ID */
export function isDevBypass(): boolean {
  return Boolean(process.env.DEV_TENANT_ID);
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
