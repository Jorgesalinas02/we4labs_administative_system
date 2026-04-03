import "server-only";
import { eq, desc } from "drizzle-orm";
import {
  withTenant,
  cashMovements,
  scenarios,
  portfolioItems,
  taxCalendarEvents,
  taxObligations,
  taxObligationSteps,
  payrollParameters,
} from "@we4labs/db";
import { getSql } from "./db";
import { resolveTenantId } from "./tenant";

export async function loadDashboard() {
  const tenantId = await resolveTenantId();
  if (!tenantId || !process.env.DATABASE_URL) return null;
  const sql = getSql();
  return withTenant(sql, tenantId, async (db) => {
    const real = await db
      .select()
      .from(cashMovements)
      .where(eq(cashMovements.isProjection, false));
    let inflow = 0;
    let outflow = 0;
    for (const r of real) {
      const n = Number(r.amount);
      if (r.kind === "inflow") inflow += n;
      else outflow += n;
    }
    const portfolio = await db.select().from(portfolioItems);
    const today = new Date().toISOString().slice(0, 10);
    let overdueRecv = 0;
    let overduePay = 0;
    for (const p of portfolio) {
      if (p.paidOn) continue;
      if (p.dueOn < today) {
        if (p.kind === "receivable") overdueRecv += Number(p.amount);
        else overduePay += Number(p.amount);
      }
    }
    const monthTotals = new Map<string, { inflow: number; outflow: number }>();
    for (const r of real) {
      const ym = r.occurredOn.slice(0, 7);
      const cur = monthTotals.get(ym) ?? { inflow: 0, outflow: 0 };
      const n = Number(r.amount);
      if (r.kind === "inflow") cur.inflow += n;
      else cur.outflow += n;
      monthTotals.set(ym, cur);
    }
    const cashflowByMonth = [...monthTotals.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, v]) => ({
        month,
        label: month,
        inflow: v.inflow,
        outflow: v.outflow,
      }));
    return {
      inflow,
      outflow,
      net: inflow - outflow,
      overdueReceivables: overdueRecv,
      overduePayables: overduePay,
      movementCount: real.length,
      portfolioOpen: portfolio.filter((p) => !p.paidOn).length,
      cashflowByMonth,
    };
  });
}

export async function loadScenarios() {
  const tenantId = await resolveTenantId();
  if (!tenantId || !process.env.DATABASE_URL) return [];
  const sql = getSql();
  return withTenant(sql, tenantId, async (db) => {
    return db.select().from(scenarios).orderBy(desc(scenarios.createdAt));
  });
}

export async function loadCashMovements() {
  const tenantId = await resolveTenantId();
  if (!tenantId || !process.env.DATABASE_URL) return [];
  const sql = getSql();
  return withTenant(sql, tenantId, async (db) => {
    return db
      .select()
      .from(cashMovements)
      .orderBy(desc(cashMovements.occurredOn));
  });
}

export async function loadPortfolio() {
  const tenantId = await resolveTenantId();
  if (!tenantId || !process.env.DATABASE_URL) return [];
  const sql = getSql();
  return withTenant(sql, tenantId, async (db) => {
    return db.select().from(portfolioItems).orderBy(desc(portfolioItems.dueOn));
  });
}

export async function loadTaxCalendar() {
  const tenantId = await resolveTenantId();
  if (!tenantId || !process.env.DATABASE_URL) return [];
  const sql = getSql();
  return withTenant(sql, tenantId, async (db) => {
    const rows = await db
      .select({
        id: taxCalendarEvents.id,
        tenantId: taxCalendarEvents.tenantId,
        obligationCode: taxCalendarEvents.obligationCode,
        taxObligationId: taxCalendarEvents.taxObligationId,
        title: taxCalendarEvents.title,
        dueOn: taxCalendarEvents.dueOn,
        entity: taxCalendarEvents.entity,
        periodicity: taxCalendarEvents.periodicity,
        notes: taxCalendarEvents.notes,
        createdAt: taxCalendarEvents.createdAt,
        guideCode: taxObligations.code,
      })
      .from(taxCalendarEvents)
      .leftJoin(taxObligations, eq(taxCalendarEvents.taxObligationId, taxObligations.id))
      .orderBy(taxCalendarEvents.dueOn);
    return rows;
  });
}

export async function loadTaxObligations() {
  const tenantId = await resolveTenantId();
  if (!tenantId || !process.env.DATABASE_URL) return [];
  const sql = getSql();
  return withTenant(sql, tenantId, async (db) => {
    const obs = await db.select().from(taxObligations).orderBy(taxObligations.code);
    const steps = await db.select().from(taxObligationSteps);
    const byOb: Record<string, typeof steps> = {};
    for (const s of steps) {
      byOb[s.obligationId] = byOb[s.obligationId] ?? [];
      byOb[s.obligationId].push(s);
    }
    return obs.map((o) => ({
      ...o,
      steps: (byOb[o.id] ?? []).sort((a, b) => a.sortOrder - b.sortOrder),
    }));
  });
}

export async function loadLatestPayrollParams() {
  const tenantId = await resolveTenantId();
  if (!tenantId || !process.env.DATABASE_URL) return null;
  const sql = getSql();
  return withTenant(sql, tenantId, async (db) => {
    const rows = await db
      .select()
      .from(payrollParameters)
      .where(eq(payrollParameters.tenantId, tenantId))
      .orderBy(desc(payrollParameters.effectiveFrom))
      .limit(1);
    return rows[0] ?? null;
  });
}
