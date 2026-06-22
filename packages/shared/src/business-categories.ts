/**
 * Catálogo de categorías y subcategorías de ingresos y egresos para PYME.
 * Cada item lleva: grupo padre, code único, label, y si "pide cliente" (asksClient).
 */

export type ClientFlag = "required" | "optional" | "none";

export type CategoryCatalogItem = {
  kind: "income" | "expense";
  parentCode: string;
  parentLabel: string;
  code: string;
  label: string;
  /** ¿Requiere asociar un cliente a la transacción? */
  asksClient: ClientFlag;
};

export const INCOME_CATALOG: CategoryCatalogItem[] = [
  // ── 1. Ventas operacionales ──────────────────────────────────────
  { kind: "income", parentCode: "ventas_operacionales", parentLabel: "Ventas operacionales", code: "anticipo_proyecto", label: "Anticipo de proyecto", asksClient: "required" },
  { kind: "income", parentCode: "ventas_operacionales", parentLabel: "Ventas operacionales", code: "pago_hito", label: "Pago por hito / avance", asksClient: "required" },
  { kind: "income", parentCode: "ventas_operacionales", parentLabel: "Ventas operacionales", code: "pago_final", label: "Pago final / entrega", asksClient: "required" },
  { kind: "income", parentCode: "ventas_operacionales", parentLabel: "Ventas operacionales", code: "venta_contado", label: "Venta de contado", asksClient: "required" },
  { kind: "income", parentCode: "ventas_operacionales", parentLabel: "Ventas operacionales", code: "recaudo_cartera", label: "Recaudo de cartera (venta a crédito)", asksClient: "required" },
  { kind: "income", parentCode: "ventas_operacionales", parentLabel: "Ventas operacionales", code: "venta_saas", label: "Venta de producto propio / SaaS", asksClient: "required" },

  // ── 2. Ingresos recurrentes ──────────────────────────────────────
  { kind: "income", parentCode: "ingresos_recurrentes", parentLabel: "Ingresos recurrentes", code: "suscripcion_licencia", label: "Suscripción / licencia", asksClient: "required" },
  { kind: "income", parentCode: "ingresos_recurrentes", parentLabel: "Ingresos recurrentes", code: "mantenimiento_soporte", label: "Mantenimiento o soporte mensual", asksClient: "required" },
  { kind: "income", parentCode: "ingresos_recurrentes", parentLabel: "Ingresos recurrentes", code: "retainer_mensual", label: "Retainer mensual (horas fijas)", asksClient: "required" },
  { kind: "income", parentCode: "ingresos_recurrentes", parentLabel: "Ingresos recurrentes", code: "hosting_facturado", label: "Hosting / infraestructura facturada", asksClient: "required" },
  { kind: "income", parentCode: "ingresos_recurrentes", parentLabel: "Ingresos recurrentes", code: "renovacion_anual", label: "Renovación anual", asksClient: "required" },

  // ── 3. Otros ingresos operativos ─────────────────────────────────
  { kind: "income", parentCode: "otros_operativos", parentLabel: "Otros ingresos operativos", code: "consultoria_capacitacion", label: "Consultoría o capacitación", asksClient: "optional" },
  { kind: "income", parentCode: "otros_operativos", parentLabel: "Otros ingresos operativos", code: "auditoria_code_review", label: "Auditoría técnica / code review", asksClient: "optional" },
  { kind: "income", parentCode: "otros_operativos", parentLabel: "Otros ingresos operativos", code: "comisiones_recibidas", label: "Comisiones recibidas", asksClient: "optional" },
  { kind: "income", parentCode: "otros_operativos", parentLabel: "Otros ingresos operativos", code: "referidos_partnerships", label: "Referidos / partnerships", asksClient: "optional" },

  // ── 4. Ingresos no operacionales ─────────────────────────────────
  { kind: "income", parentCode: "no_operacionales", parentLabel: "Ingresos no operacionales", code: "intereses_ganados", label: "Intereses ganados", asksClient: "none" },
  { kind: "income", parentCode: "no_operacionales", parentLabel: "Ingresos no operacionales", code: "devolucion_impuestos", label: "Devolución de impuestos", asksClient: "none" },
  { kind: "income", parentCode: "no_operacionales", parentLabel: "Ingresos no operacionales", code: "venta_activos_inc", label: "Venta de activos", asksClient: "none" },
  { kind: "income", parentCode: "no_operacionales", parentLabel: "Ingresos no operacionales", code: "reembolso_proveedor", label: "Reembolso de proveedor", asksClient: "none" },
  { kind: "income", parentCode: "no_operacionales", parentLabel: "Ingresos no operacionales", code: "aporte_socios", label: "Aporte de socios / capital", asksClient: "none" },
  { kind: "income", parentCode: "no_operacionales", parentLabel: "Ingresos no operacionales", code: "diferencia_cambio_gan", label: "Diferencia en cambio (ganancia)", asksClient: "none" },
];

export const EXPENSE_CATALOG: CategoryCatalogItem[] = [
  // ── 1. Costos directos ───────────────────────────────────────────
  { kind: "expense", parentCode: "costos_directos", parentLabel: "Costos directos", code: "subcontratistas", label: "Subcontratistas / developers externos", asksClient: "required" },
  { kind: "expense", parentCode: "costos_directos", parentLabel: "Costos directos", code: "diseno_ux_freelance", label: "Diseñador UI/UX freelance", asksClient: "required" },
  { kind: "expense", parentCode: "costos_directos", parentLabel: "Costos directos", code: "qa_tester", label: "QA / tester externo", asksClient: "required" },
  { kind: "expense", parentCode: "costos_directos", parentLabel: "Costos directos", code: "infra_cloud_proyecto", label: "Infraestructura cloud del proyecto", asksClient: "required" },
  { kind: "expense", parentCode: "costos_directos", parentLabel: "Costos directos", code: "apis_servicios_proyecto", label: "APIs / servicios de terceros del proyecto", asksClient: "required" },
  { kind: "expense", parentCode: "costos_directos", parentLabel: "Costos directos", code: "licencias_proyecto", label: "Licencias o assets para un proyecto", asksClient: "required" },

  // ── 2. Nómina y carga laboral ─────────────────────────────────────
  { kind: "expense", parentCode: "nomina_carga_laboral", parentLabel: "Nómina y carga laboral", code: "sueldo_founders", label: "Sueldo founders", asksClient: "none" },
  { kind: "expense", parentCode: "nomina_carga_laboral", parentLabel: "Nómina y carga laboral", code: "salario_empleados", label: "Salario empleados", asksClient: "none" },
  { kind: "expense", parentCode: "nomina_carga_laboral", parentLabel: "Nómina y carga laboral", code: "honorarios_contratistas", label: "Honorarios contratistas", asksClient: "none" },
  { kind: "expense", parentCode: "nomina_carga_laboral", parentLabel: "Nómina y carga laboral", code: "bonos_equipo", label: "Bonificaciones / comisiones del equipo", asksClient: "none" },
  { kind: "expense", parentCode: "nomina_carga_laboral", parentLabel: "Nómina y carga laboral", code: "prestaciones_sociales", label: "Prestaciones sociales", asksClient: "none" },
  { kind: "expense", parentCode: "nomina_carga_laboral", parentLabel: "Nómina y carga laboral", code: "seg_social_parafiscales", label: "Seguridad social y parafiscales", asksClient: "none" },

  // ── 3. Gastos administrativos ─────────────────────────────────────
  { kind: "expense", parentCode: "gastos_administrativos", parentLabel: "Gastos administrativos", code: "arriendo_oficina", label: "Arriendo de oficina", asksClient: "none" },
  { kind: "expense", parentCode: "gastos_administrativos", parentLabel: "Gastos administrativos", code: "coworking", label: "Coworking", asksClient: "none" },
  { kind: "expense", parentCode: "gastos_administrativos", parentLabel: "Gastos administrativos", code: "servicios_publicos_internet", label: "Servicios públicos / internet", asksClient: "none" },
  { kind: "expense", parentCode: "gastos_administrativos", parentLabel: "Gastos administrativos", code: "software_suscripciones", label: "Software y suscripciones internas", asksClient: "none" },
  { kind: "expense", parentCode: "gastos_administrativos", parentLabel: "Gastos administrativos", code: "contador_honorarios", label: "Contador / honorarios contables", asksClient: "none" },
  { kind: "expense", parentCode: "gastos_administrativos", parentLabel: "Gastos administrativos", code: "servicios_legales", label: "Servicios legales", asksClient: "none" },
  { kind: "expense", parentCode: "gastos_administrativos", parentLabel: "Gastos administrativos", code: "papeleria", label: "Papelería", asksClient: "none" },
  { kind: "expense", parentCode: "gastos_administrativos", parentLabel: "Gastos administrativos", code: "aseo_cafeteria", label: "Aseo y cafetería", asksClient: "none" },

  // ── 4. Gastos comerciales y de marketing ──────────────────────────
  { kind: "expense", parentCode: "gastos_comerciales", parentLabel: "Gastos comerciales y de marketing", code: "publicidad_digital", label: "Publicidad digital (Meta, Google)", asksClient: "optional" },
  { kind: "expense", parentCode: "gastos_comerciales", parentLabel: "Gastos comerciales y de marketing", code: "diseno_marca_contenido", label: "Diseño de marca / contenido", asksClient: "optional" },
  { kind: "expense", parentCode: "gastos_comerciales", parentLabel: "Gastos comerciales y de marketing", code: "herramientas_marketing", label: "Herramientas de marketing (CRM, email)", asksClient: "none" },
  { kind: "expense", parentCode: "gastos_comerciales", parentLabel: "Gastos comerciales y de marketing", code: "eventos_ferias", label: "Eventos / ferias / networking", asksClient: "optional" },
  { kind: "expense", parentCode: "gastos_comerciales", parentLabel: "Gastos comerciales y de marketing", code: "comisiones_vendedores", label: "Comisiones a vendedores", asksClient: "none" },
  { kind: "expense", parentCode: "gastos_comerciales", parentLabel: "Gastos comerciales y de marketing", code: "viaticos_comerciales", label: "Viáticos y representación comercial", asksClient: "optional" },

  // ── 5. Gasto relacionado a cliente ────────────────────────────────
  { kind: "expense", parentCode: "gasto_cliente", parentLabel: "Gasto relacionado a cliente", code: "comidas_trabajo", label: "Comidas de trabajo", asksClient: "required" },
  { kind: "expense", parentCode: "gasto_cliente", parentLabel: "Gasto relacionado a cliente", code: "desplazamientos_cliente", label: "Desplazamientos", asksClient: "required" },
  { kind: "expense", parentCode: "gasto_cliente", parentLabel: "Gasto relacionado a cliente", code: "hospedaje_cliente", label: "Hospedaje por visita a cliente", asksClient: "required" },
  { kind: "expense", parentCode: "gasto_cliente", parentLabel: "Gasto relacionado a cliente", code: "detalles_clientes", label: "Detalles / regalos a clientes", asksClient: "required" },
  { kind: "expense", parentCode: "gasto_cliente", parentLabel: "Gasto relacionado a cliente", code: "otros_gasto_cliente", label: "Otros gastos por atender a un cliente", asksClient: "required" },

  // ── 6. Deuda y financiamiento ─────────────────────────────────────
  { kind: "expense", parentCode: "deuda_financiamiento", parentLabel: "Deuda y financiamiento", code: "capital_prestamo", label: "Pago a capital de préstamo", asksClient: "none" },
  { kind: "expense", parentCode: "deuda_financiamiento", parentLabel: "Deuda y financiamiento", code: "intereses_credito", label: "Intereses de crédito", asksClient: "none" },
  { kind: "expense", parentCode: "deuda_financiamiento", parentLabel: "Deuda y financiamiento", code: "cuota_tarjeta", label: "Cuota de tarjeta de crédito", asksClient: "none" },
  { kind: "expense", parentCode: "deuda_financiamiento", parentLabel: "Deuda y financiamiento", code: "comisiones_bancarias", label: "Comisiones bancarias", asksClient: "none" },
  { kind: "expense", parentCode: "deuda_financiamiento", parentLabel: "Deuda y financiamiento", code: "gmf_4x1000", label: "Gravamen 4×1000 (GMF)", asksClient: "none" },
  { kind: "expense", parentCode: "deuda_financiamiento", parentLabel: "Deuda y financiamiento", code: "intereses_mora", label: "Intereses de mora", asksClient: "none" },

  // ── 7. Impuestos y obligaciones ───────────────────────────────────
  { kind: "expense", parentCode: "impuestos_obligaciones", parentLabel: "Impuestos y obligaciones", code: "iva_exp", label: "IVA", asksClient: "none" },
  { kind: "expense", parentCode: "impuestos_obligaciones", parentLabel: "Impuestos y obligaciones", code: "retencion_fuente_exp", label: "Retención en la fuente", asksClient: "none" },
  { kind: "expense", parentCode: "impuestos_obligaciones", parentLabel: "Impuestos y obligaciones", code: "ica_reteica", label: "ICA / RETEICA", asksClient: "none" },
  { kind: "expense", parentCode: "impuestos_obligaciones", parentLabel: "Impuestos y obligaciones", code: "renta_exp", label: "Renta", asksClient: "none" },
  { kind: "expense", parentCode: "impuestos_obligaciones", parentLabel: "Impuestos y obligaciones", code: "camara_comercio", label: "Cámara de comercio (renovación)", asksClient: "none" },
  { kind: "expense", parentCode: "impuestos_obligaciones", parentLabel: "Impuestos y obligaciones", code: "otras_tasas", label: "Otras tasas", asksClient: "none" },

  // ── 8. Inversión / CAPEX ──────────────────────────────────────────
  { kind: "expense", parentCode: "inversion_capex", parentLabel: "Inversión (CAPEX)", code: "equipos_computo", label: "Equipos de cómputo", asksClient: "none" },
  { kind: "expense", parentCode: "inversion_capex", parentLabel: "Inversión (CAPEX)", code: "mobiliario_capex", label: "Mobiliario", asksClient: "none" },
  { kind: "expense", parentCode: "inversion_capex", parentLabel: "Inversión (CAPEX)", code: "adecuaciones_oficina", label: "Adecuaciones de oficina", asksClient: "none" },
  { kind: "expense", parentCode: "inversion_capex", parentLabel: "Inversión (CAPEX)", code: "software_perpetuo", label: "Software con licencia perpetua", asksClient: "none" },
  { kind: "expense", parentCode: "inversion_capex", parentLabel: "Inversión (CAPEX)", code: "otros_activos_fijos", label: "Otros activos fijos", asksClient: "none" },
];

export const ALL_CATEGORIES_CATALOG: CategoryCatalogItem[] = [
  ...INCOME_CATALOG,
  ...EXPENSE_CATALOG,
];

/** Agrupa un arreglo de items de catálogo por parentCode. */
export function groupByParent(items: CategoryCatalogItem[]): Map<string, CategoryCatalogItem[]> {
  const map = new Map<string, CategoryCatalogItem[]>();
  for (const item of items) {
    const group = map.get(item.parentCode) ?? [];
    group.push(item);
    map.set(item.parentCode, group);
  }
  return map;
}
