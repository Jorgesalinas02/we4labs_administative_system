import type { CarteraReceivableRates } from "@we4labs/shared";
import { CarteraInvoicePaymentButton } from "@/components/cartera-invoice-payment-button";
import { CarteraNewInvoiceButton } from "@/components/cartera-new-invoice-button";
import { CarteraReceivablesTable, type CarteraPortfolioRow } from "@/components/cartera-receivables-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { computeReceivableKpis, formatCarteraCop } from "@/lib/cartera-metrics";

export type { CarteraPortfolioRow };

const kpiCell = "rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50";

/** Solo CxC: la página debe pasar filas `kind === "receivable"` (CxP fuera de alcance por ahora). */
export function CarteraControlView({
  rows,
  todayYmd,
  rates,
  cashFlowMonths,
  cashFlowMonthLabels,
}: {
  rows: CarteraPortfolioRow[];
  todayYmd: string;
  rates: CarteraReceivableRates;
  cashFlowMonths: string[];
  cashFlowMonthLabels: string[];
}) {
  const kpis = computeReceivableKpis(rows, todayYmd);

  const kpiItems: { label: string; value: number }[] = [
    { label: "Total facturado (bruto)", value: kpis.totalFacturadoBruto },
    { label: "Total IVA cobrado", value: kpis.totalIva },
    { label: "Total retenciones descontadas", value: kpis.totalRetenciones },
    { label: "Neto por cobrar", value: kpis.netoPorCobrar },
    { label: "Total recaudado", value: kpis.totalRecaudado },
    { label: "Cartera vigente", value: kpis.carteraVigente },
    { label: "Cartera vencida", value: kpis.carteraVencida },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        {kpiItems.map((k) => (
          <div key={k.label} className={kpiCell}>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{k.label}</p>
            <p className="mt-0.5 text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
              {formatCarteraCop(k.value)}
            </p>
          </div>
        ))}
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800">
          <CardTitle className="text-base">Documentos por cobrar</CardTitle>
          <div className="flex flex-wrap gap-2">
            <CarteraInvoicePaymentButton
              rows={rows}
              cashFlowMonths={cashFlowMonths}
              cashFlowMonthLabels={cashFlowMonthLabels}
            />
            <CarteraNewInvoiceButton rates={rates} todayYmd={todayYmd} />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <CarteraReceivablesTable rows={rows} todayYmd={todayYmd} rates={rates} />
        </CardContent>
      </Card>
    </div>
  );
}
