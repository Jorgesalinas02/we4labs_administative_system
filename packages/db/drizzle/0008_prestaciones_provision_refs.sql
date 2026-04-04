ALTER TABLE "payroll_parameters" ADD COLUMN IF NOT EXISTS "intereses_cesantias_provision_pct" numeric(6, 4);
UPDATE "payroll_parameters" SET "intereses_cesantias_provision_pct" = 0.01 WHERE "intereses_cesantias_provision_pct" IS NULL;
ALTER TABLE "payroll_parameters" DROP COLUMN IF EXISTS "intereses_cesantias_annual_pct";
ALTER TABLE "payroll_parameters" ADD COLUMN IF NOT EXISTS "prestaciones_references_json" jsonb;
