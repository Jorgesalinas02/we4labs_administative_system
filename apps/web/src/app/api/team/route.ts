import { NextResponse } from "next/server";
import { teamMembers, withTenant } from "@we4labs/db";
import { and, asc, eq } from "drizzle-orm";
import { getSql } from "@/lib/db";
import { resolveTenantId } from "@/lib/tenant";
import { requireAdminAccess } from "@/lib/access";

export const runtime = "nodejs";

// GET /api/team
export async function GET() {
  const tenantId = await resolveTenantId();
  if (!tenantId || !process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Sin tenant o base de datos" }, { status: 400 });
  }
  const sql = getSql();
  const rows = await withTenant(sql, tenantId, (db) =>
    db
      .select()
      .from(teamMembers)
      .where(eq(teamMembers.tenantId, tenantId))
      .orderBy(asc(teamMembers.name)),
  );
  return NextResponse.json(rows);
}

// POST /api/team  { name, kind, email?, notes? }
export async function POST(req: Request) {
  const admin = await requireAdminAccess();
  if (!admin.ok) return admin.response;
  const tenantId = await resolveTenantId();
  if (!tenantId || !process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Sin tenant o base de datos" }, { status: 400 });
  }
  try {
    const raw = (await req.json()) as {
      name?: unknown;
      kind?: unknown;
      email?: unknown;
      notes?: unknown;
    };
    const name = typeof raw.name === "string" ? raw.name.trim() : "";
    if (!name) return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 });
    const kind = typeof raw.kind === "string" ? raw.kind.trim() || "empleado" : "empleado";

    const sql = getSql();
    const [inserted] = await withTenant(sql, tenantId, (db) =>
      db
        .insert(teamMembers)
        .values({
          tenantId,
          name,
          kind,
          email: typeof raw.email === "string" ? raw.email.trim() || null : null,
          notes: typeof raw.notes === "string" ? raw.notes.trim() || null : null,
        })
        .returning(),
    );
    return NextResponse.json(inserted, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}

// PATCH /api/team  { id, name?, kind?, email?, notes?, active? }
export async function PATCH(req: Request) {
  const admin = await requireAdminAccess();
  if (!admin.ok) return admin.response;
  const tenantId = await resolveTenantId();
  if (!tenantId || !process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Sin tenant o base de datos" }, { status: 400 });
  }
  try {
    const raw = (await req.json()) as {
      id?: unknown;
      name?: unknown;
      kind?: unknown;
      email?: unknown;
      notes?: unknown;
      active?: unknown;
    };
    const id = typeof raw.id === "string" ? raw.id : null;
    if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });

    const set: Record<string, unknown> = { updatedAt: new Date() };
    if (raw.name !== undefined) {
      const n = typeof raw.name === "string" ? raw.name.trim() : "";
      if (!n) return NextResponse.json({ error: "El nombre no puede estar vacío" }, { status: 400 });
      set.name = n;
    }
    if (raw.kind !== undefined) set.kind = typeof raw.kind === "string" ? raw.kind.trim() || "empleado" : "empleado";
    if (raw.email !== undefined) set.email = typeof raw.email === "string" ? raw.email.trim() || null : null;
    if (raw.notes !== undefined) set.notes = typeof raw.notes === "string" ? raw.notes.trim() || null : null;
    if (raw.active !== undefined) set.active = Boolean(raw.active);

    const sql = getSql();
    await withTenant(sql, tenantId, (db) =>
      db
        .update(teamMembers)
        .set(set)
        .where(and(eq(teamMembers.id, id), eq(teamMembers.tenantId, tenantId))),
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}

// DELETE /api/team?id=...
export async function DELETE(req: Request) {
  const admin = await requireAdminAccess();
  if (!admin.ok) return admin.response;
  const tenantId = await resolveTenantId();
  if (!tenantId || !process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Sin tenant o base de datos" }, { status: 400 });
  }
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });

  const sql = getSql();
  await withTenant(sql, tenantId, (db) =>
    db.delete(teamMembers).where(and(eq(teamMembers.id, id), eq(teamMembers.tenantId, tenantId))),
  );
  return NextResponse.json({ ok: true });
}
