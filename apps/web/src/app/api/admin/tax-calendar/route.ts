import { NextResponse } from "next/server";
import { taxEventSchema } from "@we4labs/shared";
import { taxCalendarEvents, withTenant } from "@we4labs/db";
import { getSql } from "@/lib/db";
import { revalidateTaxCalendarPage } from "@/lib/revalidate-data";
import { resolveTenantId } from "@/lib/tenant";

export const runtime = "nodejs";

/** Alta de evento de calendario (rol admin en prod vía Cognito `custom:role`). */
export async function POST(req: Request) {
  const tenantId = await resolveTenantId();
  if (!tenantId || !process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Sin tenant o base de datos" }, { status: 400 });
  }
  try {
    const raw = await req.json();
    const body = taxEventSchema.omit({ id: true }).parse(raw);
    const sql = getSql();
    const [row] = await withTenant(sql, tenantId, async (db) => {
      return db
        .insert(taxCalendarEvents)
        .values({
          tenantId,
          obligationCode: body.obligationCode,
          taxObligationId: body.taxObligationId ?? null,
          title: body.title,
          dueOn: body.dueOn,
          entity: body.entity ?? null,
          periodicity: body.periodicity ?? null,
          notes: body.notes ?? null,
        })
        .returning({ id: taxCalendarEvents.id });
    });
    revalidateTaxCalendarPage();
    return NextResponse.json({ id: row?.id });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}
