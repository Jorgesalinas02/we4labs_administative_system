import {
  CARTERA_EXCEL_DEFAULT_RATES,
  type CarteraReceivableRates,
} from "@we4labs/shared";

function num(v: string | null | undefined): number {
  if (v == null || v === "") return NaN;
  const x = Number(v);
  return Number.isFinite(x) ? x : NaN;
}

/** Última fila de `legal_parameters` → mismas tasas que Supuestos C11:C14 del Excel. */
export function legalParamsToCarteraRates(lp: {
  generalVatRatePct: string | null;
  clientsWithholdingSharePct: string | null;
  withholdingServicesRatePct: string | null;
  icaWithholdingRatePct: string | null;
} | null): CarteraReceivableRates {
  if (!lp) return CARTERA_EXCEL_DEFAULT_RATES;
  const iva = num(lp.generalVatRatePct);
  const cw = num(lp.clientsWithholdingSharePct);
  const ws = num(lp.withholdingServicesRatePct);
  const ica = num(lp.icaWithholdingRatePct);
  return {
    ivaRate: Number.isFinite(iva) && iva > 0 ? iva : CARTERA_EXCEL_DEFAULT_RATES.ivaRate,
    clientsWithholdingFraction:
      Number.isFinite(cw) && cw >= 0 ? cw : CARTERA_EXCEL_DEFAULT_RATES.clientsWithholdingFraction,
    withholdingServicesRate:
      Number.isFinite(ws) && ws >= 0 ? ws : CARTERA_EXCEL_DEFAULT_RATES.withholdingServicesRate,
    icaWithholdingRate:
      Number.isFinite(ica) && ica >= 0 ? ica : CARTERA_EXCEL_DEFAULT_RATES.icaWithholdingRate,
  };
}
