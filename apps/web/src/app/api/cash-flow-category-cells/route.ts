import { NextResponse } from "next/server";
import {
  cashFlowSheetCells,
  cashFlowSheetSettings,
  businessCategories,
  withTenant,
} from "@we4labs/db";
import { CASH_FLOW_DEFAULT_START_YM, cashFlowMonthPeriods } from "@we4labs/shared";
import { and, eq, inArray } from "drizzle-orm";
import { getSql } from "@/lib/db";
import { resolveTenantId } from "@/lib/tenant";
import { requireAdminAccess } from "@/lib/access";
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";

export async function GET() {
  const tenantId = await resolveTenantId();
  if (!tenantId || !process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Sin tenant o base de datos" }, { status: 400 });
  }
  const sql = getSql();
  const cells = await withTenant(sql, tenantId, async (db) => {
    const cats = await db
      .select({ code: businessCategories.code, parentCode: businessCategories.parentCode })
      .from(businessCategories)
      .where(eq(businessCategories.tenantId, tenantId));
    if (cats.length === 0) return [];
    // Budget is stored per parent group code
    const parentCodes = [...new Set(cats.map((c) => c.parentCode ?? c.code))];
    return db
      .select()
      .from(cashFlowSheetCells)
      .where(
        and(
          eq(cashFlowSheetCells.tenantId, tenantId),
          inArray(cashFlowSheetCells.lineCode, parentCodes),
        ),
      );
  });

  // Return both amounts and notes
  const amounts: Record<string, Record<string, number>> = {};
  const notes: Record<string, Record<string, string>> = {};
  for (const c of cells) {
    if (!amounts[c.lineCode]) amounts[c.lineCode] = {};
    amounts[c.lineCode]![c.periodYm] = Number(c.amount);
    if (c.notes) {
      if (!notes[c.lineCode]) notes[c.lineCode] = {};
      notes[c.lineCode]![c.periodYm] = c.notes;
    }
  }
  return NextResponse.json({ amounts, notes });
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
    const cells = raw?.cells as
      | { lineCode: string; periodYm: string; amount: number; notes?: string }[]
      | undefined;

    if (!Array.isArray(cells) || cells.length === 0) {
      return NextResponse.json({ error: "cells requerido" }, { status: 400 });
    }

    const sql = getSql();
    await withTenant(sql, tenantId, async (db) => {
      // Fetch valid codes + months for this tenant
      const cats = await db
        .select({ code: businessCategories.code, parentCode: businessCategories.parentCode })
        .from(businessCategories)
        .where(eq(businessCategories.tenantId, tenantId));
      // Accept parent group codes (used as budget keys)
      const validCodes = new Set(cats.map((c) => c.parentCode ?? c.code));

      const [settings] = await db
        .select({ startYm: cashFlowSheetSettings.startYm })
        .from(cashFlowSheetSettings)
        .where(eq(cashFlowSheetSettings.tenantId, tenantId))
        .limit(1);
      const months = new Set(
        cashFlowMonthPeriods(settings?.startYm ?? CASH_FLOW_DEFAULT_START_YM),
      );

      for (const c of cells) {
        if (!validCodes.has(c.lineCode)) continue;
        if (!months.has(c.periodYm)) continue;
        await db
          .insert(cashFlowSheetCells)
          .values({
            tenantId,
            lineCode: c.lineCode,
            periodYm: c.periodYm,
            amount: String(c.amount),
            notes: c.notes ?? null,
          })
          .onConflictDoUpdate({
            target: [
              cashFlowSheetCells.tenantId,
              cashFlowSheetCells.lineCode,
              cashFlowSheetCells.periodYm,
            ],
            set: {
              amount: String(c.amount),
              notes: c.notes ?? null,
              updatedAt: new Date(),
            },
          });
      }
    });

    revalidatePath("/flujo-caja");
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}
