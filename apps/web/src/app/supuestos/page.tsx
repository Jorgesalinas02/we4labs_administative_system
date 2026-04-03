import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { loadScenarios } from "@/lib/data";

export default async function SupuestosPage() {
  const rows = await loadScenarios();
  if (!process.env.DATABASE_URL) {
    return <p className="text-sm text-zinc-500">Conecta la base de datos para ver escenarios.</p>;
  }
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Supuestos</h1>
        <p className="text-sm text-zinc-500">Escenarios de planeación (tasa, inflación, notas).</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {rows.length === 0 ? (
          <p className="text-sm text-zinc-500">No hay escenarios. Ejecuta el seed o crea uno vía API.</p>
        ) : (
          rows.map((s) => (
            <Card key={s.id}>
              <CardHeader>
                <CardTitle>{s.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
                {s.annualRatePct != null && <p>Tasa anual: {String(s.annualRatePct)}%</p>}
                {s.inflationPct != null && <p>Inflación: {String(s.inflationPct)}%</p>}
                {s.notes && <p className="pt-2 text-zinc-500">{s.notes}</p>}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
