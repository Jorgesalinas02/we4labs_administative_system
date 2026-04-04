/**
 * Qué llaves de expansión deben estar activas para mostrar cada fila,
 * y qué llave alterna el clic en filas cabecera (A, B, A1, B1…).
 */
export const CF_EXPAND = {
  ingresos: "m:ingresos",
  egresos: "m:egresos",
  a1: "s:a1",
  a2: "s:a2",
  b1: "s:b1",
  b2: "s:b2",
  b3: "s:b3",
  b4: "s:b4",
  b5: "s:b5",
  b6: "s:b6",
} as const;

export type CfExpandKey = (typeof CF_EXPAND)[keyof typeof CF_EXPAND];

export const CF_ALL_EXPAND_KEYS: CfExpandKey[] = [
  CF_EXPAND.ingresos,
  CF_EXPAND.a1,
  CF_EXPAND.a2,
  CF_EXPAND.egresos,
  CF_EXPAND.b1,
  CF_EXPAND.b2,
  CF_EXPAND.b3,
  CF_EXPAND.b4,
  CF_EXPAND.b5,
  CF_EXPAND.b6,
];

export type CollapseLineMeta = {
  /** Si no es null, todas estas llaves deben estar abiertas para mostrar la fila. */
  requiredKeys: CfExpandKey[] | null;
  /** Si existe, la fila es cabecera desplegable y alterna esta llave. */
  toggleKey?: CfExpandKey;
};

const MI = CF_EXPAND.ingresos;
const ME = CF_EXPAND.egresos;

/** Metadatos por `line.code` de la plantilla de flujo de caja. */
export function getCashFlowCollapseMeta(lineCode: string): CollapseLineMeta {
  const meta = ((): CollapseLineMeta | undefined => {
    switch (lineCode) {
      case "concepto":
      case "saldo_inicial_de_caja":
      case "_sp1":
      case "_sp4":
      case "_sp11":
      case "flujo_neto_del_per_odo":
      case "saldo_final_de_caja":
        return { requiredKeys: null };

      case "a_ingresos_operacionales":
        return { requiredKeys: null, toggleKey: MI };
      case "a1_recaudo_por_servicios_prestados":
        return { requiredKeys: [MI], toggleKey: CF_EXPAND.a1 };
      case "servicios_de_consultor_a":
      case "servicios_profesionales_outsourcing":
      case "capacitaciones_y_formaci_n":
      case "otros_servicios":
      case "subtotal_ingresos_brutos_sin_iva":
      case "iva_cobrado_sobre_servicios_19":
      case "retenci_n_en_la_fuente_practicada_por_clientes":
      case "retenci_n_de_ica_practicada_por_clientes":
      case "total_ingresos_recibidos_en_efectivo":
        return { requiredKeys: [MI, CF_EXPAND.a1] };

      case "_sp2":
        return { requiredKeys: [MI] };

      case "a2_otros_ingresos_de_efectivo":
        return { requiredKeys: [MI], toggleKey: CF_EXPAND.a2 };
      case "rendimientos_financieros":
      case "recuperaci_n_de_cartera_vencida":
      case "pr_stamos_cr_ditos_recibidos":
      case "aportes_de_socios":
      case "otros_ingresos_no_operacionales":
      case "total_otros_ingresos":
        return { requiredKeys: [MI, CF_EXPAND.a2] };

      case "_sp3":
        return { requiredKeys: [MI] };
      case "total_entradas_de_efectivo":
        return { requiredKeys: [MI] };

      case "b_egresos_salidas_de_efectivo":
        return { requiredKeys: null, toggleKey: ME };
      case "b1_n_mina_y_carga_laboral":
        return { requiredKeys: [ME], toggleKey: CF_EXPAND.b1 };
      case "salarios_base":
      case "auxilio_de_transporte":
      case "horas_extras_y_recargos":
      case "comisiones_e_incentivos":
      case "base_salarial_para_aportes":
      case "salud_eps_8_5":
      case "pensi_n_afp_12":
      case "arl_riesgo_i":
      case "caja_de_compensaci_n_4":
      case "icbf_3":
      case "sena_2":
      case "cesant_as_8_33":
      case "intereses_sobre_cesant_as_1":
      case "prima_de_servicios_8_33":
      case "vacaciones_4_17":
      case "total_n_mina_y_carga_laboral":
        return { requiredKeys: [ME, CF_EXPAND.b1] };

      case "_sp5":
        return { requiredKeys: [ME] };

      case "b2_gastos_operativos":
        return { requiredKeys: [ME], toggleKey: CF_EXPAND.b2 };
      case "arriendo_oficina_coworking":
      case "servicios_p_blicos_agua_luz_gas":
      case "internet_y_telecomunicaciones":
      case "software_y_licencias_saas":
      case "papeler_a_y_suministros_de_oficina":
      case "mantenimiento_y_reparaciones":
      case "seguros_p_lizas_empresariales":
      case "vigilancia_y_seguridad":
      case "aseo_y_cafeter_a":
      case "transporte_y_vi_ticos":
      case "total_gastos_operativos":
        return { requiredKeys: [ME, CF_EXPAND.b2] };

      case "_sp6":
        return { requiredKeys: [ME] };

      case "b3_gastos_comerciales_y_marketing":
        return { requiredKeys: [ME], toggleKey: CF_EXPAND.b3 };
      case "publicidad_y_pauta_digital":
      case "eventos_y_networking":
      case "material_promocional":
      case "comisiones_de_venta_a_terceros":
      case "total_gastos_comerciales":
        return { requiredKeys: [ME, CF_EXPAND.b3] };

      case "_sp7":
        return { requiredKeys: [ME] };

      case "b4_obligaciones_tributarias":
        return { requiredKeys: [ME], toggleKey: CF_EXPAND.b4 };
      case "iva_por_pagar_diferencia_cobrado_pagado":
      case "autorretenci_n_de_renta":
      case "retenci_n_en_la_fuente_como_agente_retenedor":
      case "retenci_n_de_ica_como_agente_retenedor":
      case "ica_bimestral":
      case "impuesto_de_renta_anticipos_cuotas":
      case "gmf_4x1000":
      case "total_obligaciones_tributarias":
        return { requiredKeys: [ME, CF_EXPAND.b4] };

      case "_sp8":
        return { requiredKeys: [ME] };

      case "b5_gastos_financieros":
        return { requiredKeys: [ME], toggleKey: CF_EXPAND.b5 };
      case "cuota_cr_dito_bancario_capital_intereses":
      case "comisiones_bancarias":
      case "intereses_tarjeta_de_cr_dito_empresarial":
      case "leasing_arrendamiento_financiero":
      case "total_gastos_financieros":
        return { requiredKeys: [ME, CF_EXPAND.b5] };

      case "_sp9":
        return { requiredKeys: [ME] };

      case "b6_inversiones_y_capex":
        return { requiredKeys: [ME], toggleKey: CF_EXPAND.b6 };
      case "equipos_de_c_mputo":
      case "mobiliario_y_adecuaciones":
      case "inversi_n_en_tecnolog_a_desarrollo":
      case "otras_inversiones":
      case "total_inversiones_capex":
        return { requiredKeys: [ME, CF_EXPAND.b6] };

      case "_sp10":
        return { requiredKeys: [ME] };
      case "total_salidas_de_efectivo":
        return { requiredKeys: [ME] };

      default:
        return undefined;
    }
  })();

  return meta ?? { requiredKeys: null };
}

export function isRowVisible(expanded: Set<string>, meta: CollapseLineMeta): boolean {
  if (meta.requiredKeys == null) return true;
  return meta.requiredKeys.every((k) => expanded.has(k));
}
