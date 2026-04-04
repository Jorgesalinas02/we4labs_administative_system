/**
 * Obligaciones alineadas a la plantilla Flujo_de_Caja_Pyme_SAS completo.xlsx:
 * - Hoja «Flujo de Caja» sección B4 (líneas de salida por obligaciones tributarias).
 * - Hoja «Calendario Tributario» (referencia conceptual; fechas son ilustrativas).
 * Contenido de carácter general: verificar calendario y tarifas oficiales DIAN / municipio.
 */

export type TaxObligationStepSeed = { title: string; details?: string };

export type TaxObligationSeedDef = {
  code: string;
  title: string;
  summary: string;
  appliesTo: string;
  periodicity: string;
  legalRef: string;
  bodyMarkdown: string;
  steps: TaxObligationStepSeed[];
};

/** Línea Excel: iva_por_pagar_diferencia_cobrado_pagado */
const IVA: TaxObligationSeedDef = {
  code: "IVA",
  title: "Impuesto al Valor Agregado (IVA)",
  summary:
    "Liquidación del IVA generado en ventas frente al IVA descontable en compras; el saldo a pagar es parte del flujo de caja (diferencia cobrado − pagado en términos de efectivo).",
  appliesTo: "Responsables de IVA en régimen común o simplificado según clasificación DIAN.",
  periodicity: "Declaración bimestral o cuatrimestral según calendario; pago según saldo a cargo.",
  legalRef: "Estatuto Tributario — Título V; Resoluciones DIAN de facturación electrónica.",
  bodyMarkdown:
    "## En el Excel\nCorresponde a la fila **IVA por pagar (diferencia cobrado − pagado)** en B4.\n\n## Nota\nConciliar con formulario 300 / medios magnéticos según proceda.",
  steps: [
    {
      title: "Consolidar facturas de venta y compra del periodo",
      details: "Validar eventos DIAN y soportes electrónicos.",
    },
    {
      title: "Preparar declaración y determinar saldo a pagar o a favor",
      details: "Usar aplicativo DIAN o software autorizado.",
    },
    {
      title: "Programar pago en banco dentro del vencimiento",
      details: "Registrar el egreso en el mes correspondiente del flujo de caja.",
    },
  ],
};

/** autorretenci_n_de_renta */
const AUTORRET_RENTA: TaxObligationSeedDef = {
  code: "AUTORRET_RENTA",
  title: "Autorretención de renta",
  summary:
    "Retención que el contribuyente practica sobre sus propios ingresos por renta de trabajo o por otros conceptos cuando la norma así lo exige.",
  appliesTo: "Personas naturales y jurídicas sujetas a autorretención según actividad y montos.",
  periodicity: "Según calendario tributario (declaración y pago acumulado).",
  legalRef: "E.T. — arts. 383 y siguientes; Decreto 2201 de 2016 y normas concordantes.",
  bodyMarkdown: "## En el Excel\nFila **Autorretención de renta** (B4).",
  steps: [
    {
      title: "Verificar si aplica autorretención en el periodo",
      details: "Revisar tarifa y base según tipo de ingreso.",
    },
    {
      title: "Declarar y pagar dentro de los plazos",
      details: "Conciliar con contabilidad y flujo de caja mensual.",
    },
  ],
};

/** retenci_n_en_la_fuente_como_agente_retenedor */
const RETE_FUENTE: TaxObligationSeedDef = {
  code: "RETE_FUENTE",
  title: "Retención en la fuente como agente retenedor",
  summary:
    "Practicar retención a proveedores y contratistas, consignar y declarar los montos retenidos a la DIAN.",
  appliesTo: "Agentes de retención designados por la DIAN o por norma especial.",
  periodicity: "Declaración y pago mensual o según calendario oficial.",
  legalRef: "E.T. — arts. 383-2, 392 y tablas de retención; Resoluciones DIAN.",
  bodyMarkdown: "## En el Excel\nFila **Retención en la fuente (como agente retenedor)** (B4).",
  steps: [
    {
      title: "Liquidar retenciones del periodo por concepto",
      details: "Servicios, honorarios, compras, etc., según tarifas vigentes.",
    },
    {
      title: "Presentar declaración informativa / pago consolidado",
      details: "Medios magnéticos o formulario según instructivo DIAN.",
    },
    {
      title: "Registrar egreso en el mes del pago al fisco",
      details: "Alineado a la columna del mes en la matriz de flujo de caja.",
    },
  ],
};

/** retenci_n_de_ica_como_agente_retenedor */
const RETE_ICA: TaxObligationSeedDef = {
  code: "RETE_ICA",
  title: "Retención de ICA como agente retenedor",
  summary:
    "Cuando actúa como agente de retención de ICA municipal sobre pagos a contratistas, debe declarar y consignar según el municipio.",
  appliesTo: "Agentes de retención de ICA designados por acuerdos municipales.",
  periodicity: "Según periodicidad del municipio (mensual, bimestral, etc.).",
  legalRef: "Acuerdos y decretos del municipio donde opera; E.T. disposiciones locales.",
  bodyMarkdown: "## En el Excel\nFila **Retención de ICA (como agente retenedor)** (B4).",
  steps: [
    {
      title: "Determinar base y tarifa de retención ICA",
      details: "Consultar acuerdo del municipio correspondiente.",
    },
    {
      title: "Declarar y pagar en Secretaría de Hacienda o canal en línea",
      details: "Conservar soporte para conciliación bancaria.",
    },
  ],
};

/** ica_bimestral */
const ICA_MUN: TaxObligationSeedDef = {
  code: "ICA_MUN",
  title: "ICA bimestral (Industria y Comercio)",
  summary:
    "Impuesto municipal sobre actividades industriales, comerciales y de servicios; liquidación propia del contribuyente en la jurisdicción principal.",
  appliesTo: "Empresas con establecimiento o actividad gravable en el municipio.",
  periodicity: "Típicamente bimestral; verificar acuerdo local.",
  legalRef: "Estatuto Orgánico del Sistema Financiero y normas municipales.",
  bodyMarkdown: "## En el Excel\nFila **ICA bimestral** (B4).",
  steps: [
    {
      title: "Calcular base gravable y tarifa por actividad",
      details: "Usar formulario o sistema del municipio.",
    },
    {
      title: "Presentar declaración y pagar en fecha límite",
      details: "Imputar el egreso al mes de pago en el flujo de caja.",
    },
  ],
};

/** impuesto_de_renta_anticipos_cuotas */
const RENTA: TaxObligationSeedDef = {
  code: "RENTA",
  title: "Impuesto de la renta — anticipos y liquidación",
  summary:
    "Pagos anticipados de renta (personas jurídicas y naturales con obligación) y cierre anual; impactan salidas de efectivo del periodo.",
  appliesTo: "Contribuyentes sujetos a renta según clasificación DIAN.",
  periodicity: "Anticipos según calendario; liquidación anual.",
  legalRef: "E.T. — Libro I, impuesto sobre la renta y complementarios.",
  bodyMarkdown: "## En el Excel\nFila **Impuesto de renta (anticipos / cuotas)** (B4).",
  steps: [
    {
      title: "Calcular anticipos según método aplicable",
      details: "Porcentaje sobre patrimonio líquido, renta presunta u otros.",
    },
    {
      title: "Declarar y pagar cada vencimiento",
      details: "Registrar en el mes correspondiente del flujo.",
    },
    {
      title: "Cierre anual: conciliar con estados financieros",
      details: "Liquidación definitiva y saldos a pagar o a favor.",
    },
  ],
};

/** gmf_4x1000 */
const GMF: TaxObligationSeedDef = {
  code: "GMF",
  title: "GMF — Gravamen a los movimientos financieros (4×1000)",
  summary:
    "Tributo sobre movimientos de dinero en cuentas corrientes, ahorro y otros productos financieros sujetos.",
  appliesTo: "Cuentas y productos alcanzados por la norma; exenciones según topes y tipo de cuenta.",
  periodicity: "Se devenga por operación; consolidación contable y de tesorería mensual.",
  legalRef: "Ley 633 de 2000 y modificaciones; conceptos DIAN y Superfinanciera.",
  bodyMarkdown: "## En el Excel\nFila **GMF (4x1000)** (B4).",
  steps: [
    {
      title: "Extraer movimientos gravados del extracto bancario",
      details: "Identificar consignaciones, transferencias y débitos sujetos.",
    },
    {
      title: "Provisionar o registrar el costo fiscal del periodo",
      details: "Incluir en proyección de salidas del flujo de caja.",
    },
  ],
};

/** Orden alfabético por código para listados estables */
export const TAX_OBLIGATIONS_FLUJO_PYME_SAS: TaxObligationSeedDef[] = [
  AUTORRET_RENTA,
  GMF,
  IVA,
  ICA_MUN,
  RENTA,
  RETE_FUENTE,
  RETE_ICA,
];
