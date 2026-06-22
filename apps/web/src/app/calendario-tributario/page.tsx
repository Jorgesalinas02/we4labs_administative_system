export const dynamic = "force-dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { loadTaxCalendar } from "@/lib/data";

export default async function CalendarioPage() {
  const rows = await loadTaxCalendar();
  if (!process.env.DATABASE_URL) {
    return <p className="text-sm text-zinc-500">Conecta la base de datos.</p>;
  }
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Calendario tributario</h1>
        <p className="text-sm text-zinc-500">
          Colombia — fechas semilla; enlaza con la{" "}
          <Link href="/guia-obligaciones" className="text-blue-600 underline dark:text-blue-400">
            guía de obligaciones
          </Link>
          .
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Próximos vencimientos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {rows.map((e) => (
            <div
              key={e.id}
              className="flex flex-col gap-1 rounded-lg border border-zinc-100 p-3 dark:border-zinc-900 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium">{e.title}</p>
                <p className="text-xs text-zinc-500">
                  {e.obligationCode} · {e.entity ?? "—"} · {e.periodicity ?? "—"}
                </p>
                {e.notes && <p className="text-xs text-amber-700 dark:text-amber-400">{e.notes}</p>}
                {e.guideCode && (
                  <Link
                    href={`/guia-obligaciones?code=${encodeURIComponent(e.guideCode)}`}
                    className="mt-1 inline-block text-xs font-medium text-blue-600 underline dark:text-blue-400"
                  >
                    Ver guía: {e.guideCode}
                  </Link>
                )}
              </div>
              <div className="text-sm font-semibold tabular-nums text-zinc-800 dark:text-zinc-200">
                {e.dueOn}
              </div>
            </div>
          ))}
          {rows.length === 0 && <p className="text-sm text-zinc-500">Sin eventos.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
