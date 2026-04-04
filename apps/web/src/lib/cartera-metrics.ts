/** Métricas y formato alineados a la hoja «Control de Cartera» del Excel de referencia. */

export function carteraNum(v: string | number | null | undefined): number {
  if (v == null) return 0;
  const x = typeof v === "string" ? Number(v) : v;
  return Number.isFinite(x) ? x : 0;
}

export function formatCarteraCop(n: number): string {
  return n.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
}

export type CarteraBalanceRow = {
  amount: string | number;
  paidAmount?: string | number | null;
  paidOn?: string | null;
};

/** Saldo pendiente: neto − pagado; si hay fecha de pago total se considera cerrado. */
export function carteraBalancePending(r: CarteraBalanceRow): number {
  if (r.paidOn) return 0;
  const net = carteraNum(r.amount);
  const paid = carteraNum(r.paidAmount);
  return Math.max(0, net - paid);
}

export function carteraDaysOverdue(dueOn: string, balance: number, todayYmd: string): number | null {
  if (balance <= 0) return null;
  if (dueOn >= todayYmd) return null;
  const a = new Date(dueOn + "T12:00:00");
  const b = new Date(todayYmd + "T12:00:00");
  const ms = b.getTime() - a.getTime();
  return Math.max(0, Math.floor(ms / (24 * 60 * 60 * 1000)));
}

export type CarteraKpis = {
  totalFacturadoBruto: number;
  totalIva: number;
  totalRetenciones: number;
  netoPorCobrar: number;
  totalRecaudado: number;
  carteraVigente: number;
  carteraVencida: number;
};

export function computeReceivableKpis(
  rows: Array<{
    kind: string;
    amount: string | number;
    grossAmount?: string | number | null;
    ivaAmount?: string | number | null;
    retefuenteAmount?: string | number | null;
    reteicaAmount?: string | number | null;
    paidAmount?: string | number | null;
    paidOn?: string | null;
    dueOn: string;
  }>,
  todayYmd: string,
): CarteraKpis {
  const r = rows.filter((x) => x.kind === "receivable");
  let totalFacturadoBruto = 0;
  let totalIva = 0;
  let totalRetenciones = 0;
  let netoPorCobrar = 0;
  let totalRecaudado = 0;
  let carteraVigente = 0;
  let carteraVencida = 0;

  for (const row of r) {
    const gross = carteraNum(row.grossAmount);
    const iva = carteraNum(row.ivaAmount);
    const rf = carteraNum(row.retefuenteAmount);
    const ri = carteraNum(row.reteicaAmount);
    const net = carteraNum(row.amount);
    totalFacturadoBruto += gross > 0 ? gross : 0;
    totalIva += iva;
    totalRetenciones += rf + ri;
    netoPorCobrar += net;
    totalRecaudado += carteraNum(row.paidAmount);
    const bal = carteraBalancePending(row);
    if (bal <= 0) continue;
    if (row.dueOn < todayYmd) carteraVencida += bal;
    else carteraVigente += bal;
  }

  return {
    totalFacturadoBruto,
    totalIva,
    totalRetenciones,
    netoPorCobrar,
    totalRecaudado,
    carteraVigente,
    carteraVencida,
  };
}
