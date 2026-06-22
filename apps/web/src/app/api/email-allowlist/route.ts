import { NextResponse } from "next/server";
import { emailAllowlist } from "@we4labs/db";
import { asc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { requireAllowedAccess } from "@/lib/access";

export const runtime = "nodejs";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function GET() {
  const access = await requireAllowedAccess();
  if (!access.ok) return access.response;

  const db = getDb();
  const rows = await db.select().from(emailAllowlist).orderBy(asc(emailAllowlist.createdAt));
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const access = await requireAllowedAccess();
  if (!access.ok) return access.response;

  try {
    const raw = (await req.json()) as { email?: unknown };
    const email = typeof raw.email === "string" ? raw.email.trim().toLowerCase() : "";
    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: "Correo inválido" }, { status: 400 });
    }

    const db = getDb();
    const [inserted] = await db
      .insert(emailAllowlist)
      .values({
        email,
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

export async function DELETE(req: Request) {
  const access = await requireAllowedAccess();
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
