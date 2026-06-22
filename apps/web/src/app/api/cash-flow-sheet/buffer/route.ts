import { NextResponse } from "next/server";
import { cashFlowBufferUpdateSchema, CASH_FLOW_DEFAULT_START_YM } from "@we4labs/shared";
import { cashFlowSheetSettings, withTenant } from "@we4labs/db";
import { getSql } from "@/lib/db";
import { revalidateSupuestosPage } from "@/lib/revalidate-data";
import { resolveTenantId } from "@/lib/tenant";

export const runtime = "nodejs";

export async function PATCH(req: Request) {
  const tenantId = await resolveTenantId();
  if (!tenantId || !process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Sin tenant o base de datos" }, { status: 400 });
  }
  try {
    const raw = await req.json();
    const body = cashFlowBufferUpdateSchema.parse(raw);
    const sql = getSql();
    await withTenant(sql, tenantId, async (db) => {
      await db
        .insert(cashFlowSheetSettings)
        .values({
          tenantId,
          startYm: CASH_FLOW_DEFAULT_START_YM,
          minCashBufferPct: String(body.minCashBufferPct),
        })
        .onConflictDoUpdate({
          target: cashFlowSheetSettings.tenantId,
          set: { minCashBufferPct: String(body.minCashBufferPct), updatedAt: new Date() },
        });
    });
    revalidateSupuestosPage();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}
