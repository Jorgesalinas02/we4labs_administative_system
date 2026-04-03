import type { PayrollCalcInput } from "./index.js";

export type PayrollParameterSet = {
  smmlv: number;
  transportAidMonthly: number;
  healthEmployeePct: number;
  healthEmployerPct: number;
  pensionEmployeePct: number;
  pensionEmployerPct: number;
  solidaridadEmployeePct: number;
  risksEmployerPct: number;
  senaEmployerPct: number;
  icbfEmployerPct: number;
  cajaEmployerPct: number;
};

/** Cálculo simplificado mensual prorrateado por días (Colombia, MVP). */
export function calculatePayrollColombia(
  input: PayrollCalcInput,
  p: PayrollParameterSet,
) {
  const devengadoSalario = (input.baseSalary / 30) * input.daysWorked;
  const tope2smmlv = 2 * p.smmlv;
  const transport =
    input.includeTransportAid && input.baseSalary <= tope2smmlv
      ? (p.transportAidMonthly / 30) * input.daysWorked
      : 0;
  const ibcSeguridad = devengadoSalario + transport;

  const healthEmp = ibcSeguridad * p.healthEmployeePct;
  const pensionEmp = ibcSeguridad * p.pensionEmployeePct;
  const solidaridad = ibcSeguridad * p.solidaridadEmployeePct;
  const healthEmployer = ibcSeguridad * p.healthEmployerPct;
  const pensionEmployer = ibcSeguridad * p.pensionEmployerPct;
  const risks = ibcSeguridad * p.risksEmployerPct;
  const sena = ibcSeguridad * p.senaEmployerPct;
  const icbf = ibcSeguridad * p.icbfEmployerPct;
  const caja = ibcSeguridad * p.cajaEmployerPct;

  const totalDeductions = healthEmp + pensionEmp + solidaridad;
  const netToEmployee = devengadoSalario + transport - totalDeductions;
  const employerContributions =
    healthEmployer + pensionEmployer + risks + sena + icbf + caja;

  return {
    devengadoSalario,
    transportAid: transport,
    ibcSeguridadSocial: ibcSeguridad,
    employee: { health: healthEmp, pension: pensionEmp, solidaridad },
    employer: {
      health: healthEmployer,
      pension: pensionEmployer,
      arl: risks,
      sena,
      icbf,
      cajaCompensacion: caja,
    },
    totalDeductions,
    netToEmployee,
    employerContributions,
    disclaimer:
      "Estimación educativa. Validar con normativa, contrato y software legal homologado.",
  };
}
