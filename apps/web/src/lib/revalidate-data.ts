import "server-only";
import { revalidatePath } from "next/cache";

const P = {
  dashboard: "/dashboard",
  flujoCaja: "/flujo-caja",
  centrosCostos: "/centros-de-costos",
  cartera: "/cartera",
  calendario: "/calendario-tributario",
  supuestos: "/supuestos",
  guia: "/guia-obligaciones",
} as const;

/** Tras mutar matriz de flujo de caja o movimientos que afectan KPIs. */
export function revalidateCashRelatedPages() {
  revalidatePath(P.dashboard);
  revalidatePath(P.flujoCaja);
  revalidatePath(P.centrosCostos);
}

/** Tras crear/editar/eliminar un centro de costos. */
export function revalidateCostCentersPage() {
  revalidatePath(P.centrosCostos);
  revalidatePath(P.dashboard);
}

/** Tras crear movimiento de caja. */
export function revalidateAfterCashMovement() {
  revalidatePath(P.dashboard);
  revalidatePath(P.flujoCaja);
}

/** Tras cambiar parámetros legales o de nómina. */
export function revalidateSupuestosPage() {
  revalidatePath(P.supuestos);
}

/** Nuevo evento en calendario tributario. */
export function revalidateTaxCalendarPage() {
  revalidatePath(P.calendario);
}
