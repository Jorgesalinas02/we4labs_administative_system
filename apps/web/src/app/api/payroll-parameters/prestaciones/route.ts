import { NextResponse } from "next/server";
import { payrollPrestacionesUpdateSchema } from "@we4labs/shared";
import { payrollParameters, withTenant } from "@we4labs/db";
import { and, eq } from "drizzle-orm";
import { getSql } from "@/lib/db";
import { revalidateSupuestosPage } from "@/lib/revalidate-data";
import { resolveTenantId } from "@/lib/tenant";

export const runtime = "nodejs";

function pctToFractionStr(p: number): string {
  const v = p / 100;
  if (!Number.isFinite(v)) return "0";
  const s = v.toFixed(6);
  return s.replace(/\.?0+$/, "") || "0";
}

export async function PATCH(req: Request) {
  const tenantId = await resolveTenantId();
  if (!tenantId || !process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Sin tenant o base de datos" }, { status: 400 });
  }
  try {
    const raw = await req.json();
    const body = payrollPrestacionesUpdateSchema.parse(raw);
    const sql = getSql();
    await withTenant(sql, tenantId, async (db) => {
      const updated = await db
        .update(payrollParameters)
        .set({
          cesantiasPct: pctToFractionStr(body.cesantiasPct),
          interesesCesantiasProvisionPct: pctToFractionStr(body.interesesCesantiasProvisionPct),
          primaServiciosPct: pctToFractionStr(body.primaServiciosPct),
          vacacionesProvisionPct: pctToFractionStr(body.vacacionesProvisionPct),
        })
        .where(and(eq(payrollParameters.id, body.id), eq(payrollParameters.tenantId, tenantId)))
        .returning({ id: payrollParameters.id });
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
