import { NextResponse } from "next/server";
import {
  carteraReceivableCreateSchema,
  computeCarteraExcelEstado,
  computeReceivableAmountsFromGross,
  nextFacInvoiceRefFromRefs,
} from "@we4labs/shared";
import { portfolioItems, withTenant } from "@we4labs/db";
import { and, eq, max } from "drizzle-orm";
import { getSql } from "@/lib/db";
import { legalParamsToCarteraRates } from "@/lib/cartera-rates";
import { loadLatestLegalParams } from "@/lib/data";
import { resolveTenantId } from "@/lib/tenant";
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";

export async function GET() {
  const tenantId = await resolveTenantId();
  if (!tenantId || !process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Sin tenant o base de datos" }, { status: 400 });
  }
  const sql = getSql();
  const nextInvoiceRef = await withTenant(sql, tenantId, async (db) => {
    const refRows = await db
      .select({ ref: portfolioItems.invoiceRef })
      .from(portfolioItems)
      .where(and(eq(portfolioItems.tenantId, tenantId), eq(portfolioItems.kind, "receivable")));
    return nextFacInvoiceRefFromRefs(refRows.map((r) => r.ref));
  });
  return NextResponse.json({ nextInvoiceRef });
}

export async function POST(req: Request) {
  const tenantId = await resolveTenantId();
  if (!tenantId || !process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Sin tenant o base de datos" }, { status: 400 });
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = carteraReceivableCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }

  const body = parsed.data;
  const legal = await loadLatestLegalParams();
  const rates = legalParamsToCarteraRates(legal);
  const { iva, retefuente, reteica, net } = computeReceivableAmountsFromGross(body.grossAmount, rates);
  const todayYmd = new Date().toISOString().slice(0, 10);
  const status = computeCarteraExcelEstado({
    grossPositive: body.grossAmount > 0,
    balance: net,
    dueOn: body.dueOn,
    todayYmd,
  });

  const sql = getSql();
  const row = await withTenant(sql, tenantId, async (db) => {
    const refRows = await db
      .select({ ref: portfolioItems.invoiceRef })
      .from(portfolioItems)
      .where(and(eq(portfolioItems.tenantId, tenantId), eq(portfolioItems.kind, "receivable")));
    const invoiceRef = nextFacInvoiceRefFromRefs(refRows.map((r) => r.ref));

    const [agg] = await db
      .select({ m: max(portfolioItems.sortOrder) })
      .from(portfolioItems)
      .where(and(eq(portfolioItems.tenantId, tenantId), eq(portfolioItems.kind, "receivable")));
    const maxSo = agg?.m != null ? Number(agg.m) : 0;
    const sortOrder = Number.isFinite(maxSo) ? maxSo + 1 : 1;

    const [inserted] = await db
      .insert(portfolioItems)
      .values({
        tenantId,
        kind: "receivable",
        sortOrder,
        counterparty: body.counterparty.trim(),
        serviceDescription: body.serviceDescription?.trim() || null,
        invoiceRef,
        issuedOn: body.issuedOn,
        dueOn: body.dueOn,
        grossAmount: String(body.grossAmount),
        ivaAmount: String(iva),
        retefuenteAmount: String(retefuente),
        reteicaAmount: String(reteica),
        amount: String(net),
        paidAmount: "0",
        paidOn: null,
        status: status || "VIGENTE",
        notes: body.notes?.trim() || null,
      })
      .returning({ id: portfolioItems.id, invoiceRef: portfolioItems.invoiceRef });

    return inserted;
  });

  revalidatePath("/cartera");
  revalidatePath("/dashboard");

  return NextResponse.json({ ok: true, id: row?.id, invoiceRef: row?.invoiceRef ?? null });
}
