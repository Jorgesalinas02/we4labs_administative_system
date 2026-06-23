import { sql } from "drizzle-orm";
import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const tenants = pgTable("tenants", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 200 }).notNull(),
  slug: varchar("slug", { length: 80 }).notNull().unique(),
  sector: varchar("sector", { length: 120 }),
  brandingJson: jsonb("branding_json").$type<Record<string, string> | null>(),
  clerkUserId: varchar("clerk_user_id", { length: 200 }).unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

/** Lista blanca de correos autorizados a ingresar al sistema, con su rol de acceso. */
export const emailAllowlist = pgTable("email_allowlist", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  addedBy: varchar("added_by", { length: 320 }),
  /** Rol de acceso: "admin" (total) | "consultor" (solo lectura). */
  role: varchar("role", { length: 32 }).notNull().default("consultor"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  email: varchar("email", { length: 320 }).notNull(),
  name: varchar("name", { length: 200 }),
  role: varchar("role", { length: 32 }).notNull().default("member"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const scenarios = pgTable("scenarios", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 200 }).notNull(),
  annualRatePct: numeric("annual_rate_pct", { precision: 6, scale: 3 }),
  inflationPct: numeric("inflation_pct", { precision: 6, scale: 3 }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const cashMovements = pgTable("cash_movements", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  scenarioId: uuid("scenario_id").references(() => scenarios.id, {
    onDelete: "set null",
  }),
  occurredOn: varchar("occurred_on", { length: 10 }).notNull(),
  kind: varchar("kind", { length: 16 }).notNull(),
  category: varchar("category", { length: 120 }).notNull(),
  amount: numeric("amount", { precision: 18, scale: 2 }).notNull(),
  isProjection: boolean("is_projection").notNull().default(false),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

/** Primer mes de las 12 columnas del flujo (YYYY-MM), alineado a la plantilla Excel. */
export const cashFlowSheetSettings = pgTable("cash_flow_sheet_settings", {
  tenantId: uuid("tenant_id")
    .primaryKey()
    .references(() => tenants.id, { onDelete: "cascade" }),
  startYm: varchar("start_ym", { length: 7 }).notNull().default("2026-04"),
  /** Colchón mínimo de seguridad como fracción del total de egresos (ej. 0.10 = 10%). */
  minCashBufferPct: numeric("min_cash_buffer_pct", { precision: 6, scale: 4 }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

/** Celdas persistidas: líneas editables × mes (importes en COP). */
export const cashFlowSheetCells = pgTable(
  "cash_flow_sheet_cells",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    lineCode: varchar("line_code", { length: 128 }).notNull(),
    periodYm: varchar("period_ym", { length: 7 }).notNull(),
    amount: numeric("amount", { precision: 18, scale: 2 }).notNull().default("0"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    tenantLinePeriodUq: uniqueIndex("cash_flow_sheet_cells_tenant_line_period_uq").on(
      t.tenantId,
      t.lineCode,
      t.periodYm,
    ),
  }),
);

export const portfolioItems = pgTable("portfolio_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  kind: varchar("kind", { length: 20 }).notNull(),
  counterparty: varchar("counterparty", { length: 200 }).notNull(),
  invoiceRef: varchar("invoice_ref", { length: 80 }),
  /** Neto a cobrar / a pagar (columna «Neto» de la hoja Control de Cartera). */
  amount: numeric("amount", { precision: 18, scale: 2 }).notNull(),
  dueOn: varchar("due_on", { length: 10 }).notNull(),
  paidOn: varchar("paid_on", { length: 10 }),
  sortOrder: integer("sort_order"),
  serviceDescription: text("service_description"),
  issuedOn: varchar("issued_on", { length: 10 }),
  grossAmount: numeric("gross_amount", { precision: 18, scale: 2 }),
  ivaAmount: numeric("iva_amount", { precision: 18, scale: 2 }),
  retefuenteAmount: numeric("retefuente_amount", { precision: 18, scale: 2 }),
  reteicaAmount: numeric("reteica_amount", { precision: 18, scale: 2 }),
  paidAmount: numeric("paid_amount", { precision: 18, scale: 2 }).notNull().default("0"),
  /** Cobros imputados a un mes del flujo de caja (YYYY-MM), por registro de pago. */
  paymentCashFlowAllocations: jsonb("payment_cash_flow_allocations")
    .$type<{ periodYm: string; amountCop: number; recordedAt: string }[]>()
    .notNull()
    .default(sql`'[]'::jsonb`),
  status: varchar("status", { length: 80 }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const taxObligations = pgTable("tax_obligations", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  code: varchar("code", { length: 64 }).notNull(),
  title: varchar("title", { length: 300 }).notNull(),
  summary: text("summary"),
  appliesTo: text("applies_to"),
  periodicity: varchar("periodicity", { length: 80 }),
  legalRef: text("legal_ref"),
  externalUrl: varchar("external_url", { length: 500 }),
  bodyMarkdown: text("body_markdown"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const taxCalendarEvents = pgTable("tax_calendar_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  obligationCode: varchar("obligation_code", { length: 64 }).notNull(),
  taxObligationId: uuid("tax_obligation_id").references(() => taxObligations.id, {
    onDelete: "set null",
  }),
  title: varchar("title", { length: 200 }).notNull(),
  dueOn: varchar("due_on", { length: 10 }).notNull(),
  entity: varchar("entity", { length: 120 }),
  periodicity: varchar("periodicity", { length: 80 }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const taxObligationSteps = pgTable("tax_obligation_steps", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  obligationId: uuid("obligation_id")
    .notNull()
    .references(() => taxObligations.id, { onDelete: "cascade" }),
  sortOrder: integer("sort_order").notNull().default(0),
  title: varchar("title", { length: 300 }).notNull(),
  details: text("details"),
});

export const payrollParameters = pgTable("payroll_parameters", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id, {
    onDelete: "cascade",
  }),
  effectiveFrom: varchar("effective_from", { length: 10 }).notNull(),
  smmlv: numeric("smmlv", { precision: 14, scale: 2 }).notNull(),
  /** UVT — Unidad de Valor Tributario vigente (COP). Decreto DIAN cada año. */
  uvt: numeric("uvt", { precision: 14, scale: 2 }),
  transportAidMonthly: numeric("transport_aid_monthly", {
    precision: 14,
    scale: 2,
  }).notNull(),
  healthEmployeePct: numeric("health_employee_pct", { precision: 6, scale: 4 }),
  healthEmployerPct: numeric("health_employer_pct", { precision: 6, scale: 4 }),
  pensionEmployeePct: numeric("pension_employee_pct", { precision: 6, scale: 4 }),
  pensionEmployerPct: numeric("pension_employer_pct", { precision: 6, scale: 4 }),
  solidaridadEmployeePct: numeric("solidaridad_employee_pct", {
    precision: 6,
    scale: 4,
  }),
  risksEmployerPct: numeric("risks_employer_pct", { precision: 6, scale: 4 }),
  senaEmployerPct: numeric("sena_employer_pct", { precision: 6, scale: 4 }),
  icbfEmployerPct: numeric("icbf_employer_pct", { precision: 6, scale: 4 }),
  cajaEmployerPct: numeric("caja_employer_pct", { precision: 6, scale: 4 }),
  /** Referencias legales por campo empleador (misma clave camelCase que el %). */
  employerParafiscalRefsJson: jsonb("employer_parafiscal_references_json").$type<
    Record<string, string> | null
  >(),
  /** Provisión mensual típica como fracción del salario (ej. 8.33% → 0.0833). */
  cesantiasPct: numeric("cesantias_pct", { precision: 6, scale: 4 }),
  primaServiciosPct: numeric("prima_servicios_pct", { precision: 6, scale: 4 }),
  vacacionesProvisionPct: numeric("vacaciones_provision_pct", { precision: 6, scale: 4 }),
  /** Provisión mensual intereses cesantías como fracción del salario (ej. 1% → 0.01). */
  interesesCesantiasProvisionPct: numeric("intereses_cesantias_provision_pct", {
    precision: 6,
    scale: 4,
  }),
  prestacionesRefsJson: jsonb("prestaciones_references_json").$type<Record<string, string> | null>(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

/** Supuestos legales / tributarios / operativos del tenant (planeación, no sustituye asesoría). */
export const legalParameters = pgTable("legal_parameters", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id, {
    onDelete: "cascade",
  }),
  effectiveFrom: varchar("effective_from", { length: 10 }).notNull(),
  initialCashBalance: numeric("initial_cash_balance", { precision: 18, scale: 2 }).notNull(),
  employeeCount: integer("employee_count").notNull(),
  averageMonthlySalaryCop: numeric("average_monthly_salary_cop", {
    precision: 18,
    scale: 2,
  }).notNull(),
  /** IVA general, fracción (ej. 0.19). */
  generalVatRatePct: numeric("general_vat_rate_pct", { precision: 6, scale: 4 }),
  /** Fracción de clientes sujetos a retención en la fuente (ej. 0.35 = 35%). */
  clientsWithholdingSharePct: numeric("clients_withholding_share_pct", {
    precision: 6,
    scale: 4,
  }),
  withholdingServicesRatePct: numeric("withholding_services_rate_pct", {
    precision: 6,
    scale: 4,
  }),
  icaWithholdingRatePct: numeric("ica_withholding_rate_pct", { precision: 6, scale: 4 }),
  incomeSelfRetentionRatePct: numeric("income_self_retention_rate_pct", {
    precision: 6,
    scale: 4,
  }),
  /** Referencias normativas o metodológicas por campo (misma clave que el campo en camelCase). */
  referencesJson: jsonb("references_json").$type<Record<string, string> | null>(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const businessCategories = pgTable("business_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  kind: varchar("kind", { length: 16 }).notNull(),
  parentCode: varchar("parent_code", { length: 100 }).notNull(),
  parentLabel: varchar("parent_label", { length: 200 }).notNull(),
  code: varchar("code", { length: 100 }).notNull(),
  label: varchar("label", { length: 200 }).notNull(),
  asksClient: varchar("asks_client", { length: 16 }).notNull().default("none"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

/** Clientes del negocio. */
export const clients = pgTable("clients", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 200 }).notNull(),
  nit: varchar("nit", { length: 30 }),
  clientType: varchar("client_type", { length: 80 }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

/** Miembros del equipo / prestadores de servicios del tenant. */
export const teamMembers = pgTable("team_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 200 }).notNull(),
  /** Rol: empleado | contratista | socio | otro */
  kind: varchar("kind", { length: 32 }).notNull().default("empleado"),
  email: varchar("email", { length: 320 }),
  notes: text("notes"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

/** Transacciones individuales por categoría de negocio y mes. */
export const cashFlowEntries = pgTable("cash_flow_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  categoryCode: varchar("category_code", { length: 100 }).notNull(),
  periodYm: varchar("period_ym", { length: 7 }).notNull(),
  occurredOn: varchar("occurred_on", { length: 10 }),
  description: text("description"),
  amount: numeric("amount", { precision: 18, scale: 2 }).notNull().default("0"),
  clientId: uuid("client_id").references(() => clients.id, { onDelete: "set null" }),
  teamMemberId: uuid("team_member_id").references(() => teamMembers.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  actorUserId: uuid("actor_user_id").references(() => users.id),
  action: varchar("action", { length: 120 }).notNull(),
  entity: varchar("entity", { length: 120 }).notNull(),
  entityId: varchar("entity_id", { length: 80 }),
  payloadJson: jsonb("payload_json"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const tenantsRelations = relations(tenants, ({ many }) => ({
  users: many(users),
  scenarios: many(scenarios),
}));

export const scenariosRelations = relations(scenarios, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [scenarios.tenantId],
    references: [tenants.id],
  }),
  movements: many(cashMovements),
}));
