export const dynamic = "force-dynamic";
import {
  CASH_FLOW_DEFAULT_START_YM,
  cashFlowMonthLabelEs,
  cashFlowMonthPeriods,
} from "@we4labs/shared";
import { CarteraControlView } from "@/components/cartera-control-view";
import { legalParamsToCarteraRates } from "@/lib/cartera-rates";
import { loadCashFlowSheet, loadLatestLegalParams, loadPortfolio } from "@/lib/data";

export default async function CarteraPage() {
  if (!process.env.DATABASE_URL) {
    return <p className="text-sm text-zinc-500">Conecta la base de datos.</p>;
  }
  const [receivables, legal, cf] = await Promise.all([
    loadPortfolio().then((rows) => rows.filter((r) => r.kind === "receivable")),
    loadLatestLegalParams(),
    loadCashFlowSheet(),
  ]);
  const cashFlowMonths = cf?.months ?? cashFlowMonthPeriods(CASH_FLOW_DEFAULT_START_YM);
  const cashFlowMonthLabels =
    cf?.monthLabels ?? cashFlowMonths.map((ym) => cashFlowMonthLabelEs(ym));
  const today = new Date().toISOString().slice(0, 10);
  const rates = legalParamsToCarteraRates(legal);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Control de cartera - Cuentas x Cobrar</h1>
        <p className="text-sm text-zinc-500">
          Las <span className="font-medium text-zinc-600 dark:text-zinc-400">cuentas por cobrar</span> son el dinero
          que tus clientes te deben por ventas o servicios ya facturados y aún no cobrados: aquí llevas cada factura, lo
          pagado, el saldo pendiente y el seguimiento (vigente, vencida, etc.) para saber cuánto entra y cuándo.
        </p>
      </div>
      <CarteraControlView
        rows={receivables}
        todayYmd={today}
        rates={rates}
        cashFlowMonths={cashFlowMonths}
        cashFlowMonthLabels={cashFlowMonthLabels}
      />
    </div>
  );
}
