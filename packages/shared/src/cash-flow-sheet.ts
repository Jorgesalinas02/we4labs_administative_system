/**
 * Plantilla alineada con Material/Flujo_de_Caja_Pyme_SAS completo.xlsx — hoja «Flujo de Caja».
 * Matriz: conceptos × meses (12) + columna total anual.
 */

export const CASH_FLOW_DEFAULT_START_YM = "2026-04";
export const CASH_FLOW_MONTH_COUNT = 12;

export type CashFlowLineDef = {
  code: string;
  label: string;
  /** Fila solo título (sin celdas numéricas de datos) */
  isHeader?: boolean;
  /** Fila título de tabla (CONCEPTO) */
  isTableTitle?: boolean;
  /** El usuario edita importes por mes */
  isInput: boolean;
};

/** Respuesta API / página: matriz calculada + metadatos de períodos. */
export type CashFlowSheetViewModel = {
  startYm: string;
  months: string[];
  monthLabels: string[];
  lines: CashFlowLineDef[];
  values: Record<string, Record<string, number>>;
  annual: Record<string, number>;
};

/** Orden = orden de filas en el Excel (5–96). */
export const CASH_FLOW_LINES: CashFlowLineDef[] = [
  { code: "concepto", label: "CONCEPTO", isTableTitle: true, isInput: false },
  { code: "saldo_inicial_de_caja", label: "SALDO INICIAL DE CAJA", isInput: true },
  { code: "_sp1", label: "", isHeader: true, isInput: false },
  { code: "a_ingresos_operacionales", label: "A. INGRESOS OPERACIONALES", isHeader: true, isInput: false },
  { code: "a1_recaudo_por_servicios_prestados", label: "A1. Recaudo por servicios prestados", isHeader: true, isInput: false },
  { code: "servicios_de_consultor_a", label: "Servicios de consultoría", isInput: true },
  { code: "servicios_profesionales_outsourcing", label: "Servicios profesionales / outsourcing", isInput: true },
  { code: "capacitaciones_y_formaci_n", label: "Capacitaciones y formación", isInput: true },
  { code: "otros_servicios", label: "Otros servicios", isInput: true },
  { code: "subtotal_ingresos_brutos_sin_iva", label: "Subtotal Ingresos Brutos (sin IVA)", isInput: false },
  { code: "iva_cobrado_sobre_servicios_19", label: "(+) IVA cobrado sobre servicios (19%)", isInput: true },
  { code: "retenci_n_en_la_fuente_practicada_por_clientes", label: "(-) Retención en la fuente practicada por clientes", isInput: true },
  { code: "retenci_n_de_ica_practicada_por_clientes", label: "(-) Retención de ICA practicada por clientes", isInput: true },
  { code: "total_ingresos_recibidos_en_efectivo", label: "TOTAL INGRESOS RECIBIDOS EN EFECTIVO", isInput: false },
  { code: "_sp2", label: "", isHeader: true, isInput: false },
  { code: "a2_otros_ingresos_de_efectivo", label: "A2. Otros ingresos de efectivo", isHeader: true, isInput: false },
  { code: "rendimientos_financieros", label: "Rendimientos financieros", isInput: true },
  { code: "recuperaci_n_de_cartera_vencida", label: "Recuperación de cartera vencida", isInput: true },
  { code: "pr_stamos_cr_ditos_recibidos", label: "Préstamos / créditos recibidos", isInput: true },
  { code: "aportes_de_socios", label: "Aportes de socios", isInput: true },
  { code: "otros_ingresos_no_operacionales", label: "Otros ingresos no operacionales", isInput: true },
  { code: "total_otros_ingresos", label: "TOTAL OTROS INGRESOS", isInput: false },
  { code: "_sp3", label: "", isHeader: true, isInput: false },
  { code: "total_entradas_de_efectivo", label: "═ TOTAL ENTRADAS DE EFECTIVO", isInput: false },
  { code: "_sp4", label: "", isHeader: true, isInput: false },
  { code: "b_egresos_salidas_de_efectivo", label: "B. EGRESOS (SALIDAS DE EFECTIVO)", isHeader: true, isInput: false },
  { code: "b1_n_mina_y_carga_laboral", label: "B1. Nómina y carga laboral", isHeader: true, isInput: false },
  { code: "salarios_base", label: "Salarios base", isInput: true },
  { code: "auxilio_de_transporte", label: "Auxilio de transporte", isInput: true },
  { code: "horas_extras_y_recargos", label: "Horas extras y recargos", isInput: true },
  { code: "comisiones_e_incentivos", label: "Comisiones e incentivos", isInput: true },
  { code: "base_salarial_para_aportes", label: "Base salarial para aportes", isInput: true },
  { code: "salud_eps_8_5", label: "Salud (EPS) — 8.5%", isInput: true },
  { code: "pensi_n_afp_12", label: "Pensión (AFP) — 12%", isInput: true },
  { code: "arl_riesgo_i", label: "ARL — Riesgo I", isInput: true },
  { code: "caja_de_compensaci_n_4", label: "Caja de Compensación — 4%", isInput: true },
  { code: "icbf_3", label: "ICBF — 3%", isInput: true },
  { code: "sena_2", label: "SENA — 2%", isInput: true },
  { code: "cesant_as_8_33", label: "Cesantías — 8.33%", isInput: true },
  { code: "intereses_sobre_cesant_as_1", label: "Intereses sobre cesantías — 1%", isInput: true },
  { code: "prima_de_servicios_8_33", label: "Prima de servicios — 8.33%", isInput: true },
  { code: "vacaciones_4_17", label: "Vacaciones — 4.17%", isInput: true },
  { code: "total_n_mina_y_carga_laboral", label: "TOTAL NÓMINA Y CARGA LABORAL", isInput: false },
  { code: "_sp5", label: "", isHeader: true, isInput: false },
  { code: "b2_gastos_operativos", label: "B2. Gastos operativos", isHeader: true, isInput: false },
  { code: "arriendo_oficina_coworking", label: "Arriendo oficina / coworking", isInput: true },
  { code: "servicios_p_blicos_agua_luz_gas", label: "Servicios públicos (agua, luz, gas)", isInput: true },
  { code: "internet_y_telecomunicaciones", label: "Internet y telecomunicaciones", isInput: true },
  { code: "software_y_licencias_saas", label: "Software y licencias (SaaS)", isInput: true },
  { code: "papeler_a_y_suministros_de_oficina", label: "Papelería y suministros de oficina", isInput: true },
  { code: "mantenimiento_y_reparaciones", label: "Mantenimiento y reparaciones", isInput: true },
  { code: "seguros_p_lizas_empresariales", label: "Seguros (pólizas empresariales)", isInput: true },
  { code: "vigilancia_y_seguridad", label: "Vigilancia y seguridad", isInput: true },
  { code: "aseo_y_cafeter_a", label: "Aseo y cafetería", isInput: true },
  { code: "transporte_y_vi_ticos", label: "Transporte y viáticos", isInput: true },
  { code: "total_gastos_operativos", label: "TOTAL GASTOS OPERATIVOS", isInput: false },
  { code: "_sp6", label: "", isHeader: true, isInput: false },
  { code: "b3_gastos_comerciales_y_marketing", label: "B3. Gastos comerciales y marketing", isHeader: true, isInput: false },
  { code: "publicidad_y_pauta_digital", label: "Publicidad y pauta digital", isInput: true },
  { code: "eventos_y_networking", label: "Eventos y networking", isInput: true },
  { code: "material_promocional", label: "Material promocional", isInput: true },
  { code: "comisiones_de_venta_a_terceros", label: "Comisiones de venta a terceros", isInput: true },
  { code: "total_gastos_comerciales", label: "TOTAL GASTOS COMERCIALES", isInput: false },
  { code: "_sp7", label: "", isHeader: true, isInput: false },
  { code: "b4_obligaciones_tributarias", label: "B4. Obligaciones tributarias", isHeader: true, isInput: false },
  { code: "iva_por_pagar_diferencia_cobrado_pagado", label: "IVA por pagar (diferencia cobrado - pagado)", isInput: true },
  { code: "autorretenci_n_de_renta", label: "Autorretención de renta", isInput: true },
  { code: "retenci_n_en_la_fuente_como_agente_retenedor", label: "Retención en la fuente (como agente retenedor)", isInput: true },
  { code: "retenci_n_de_ica_como_agente_retenedor", label: "Retención de ICA (como agente retenedor)", isInput: true },
  { code: "ica_bimestral", label: "ICA bimestral", isInput: true },
  { code: "impuesto_de_renta_anticipos_cuotas", label: "Impuesto de renta (anticipos / cuotas)", isInput: true },
  { code: "gmf_4x1000", label: "GMF (4x1000)", isInput: true },
  { code: "total_obligaciones_tributarias", label: "TOTAL OBLIGACIONES TRIBUTARIAS", isInput: false },
  { code: "_sp8", label: "", isHeader: true, isInput: false },
  { code: "b5_gastos_financieros", label: "B5. Gastos financieros", isHeader: true, isInput: false },
  { code: "cuota_cr_dito_bancario_capital_intereses", label: "Cuota crédito bancario (capital + intereses)", isInput: true },
  { code: "comisiones_bancarias", label: "Comisiones bancarias", isInput: true },
  { code: "intereses_tarjeta_de_cr_dito_empresarial", label: "Intereses tarjeta de crédito empresarial", isInput: true },
  { code: "leasing_arrendamiento_financiero", label: "Leasing / arrendamiento financiero", isInput: true },
  { code: "total_gastos_financieros", label: "TOTAL GASTOS FINANCIEROS", isInput: false },
  { code: "_sp9", label: "", isHeader: true, isInput: false },
  { code: "b6_inversiones_y_capex", label: "B6. Inversiones y CAPEX", isHeader: true, isInput: false },
  { code: "equipos_de_c_mputo", label: "Equipos de cómputo", isInput: true },
  { code: "mobiliario_y_adecuaciones", label: "Mobiliario y adecuaciones", isInput: true },
  { code: "inversi_n_en_tecnolog_a_desarrollo", label: "Inversión en tecnología / desarrollo", isInput: true },
  { code: "otras_inversiones", label: "Otras inversiones", isInput: true },
  { code: "total_inversiones_capex", label: "TOTAL INVERSIONES / CAPEX", isInput: false },
  { code: "_sp10", label: "", isHeader: true, isInput: false },
  { code: "total_salidas_de_efectivo", label: "═ TOTAL SALIDAS DE EFECTIVO", isInput: false },
  { code: "_sp11", label: "", isHeader: true, isInput: false },
  { code: "flujo_neto_del_per_odo", label: "═ FLUJO NETO DEL PERÍODO", isInput: false },
  { code: "saldo_final_de_caja", label: "═ SALDO FINAL DE CAJA", isInput: false },
];

export function cashFlowInputLineCodes(): string[] {
  return CASH_FLOW_LINES.filter((l) => l.isInput && !l.code.startsWith("_")).map((l) => l.code);
}

/** Genera 12 etiquetas YYYY-MM a partir del primer mes. */
export function cashFlowMonthPeriods(startYm: string): string[] {
  const [y, m] = startYm.split("-").map(Number);
  const out: string[] = [];
  let yy = y;
  let mm = m;
  for (let i = 0; i < CASH_FLOW_MONTH_COUNT; i++) {
    out.push(`${yy}-${String(mm).padStart(2, "0")}`);
    mm += 1;
    if (mm > 12) {
      mm = 1;
      yy += 1;
    }
  }
  return out;
}

export function cashFlowMonthLabelEs(ym: string): string {
  const [y, mo] = ym.split("-").map(Number);
  const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  return `${meses[mo - 1]}-${String(y).slice(2)}`;
}

type CellMap = Map<string, number>;

function key(line: string, ym: string) {
  return `${line}|${ym}`;
}

function sumCodes(codes: string[], ym: string, cells: CellMap): number {
  let s = 0;
  for (const c of codes) {
    s += cells.get(key(c, ym)) ?? 0;
  }
  return s;
}

/**
 * cells: valores persistidos solo para líneas isInput (y saldo inicial mes 0).
 * Rellena `cells` con todas las fórmulas por mes y devuelve totales anuales por línea.
 */
export function computeCashFlowSheet(
  months: string[],
  stored: Record<string, Record<string, number>>,
): { cells: Record<string, Record<string, number>>; annual: Record<string, number> } {
  const flat: CellMap = new Map();
  for (const line of Object.keys(stored)) {
    const byM = stored[line];
    if (!byM) continue;
    for (const ym of months) {
      if (byM[ym] != null && !Number.isNaN(byM[ym])) {
        flat.set(key(line, ym), Number(byM[ym]));
      }
    }
  }

  const annual: Record<string, number> = {};

  const setv = (line: string, ym: string, v: number) => {
    flat.set(key(line, ym), v);
  };

  const getv = (line: string, ym: string) => flat.get(key(line, ym)) ?? 0;

  for (const ym of months) {
    // Subtotales ingresos operacionales
    setv(
      "subtotal_ingresos_brutos_sin_iva",
      ym,
      sumCodes(
        [
          "servicios_de_consultor_a",
          "servicios_profesionales_outsourcing",
          "capacitaciones_y_formaci_n",
          "otros_servicios",
        ],
        ym,
        flat,
      ),
    );
    setv(
      "total_ingresos_recibidos_en_efectivo",
      ym,
      getv("subtotal_ingresos_brutos_sin_iva", ym) +
        getv("iva_cobrado_sobre_servicios_19", ym) -
        getv("retenci_n_en_la_fuente_practicada_por_clientes", ym) -
        getv("retenci_n_de_ica_practicada_por_clientes", ym),
    );
    setv(
      "total_otros_ingresos",
      ym,
      sumCodes(
        [
          "rendimientos_financieros",
          "recuperaci_n_de_cartera_vencida",
          "pr_stamos_cr_ditos_recibidos",
          "aportes_de_socios",
          "otros_ingresos_no_operacionales",
        ],
        ym,
        flat,
      ),
    );
    setv(
      "total_entradas_de_efectivo",
      ym,
      getv("total_ingresos_recibidos_en_efectivo", ym) + getv("total_otros_ingresos", ym),
    );

    setv(
      "total_n_mina_y_carga_laboral",
      ym,
      sumCodes(
        [
          "salarios_base",
          "auxilio_de_transporte",
          "horas_extras_y_recargos",
          "comisiones_e_incentivos",
          "base_salarial_para_aportes",
          "salud_eps_8_5",
          "pensi_n_afp_12",
          "arl_riesgo_i",
          "caja_de_compensaci_n_4",
          "icbf_3",
          "sena_2",
          "cesant_as_8_33",
          "intereses_sobre_cesant_as_1",
          "prima_de_servicios_8_33",
          "vacaciones_4_17",
        ],
        ym,
        flat,
      ),
    );
    setv(
      "total_gastos_operativos",
      ym,
      sumCodes(
        [
          "arriendo_oficina_coworking",
          "servicios_p_blicos_agua_luz_gas",
          "internet_y_telecomunicaciones",
          "software_y_licencias_saas",
          "papeler_a_y_suministros_de_oficina",
          "mantenimiento_y_reparaciones",
          "seguros_p_lizas_empresariales",
          "vigilancia_y_seguridad",
          "aseo_y_cafeter_a",
          "transporte_y_vi_ticos",
        ],
        ym,
        flat,
      ),
    );
    setv(
      "total_gastos_comerciales",
      ym,
      sumCodes(
        ["publicidad_y_pauta_digital", "eventos_y_networking", "material_promocional", "comisiones_de_venta_a_terceros"],
        ym,
        flat,
      ),
    );
    setv(
      "total_obligaciones_tributarias",
      ym,
      sumCodes(
        [
          "iva_por_pagar_diferencia_cobrado_pagado",
          "autorretenci_n_de_renta",
          "retenci_n_en_la_fuente_como_agente_retenedor",
          "retenci_n_de_ica_como_agente_retenedor",
          "ica_bimestral",
          "impuesto_de_renta_anticipos_cuotas",
          "gmf_4x1000",
        ],
        ym,
        flat,
      ),
    );
    setv(
      "total_gastos_financieros",
      ym,
      sumCodes(
        [
          "cuota_cr_dito_bancario_capital_intereses",
          "comisiones_bancarias",
          "intereses_tarjeta_de_cr_dito_empresarial",
          "leasing_arrendamiento_financiero",
        ],
        ym,
        flat,
      ),
    );
    setv(
      "total_inversiones_capex",
      ym,
      sumCodes(
        ["equipos_de_c_mputo", "mobiliario_y_adecuaciones", "inversi_n_en_tecnolog_a_desarrollo", "otras_inversiones"],
        ym,
        flat,
      ),
    );
    setv(
      "total_salidas_de_efectivo",
      ym,
      getv("total_n_mina_y_carga_laboral", ym) +
        getv("total_gastos_operativos", ym) +
        getv("total_gastos_comerciales", ym) +
        getv("total_obligaciones_tributarias", ym) +
        getv("total_gastos_financieros", ym) +
        getv("total_inversiones_capex", ym),
    );
    setv(
      "flujo_neto_del_per_odo",
      ym,
      getv("total_entradas_de_efectivo", ym) - getv("total_salidas_de_efectivo", ym),
    );
  }

  // Saldo inicial / final encadenados entre meses
  const first = months[0]!;
  for (let i = 0; i < months.length; i++) {
    const ym = months[i]!;
    const prevYm = i > 0 ? months[i - 1]! : null;
    const opening =
      i === 0 ? getv("saldo_inicial_de_caja", ym) : getv("saldo_final_de_caja", prevYm!);
    setv("saldo_inicial_de_caja", ym, opening);
    setv("saldo_final_de_caja", ym, opening + getv("flujo_neto_del_per_odo", ym));
  }

  const firstYm = months[0]!;
  const lastYm = months[months.length - 1]!;
  for (const line of CASH_FLOW_LINES) {
    if (line.isHeader || line.isTableTitle || line.code.startsWith("_")) continue;
    let a = 0;
    for (const ym of months) {
      a += getv(line.code, ym);
    }
    annual[line.code] = a;
  }
  annual["saldo_inicial_de_caja"] = getv("saldo_inicial_de_caja", firstYm);
  annual["saldo_final_de_caja"] = getv("saldo_final_de_caja", lastYm);

  const cells: Record<string, Record<string, number>> = {};
  for (const line of CASH_FLOW_LINES) {
    if (line.isHeader || line.isTableTitle || line.code.startsWith("_")) continue;
    cells[line.code] = {};
    for (const ym of months) {
      cells[line.code]![ym] = getv(line.code, ym);
    }
  }

  return { cells, annual };
}
