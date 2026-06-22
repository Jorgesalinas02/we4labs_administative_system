import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmployerParafiscalTable } from "@/components/employer-parafiscal-table";
import { PrestacionesSocialesTable } from "@/components/prestaciones-sociales-table";
import { LegalParametersTable } from "@/components/legal-parameters-table";
import { SalaryBaseEditor } from "@/components/salary-base-editor";
import { BusinessProfileEditor } from "@/components/business-profile-editor";
import { CashBufferEditor } from "@/components/cash-buffer-editor";
import { CategorySection } from "@/components/category-section";
import type {
  LegalParamsRecord,
  PayrollParamsRecord,
  ScenarioRecord,
  TenantProfileRecord,
  CashFlowSettingsRecord,
  BusinessCategoryRecord,
} from "@/lib/data";

export function SupuestosView({
  scenarios,
  payroll,
  legal,
  tenant,
  cfSettings,
  saldoInicial,
  startYm,
  incomeCategories,
  expenseCategories,
}: {
  scenarios: ScenarioRecord[];
  payroll: PayrollParamsRecord | null;
  legal: LegalParamsRecord | null;
  tenant: TenantProfileRecord | null;
  cfSettings: CashFlowSettingsRecord | null;
  saldoInicial: number | null;
  startYm: string | null;
  incomeCategories: BusinessCategoryRecord[];
  expenseCategories: BusinessCategoryRecord[];
}) {
  const noSeed = !payroll && !legal && !tenant;

  if (noSeed) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
        <p>
          No hay datos de supuestos para este tenant. Ejecuta{" "}
          <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/50">pnpm db:migrate</code> y{" "}
          <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/50">pnpm db:seed</code>.
        </p>
      </div>
    );
  }

  const SectionTitle = ({ n, title }: { n: string; title: string }) => (
    <div className="flex items-baseline gap-2">
      <span className="text-xs font-bold tabular-nums text-zinc-400 dark:text-zinc-600">{n}</span>
      <h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        {title}
      </h2>
    </div>
  );

  return (
    <div className="space-y-10">

      {/* ── 1. PARÁMETROS FISCALES 2026 ─────────────────────────────── */}
      <section className="space-y-3">
        <SectionTitle n="1" title="Parámetros fiscales 2026" />
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">SMMLV, UVT y auxilio de transporte</CardTitle>
            <CardDescription>
              Valores oficiales vigentes en pesos COP. Se usan en la calculadora de nómina y en
              reglas como el tope de 2 SMMLV para auxilio de transporte.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!payroll ? (
              <p className="text-sm text-zinc-500">Sin parámetros. Ejecuta el seed.</p>
            ) : (
              <SalaryBaseEditor payroll={payroll} />
            )}
          </CardContent>
        </Card>
      </section>

      {/* ── 2. DATOS DEL NEGOCIO ─────────────────────────────────────── */}
      <section className="space-y-3">
        <SectionTitle n="2" title="Datos del negocio" />
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Perfil de la empresa</CardTitle>
            <CardDescription>
              Nombre, sector, mes de inicio de proyección, empleados y salario promedio.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {tenant ? (
              <BusinessProfileEditor tenant={tenant} />
            ) : (
              <p className="text-sm text-zinc-500">Sin datos del tenant. Ejecuta el seed.</p>
            )}
            <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <div className="space-y-1">
                <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Mes de inicio de la proyección
                </p>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {startYm ?? "—"}
                </p>
                <p className="text-xs text-zinc-400">
                  Se edita desde{" "}
                  <a href="/flujo-de-caja" className="underline underline-offset-2 hover:text-zinc-600">
                    Flujo de Caja
                  </a>.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ── 3. INGRESOS MENSUALES ESPERADOS ─────────────────────────── */}
      <section className="space-y-3">
        <SectionTitle n="3" title="Ingresos mensuales esperados" />
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Categorías de ingreso activas</CardTitle>
            <CardDescription>
              Selecciona las categorías que aplican a tu negocio. Podrás registrar valores mes a
              mes en{" "}
              <a href="/flujo-de-caja" className="underline underline-offset-2 hover:text-zinc-600">
                Flujo de Caja
              </a>
              .
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CategorySection kind="income" categories={incomeCategories} />
          </CardContent>
        </Card>
      </section>

      {/* ── 4. EGRESOS MENSUALES ─────────────────────────────────────── */}
      <section className="space-y-3">
        <SectionTitle n="4" title="Egresos mensuales" />
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Categorías de egreso activas</CardTitle>
            <CardDescription>
              Costos, gastos fijos, variables, nómina, impuestos e inversión. Agrupa los que
              aplican a tu operación.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CategorySection kind="expense" categories={expenseCategories} />
          </CardContent>
        </Card>
      </section>

      {/* ── 5. SALDO EN CAJA / BANCO ─────────────────────────────────── */}
      <section className="space-y-3">
        <SectionTitle n="5" title="Saldo en caja / banco" />
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Saldo inicial y colchón de seguridad</CardTitle>
            <CardDescription>
              El saldo inicial se toma del flujo de caja. El colchón mínimo es una alerta de
              planeación: cuánto efectivo de reserva mantener como porcentaje de los egresos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CashBufferEditor settings={cfSettings} saldoInicial={saldoInicial} />
          </CardContent>
        </Card>
      </section>

      {/* ── PARÁMETROS LEGALES Y TRIBUTARIOS ────────────────────────── */}
      <section className="space-y-3">
        <SectionTitle n="+" title="Parámetros legales y tributarios" />
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Tasas y porcentajes aplicables</CardTitle>
            <CardDescription>
              IVA, retenciones, ICA y referencias normativas editables. Verificar con normativa
              vigente.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!legal ? (
              <p className="text-sm text-zinc-500">Sin datos. Ejecuta el seed.</p>
            ) : (
              <LegalParametersTable legal={legal} />
            )}
          </CardContent>
        </Card>
      </section>

      {/* ── APORTES PARAFISCALES ─────────────────────────────────────── */}
      <section className="space-y-3">
        <SectionTitle n="+" title="Aportes parafiscales y seguridad social" />
        <p className="text-sm text-zinc-500">
          Porcentajes sobre la base de cotización (IBC). Se aplican en la calculadora de nómina.
        </p>
        <Card>
          <CardContent className="pt-6">
            {!payroll ? (
              <p className="text-sm text-zinc-500">—</p>
            ) : (
              <EmployerParafiscalTable payroll={payroll} />
            )}
          </CardContent>
        </Card>
      </section>

      {/* ── PRESTACIONES SOCIALES ────────────────────────────────────── */}
      <section className="space-y-3">
        <SectionTitle n="+" title="Prestaciones sociales (% sobre salario)" />
        <p className="text-sm text-zinc-500">
          Provisión mensual estimada. El total es la suma de cesantías, intereses, prima y
          vacaciones.
        </p>
        <Card>
          <CardContent className="pt-6">
            {!payroll ? (
              <p className="text-sm text-zinc-500">—</p>
            ) : (
              <PrestacionesSocialesTable payroll={payroll} />
            )}
          </CardContent>
        </Card>
      </section>

      {/* ── ESCENARIOS DE PLANEACIÓN ────────────────────────────────── */}
      {scenarios.length > 0 && (
        <section className="space-y-3">
          <SectionTitle n="+" title="Escenarios de planeación" />
          <Card>
            <CardContent className="pt-6">
              <ul className="space-y-3">
                {scenarios.map((s) => (
                  <li
                    key={s.id}
                    className="rounded-lg border border-zinc-200 bg-zinc-50/80 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/40"
                  >
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">{s.name}</p>
                    <div className="mt-1 flex flex-wrap gap-x-4 text-sm text-zinc-600 dark:text-zinc-400">
                      {s.annualRatePct != null && (
                        <span>Tasa anual: {String(s.annualRatePct)} %</span>
                      )}
                      {s.inflationPct != null && (
                        <span>Inflación: {String(s.inflationPct)} %</span>
                      )}
                    </div>
                    {s.notes && <p className="mt-1 text-xs text-zinc-500">{s.notes}</p>}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}
