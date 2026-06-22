import { NextResponse } from "next/server";
import { CASH_FLOW_DEFAULT_START_YM, cashFlowMonthPeriods } from "@we4labs/shared";
import { cashFlowSheetCells, cashFlowSheetSettings, withTenant } from "@we4labs/db";
import { eq } from "drizzle-orm";
import { getSql } from "@/lib/db";
import { revalidateCashRelatedPages, revalidateSupuestosPage } from "@/lib/revalidate-data";
import { resolveTenantId } from "@/lib/tenant";

export const runtime = "nodejs";

export async function PATCH(req: Request) {
  const tenantId = await resolveTenantId();
  if (!tenantId || !process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Sin tenant o base de datos" }, { status: 400 });
  }
  try {
    const raw = (await req.json()) as { amount?: unknown };
    const amount = Number(raw.amount);
    if (!Number.isFinite(amount) || amount < 0) {
      return NextResponse.json({ error: "Monto inválido" }, { status: 400 });
    }

    const sql = getSql();
    await withTenant(sql, tenantId, async (db) => {
      const [existing] = await db
        .select()
        .from(cashFlowSheetSettings)
        .where(eq(cashFlowSheetSettings.tenantId, tenantId))
        .limit(1);
      const startYm = existing?.startYm ?? CASH_FLOW_DEFAULT_START_YM;
      const firstYm = cashFlowMonthPeriods(startYm)[0]!;

      await db
        .insert(cashFlowSheetCells)
        .values({
          tenantId,
          lineCode: "saldo_inicial_de_caja",
          periodYm: firstYm,
          amount: String(amount),
        })
        .onConflictDoUpdate({
          target: [
            cashFlowSheetCells.tenantId,
            cashFlowSheetCells.lineCode,
            cashFlowSheetCells.periodYm,
          ],
          set: { amount: String(amount), updatedAt: new Date() },
        });
    });

    revalidateCashRelatedPages();
    revalidateSupuestosPage();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}
