import "server-only";
import { eq, desc, asc, inArray, and } from "drizzle-orm";
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
  tenants,
  businessCategories,
  cashFlowEntries,
  clients,
  teamMembers,
  emailAllowlist,
} from "@we4labs/db";
import {
  CASH_FLOW_DEFAULT_START_YM,
  CASH_FLOW_LINES,
  type CashFlowSheetViewModel,
  cashFlowMonthLabelEs,
  cashFlowMonthPeriods,
  computeCashFlowSheet,
  isUserRole,
  type UserRole,
} from "@we4labs/shared";
import { cacheByTenant } from "./data-cache";
import { getSql, getDb } from "./db";
import { resolveTenantId } from "./tenant";

async function runLoadDashboard(tenantId: string) {
  const sql = getSql();
  return withTenant(sql, tenantId, async (db) => {
    const today = new Date().toISOString().slice(0, 10);
    const currentYm = today.slice(0, 7);

    const [entries, allCategories, portfolio, taxEvents, initialBalanceCells] = await Promise.all([
      db
        .select()
        .from(cashFlowEntries)
        .where(eq(cashFlowEntries.tenantId, tenantId))
        .orderBy(desc(cashFlowEntries.occurredOn)),
      db
        .select()
        .from(businessCategories)
        .where(eq(businessCategories.tenantId, tenantId)),
      db.select().from(portfolioItems),
      db
        .select({
          id: taxCalendarEvents.id,
          name: taxObligations.title,
          title: taxCalendarEvents.title,
          dueOn: taxCalendarEvents.dueOn,
        })
        .from(taxCalendarEvents)
        .leftJoin(taxObligations, eq(taxCalendarEvents.taxObligationId, taxObligations.id))
        .orderBy(taxCalendarEvents.dueOn),
      db
        .select({ amount: cashFlowSheetCells.amount })
        .from(cashFlowSheetCells)
        .where(
          and(
            eq(cashFlowSheetCells.tenantId, tenantId),
            eq(cashFlowSheetCells.lineCode, "saldo_inicial_de_caja"),
          ),
        )
        .limit(1),
    ]);

    // KPIs del mes actual
    const incomeKinds = new Set(
      allCategories.filter((c) => c.kind === "income").map((c) => c.code),
    );
    let currentInflow = 0;
    let currentOutflow = 0;
    let totalInflow = 0;
    let totalOutflow = 0;

    const monthTotals = new Map<string, { inflow: number; outflow: number }>();
    for (const e of entries) {
      const n = Number(e.amount);
      const ym = e.periodYm;
      const isIncome = incomeKinds.has(e.categoryCode);
      const cur = monthTotals.get(ym) ?? { inflow: 0, outflow: 0 };
      if (isIncome) {
        cur.inflow += n;
        totalInflow += n;
        if (ym === currentYm) currentInflow += n;
      } else {
        cur.outflow += n;
        totalOutflow += n;
        if (ym === currentYm) currentOutflow += n;
      }
      monthTotals.set(ym, cur);
    }

    // Saldo inicial de caja (stored in cashFlowSheetCells)
    const initialBalance = initialBalanceCells[0] ? Number(initialBalanceCells[0].amount) : 0;
    const currentBalance = initialBalance + totalInflow - totalOutflow;

    // Últimas 8 transacciones
    const recentTransactions = entries.slice(0, 8).map((e) => {
      const cat = allCategories.find((c) => c.code === e.categoryCode);
      return {
        id: e.id,
        categoryName: cat?.label ?? e.categoryCode,
        kind: incomeKinds.has(e.categoryCode) ? ("income" as const) : ("expense" as const),
        amount: Number(e.amount),
        occurredOn: e.occurredOn,
        description: e.description,
      };
    });

    // Próximas obligaciones tributarias (siguientes 5)
    const upcomingObligations = taxEvents
      .filter((t) => t.dueOn >= today)
      .slice(0, 5)
      .map((t) => ({
        id: t.id,
        name: t.name ?? t.title ?? "Obligación tributaria",
        dueOn: t.dueOn,
      }));

    // Cartera vencida
    let overdueRecv = 0;
    let overduePay = 0;
    for (const p of portfolio) {
      if (p.paidOn) continue;
      if (p.dueOn < today) {
        if (p.kind === "receivable") overdueRecv += Number(p.amount);
        else overduePay += Number(p.amount);
      }
    }

    const cashflowByMonth = [...monthTotals.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, v]) => ({
        month,
        label: cashFlowMonthLabelEs(month),
        inflow: v.inflow,
        outflow: v.outflow,
        net: v.inflow - v.outflow,
      }));

    return {
      currentInflow,
      currentOutflow,
      currentNet: currentInflow - currentOutflow,
      currentBalance,
      overdueReceivables: overdueRecv,
      overduePayables: overduePay,
      entryCount: entries.length,
      cashflowByMonth,
      recentTransactions,
      upcomingObligations,
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

async function runLoadTenantProfile(tenantId: string) {
  const db = getDb();
  const rows = await db.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1);
  return rows[0] ?? null;
}

const loadTenantProfileCached = cacheByTenant("tenantProfile", runLoadTenantProfile);

export async function loadTenantProfile() {
  const tenantId = await resolveTenantId();
  if (!tenantId || !process.env.DATABASE_URL) return null;
  return loadTenantProfileCached(tenantId);
}

async function runLoadCashFlowSettings(tenantId: string) {
  const sql = getSql();
  return withTenant(sql, tenantId, async (db) => {
    const rows = await db
      .select()
      .from(cashFlowSheetSettings)
      .where(eq(cashFlowSheetSettings.tenantId, tenantId))
      .limit(1);
    return rows[0] ?? null;
  });
}

const loadCashFlowSettingsCached = cacheByTenant("cashFlowSettings", runLoadCashFlowSettings);

export async function loadCashFlowSettings() {
  const tenantId = await resolveTenantId();
  if (!tenantId || !process.env.DATABASE_URL) return null;
  return loadCashFlowSettingsCached(tenantId);
}

async function runLoadBusinessCategories(tenantId: string) {
  const sql = getSql();
  return withTenant(sql, tenantId, (db) =>
    db
      .select()
      .from(businessCategories)
      .where(eq(businessCategories.tenantId, tenantId))
      .orderBy(asc(businessCategories.sortOrder), asc(businessCategories.createdAt)),
  );
}

const loadBusinessCategoriesCached = cacheByTenant("businessCategories", runLoadBusinessCategories);

export async function loadBusinessCategories() {
  const tenantId = await resolveTenantId();
  if (!tenantId || !process.env.DATABASE_URL) return [];
  return loadBusinessCategoriesCached(tenantId);
}

export type BusinessCategoryRecord = Awaited<ReturnType<typeof loadBusinessCategories>>[number];

// ── Celdas de categorías de flujo de caja ────────────────────────────────────

export type CategoryCellsPayload = {
  amounts: Record<string, Record<string, number>>;
  notes: Record<string, Record<string, string>>;
};

async function runLoadCategoryCells(tenantId: string): Promise<CategoryCellsPayload> {
  const sql = getSql();
  return withTenant(sql, tenantId, async (db) => {
    const cats = await db
      .select({ code: businessCategories.code })
      .from(businessCategories)
      .where(eq(businessCategories.tenantId, tenantId));
    if (cats.length === 0) return { amounts: {}, notes: {} };
    const codes = cats.map((c) => c.code);
    const rows = await db
      .select()
      .from(cashFlowSheetCells)
      .where(
        and(
          eq(cashFlowSheetCells.tenantId, tenantId),
          inArray(cashFlowSheetCells.lineCode, codes),
        ),
      );
    const amounts: Record<string, Record<string, number>> = {};
    const notes: Record<string, Record<string, string>> = {};
    for (const r of rows) {
      if (!amounts[r.lineCode]) amounts[r.lineCode] = {};
      amounts[r.lineCode]![r.periodYm] = Number(r.amount);
      if (r.notes) {
        if (!notes[r.lineCode]) notes[r.lineCode] = {};
        notes[r.lineCode]![r.periodYm] = r.notes;
      }
    }
    return { amounts, notes };
  });
}

const loadCategoryCellsCached = cacheByTenant("categoryCells", runLoadCategoryCells);

export async function loadCategoryCells() {
  const tenantId = await resolveTenantId();
  if (!tenantId || !process.env.DATABASE_URL) return {};
  return loadCategoryCellsCached(tenantId);
}

// ── Entradas de flujo de caja por categoría ──────────────────────────────────

export type CashFlowEntry = {
  id: string;
  categoryCode: string;
  periodYm: string;
  occurredOn: string | null;
  description: string | null;
  amount: number;
  clientId: string | null;
  teamMemberId: string | null;
  createdAt: Date | null;
};

/** Suma de entradas por [categoryCode][periodYm] */
export type CategoryEntrySums = Record<string, Record<string, number>>;

async function runLoadCategoryEntries(tenantId: string): Promise<{
  sums: CategoryEntrySums;
  entries: CashFlowEntry[];
}> {
  const sql = getSql();
  return withTenant(sql, tenantId, async (db) => {
    const rows = await db
      .select()
      .from(cashFlowEntries)
      .where(eq(cashFlowEntries.tenantId, tenantId))
      .orderBy(asc(cashFlowEntries.periodYm), asc(cashFlowEntries.createdAt));

    const sums: CategoryEntrySums = {};
    const entries: CashFlowEntry[] = [];

    for (const r of rows) {
      const amt = Number(r.amount);
      if (!sums[r.categoryCode]) sums[r.categoryCode] = {};
      sums[r.categoryCode]![r.periodYm] = (sums[r.categoryCode]![r.periodYm] ?? 0) + amt;
      entries.push({
        id: r.id,
        categoryCode: r.categoryCode,
        periodYm: r.periodYm,
        occurredOn: r.occurredOn ?? null,
        description: r.description ?? null,
        amount: amt,
        clientId: r.clientId ?? null,
        teamMemberId: r.teamMemberId ?? null,
        createdAt: r.createdAt ?? null,
      });
    }
    return { sums, entries };
  });
}

const loadCategoryEntriesCached = cacheByTenant("categoryEntries", runLoadCategoryEntries);

export async function loadCategoryEntries() {
  const tenantId = await resolveTenantId();
  if (!tenantId || !process.env.DATABASE_URL) return { sums: {}, entries: [] };
  return loadCategoryEntriesCached(tenantId);
}

// ── Group Budgets (presupuesto por grupo de categoría × mes) ──────────────────

export type GroupBudgets = Record<string, Record<string, number>>;

async function runLoadGroupBudgets(tenantId: string): Promise<GroupBudgets> {
  const sql = getSql();
  return withTenant(sql, tenantId, async (db) => {
    const cats = await db
      .select({ code: businessCategories.code, parentCode: businessCategories.parentCode })
      .from(businessCategories)
      .where(eq(businessCategories.tenantId, tenantId));
    const parentCodes = [...new Set(cats.map((c) => c.parentCode ?? c.code))];
    if (parentCodes.length === 0) return {};
    const cells = await db
      .select()
      .from(cashFlowSheetCells)
      .where(
        and(
          eq(cashFlowSheetCells.tenantId, tenantId),
          inArray(cashFlowSheetCells.lineCode, parentCodes),
        ),
      );
    const result: GroupBudgets = {};
    for (const c of cells) {
      if (!result[c.lineCode]) result[c.lineCode] = {};
      result[c.lineCode]![c.periodYm] = Number(c.amount);
    }
    return result;
  });
}

const loadGroupBudgetsCached = cacheByTenant("groupBudgets", runLoadGroupBudgets);

export async function loadGroupBudgets(): Promise<GroupBudgets> {
  try {
    const tenantId = await resolveTenantId();
    if (!tenantId || !process.env.DATABASE_URL) return {};
    return await loadGroupBudgetsCached(tenantId);
  } catch {
    return {};
  }
}

// ── Clientes ──────────────────────────────────────────────────────────────────

async function runLoadClients(tenantId: string) {
  const sql = getSql();
  return withTenant(sql, tenantId, (db) =>
    db
      .select()
      .from(clients)
      .where(eq(clients.tenantId, tenantId))
      .orderBy(asc(clients.name)),
  );
}

const loadClientsCached = cacheByTenant("clients", runLoadClients);

export async function loadClients() {
  const tenantId = await resolveTenantId();
  if (!tenantId || !process.env.DATABASE_URL) return [];
  return loadClientsCached(tenantId);
}

export type ClientRecord = Awaited<ReturnType<typeof loadClients>>[number];

// ── Equipo ────────────────────────────────────────────────────────────────────

async function runLoadTeamMembers(tenantId: string) {
  const sql = getSql();
  return withTenant(sql, tenantId, (db) =>
    db
      .select()
      .from(teamMembers)
      .where(eq(teamMembers.tenantId, tenantId))
      .orderBy(asc(teamMembers.name)),
  );
}

const loadTeamMembersCached = cacheByTenant("teamMembers", runLoadTeamMembers);

export async function loadTeamMembers() {
  const tenantId = await resolveTenantId();
  if (!tenantId || !process.env.DATABASE_URL) return [];
  return loadTeamMembersCached(tenantId);
}

export type TeamMemberRecord = Awaited<ReturnType<typeof loadTeamMembers>>[number];

export type CashFlowSheetPayload = CashFlowSheetViewModel;
export type ScenarioRecord = Awaited<ReturnType<typeof loadScenarios>>[number];
export type PayrollParamsRecord = NonNullable<Awaited<ReturnType<typeof loadLatestPayrollParams>>>;
export type LegalParamsRecord = NonNullable<Awaited<ReturnType<typeof loadLatestLegalParams>>>;
export type TenantProfileRecord = NonNullable<Awaited<ReturnType<typeof loadTenantProfile>>>;
export type CashFlowSettingsRecord = NonNullable<Awaited<ReturnType<typeof loadCashFlowSettings>>>;

// ── Email Allowlist ──────────────────────────────────────────────────────────

export async function loadEmailAllowlist() {
  if (!process.env.DATABASE_URL) return [];
  const db = getDb();
  return db
    .select()
    .from(emailAllowlist)
    .orderBy(asc(emailAllowlist.createdAt));
}

/**
 * Returns true if the email is allowed to access the system.
 * Solo correos en email_allowlist (+ INITIAL_ADMIN_EMAIL si está definido).
 */
export async function isEmailAllowed(email: string): Promise<boolean> {
  if (!process.env.DATABASE_URL) return true;

  const normalized = email.trim().toLowerCase();
  if (!normalized) return false;

  const bootstrap = process.env.INITIAL_ADMIN_EMAIL?.trim().toLowerCase();
  if (bootstrap && normalized === bootstrap) return true;

  const db = getDb();
  const all = await db.select({ email: emailAllowlist.email }).from(emailAllowlist);
  if (all.length === 0) return false;

  return all.some((r) => r.email.toLowerCase() === normalized);
}

/**
 * Devuelve el rol del correo, o null si no está autorizado.
 * INITIAL_ADMIN_EMAIL siempre es "admin" (bootstrap). Sin DATABASE_URL ⇒ "admin" (dev).
 */
export async function getUserRole(email: string): Promise<UserRole | null> {
  if (!process.env.DATABASE_URL) return "admin";

  const normalized = email.trim().toLowerCase();
  if (!normalized) return null;

  const bootstrap = process.env.INITIAL_ADMIN_EMAIL?.trim().toLowerCase();
  if (bootstrap && normalized === bootstrap) return "admin";

  const db = getDb();
  const [row] = await db
    .select({ role: emailAllowlist.role })
    .from(emailAllowlist)
    .where(eq(emailAllowlist.email, normalized))
    .limit(1);

  if (!row) return null;
  return isUserRole(row.role) ? row.role : "consultor";
}

/** Actualiza el rol de un usuario de la lista. Devuelve el registro actualizado o null. */
export async function updateUserRole(id: string, role: UserRole) {
  const db = getDb();
  const [updated] = await db
    .update(emailAllowlist)
    .set({ role })
    .where(eq(emailAllowlist.id, id))
    .returning();
  return updated ?? null;
}

export type EmailAllowlistRecord = Awaited<ReturnType<typeof loadEmailAllowlist>>[number];
