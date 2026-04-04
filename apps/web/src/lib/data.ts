import "server-only";
import { eq, desc, asc } from "drizzle-orm";
import {
  withTenant,
  cashMovements,
  cashFlowSheetCells,
  cashFlowSheetSettings,
  scenarios,
  portfolioItems,
  taxCalendarEvents,
  taxObligations,
  taxObligationSteps,
  payrollParameters,
  legalParameters,
} from "@we4labs/db";
import {
  CASH_FLOW_DEFAULT_START_YM,
  CASH_FLOW_LINES,
  type CashFlowSheetViewModel,
  cashFlowMonthLabelEs,
  cashFlowMonthPeriods,
  computeCashFlowSheet,
} from "@we4labs/shared";
import { cacheByTenant } from "./data-cache";
import { getSql } from "./db";
import { resolveTenantId } from "./tenant";

async function runLoadDashboard(tenantId: string) {
  const sql = getSql();
  return withTenant(sql, tenantId, async (db) => {
    const [real, portfolio] = await Promise.all([
      db
        .select()
        .from(cashMovements)
        .where(eq(cashMovements.isProjection, false)),
      db.select().from(portfolioItems),
    ]);
    let inflow = 0;
    let outflow = 0;
    for (const r of real) {
      const n = Number(r.amount);
      if (r.kind === "inflow") inflow += n;
      else outflow += n;
    }
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

const loadDashboardCached = cacheByTenant("dashboard", runLoadDashboard);

export async function loadDashboard() {
  const tenantId = await resolveTenantId();
  if (!tenantId || !process.env.DATABASE_URL) return null;
  return loadDashboardCached(tenantId);
}

async function runLoadScenarios(tenantId: string) {
  const sql = getSql();
  return withTenant(sql, tenantId, async (db) => {
    return db.select().from(scenarios).orderBy(desc(scenarios.createdAt));
  });
}

const loadScenariosCached = cacheByTenant("scenarios", runLoadScenarios);

export async function loadScenarios() {
  const tenantId = await resolveTenantId();
  if (!tenantId || !process.env.DATABASE_URL) return [];
  return loadScenariosCached(tenantId);
}

async function runLoadCashMovements(tenantId: string) {
  const sql = getSql();
  return withTenant(sql, tenantId, async (db) => {
    return db
      .select()
      .from(cashMovements)
      .orderBy(desc(cashMovements.occurredOn));
  });
}

const loadCashMovementsCached = cacheByTenant("cashMovements", runLoadCashMovements);

export async function loadCashMovements() {
  const tenantId = await resolveTenantId();
  if (!tenantId || !process.env.DATABASE_URL) return [];
  return loadCashMovementsCached(tenantId);
}

async function runLoadCashFlowSheet(tenantId: string): Promise<CashFlowSheetViewModel> {
  const sql = getSql();
  return withTenant(sql, tenantId, async (db): Promise<CashFlowSheetViewModel> => {
    const [[settingsRow], cellRows] = await Promise.all([
      db
        .select()
        .from(cashFlowSheetSettings)
        .where(eq(cashFlowSheetSettings.tenantId, tenantId))
        .limit(1),
      db.select().from(cashFlowSheetCells),
    ]);
    const startYm = settingsRow?.startYm ?? CASH_FLOW_DEFAULT_START_YM;
    const months = cashFlowMonthPeriods(startYm);
    const stored: Record<string, Record<string, number>> = {};
    for (const r of cellRows) {
      if (!stored[r.lineCode]) stored[r.lineCode] = {};
      stored[r.lineCode]![r.periodYm] = Number(r.amount);
    }
    const { cells, annual } = computeCashFlowSheet(months, stored);
    return {
      startYm,
      months,
      monthLabels: months.map((ym) => cashFlowMonthLabelEs(ym)),
      lines: CASH_FLOW_LINES,
      values: cells,
      annual,
    };
  });
}

const loadCashFlowSheetCached = cacheByTenant("cashFlowSheet", runLoadCashFlowSheet);

export async function loadCashFlowSheet(): Promise<CashFlowSheetViewModel | null> {
  const tenantId = await resolveTenantId();
  if (!tenantId || !process.env.DATABASE_URL) return null;
  return loadCashFlowSheetCached(tenantId);
}

async function runLoadPortfolio(tenantId: string) {
  const sql = getSql();
  return withTenant(sql, tenantId, async (db) => {
    return db
      .select()
      .from(portfolioItems)
      .orderBy(asc(portfolioItems.sortOrder), asc(portfolioItems.dueOn));
  });
}

const loadPortfolioCached = cacheByTenant("portfolio", runLoadPortfolio);

export async function loadPortfolio() {
  const tenantId = await resolveTenantId();
  if (!tenantId || !process.env.DATABASE_URL) return [];
  return loadPortfolioCached(tenantId);
}

async function runLoadTaxCalendar(tenantId: string) {
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

const loadTaxCalendarCached = cacheByTenant("taxCalendar", runLoadTaxCalendar);

export async function loadTaxCalendar() {
  const tenantId = await resolveTenantId();
  if (!tenantId || !process.env.DATABASE_URL) return [];
  return loadTaxCalendarCached(tenantId);
}

async function runLoadTaxObligations(tenantId: string) {
  const sql = getSql();
  return withTenant(sql, tenantId, async (db) => {
    const [obs, steps] = await Promise.all([
      db.select().from(taxObligations).orderBy(taxObligations.code),
      db.select().from(taxObligationSteps),
    ]);
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

const loadTaxObligationsCached = cacheByTenant("taxObligations", runLoadTaxObligations);

export async function loadTaxObligations() {
  const tenantId = await resolveTenantId();
  if (!tenantId || !process.env.DATABASE_URL) return [];
  return loadTaxObligationsCached(tenantId);
}

async function runLoadLatestPayrollParams(tenantId: string) {
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

const loadLatestPayrollParamsCached = cacheByTenant("payrollLatest", runLoadLatestPayrollParams);

export async function loadLatestPayrollParams() {
  const tenantId = await resolveTenantId();
  if (!tenantId || !process.env.DATABASE_URL) return null;
  return loadLatestPayrollParamsCached(tenantId);
}

async function runLoadLatestLegalParams(tenantId: string) {
  const sql = getSql();
  return withTenant(sql, tenantId, async (db) => {
    const rows = await db
      .select()
      .from(legalParameters)
      .where(eq(legalParameters.tenantId, tenantId))
      .orderBy(desc(legalParameters.effectiveFrom))
      .limit(1);
    return rows[0] ?? null;
  });
}

const loadLatestLegalParamsCached = cacheByTenant("legalLatest", runLoadLatestLegalParams);

export async function loadLatestLegalParams() {
  const tenantId = await resolveTenantId();
  if (!tenantId || !process.env.DATABASE_URL) return null;
  return loadLatestLegalParamsCached(tenantId);
}

export type CashFlowSheetPayload = CashFlowSheetViewModel;
export type ScenarioRecord = Awaited<ReturnType<typeof loadScenarios>>[number];
export type PayrollParamsRecord = NonNullable<Awaited<ReturnType<typeof loadLatestPayrollParams>>>;
export type LegalParamsRecord = NonNullable<Awaited<ReturnType<typeof loadLatestLegalParams>>>;
