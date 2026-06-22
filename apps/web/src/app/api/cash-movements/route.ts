import { NextResponse } from "next/server";
import { cashMovementSchema } from "@we4labs/shared";
import { cashMovements, withTenant } from "@we4labs/db";
import { getSql } from "@/lib/db";
import { revalidateAfterCashMovement } from "@/lib/revalidate-data";
import { resolveTenantId } from "@/lib/tenant";
import { requireAdminAccess } from "@/lib/access";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const admin = await requireAdminAccess();
  if (!admin.ok) return admin.response;
  const tenantId = await resolveTenantId();
  if (!tenantId || !process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Sin tenant o base de datos" }, { status: 400 });
  }
  try {
    const raw = await req.json();
    const body = cashMovementSchema.parse(raw);
    const sql = getSql();
    await withTenant(sql, tenantId, async (db) => {
      await db.insert(cashMovements).values({
        tenantId,
        scenarioId: body.scenarioId ?? null,
        occurredOn: body.occurredOn,
        kind: body.kind,
        category: body.category,
        amount: String(body.amount),
        isProjection: body.isProjection,
        description: body.description ?? null,
      });
    });
    revalidateAfterCashMovement();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}
