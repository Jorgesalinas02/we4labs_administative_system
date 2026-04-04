import { loadLatestLegalParams, loadLatestPayrollParams, loadScenarios } from "@/lib/data";
import { SupuestosView } from "@/components/supuestos-view";

export default async function SupuestosPage() {
  if (!process.env.DATABASE_URL) {
    return <p className="text-sm text-zinc-500">Conecta la base de datos para ver supuestos.</p>;
  }

  const [scenarios, payroll, legal] = await Promise.all([
    loadScenarios(),
    loadLatestPayrollParams(),
    loadLatestLegalParams(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Supuestos</h1>
        <p className="text-sm text-zinc-500">
          Parámetros legales y de planeación, nómina (aportes y prestaciones) por tenant.
        </p>
      </div>
      <SupuestosView scenarios={scenarios} payroll={payroll} legal={legal} />
    </div>
  );
}
