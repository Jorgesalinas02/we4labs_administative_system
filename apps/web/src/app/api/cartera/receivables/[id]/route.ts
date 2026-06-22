import { NextResponse } from "next/server";
import {
  carteraReceivablePaymentSchema,
  carteraReceivableUpdateSchema,
  computeCarteraExcelEstado,
  computeReceivableAmountsFromGross,
} from "@we4labs/shared";
import { portfolioItems, withTenant } from "@we4labs/db";
import { and, eq } from "drizzle-orm";
import { getSql } from "@/lib/db";
import { legalParamsToCarteraRates } from "@/lib/cartera-rates";
import { loadLatestLegalParams } from "@/lib/data";
import { resolveTenantId } from "@/lib/tenant";
import { requireAdminAccess } from "@/lib/access";
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function parseUuidParam(id: string | undefined): string | null {
  return typeof id === "string" && UUID_RE.test(id) ? id : null;
}

function num(v: string | null | undefined): number {
  if (v == null || v === "") return 0;
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
}

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminAccess();
  if (!admin.ok) return admin.response;
  const tenantId = await resolveTenantId();
  if (!tenantId || !process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Sin tenant o base de datos" }, { status: 400 });
  }

  const id = parseUuidParam((await context.params).id);
  if (!id) {
    return NextResponse.json({ error: "Identificador inválido" }, { status: 400 });
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = carteraReceivablePaymentSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }

  const { paymentAmount, cashFlowPeriodYm } = parsed.data;
  const todayYmd = new Date().toISOString().slice(0, 10);
  const sql = getSql();

  try {
    const updated = await withTenant(sql, tenantId, async (db) => {
      const [row] = await db
        .select()
        .from(portfolioItems)
        .where(
          and(
            eq(portfolioItems.id, id),
            eq(portfolioItems.tenantId, tenantId),
            eq(portfolioItems.kind, "receivable"),
          ),
        )
        .limit(1);

      if (!row) return null;

      const net = num(row.amount);
      const oldPaid = num(row.paidAmount);
      const newPaid = Math.min(net, Math.round(oldPaid + paymentAmount));
      const deltaPaid = Math.round(newPaid - oldPaid);
      const balance = Math.max(0, net - newPaid);
      const grossPositive = num(row.grossAmount) > 0 || net > 0;
      const status =
        computeCarteraExcelEstado({
          grossPositive,
          balance,
          dueOn: row.dueOn,
          todayYmd,
        }) || "VIGENTE";
      const paidOn = balance <= 0 ? todayYmd : null;

      const prevAlloc = row.paymentCashFlowAllocations;
      const nextAllocations: { periodYm: string; amountCop: number; recordedAt: string }[] = Array.isArray(
        prevAlloc,
      )
        ? [...prevAlloc]
        : [];
      if (deltaPaid > 0) {
        nextAllocations.push({
          periodYm: cashFlowPeriodYm,
          amountCop: deltaPaid,
          recordedAt: new Date().toISOString(),
        });
      }

      await db
        .update(portfolioItems)
        .set({
          paidAmount: String(newPaid),
          paidOn,
          status,
          paymentCashFlowAllocations: nextAllocations,
        })
        .where(and(eq(portfolioItems.id, id), eq(portfolioItems.tenantId, tenantId)));

      return { paidAmount: newPaid, paidOn, status };
    });

    if (!updated) {
      return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 });
    }

    revalidatePath("/cartera");
    revalidatePath("/dashboard");

    return NextResponse.json({ ok: true, ...updated });
  } catch (e) {
    console.error("[cartera/receivables PATCH]", e);
    const msg = e instanceof Error ? e.message : String(e);
    const missingColumn =
      /payment_cash_flow_allocations|column .* does not exist/i.test(msg) ||
      /42703/.test(msg); /* undefined_column */
    const hint = missingColumn
      ? " Falta la columna en la base de datos: ejecuta las migraciones (por ejemplo `pnpm --filter @we4labs/db migrate` o el script `db:migrate` del proyecto)."
      : "";
    return NextResponse.json(
      { error: `No se pudo registrar el pago.${hint}${hint ? "" : ` ${msg}`}` },
      { status: 500 },
    );
  }
}

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminAccess();
  if (!admin.ok) return admin.response;
  const tenantId = await resolveTenantId();
  if (!tenantId || !process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Sin tenant o base de datos" }, { status: 400 });
  }

  const id = parseUuidParam((await context.params).id);
  if (!id) {
    return NextResponse.json({ error: "Identificador inválido" }, { status: 400 });
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = carteraReceivableUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }

  const body = parsed.data;
  const legal = await loadLatestLegalParams();
  const rates = legalParamsToCarteraRates(legal);
  const { iva, retefuente, reteica, net } = computeReceivableAmountsFromGross(body.grossAmount, rates);
  const todayYmd = new Date().toISOString().slice(0, 10);
  const sql = getSql();

  const ok = await withTenant(sql, tenantId, async (db) => {
    const [row] = await db
      .select()
      .from(portfolioItems)
      .where(
        and(
          eq(portfolioItems.id, id),
          eq(portfolioItems.tenantId, tenantId),
          eq(portfolioItems.kind, "receivable"),
        ),
      )
      .limit(1);

    if (!row) return false;

    const oldPaid = Math.round(num(row.paidAmount));
    const newPaid = Math.min(net, oldPaid);
    const balance = Math.max(0, net - newPaid);
    const grossPositive = body.grossAmount > 0;
    const status =
      computeCarteraExcelEstado({
        grossPositive,
        balance,
        dueOn: body.dueOn,
        todayYmd,
      }) || "VIGENTE";
    const paidOn = balance <= 0 ? todayYmd : null;

    await db
      .update(portfolioItems)
      .set({
        counterparty: body.counterparty.trim(),
        serviceDescription: body.serviceDescription?.trim() || null,
        issuedOn: body.issuedOn,
        dueOn: body.dueOn,
        grossAmount: String(body.grossAmount),
        ivaAmount: String(iva),
        retefuenteAmount: String(retefuente),
        reteicaAmount: String(reteica),
        amount: String(net),
        paidAmount: String(newPaid),
        paidOn,
        status: status || "VIGENTE",
        notes: body.notes?.trim() || null,
      })
      .where(and(eq(portfolioItems.id, id), eq(portfolioItems.tenantId, tenantId)));

    return true;
  });

  if (!ok) {
    return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 });
  }

  revalidatePath("/cartera");
  revalidatePath("/dashboard");

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, context: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminAccess();
  if (!admin.ok) return admin.response;
  const tenantId = await resolveTenantId();
  if (!tenantId || !process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Sin tenant o base de datos" }, { status: 400 });
  }

  const id = parseUuidParam((await context.params).id);
  if (!id) {
    return NextResponse.json({ error: "Identificador inválido" }, { status: 400 });
  }

  const sql = getSql();
  const deleted = await withTenant(sql, tenantId, async (db) => {
    const [row] = await db
      .delete(portfolioItems)
      .where(
        and(
          eq(portfolioItems.id, id),
          eq(portfolioItems.tenantId, tenantId),
          eq(portfolioItems.kind, "receivable"),
        ),
      )
      .returning({ id: portfolioItems.id });
    return row ?? null;
  });

  if (!deleted) {
    return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 });
  }

  revalidatePath("/cartera");
  revalidatePath("/dashboard");

  return NextResponse.json({ ok: true });
}
