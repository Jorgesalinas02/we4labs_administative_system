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
  sortOrder: z.number().int().optional(),
  serviceDescription: z.string().max(2000).optional(),
  issuedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  grossAmount: z.number().nonnegative().optional(),
  ivaAmount: z.number().nonnegative().optional(),
  retefuenteAmount: z.number().nonnegative().optional(),
  reteicaAmount: z.number().nonnegative().optional(),
  paidAmount: z.number().nonnegative().optional(),
  status: z.string().max(80).optional(),
  notes: z.string().max(2000).optional(),
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

/** Actualización de parámetros legales: porcentajes en columna valor como número 0–100 (ej. 19 = 19 %). */
export const legalParametersUpdateSchema = z.object({
  id: uuidSchema,
  effectiveFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  initialCashBalance: z.number().finite().nonnegative(),
  employeeCount: z.number().int().nonnegative(),
  averageMonthlySalaryCop: z.number().finite().nonnegative(),
  generalVatRatePct: z.number().finite().min(0).max(100),
  clientsWithholdingSharePct: z.number().finite().min(0).max(100),
  withholdingServicesRatePct: z.number().finite().min(0).max(100),
  icaWithholdingRatePct: z.number().finite().min(0).max(100),
  incomeSelfRetentionRatePct: z.number().finite().min(0).max(100),
});
export type LegalParametersUpdateInput = z.infer<typeof legalParametersUpdateSchema>;

/** % empleador en seguridad social y parafiscales; valores 0–100 (ej. 8,5 = 8,5 %). */
export const payrollEmployerParafiscalUpdateSchema = z.object({
  id: uuidSchema,
  healthEmployerPct: z.number().finite().min(0).max(100),
  pensionEmployerPct: z.number().finite().min(0).max(100),
  risksEmployerPct: z.number().finite().min(0).max(100),
  cajaEmployerPct: z.number().finite().min(0).max(100),
  icbfEmployerPct: z.number().finite().min(0).max(100),
  senaEmployerPct: z.number().finite().min(0).max(100),
});
export type PayrollEmployerParafiscalUpdateInput = z.infer<typeof payrollEmployerParafiscalUpdateSchema>;

/** Provisiones prestaciones sociales (% sobre salario); valores 0–100. */
export const payrollPrestacionesUpdateSchema = z.object({
  id: uuidSchema,
  cesantiasPct: z.number().finite().min(0).max(100),
  interesesCesantiasProvisionPct: z.number().finite().min(0).max(100),
  primaServiciosPct: z.number().finite().min(0).max(100),
  vacacionesProvisionPct: z.number().finite().min(0).max(100),
});
export type PayrollPrestacionesUpdateInput = z.infer<typeof payrollPrestacionesUpdateSchema>;

/** SMMLV, UVT y auxilio de transporte; valores en pesos COP enteros. */
export const payrollSalaryBaseUpdateSchema = z.object({
  id: uuidSchema,
  smmlv: z.number().int().finite().positive(),
  uvt: z.number().int().finite().positive(),
  transportAidMonthly: z.number().int().finite().min(0),
});
export type PayrollSalaryBaseUpdateInput = z.infer<typeof payrollSalaryBaseUpdateSchema>;

/** Datos del negocio: nombre y sector del tenant. */
export const tenantBusinessProfileUpdateSchema = z.object({
  name: z.string().min(1).max(200),
  sector: z.string().min(1).max(120),
});
export type TenantBusinessProfileUpdateInput = z.infer<typeof tenantBusinessProfileUpdateSchema>;

/** Colchón mínimo de caja: fracción 0–1 (ej. 0.10 = 10%). */
export const cashFlowBufferUpdateSchema = z.object({
  minCashBufferPct: z.number().finite().min(0).max(1),
});
export type CashFlowBufferUpdateInput = z.infer<typeof cashFlowBufferUpdateSchema>;

/** Actualización de celdas editables del flujo de caja (plantilla Excel). */
export const cashFlowSheetPatchSchema = z.object({
  startYm: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  cells: z
    .array(
      z.object({
        lineCode: z.string().min(1).max(128),
        periodYm: z.string().regex(/^\d{4}-\d{2}$/),
        amount: z.number().finite(),
      }),
    )
    .optional(),
});
export type CashFlowSheetPatchInput = z.infer<typeof cashFlowSheetPatchSchema>;

/** Alta de factura CxC (campos del modal; IVA/rete/neto se calculan como en el Excel). El N° factura FAC-XXX lo asigna el servidor. */
export const carteraReceivableCreateSchema = z.object({
  counterparty: z.string().min(1).max(200),
  serviceDescription: z.string().max(2000).optional(),
  issuedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dueOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  grossAmount: z.number().finite().positive(),
  notes: z.string().max(2000).optional(),
});
export type CarteraReceivableCreateInput = z.infer<typeof carteraReceivableCreateSchema>;

/** Edición de factura CxC: mismos campos que el alta; el N° factura no cambia en servidor. */
export const carteraReceivableUpdateSchema = carteraReceivableCreateSchema;
export type CarteraReceivableUpdateInput = z.infer<typeof carteraReceivableUpdateSchema>;

/** Registro de pago sobre una factura CxC: suma al campo pagado (tope = neto). */
export const carteraReceivablePaymentSchema = z.object({
  paymentAmount: z.number().finite().positive(),
  /** Mes del flujo de caja (mismas columnas YYYY-MM que la hoja) donde imputar este cobro. */
  cashFlowPeriodYm: z.string().regex(/^\d{4}-\d{2}$/),
});
export type CarteraReceivablePaymentInput = z.infer<typeof carteraReceivablePaymentSchema>;

export * from "./payroll.js";
export * from "./cash-flow-sheet.js";
export * from "./cartera-receivable-math.js";
export * from "./cartera-invoice-ref.js";
export * from "./business-categories.js";
