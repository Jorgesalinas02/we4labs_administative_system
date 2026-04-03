import { NominaCalculator } from "@/components/nomina-calculator";

export default function NominaPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Calculadora de nómina</h1>
        <p className="text-sm text-zinc-500">
          Colombia — estimación con parámetros del tenant (tabla <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-900">payroll_parameters</code>
          ). No sustituye asesoría legal ni software homologado.
        </p>
      </div>
      <NominaCalculator />
    </div>
  );
}
