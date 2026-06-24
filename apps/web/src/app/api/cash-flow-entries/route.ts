import { NextResponse } from "next/server";
import { cashFlowEntries, costCenters, withTenant } from "@we4labs/db";
import { and, eq } from "drizzle-orm";
import { getSql } from "@/lib/db";
import { revalidateCashRelatedPages } from "@/lib/revalidate-data";
import { resolveTenantId } from "@/lib/tenant";
import { requireAdminAccess } from "@/lib/access";

export const runtime = "nodejs";

// GET /api/cash-flow-entries?categoryCode=...&periodYm=...
export async function GET(req: Request) {
  const tenantId = await resolveTenantId();
  if (!tenantId || !process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Sin tenant o base de datos" }, { status: 400 });
  }
  const { searchParams } = new URL(req.url);
  const categoryCode = searchParams.get("categoryCode");
  const periodYm = searchParams.get("periodYm");

  const sql = getSql();
  const rows = await withTenant(sql, tenantId, (db) => {
    const conds = [eq(cashFlowEntries.tenantId, tenantId)];
    if (categoryCode) conds.push(eq(cashFlowEntries.categoryCode, categoryCode));
    if (periodYm) conds.push(eq(cashFlowEntries.periodYm, periodYm));
    return db
      .select()
      .from(cashFlowEntries)
      .where(and(...conds))
      .orderBy(cashFlowEntries.createdAt);
  });
  return NextResponse.json(rows);
}

// POST /api/cash-flow-entries  { categoryCode, periodYm, occurredOn?, description?, amount, clientId? }
export async function POST(req: Request) {
  const admin = await requireAdminAccess();
  if (!admin.ok) return admin.response;
  const tenantId = await resolveTenantId();
  if (!tenantId || !process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Sin tenant o base de datos" }, { status: 400 });
  }
  try {
    const raw = (await req.json()) as {
      categoryCode?: unknown;
      periodYm?: unknown;
      occurredOn?: unknown;
      description?: unknown;
      amount?: unknown;
      clientId?: unknown;
      teamMemberId?: unknown;
      costCenterId?: unknown;
    };

    const categoryCode = typeof raw.categoryCode === "string" ? raw.categoryCode.trim() : null;
    const periodYm = typeof raw.periodYm === "string" ? raw.periodYm.trim() : null;
    const amount = Number(raw.amount);

    if (!categoryCode || !periodYm) {
      return NextResponse.json({ error: "categoryCode y periodYm son requeridos" }, { status: 400 });
    }
    if (!Number.isFinite(amount)) {
      return NextResponse.json({ error: "Monto inválido" }, { status: 400 });
    }

    let resolvedClientId = typeof raw.clientId === "string" ? raw.clientId : null;
    let resolvedCostCenterId = typeof raw.costCenterId === "string" ? raw.costCenterId : null;
    const resolvedTeamMemberId = typeof raw.teamMemberId === "string" ? raw.teamMemberId : null;

    const sql = getSql();

    // Auto-link: clientId → costCenterId
    if (resolvedClientId && !resolvedCostCenterId) {
      const [match] = await withTenant(sql, tenantId, (db) =>
        db.select({ id: costCenters.id })
          .from(costCenters)
          .where(and(eq(costCenters.tenantId, tenantId), eq(costCenters.clientId, resolvedClientId!), eq(costCenters.active, true)))
          .limit(1),
      );
      if (match) resolvedCostCenterId = match.id;
    }
    // Auto-link: costCenterId → clientId
    else if (resolvedCostCenterId && !resolvedClientId) {
      const [center] = await withTenant(sql, tenantId, (db) =>
        db.select({ clientId: costCenters.clientId })
          .from(costCenters)
          .where(and(eq(costCenters.id, resolvedCostCenterId!), eq(costCenters.tenantId, tenantId)))
          .limit(1),
      );
      if (center?.clientId) resolvedClientId = center.clientId;
    }

    const [inserted] = await withTenant(sql, tenantId, (db) =>
      db
        .insert(cashFlowEntries)
        .values({
          tenantId,
          categoryCode,
          periodYm,
          occurredOn: typeof raw.occurredOn === "string" ? raw.occurredOn : null,
          description: typeof raw.description === "string" ? raw.description.trim() || null : null,
          amount: String(amount),
          clientId: resolvedClientId,
          teamMemberId: resolvedTeamMemberId,
          costCenterId: resolvedCostCenterId,
        })
        .returning(),
    );

    revalidateCashRelatedPages();
    return NextResponse.json(inserted, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}

// DELETE /api/cash-flow-entries?id=...
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
    db
      .delete(cashFlowEntries)
      .where(and(eq(cashFlowEntries.id, id), eq(cashFlowEntries.tenantId, tenantId))),
  );

  revalidateCashRelatedPages();
  return NextResponse.json({ ok: true });
}

// PATCH /api/cash-flow-entries  { id, occurredOn?, description?, amount? }
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
      occurredOn?: unknown;
      description?: unknown;
      amount?: unknown;
      clientId?: unknown;
      teamMemberId?: unknown;
    };

    const id = typeof raw.id === "string" ? raw.id : null;
    if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (raw.occurredOn !== undefined)
      updates.occurredOn = typeof raw.occurredOn === "string" ? raw.occurredOn : null;
    if (raw.description !== undefined)
      updates.description = typeof raw.description === "string" ? raw.description.trim() || null : null;
    if (raw.amount !== undefined) {
      const amount = Number(raw.amount);
      if (!Number.isFinite(amount)) return NextResponse.json({ error: "Monto inválido" }, { status: 400 });
      updates.amount = String(amount);
    }
    if (raw.clientId !== undefined)
      updates.clientId = typeof raw.clientId === "string" ? raw.clientId : null;
    if (raw.teamMemberId !== undefined)
      updates.teamMemberId = typeof raw.teamMemberId === "string" ? raw.teamMemberId : null;

    const sql = getSql();
    await withTenant(sql, tenantId, (db) =>
      db
        .update(cashFlowEntries)
        .set(updates)
        .where(and(eq(cashFlowEntries.id, id), eq(cashFlowEntries.tenantId, tenantId))),
    );

    revalidateCashRelatedPages();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}
