import { NextResponse } from "next/server";
import { costCenters, withTenant } from "@we4labs/db";
import { and, asc, eq } from "drizzle-orm";
import { getSql } from "@/lib/db";
import { resolveTenantId } from "@/lib/tenant";
import { requireAdminAccess, requireAllowedAccess } from "@/lib/access";
import { revalidateCostCentersPage } from "@/lib/revalidate-data";

export const runtime = "nodejs";

// GET /api/cost-centers
export async function GET() {
  const access = await requireAllowedAccess();
  if (!access.ok) return access.response;
  const tenantId = await resolveTenantId();
  if (!tenantId || !process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Sin tenant o base de datos" }, { status: 400 });
  }
  const sql = getSql();
  const rows = await withTenant(sql, tenantId, (db) =>
    db
      .select()
      .from(costCenters)
      .where(eq(costCenters.tenantId, tenantId))
      .orderBy(asc(costCenters.name)),
  );
  return NextResponse.json(rows);
}

// POST /api/cost-centers
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
      clientId?: unknown;
      quotedAmount?: unknown;
      startDate?: unknown;
      endDate?: unknown;
      status?: unknown;
      description?: unknown;
    };
    const name = typeof raw.name === "string" ? raw.name.trim() : "";
    if (!name) return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 });

    const sql = getSql();
    const [inserted] = await withTenant(sql, tenantId, (db) =>
      db
        .insert(costCenters)
        .values({
          tenantId,
          name,
          clientId: typeof raw.clientId === "string" && raw.clientId ? raw.clientId : null,
          quotedAmount: typeof raw.quotedAmount === "number" ? String(raw.quotedAmount) : "0",
          startDate: typeof raw.startDate === "string" ? raw.startDate || null : null,
          endDate: typeof raw.endDate === "string" ? raw.endDate || null : null,
          status: typeof raw.status === "string" ? raw.status || "en_progreso" : "en_progreso",
          description: typeof raw.description === "string" ? raw.description.trim() || null : null,
        })
        .returning(),
    );
    revalidateCostCentersPage();
    return NextResponse.json(inserted, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}

// PATCH /api/cost-centers  { id, ...fields }
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
      clientId?: unknown;
      quotedAmount?: unknown;
      startDate?: unknown;
      endDate?: unknown;
      status?: unknown;
      description?: unknown;
      active?: unknown;
    };
    const id = typeof raw.id === "string" ? raw.id : null;
    if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });

    const sql = getSql();
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (typeof raw.name === "string" && raw.name.trim()) updates.name = raw.name.trim();
    if (raw.clientId !== undefined) updates.clientId = typeof raw.clientId === "string" && raw.clientId ? raw.clientId : null;
    if (typeof raw.quotedAmount === "number") updates.quotedAmount = String(raw.quotedAmount);
    if (raw.startDate !== undefined) updates.startDate = typeof raw.startDate === "string" ? raw.startDate || null : null;
    if (raw.endDate !== undefined) updates.endDate = typeof raw.endDate === "string" ? raw.endDate || null : null;
    if (typeof raw.status === "string") updates.status = raw.status;
    if (raw.description !== undefined) updates.description = typeof raw.description === "string" ? raw.description.trim() || null : null;
    if (typeof raw.active === "boolean") updates.active = raw.active;

    const [updated] = await withTenant(sql, tenantId, (db) =>
      db
        .update(costCenters)
        .set(updates)
        .where(and(eq(costCenters.id, id), eq(costCenters.tenantId, tenantId)))
        .returning(),
    );
    if (!updated) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    revalidateCostCentersPage();
    return NextResponse.json(updated);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}

// DELETE /api/cost-centers?id=...
export async function DELETE(req: Request) {
  const admin = await requireAdminAccess();
  if (!admin.ok) return admin.response;
  const tenantId = await resolveTenantId();
  if (!tenantId || !process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Sin tenant o base de datos" }, { status: 400 });
  }
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });

  const sql = getSql();
  await withTenant(sql, tenantId, (db) =>
    db.delete(costCenters).where(and(eq(costCenters.id, id), eq(costCenters.tenantId, tenantId))),
  );
  revalidateCostCentersPage();
  return NextResponse.json({ ok: true });
}
