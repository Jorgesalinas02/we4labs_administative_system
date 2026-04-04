/** Consecutivo de factura CxC: FAC-001, FAC-002, … (mínimo 3 dígitos). */
export const CARTERA_FAC_REF_PREFIX = "FAC-";

const FAC_REF_RE = /^FAC-(\d+)$/i;

/**
 * A partir de los `invoice_ref` existentes en CxC, devuelve el siguiente código FAC-XXX.
 * Ignora referencias que no sigan el patrón (ej. datos históricos FC-1001).
 */
export function nextFacInvoiceRefFromRefs(refs: (string | null | undefined)[]): string {
  let max = 0;
  for (const r of refs) {
    if (r == null || r === "") continue;
    const m = r.trim().match(FAC_REF_RE);
    if (m) max = Math.max(max, parseInt(m[1]!, 10));
  }
  const next = max + 1;
  return `${CARTERA_FAC_REF_PREFIX}${String(next).padStart(3, "0")}`;
}
