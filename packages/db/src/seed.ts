import path from "node:path";
import { loadMonorepoEnv } from "./load-monorepo-env.js";

loadMonorepoEnv();
import { fileURLToPath } from "node:url";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import * as schema from "./schema.js";
import { withTenant } from "./client.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const url = process.env.DATABASE_URL ?? "postgres://we4labs:we4labs@localhost:5433/we4labs";

async function main() {
  const client = postgres(url, { max: 1 });
  const db = drizzle(client, { schema });

  await db
    .insert(schema.tenants)
    .values({
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

  await withTenant(client, tenantId, async (tdb) => {
    const existing = await tdb.select().from(schema.cashMovements).limit(1);
    if (existing.length > 0) {
      console.log("Seed omitido: ya hay movimientos para el tenant demo.");
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
        counterparty: "Cliente A",
        invoiceRef: "FC-1001",
        amount: "2500000",
        dueOn: "2026-04-15",
      },
      {
        tenantId,
        kind: "payable",
        counterparty: "Proveedor B",
        invoiceRef: "P-882",
        amount: "980000",
        dueOn: "2026-04-05",
      },
    ]);

    const [ob] = await tdb
      .insert(schema.taxObligations)
      .values({
        tenantId,
        code: "IVA",
        title: "Impuesto al Valor Agregado (IVA)",
        summary:
          "Obligación común para prestadores de servicios y venta de bienes.",
        appliesTo: "Empresas declarantes de IVA en régimen común.",
        periodicity: "bimestral o mensual según clasificación",
        legalRef: "Estatuto tributario colombiano — consultar norma vigente.",
        bodyMarkdown:
          "## Resumen\nRegistrar ventas y compras, liquidar saldos a favor o en contra.\n\n## Próximos pasos\n1. Consolidar facturas del periodo.\n2. Preliquidación en sistema DIAN.",
      })
      .returning();

    if (ob) {
      await tdb.insert(schema.taxObligationSteps).values([
        {
          tenantId,
          obligationId: ob.id,
          sortOrder: 1,
          title: "Validar facturas electrónicas recibidas",
          details: "Revisar eventos 032/033 en el módulo DIAN.",
        },
        {
          tenantId,
          obligationId: ob.id,
          sortOrder: 2,
          title: "Presentar declaración dentro del calendario",
          details: "Usar el calendario oficial o el de esta aplicación como recordatorio.",
        },
      ]);
    }

    await tdb.insert(schema.taxCalendarEvents).values([
      {
        tenantId,
        obligationCode: "IVA-BIM",
        taxObligationId: ob?.id ?? null,
        title: "Declaración IVA bimestral",
        dueOn: "2026-04-16",
        entity: "DIAN",
        periodicity: "bimestral",
      },
      {
        tenantId,
        obligationCode: "Renta-EMP",
        title: "Impuesto de renta personas jurídicas (liquidación anual)",
        dueOn: "2026-04-09",
        entity: "DIAN",
        periodicity: "anual",
        notes: "Semilla Colombia — verificar vigencia oficial.",
      },
    ]);

    await tdb.insert(schema.payrollParameters).values({
      tenantId,
      effectiveFrom: "2026-01-01",
      smmlv: "1423500",
      transportAidMonthly: "200000",
      healthEmployeePct: "0.04",
      healthEmployerPct: "0.085",
      pensionEmployeePct: "0.04",
      pensionEmployerPct: "0.12",
      solidaridadEmployeePct: "0.01",
      risksEmployerPct: "0.0221",
      senaEmployerPct: "0.02",
      icbfEmployerPct: "0.03",
      cajaEmployerPct: "0.04",
      notes: "MVP — porcentajes ilustrativos; validar con tabla oficial y contrato.",
    });
  });

  console.log("Seed listo. tenant_id:", tenantId);
  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
