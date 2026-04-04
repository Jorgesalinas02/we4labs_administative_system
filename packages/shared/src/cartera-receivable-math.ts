/**
 * Fórmulas alineadas a la hoja «Control de Cartera» de Flujo_de_Caja_Pyme_SAS completo.xlsx
 * (filas de detalle: I = H*C11, J = H*C12*C13, K = H*C14, L = H+I-J-K).
 * C11–C14 corresponden a tarifas en «Supuestos» (y en app a `legal_parameters` cuando existan).
 */

export type CarteraReceivableRates = {
  /** Tarifa IVA (fracción, ej. 0.19). */
  ivaRate: number;
  /** Fracción de clientes con retención en la fuente (ej. 0.7). */
  clientsWithholdingFraction: number;
  /** Tarifa retención en la fuente servicios (ej. 0.04). */
  withholdingServicesRate: number;
  /** Tarifa retención ICA (ej. 0.00966). */
  icaWithholdingRate: number;
};

/** Valores por defecto = celdas C11:C14 de la hoja Supuestos del Excel de referencia. */
export const CARTERA_EXCEL_DEFAULT_RATES: CarteraReceivableRates = {
  ivaRate: 0.19,
  clientsWithholdingFraction: 0.7,
  withholdingServicesRate: 0.04,
  icaWithholdingRate: 0.00966,
};

export function roundCop(n: number): number {
  return Math.round(n);
}

export function computeReceivableAmountsFromGross(
  gross: number,
  rates: CarteraReceivableRates = CARTERA_EXCEL_DEFAULT_RATES,
): { iva: number; retefuente: number; reteica: number; net: number } {
  const iva = roundCop(gross * rates.ivaRate);
  const retefuente = roundCop(gross * rates.clientsWithholdingFraction * rates.withholdingServicesRate);
  const reteica = roundCop(gross * rates.icaWithholdingRate);
  const net = gross + iva - retefuente - reteica;
  return { iva, retefuente, reteica, net };
}

/** Estados columna P del Excel (nueva fila sin «Pagado»: balance = neto). */
export type CarteraExcelEstado = "COBRADA" | "VIGENTE" | "VENCIDA" | "CRÍTICA" | "CASTIGAR";

function daysFromDueToToday(dueYmd: string, todayYmd: string): number {
  const a = new Date(dueYmd + "T12:00:00").getTime();
  const b = new Date(todayYmd + "T12:00:00").getTime();
  return Math.floor((b - a) / (24 * 60 * 60 * 1000));
}

/**
 * Replica la fórmula de estado del Excel (columna P).
 * `balance` = saldo pendiente (columna N); si es 0 → COBRADA.
 */
export function computeCarteraExcelEstado(opts: {
  grossPositive: boolean;
  balance: number;
  dueOn: string;
  todayYmd: string;
}): CarteraExcelEstado | "" {
  if (!opts.grossPositive) return "";
  if (opts.balance <= 0) return "COBRADA";
  if (!opts.dueOn) return "VIGENTE";
  if (opts.todayYmd <= opts.dueOn) return "VIGENTE";
  const d = daysFromDueToToday(opts.dueOn, opts.todayYmd);
  if (d <= 30) return "VENCIDA";
  if (d <= 90) return "CRÍTICA";
  return "CASTIGAR";
}

/** Columna O: días de mora si hay saldo y hay vencimiento. */
export function computeCarteraExcelDiasVencidos(opts: {
  grossPositive: boolean;
  balance: number;
  dueOn: string;
  todayYmd: string;
}): number | null {
  if (!opts.grossPositive || opts.balance <= 0 || !opts.dueOn) return null;
  return Math.max(0, daysFromDueToToday(opts.dueOn, opts.todayYmd));
}
