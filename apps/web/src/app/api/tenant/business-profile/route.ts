import { NextResponse } from "next/server";
import { tenantBusinessProfileUpdateSchema } from "@we4labs/shared";
import { tenants } from "@we4labs/db";
import { eq } from "drizzle-orm";
import { getSql } from "@/lib/db";
import { revalidateSupuestosPage } from "@/lib/revalidate-data";
import { resolveTenantId } from "@/lib/tenant";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "@we4labs/db";

export const runtime = "nodejs";

export async function PATCH(req: Request) {
  const tenantId = await resolveTenantId();
  if (!tenantId || !process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Sin tenant o base de datos" }, { status: 400 });
  }
  try {
    const raw = await req.json();
    const body = tenantBusinessProfileUpdateSchema.parse(raw);
    const sql = getSql();
    const db = drizzle(sql, { schema });
    const updated = await db
      .update(tenants)
      .set({ name: body.name, sector: body.sector })
      .where(eq(tenants.id, tenantId))
      .returning({ id: tenants.id });
    if (updated.length === 0) {
      return NextResponse.json({ error: "Tenant no encontrado." }, { status: 404 });
    }
    revalidateSupuestosPage();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}
