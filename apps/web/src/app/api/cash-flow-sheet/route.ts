import { NextResponse } from "next/server";
import {
  CASH_FLOW_DEFAULT_START_YM,
  cashFlowInputLineCodes,
  cashFlowMonthPeriods,
  cashFlowSheetPatchSchema,
} from "@we4labs/shared";
import {
  cashFlowSheetCells,
  cashFlowSheetSettings,
  withTenant,
} from "@we4labs/db";
import { eq } from "drizzle-orm";
import { getSql } from "@/lib/db";
import { loadCashFlowSheet } from "@/lib/data";
import { revalidateCashRelatedPages } from "@/lib/revalidate-data";
import { resolveTenantId } from "@/lib/tenant";

export const runtime = "nodejs";

const ALLOWED = new Set(cashFlowInputLineCodes());

export async function GET() {
  const tenantId = await resolveTenantId();
  if (!tenantId || !process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Sin tenant o base de datos" }, { status: 400 });
  }
  const data = await loadCashFlowSheet();
  if (!data) {
    return NextResponse.json({ error: "Sin datos" }, { status: 400 });
  }
  return NextResponse.json(data);
}

export async function PATCH(req: Request) {
  const tenantId = await resolveTenantId();
  if (!tenantId || !process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Sin tenant o base de datos" }, { status: 400 });
  }
  try {
    const raw = await req.json();
    const body = cashFlowSheetPatchSchema.parse(raw);
    const sql = getSql();
    await withTenant(sql, tenantId, async (db) => {
      const [existing] = await db
        .select()
        .from(cashFlowSheetSettings)
        .where(eq(cashFlowSheetSettings.tenantId, tenantId))
        .limit(1);
      let startYm = existing?.startYm ?? CASH_FLOW_DEFAULT_START_YM;
      if (body.startYm) {
        startYm = body.startYm;
        await db
          .insert(cashFlowSheetSettings)
          .values({ tenantId, startYm })
          .onConflictDoUpdate({
            target: cashFlowSheetSettings.tenantId,
            set: { startYm, updatedAt: new Date() },
          });
      }
      const periodList = cashFlowMonthPeriods(startYm);
      const months = new Set(periodList);
      const firstYm = periodList[0]!;

      for (const c of body.cells ?? []) {
        if (!ALLOWED.has(c.lineCode)) {
          throw new Error(`Línea no editable: ${c.lineCode}`);
        }
        if (!months.has(c.periodYm)) {
          throw new Error(`Período fuera de rango: ${c.periodYm}`);
        }
        if (c.lineCode === "saldo_inicial_de_caja" && c.periodYm !== firstYm) {
          continue;
        }
        await db
          .insert(cashFlowSheetCells)
          .values({
            tenantId,
            lineCode: c.lineCode,
            periodYm: c.periodYm,
            amount: String(c.amount),
          })
          .onConflictDoUpdate({
            target: [
              cashFlowSheetCells.tenantId,
              cashFlowSheetCells.lineCode,
              cashFlowSheetCells.periodYm,
            ],
            set: {
              amount: String(c.amount),
              updatedAt: new Date(),
            },
          });
      }
    });
    revalidateCashRelatedPages();
    const data = await loadCashFlowSheet();
    return NextResponse.json(data ?? { ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}
