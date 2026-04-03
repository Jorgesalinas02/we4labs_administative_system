import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const tenants = pgTable("tenants", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 200 }).notNull(),
  slug: varchar("slug", { length: 80 }).notNull().unique(),
  brandingJson: jsonb("branding_json").$type<Record<string, string> | null>(),
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

export const portfolioItems = pgTable("portfolio_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  kind: varchar("kind", { length: 20 }).notNull(),
  counterparty: varchar("counterparty", { length: 200 }).notNull(),
  invoiceRef: varchar("invoice_ref", { length: 80 }),
  amount: numeric("amount", { precision: 18, scale: 2 }).notNull(),
  dueOn: varchar("due_on", { length: 10 }).notNull(),
  paidOn: varchar("paid_on", { length: 10 }),
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
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
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
