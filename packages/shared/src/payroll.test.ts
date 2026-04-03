import { describe, expect, it } from "vitest";
import { calculatePayrollColombia } from "./payroll.js";

describe("calculatePayrollColombia", () => {
  const params = {
    smmlv: 1_423_500,
    transportAidMonthly: 200_000,
    healthEmployeePct: 0.04,
    healthEmployerPct: 0.085,
    pensionEmployeePct: 0.04,
    pensionEmployerPct: 0.12,
    solidaridadEmployeePct: 0.01,
    risksEmployerPct: 0.0221,
    senaEmployerPct: 0.02,
    icbfEmployerPct: 0.03,
    cajaEmployerPct: 0.04,
  };

  it("proratea por días y aplica auxilio si salario ≤ 2 SMMLV", () => {
    const r = calculatePayrollColombia(
      {
        baseSalary: 2_500_000,
        daysWorked: 15,
        includeTransportAid: true,
        contractType: "indefinido",
      },
      params,
    );
    expect(r.devengadoSalario).toBeCloseTo((2_500_000 / 30) * 15, 2);
    expect(r.transportAid).toBeCloseTo((200_000 / 30) * 15, 2);
    expect(r.netToEmployee).toBeGreaterThan(0);
    expect(r.employerContributions).toBeGreaterThan(0);
  });

  it("no aplica auxilio si el salario supera 2 SMMLV", () => {
    const r = calculatePayrollColombia(
      {
        baseSalary: 5_000_000,
        daysWorked: 30,
        includeTransportAid: true,
        contractType: "indefinido",
      },
      params,
    );
    expect(r.transportAid).toBe(0);
  });
});
