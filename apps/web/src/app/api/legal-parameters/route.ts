import { NextResponse } from "next/server";
import { legalParametersUpdateSchema } from "@we4labs/shared";
import { legalParameters, withTenant } from "@we4labs/db";
import { and, eq } from "drizzle-orm";
import { getSql } from "@/lib/db";
import { revalidateSupuestosPage } from "@/lib/revalidate-data";
import { resolveTenantId } from "@/lib/tenant";
import { requireAdminAccess } from "@/lib/access";

export const runtime = "nodejs";

function pctToFractionStr(p: number): string {
  const v = p / 100;
  if (!Number.isFinite(v)) return "0";
  const s = v.toFixed(6);
  return s.replace(/\.?0+$/, "") || "0";
}

export async function PATCH(req: Request) {
  const admin = await requireAdminAccess();
  if (!admin.ok) return admin.response;
  const tenantId = await resolveTenantId();
  if (!tenantId || !process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Sin tenant o base de datos" }, { status: 400 });
  }
  try {
    const raw = await req.json();
    const body = legalParametersUpdateSchema.parse(raw);
    const sql = getSql();
    await withTenant(sql, tenantId, async (db) => {
      const updated = await db
        .update(legalParameters)
        .set({
          effectiveFrom: body.effectiveFrom,
          initialCashBalance: String(body.initialCashBalance),
          employeeCount: body.employeeCount,
          averageMonthlySalaryCop: String(body.averageMonthlySalaryCop),
          generalVatRatePct: pctToFractionStr(body.generalVatRatePct),
          clientsWithholdingSharePct: pctToFractionStr(body.clientsWithholdingSharePct),
          withholdingServicesRatePct: pctToFractionStr(body.withholdingServicesRatePct),
          icaWithholdingRatePct: pctToFractionStr(body.icaWithholdingRatePct),
          incomeSelfRetentionRatePct: pctToFractionStr(body.incomeSelfRetentionRatePct),
        })
        .where(and(eq(legalParameters.id, body.id), eq(legalParameters.tenantId, tenantId)))
        .returning({ id: legalParameters.id });
      if (updated.length === 0) {
        throw new Error("No se encontró el registro o no pertenece al tenant.");
      }
    });
    revalidateSupuestosPage();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}
