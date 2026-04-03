import { z } from "zod";

export const uuidSchema = z.string().uuid();

export const scenarioSchema = z.object({
  id: uuidSchema.optional(),
  name: z.string().min(1).max(200),
  annualRatePct: z.number().min(0).max(100).optional(),
  inflationPct: z.number().min(0).max(100).optional(),
  notes: z.string().max(2000).optional(),
});
export type ScenarioInput = z.infer<typeof scenarioSchema>;

export const cashMovementSchema = z.object({
  id: uuidSchema.optional(),
  scenarioId: uuidSchema.nullable().optional(),
  occurredOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  kind: z.enum(["inflow", "outflow"]),
  category: z.string().min(1).max(120),
  amount: z.number().positive(),
  isProjection: z.boolean().default(false),
  description: z.string().max(500).optional(),
});
export type CashMovementInput = z.infer<typeof cashMovementSchema>;

export const portfolioItemSchema = z.object({
  id: uuidSchema.optional(),
  kind: z.enum(["receivable", "payable"]),
  counterparty: z.string().min(1).max(200),
  invoiceRef: z.string().max(80).optional(),
  amount: z.number().positive(),
  dueOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  paidOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
});
export type PortfolioItemInput = z.infer<typeof portfolioItemSchema>;

export const taxEventSchema = z.object({
  id: uuidSchema.optional(),
  obligationCode: z.string().min(1).max(64),
  taxObligationId: uuidSchema.nullable().optional(),
  title: z.string().min(1).max(200),
  dueOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  entity: z.string().max(120).optional(),
  periodicity: z.string().max(80).optional(),
  notes: z.string().max(1000).optional(),
});
export type TaxEventInput = z.infer<typeof taxEventSchema>;

export const payrollCalcInputSchema = z.object({
  baseSalary: z.number().positive(),
  daysWorked: z.number().int().min(1).max(31),
  includeTransportAid: z.boolean(),
  contractType: z.enum(["indefinido", "fijo", "aprendiz"]),
});
export type PayrollCalcInput = z.infer<typeof payrollCalcInputSchema>;

export * from "./payroll.js";
