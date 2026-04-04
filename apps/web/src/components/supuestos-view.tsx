import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmployerParafiscalTable } from "@/components/employer-parafiscal-table";
import { PrestacionesSocialesTable } from "@/components/prestaciones-sociales-table";
import { LegalParametersTable } from "@/components/legal-parameters-table";
import type { LegalParamsRecord, PayrollParamsRecord, ScenarioRecord } from "@/lib/data";

function formatCop(n: string | number | null | undefined) {
  if (n == null || n === "") return "—";
  const v = Number(n);
  if (Number.isNaN(v)) return String(n);
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(v);
}

function ParamRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-zinc-100 py-2 last:border-0 dark:border-zinc-800">
      <span className="text-zinc-600 dark:text-zinc-400">{label}</span>
      <span className="font-medium tabular-nums text-zinc-900 dark:text-zinc-100">{value}</span>
    </div>
  );
}

export function SupuestosView({
  scenarios,
  payroll,
  legal,
}: {
  scenarios: ScenarioRecord[];
  payroll: PayrollParamsRecord | null;
  legal: LegalParamsRecord | null;
}) {
  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Parámetros generales
        </h2>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Parámetros legales y tributarios</CardTitle>
            <CardDescription>
              Tabla con concepto, valor editable y referencia normativa (
              <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-900">legal_parameters</code>
              ). Los porcentajes se ingresan como número (ej. 19 para 19 %). No sustituyen asesoría contable.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!legal ? (
              <div className="space-y-2 text-sm text-zinc-500">
                <p>
                  No hay fila en <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-900">legal_parameters</code> para
                  tu tenant.
                </p>
                <p>
                  En la raíz del proyecto:{" "}
                  <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-900">pnpm db:migrate</code> y luego{" "}
                  <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-900">pnpm db:seed</code> (el seed ahora crea
                  parámetros legales aunque ya existan movimientos de caja).
                </p>
                <p className="text-xs">
                  Si usas <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-900">DEV_TENANT_ID</code>, ese UUID debe
                  tener su propio registro en la base.
                </p>
              </div>
            ) : (
              <LegalParametersTable legal={legal} />
            )}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Aportes parafiscales y seguridad social
        </h2>
        <p className="text-sm text-zinc-500">
          Porcentajes sobre la base de cotización (IBC). En la calculadora mensual se usa salario devengado más auxilio de
          transporte cuando aplica.
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

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Prestaciones sociales (% sobre salario)
        </h2>
        <p className="text-sm text-zinc-500">
          Provisión mensual estimada sobre salario; el total es la suma de los cuatro rubros. Validar con CST y normativa
          vigente.
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

      <section className="space-y-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Nómina y escenarios de planeación</CardTitle>
            <CardDescription>
              <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-900">payroll_parameters</code> y escenarios
              financieros (tasa, inflación).
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <div className="space-y-1">
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Nómina y auxilios</p>
              {!payroll ? (
                <p className="text-sm text-zinc-500">Sin parámetros de nómina. Ejecuta el seed o crea un registro.</p>
              ) : (
                <>
                  <ParamRow label="Vigente desde" value={payroll.effectiveFrom} />
                  <ParamRow label="SMMLV" value={formatCop(payroll.smmlv)} />
                  <ParamRow label="Auxilio de transporte (mensual)" value={formatCop(payroll.transportAidMonthly)} />
                  {payroll.notes && (
                    <p className="pt-2 text-xs text-zinc-500 dark:text-zinc-400">{payroll.notes}</p>
                  )}
                </>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Escenarios de planeación</p>
              {scenarios.length === 0 ? (
                <p className="text-sm text-zinc-500">No hay escenarios.</p>
              ) : (
                <ul className="space-y-3">
                  {scenarios.map((s) => (
                    <li
                      key={s.id}
                      className="rounded-lg border border-zinc-200 bg-zinc-50/80 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/40"
                    >
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">{s.name}</p>
                      <div className="mt-1 flex flex-wrap gap-x-4 text-sm text-zinc-600 dark:text-zinc-400">
                        {s.annualRatePct != null && <span>Tasa anual: {String(s.annualRatePct)} %</span>}
                        {s.inflationPct != null && <span>Inflación: {String(s.inflationPct)} %</span>}
                      </div>
                      {s.notes && <p className="mt-1 text-xs text-zinc-500">{s.notes}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
