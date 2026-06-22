import { NextResponse } from "next/server";
import { clients, withTenant } from "@we4labs/db";
import { and, asc, eq } from "drizzle-orm";
import { getSql } from "@/lib/db";
import { resolveTenantId } from "@/lib/tenant";

export const runtime = "nodejs";

// GET /api/clients
export async function GET() {
  const tenantId = await resolveTenantId();
  if (!tenantId || !process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Sin tenant o base de datos" }, { status: 400 });
  }
  const sql = getSql();
  const rows = await withTenant(sql, tenantId, (db) =>
    db
      .select()
      .from(clients)
      .where(eq(clients.tenantId, tenantId))
      .orderBy(asc(clients.name)),
  );
  return NextResponse.json(rows);
}

// POST /api/clients  { name, nit?, clientType?, notes? }
export async function POST(req: Request) {
  const tenantId = await resolveTenantId();
  if (!tenantId || !process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Sin tenant o base de datos" }, { status: 400 });
  }
  try {
    const raw = (await req.json()) as {
      name?: unknown;
      nit?: unknown;
      clientType?: unknown;
      notes?: unknown;
    };
    const name = typeof raw.name === "string" ? raw.name.trim() : "";
    if (!name) return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 });

    const sql = getSql();
    const [inserted] = await withTenant(sql, tenantId, (db) =>
      db
        .insert(clients)
        .values({
          tenantId,
          name,
          nit: typeof raw.nit === "string" ? raw.nit.trim() || null : null,
          clientType: typeof raw.clientType === "string" ? raw.clientType.trim() || null : null,
          notes: typeof raw.notes === "string" ? raw.notes.trim() || null : null,
        })
        .returning(),
    );
    return NextResponse.json(inserted, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}

// PATCH /api/clients  { id, name?, nit?, clientType?, notes? }
export async function PATCH(req: Request) {
  const tenantId = await resolveTenantId();
  if (!tenantId || !process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Sin tenant o base de datos" }, { status: 400 });
  }
  try {
    const raw = (await req.json()) as {
      id?: unknown;
      name?: unknown;
      nit?: unknown;
      clientType?: unknown;
      notes?: unknown;
    };
    const id = typeof raw.id === "string" ? raw.id : null;
    if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });

    const set: Record<string, unknown> = { updatedAt: new Date() };
    if (raw.name !== undefined) {
      const n = typeof raw.name === "string" ? raw.name.trim() : "";
      if (!n) return NextResponse.json({ error: "El nombre no puede estar vacío" }, { status: 400 });
      set.name = n;
    }
    if (raw.nit !== undefined) set.nit = typeof raw.nit === "string" ? raw.nit.trim() || null : null;
    if (raw.clientType !== undefined)
      set.clientType = typeof raw.clientType === "string" ? raw.clientType.trim() || null : null;
    if (raw.notes !== undefined)
      set.notes = typeof raw.notes === "string" ? raw.notes.trim() || null : null;

    const sql = getSql();
    await withTenant(sql, tenantId, (db) =>
      db
        .update(clients)
        .set(set)
        .where(and(eq(clients.id, id), eq(clients.tenantId, tenantId))),
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}

// DELETE /api/clients?id=...
export async function DELETE(req: Request) {
  const tenantId = await resolveTenantId();
  if (!tenantId || !process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Sin tenant o base de datos" }, { status: 400 });
  }
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });

  const sql = getSql();
  await withTenant(sql, tenantId, (db) =>
    db.delete(clients).where(and(eq(clients.id, id), eq(clients.tenantId, tenantId))),
  );
  return NextResponse.json({ ok: true });
}
