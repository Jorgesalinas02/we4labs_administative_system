import { NextResponse } from "next/server";
import { payrollCalcInputSchema, calculatePayrollColombia } from "@we4labs/shared";
import { loadLatestPayrollParams } from "@/lib/data";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const input = payrollCalcInputSchema.parse(body);
    const row = await loadLatestPayrollParams();
    if (!row) {
      return NextResponse.json(
        { error: "No hay parámetros de nómina para el tenant. Ejecuta seed o migra datos." },
        { status: 400 },
      );
    }
    const p = {
      smmlv: Number(row.smmlv),
      transportAidMonthly: Number(row.transportAidMonthly),
      healthEmployeePct: Number(row.healthEmployeePct ?? 0),
      healthEmployerPct: Number(row.healthEmployerPct ?? 0),
      pensionEmployeePct: Number(row.pensionEmployeePct ?? 0),
      pensionEmployerPct: Number(row.pensionEmployerPct ?? 0),
      solidaridadEmployeePct: Number(row.solidaridadEmployeePct ?? 0),
      risksEmployerPct: Number(row.risksEmployerPct ?? 0),
      senaEmployerPct: Number(row.senaEmployerPct ?? 0),
      icbfEmployerPct: Number(row.icbfEmployerPct ?? 0),
      cajaEmployerPct: Number(row.cajaEmployerPct ?? 0),
    };
    const result = calculatePayrollColombia(input, p);
    return NextResponse.json({ result, contractNote: `Contrato: ${input.contractType} (reglas completas pendientes).` });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}
