import { NextResponse } from "next/server";
import { emailAllowlist } from "@we4labs/db";
import { isUserRole } from "@we4labs/shared";
import { asc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { requireAdminAccess } from "@/lib/access";
import { updateUserRole } from "@/lib/data";

export const runtime = "nodejs";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function GET() {
  const access = await requireAdminAccess();
  if (!access.ok) return access.response;

  const db = getDb();
  const rows = await db.select().from(emailAllowlist).orderBy(asc(emailAllowlist.createdAt));
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const access = await requireAdminAccess();
  if (!access.ok) return access.response;

  try {
    const raw = (await req.json()) as { email?: unknown; role?: unknown };
    const email = typeof raw.email === "string" ? raw.email.trim().toLowerCase() : "";
    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: "Correo inválido" }, { status: 400 });
    }
    const role = isUserRole(raw.role) ? raw.role : "consultor";

    const db = getDb();
    const [inserted] = await db
      .insert(emailAllowlist)
      .values({
        email,
        role,
        addedBy: access.email,
      })
      .returning();

    return NextResponse.json(inserted, { status: 201 });
  } catch (e) {
    const msg = String(e);
    if (msg.includes("unique") || msg.includes("duplicate")) {
      return NextResponse.json({ error: "Ese correo ya está registrado" }, { status: 409 });
    }
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function PATCH(req: Request) {
  const access = await requireAdminAccess();
  if (!access.ok) return access.response;

  try {
    const raw = (await req.json()) as { id?: unknown; role?: unknown };
    const id = typeof raw.id === "string" ? raw.id : "";
    if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });
    if (!isUserRole(raw.role)) {
      return NextResponse.json({ error: "Rol inválido" }, { status: 400 });
    }

    const db = getDb();
    const target = await db
      .select()
      .from(emailAllowlist)
      .where(eq(emailAllowlist.id, id))
      .limit(1);
    if (!target[0]) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }
    // Evitar que un admin se quite a sí mismo el rol y se bloquee fuera.
    if (target[0].email.toLowerCase() === access.email.toLowerCase() && raw.role !== "admin") {
      return NextResponse.json(
        { error: "No puedes quitarte el rol de admin a ti mismo" },
        { status: 400 },
      );
    }

    const updated = await updateUserRole(id, raw.role);
    return NextResponse.json(updated);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  const access = await requireAdminAccess();
  if (!access.ok) return access.response;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });

  const db = getDb();
  const target = await db
    .select()
    .from(emailAllowlist)
    .where(eq(emailAllowlist.id, id))
    .limit(1);

  if (!target[0]) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  if (target[0].email.toLowerCase() === access.email.toLowerCase()) {
    return NextResponse.json(
      { error: "No puedes eliminar tu propio correo mientras estás conectado" },
      { status: 400 },
    );
  }

  await db.delete(emailAllowlist).where(eq(emailAllowlist.id, id));
  return NextResponse.json({ ok: true });
}
