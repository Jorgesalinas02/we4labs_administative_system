import path from "node:path";
import { loadMonorepoEnv } from "./load-monorepo-env.js";

loadMonorepoEnv();
import { fileURLToPath } from "node:url";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { and, asc, desc, eq } from "drizzle-orm";
import * as schema from "./schema.js";
import { type Db, withTenant } from "./client.js";
import { CASH_FLOW_DEFAULT_START_YM, cashFlowMonthPeriods } from "@we4labs/shared";
import { TAX_OBLIGATIONS_FLUJO_PYME_SAS } from "./tax-obligations-seed-data.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const url = process.env.DATABASE_URL ?? "postgres://we4labs:we4labs@localhost:5433/we4labs";

/** Obligaciones B4 del Excel Flujo PYME + calendario demo; idempotente por `code`. */
async function mergeTaxObligationsFromExcelTemplate(tdb: Db, tenantId: string) {
  for (const def of TAX_OBLIGATIONS_FLUJO_PYME_SAS) {
    const found = await tdb
      .select({ id: schema.taxObligations.id })
      .from(schema.taxObligations)
      .where(and(eq(schema.taxObligations.tenantId, tenantId), eq(schema.taxObligations.code, def.code)))
      .limit(1);
    if (found.length > 0) continue;

    const [row] = await tdb
      .insert(schema.taxObligations)
      .values({
        tenantId,
        code: def.code,
        title: def.title,
        summary: def.summary,
        appliesTo: def.appliesTo,
        periodicity: def.periodicity,
        legalRef: def.legalRef,
        bodyMarkdown: def.bodyMarkdown,
      })
      .returning();

    if (row && def.steps.length > 0) {
      await tdb.insert(schema.taxObligationSteps).values(
        def.steps.map((s, i) => ({
          tenantId,
          obligationId: row.id,
          sortOrder: i + 1,
          title: s.title,
          details: s.details ?? null,
        })),
      );
    }
    console.log(`Guía obligaciones: insertada ${def.code} (plantilla Excel B4).`);
  }
}

type TaxCalendarSeedRow = {
  obligationCode: string;
  /** `tax_obligations.code` para FK */
  obligationFkCode: string;
  title: string;
  dueOn: string;
  entity: string;
  periodicity: string;
  notes?: string;
};

/** Fechas ilustrativas; al re-ejecutar el seed se actualizan título, vínculo y vencimiento por `obligation_code`. */
const TAX_CALENDAR_SEED_ROWS: TaxCalendarSeedRow[] = [
  {
    obligationCode: "IVA-BIM",
    obligationFkCode: "IVA",
    title: "Declaración IVA bimestral",
    dueOn: "2026-04-16",
    entity: "DIAN",
    periodicity: "bimestral",
  },
  {
    obligationCode: "Renta-EMP",
    obligationFkCode: "RENTA",
    title: "Impuesto de renta — personas jurídicas (liquidación anual)",
    dueOn: "2026-04-09",
    entity: "DIAN",
    periodicity: "anual",
    notes: "Semilla ilustrativa — verificar calendario oficial.",
  },
  {
    obligationCode: "ICA-MUN-BIM",
    obligationFkCode: "ICA_MUN",
    title: "ICA bimestral — declaración municipal",
    dueOn: "2026-04-19",
    entity: "Municipio",
    periodicity: "bimestral",
  },
  {
    obligationCode: "RETE-FTE-M",
    obligationFkCode: "RETE_FUENTE",
    title: "Retención en la fuente — declaración y pago (agente retenedor)",
    dueOn: "2026-04-11",
    entity: "DIAN",
    periodicity: "mensual",
  },
  {
    obligationCode: "RETE-ICA-M",
    obligationFkCode: "RETE_ICA",
    title: "Retención ICA — agente retenedor",
    dueOn: "2026-04-25",
    entity: "Municipio",
    periodicity: "mensual o bimestral",
  },
  {
    obligationCode: "AUTORRET-1",
    obligationFkCode: "AUTORRET_RENTA",
    title: "Autorretención de renta — vencimiento periodo",
    dueOn: "2026-05-08",
    entity: "DIAN",
    periodicity: "según calendario",
  },
  {
    obligationCode: "GMF-REG",
    obligationFkCode: "GMF",
    title: "GMF (4×1000) — cierre / provisión mensual",
    dueOn: "2026-04-30",
    entity: "Tesorería / bancos",
    periodicity: "mensual",
    notes: "Para planeación de flujo; el gravamen se aplica por operación.",
  },
];

async function mergeTaxCalendarFromTemplate(tdb: Db, tenantId: string) {
  const obs = await tdb
    .select()
    .from(schema.taxObligations)
    .where(eq(schema.taxObligations.tenantId, tenantId));
  const oid = (code: string) => obs.find((o) => o.code === code)?.id ?? null;

  let inserted = 0;
  let updated = 0;
  for (const row of TAX_CALENDAR_SEED_ROWS) {
    const taxObligationId = oid(row.obligationFkCode);
    const payload = {
      taxObligationId,
      title: row.title,
      dueOn: row.dueOn,
      entity: row.entity,
      periodicity: row.periodicity,
      notes: row.notes ?? null,
    };

    const [existing] = await tdb
      .select({ id: schema.taxCalendarEvents.id })
      .from(schema.taxCalendarEvents)
      .where(
        and(
          eq(schema.taxCalendarEvents.tenantId, tenantId),
          eq(schema.taxCalendarEvents.obligationCode, row.obligationCode),
        ),
      )
      .orderBy(asc(schema.taxCalendarEvents.id))
      .limit(1);

    if (existing) {
      await tdb
        .update(schema.taxCalendarEvents)
        .set(payload)
        .where(eq(schema.taxCalendarEvents.id, existing.id));
      updated += 1;
    } else {
      await tdb.insert(schema.taxCalendarEvents).values({
        tenantId,
        obligationCode: row.obligationCode,
        ...payload,
      });
      inserted += 1;
    }
  }
  console.log(
    `Calendario tributario: sincronizado (${TAX_CALENDAR_SEED_ROWS.length} filas plantilla; ${inserted} nuevas, ${updated} actualizadas).`,
  );
}

/** UUID fijo del tenant demo (documentado en .env.example como DEV_TENANT_ID). */
const DEMO_TENANT_ID = "00000000-0000-4000-a000-000000000001";

async function main() {
  const client = postgres(url, { max: 1 });
  const db = drizzle(client, { schema });

  await db
    .insert(schema.tenants)
    .values({
      id: DEMO_TENANT_ID,
      name: "We4Labs Demo",
      slug: "we4labs-demo",
      brandingJson: { primary: "221 83% 48%" },
    })
    .onConflictDoNothing({ target: schema.tenants.slug });

  const tenant = await db.query.tenants.findFirst({
    where: eq(schema.tenants.slug, "we4labs-demo"),
  });
  if (!tenant) throw new Error("No se pudo crear tenant demo");

  const tenantId = tenant.id;

  const u0 = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, "admin@we4labs.local"));
  if (u0.length === 0) {
    await db.insert(schema.users).values({
      tenantId,
      email: "admin@we4labs.local",
      name: "Administrador",
      role: "admin",
    });
  }

  const legalReferences: Record<string, string> = {
    effectiveFrom: "Inicio de vigencia de los supuestos en planeación y reportes.",
    initialCashBalance: "Saldo en bancos al inicio del período",
    employeeCount: "Planta de personal fija",
    averageMonthlySalaryCop: "Salario base promedio",
    generalVatRatePct: "Art. 468 E.T. — Tarifa general 19%",
    clientsWithholdingSharePct: "Proporción de clientes que practican retención",
    withholdingServicesRatePct: "Art. 392 E.T. — Servicios generales 4%",
    icaWithholdingRatePct: "Varía según municipio y actividad",
    incomeSelfRetentionRatePct: "Decreto 2201/2016 — 0,80%",
  };

  const legalSeed = {
    effectiveFrom: "2026-01-01",
    initialCashBalance: "25000000",
    employeeCount: 5,
    averageMonthlySalaryCop: "3200000",
    generalVatRatePct: "0.19",
    clientsWithholdingSharePct: "0.35",
    withholdingServicesRatePct: "0.04",
    icaWithholdingRatePct: "0.00966",
    incomeSelfRetentionRatePct: "0.008",
    referencesJson: legalReferences,
    notes:
      "Valores ilustrativos — validar tarifas ICA/autoretención según municipio y régimen.",
  };

  const prestacionesReferences: Record<string, string> = {
    cesantiasPct: "CST Art. 249 — 8,33%",
    interesesCesantiasProvisionPct: "Ley 52/1975 — 1% (12% anual / 12)",
    primaServiciosPct: "CST Art. 306 — 8,33%",
    vacacionesProvisionPct: "CST Art. 186 — 4,17%",
  };

  const employerParafiscalReferences: Record<string, string> = {
    healthEmployerPct: "Ley 1122/2007 — 8,5% empleador",
    pensionEmployerPct: "Ley 797/2003 — 12% empleador",
    risksEmployerPct: "Decreto 1295/1994 — Riesgo I",
    cajaEmployerPct: "Ley 21/1982 — 4%",
    icbfEmployerPct: "Ley 89/1988 — 3% (si aplica, >10 SMMLV nómina)",
    senaEmployerPct: "Ley 21/1982 — 2% (si aplica, >10 SMMLV nómina)",
  };

  const payrollSeed = {
    effectiveFrom: "2026-01-01",
    smmlv: "1423500",
    transportAidMonthly: "200000",
    healthEmployeePct: "0.04",
    healthEmployerPct: "0.085",
    pensionEmployeePct: "0.04",
    pensionEmployerPct: "0.12",
    solidaridadEmployeePct: "0.01",
    risksEmployerPct: "0.005",
    senaEmployerPct: "0.02",
    icbfEmployerPct: "0.03",
    cajaEmployerPct: "0.04",
    employerParafiscalRefsJson: employerParafiscalReferences,
    cesantiasPct: "0.0833",
    interesesCesantiasProvisionPct: "0.01",
    primaServiciosPct: "0.0833",
    vacacionesProvisionPct: "0.04167",
    prestacionesRefsJson: prestacionesReferences,
    notes: "MVP — porcentajes ilustrativos; validar con tabla oficial y contrato.",
  };

  await withTenant(client, tenantId, async (tdb) => {
    const [legalRow] = await tdb
      .select({ id: schema.legalParameters.id })
      .from(schema.legalParameters)
      .where(eq(schema.legalParameters.tenantId, tenantId))
      .limit(1);
    if (!legalRow) {
      await tdb.insert(schema.legalParameters).values({ tenantId, ...legalSeed });
      console.log("Insertados legal_parameters para el tenant demo.");
    } else {
      const [latestLegal] = await tdb
        .select()
        .from(schema.legalParameters)
        .where(eq(schema.legalParameters.tenantId, tenantId))
        .orderBy(desc(schema.legalParameters.effectiveFrom))
        .limit(1);
      if (latestLegal) {
        await tdb
          .update(schema.legalParameters)
          .set({ referencesJson: legalReferences })
          .where(eq(schema.legalParameters.id, latestLegal.id));
        console.log("Referencias legales (columna referencia) sincronizadas con la plantilla.");
      }
    }

    const [payrollRow] = await tdb
      .select({ id: schema.payrollParameters.id })
      .from(schema.payrollParameters)
      .where(eq(schema.payrollParameters.tenantId, tenantId))
      .limit(1);
    if (!payrollRow) {
      await tdb.insert(schema.payrollParameters).values({ tenantId, ...payrollSeed });
      console.log("Insertados payroll_parameters para el tenant demo.");
    } else {
      const [latestPayroll] = await tdb
        .select()
        .from(schema.payrollParameters)
        .where(eq(schema.payrollParameters.tenantId, tenantId))
        .orderBy(desc(schema.payrollParameters.effectiveFrom))
        .limit(1);
      if (latestPayroll) {
        await tdb
          .update(schema.payrollParameters)
          .set({
            employerParafiscalRefsJson: employerParafiscalReferences,
            prestacionesRefsJson: prestacionesReferences,
          })
          .where(eq(schema.payrollParameters.id, latestPayroll.id));
        console.log("Referencias empleador y prestaciones sincronizadas con la plantilla.");
      }
    }

    const [cfCell] = await tdb
      .select({ id: schema.cashFlowSheetCells.id })
      .from(schema.cashFlowSheetCells)
      .where(eq(schema.cashFlowSheetCells.tenantId, tenantId))
      .limit(1);
    if (!cfCell) {
      await tdb
        .insert(schema.cashFlowSheetSettings)
        .values({ tenantId, startYm: CASH_FLOW_DEFAULT_START_YM })
        .onConflictDoNothing({ target: schema.cashFlowSheetSettings.tenantId });
      const months = cashFlowMonthPeriods(CASH_FLOW_DEFAULT_START_YM);
      const nominaEjemplo = "3314820";
      const cellRows = months.map((periodYm) => ({
        tenantId,
        lineCode: "salarios_base",
        periodYm,
        amount: nominaEjemplo,
      }));
      cellRows.push({
        tenantId,
        lineCode: "saldo_inicial_de_caja",
        periodYm: months[0]!,
        amount: "25000000",
      });
      await tdb.insert(schema.cashFlowSheetCells).values(cellRows);
      console.log("Semilla flujo de caja (matriz Excel): saldo inicial + salarios base por mes.");
    }

    await mergeTaxObligationsFromExcelTemplate(tdb, tenantId);
    await mergeTaxCalendarFromTemplate(tdb, tenantId);

    const existing = await tdb.select().from(schema.cashMovements).limit(1);
    if (existing.length > 0) {
      console.log("Seed de movimientos/cartera omitido: ya hay movimientos para el tenant demo.");
      return;
    }

    const [s1] = await tdb
      .insert(schema.scenarios)
      .values({
        tenantId,
        name: "Base 2026",
        annualRatePct: "12",
        inflationPct: "5",
        notes: "Escenario de referencia (Material/Flujo PYME)",
      })
      .returning();

    if (s1) {
      await tdb.insert(schema.cashMovements).values([
        {
          tenantId,
          scenarioId: s1.id,
          occurredOn: "2026-01-15",
          kind: "inflow",
          category: "Servicios",
          amount: "18500000",
          isProjection: false,
        },
        {
          tenantId,
          scenarioId: s1.id,
          occurredOn: "2026-02-01",
          kind: "outflow",
          category: "Nómina",
          amount: "4200000",
          isProjection: false,
        },
      ]);
    }

    await tdb.insert(schema.portfolioItems).values([
      {
        tenantId,
        kind: "receivable",
        sortOrder: 1,
        counterparty: "Cliente A",
        serviceDescription: "Consultoría y soporte (referencia hoja Control de Cartera)",
        invoiceRef: "FC-1001",
        issuedOn: "2026-03-01",
        dueOn: "2026-04-15",
        grossAmount: "2500000",
        ivaAmount: "475000",
        retefuenteAmount: "62500",
        reteicaAmount: "0",
        amount: "2912500",
        paidAmount: "1000000",
        status: "Parcial",
        notes: "Ejemplo alineado a Flujo_de_Caja_Pyme_SAS completo.xlsx",
      },
      {
        tenantId,
        kind: "payable",
        sortOrder: 1,
        counterparty: "Proveedor B",
        invoiceRef: "P-882",
        amount: "980000",
        dueOn: "2026-04-05",
        paidAmount: "0",
        status: "Abierto",
      },
    ]);

  });

  console.log("Seed listo. tenant_id:", tenantId);
  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
