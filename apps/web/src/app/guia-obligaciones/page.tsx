export const dynamic = "force-dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { loadTaxObligations } from "@/lib/data";

export default async function GuiaPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code: highlightCode } = await searchParams;
  const items = await loadTaxObligations();
  if (!process.env.DATABASE_URL) {
    return <p className="text-sm text-zinc-500">Conecta la base de datos.</p>;
  }
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Guía de obligaciones tributarias</h1>
        <p className="text-sm text-zinc-500">
          Contenido estructurado migrado desde Material (DOCX/Excel conceptual). Edición admin pendiente en
          siguientes iteraciones.
        </p>
      </div>
      <div className="space-y-6">
        {items.map((o) => (
          <Card
            key={o.id}
            className={
              highlightCode && highlightCode === o.code
                ? "ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-zinc-950"
                : undefined
            }
          >
            <CardHeader>
              <CardTitle className="text-base">
                <span className="mr-2 rounded bg-zinc-100 px-2 py-0.5 text-xs font-mono dark:bg-zinc-900">
                  {o.code}
                </span>
                {o.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-zinc-600 dark:text-zinc-400">
              {o.summary && <p>{o.summary}</p>}
              {o.appliesTo && (
                <p>
                  <span className="font-medium text-zinc-800 dark:text-zinc-200">Aplica a:</span> {o.appliesTo}
                </p>
              )}
              {o.legalRef && (
                <p className="text-xs text-zinc-500">Referencia: {o.legalRef}</p>
              )}
              {o.steps.length > 0 && (
                <ol className="list-decimal space-y-2 pl-5">
                  {o.steps.map((s) => (
                    <li key={s.id}>
                      <span className="font-medium text-zinc-800 dark:text-zinc-200">{s.title}</span>
                      {s.details && <p className="mt-0.5 text-zinc-500">{s.details}</p>}
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        ))}
        {items.length === 0 && <p className="text-sm text-zinc-500">Sin obligaciones cargadas.</p>}
      </div>
    </div>
  );
}
