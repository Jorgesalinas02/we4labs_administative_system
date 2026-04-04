ALTER TABLE "payroll_parameters" ADD COLUMN IF NOT EXISTS "cesantias_pct" numeric(6, 4);
ALTER TABLE "payroll_parameters" ADD COLUMN IF NOT EXISTS "prima_servicios_pct" numeric(6, 4);
ALTER TABLE "payroll_parameters" ADD COLUMN IF NOT EXISTS "vacaciones_provision_pct" numeric(6, 4);
ALTER TABLE "payroll_parameters" ADD COLUMN IF NOT EXISTS "intereses_cesantias_annual_pct" numeric(6, 4);
