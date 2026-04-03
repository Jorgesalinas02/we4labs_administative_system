import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { loadPortfolio } from "@/lib/data";

function money(n: string | number) {
  const x = typeof n === "string" ? Number(n) : n;
  return x.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
}

export default async function CarteraPage() {
  const rows = await loadPortfolio();
  if (!process.env.DATABASE_URL) {
    return <p className="text-sm text-zinc-500">Conecta la base de datos.</p>;
  }
  const today = new Date().toISOString().slice(0, 10);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Control de cartera</h1>
        <p className="text-sm text-zinc-500">Cuentas por cobrar / pagar y aging simple (vs hoy).</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Documentos</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-zinc-500 dark:border-zinc-800">
                <th className="pb-2 pr-4 font-medium">Tipo</th>
                <th className="pb-2 pr-4 font-medium">Contraparte</th>
                <th className="pb-2 pr-4 font-medium">Ref.</th>
                <th className="pb-2 pr-4 font-medium">Monto</th>
                <th className="pb-2 pr-4 font-medium">Venc.</th>
                <th className="pb-2 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const open = !r.paidOn;
                const overdue = open && r.dueOn < today;
                return (
                  <tr key={r.id} className="border-b border-zinc-100 dark:border-zinc-900">
                    <td className="py-2 pr-4">{r.kind === "receivable" ? "CxC" : "CxP"}</td>
                    <td className="py-2 pr-4">{r.counterparty}</td>
                    <td className="py-2 pr-4">{r.invoiceRef ?? "—"}</td>
                    <td className="py-2 pr-4 tabular-nums">{money(r.amount)}</td>
                    <td className="py-2 pr-4">{r.dueOn}</td>
                    <td className="py-2">
                      {!open ? "Pagado" : overdue ? "Vencido" : "Abierto"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {rows.length === 0 && <p className="text-sm text-zinc-500">Sin documentos.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
