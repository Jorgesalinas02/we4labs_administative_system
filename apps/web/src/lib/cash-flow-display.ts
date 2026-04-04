/**
 * Etiqueta tal como se muestra en la matriz de flujo de caja (sin prefijo A./B./A1.… del Excel).
 */
export function displayCashFlowLineLabel(label: string): string {
  return label.replace(/^\s*[A-Za-z]\d*\.\s*/, "").trimStart();
}
