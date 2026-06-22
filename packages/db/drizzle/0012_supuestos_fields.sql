-- Parámetros fiscales: UVT (Unidad de Valor Tributario) junto al SMMLV
ALTER TABLE "payroll_parameters" ADD COLUMN "uvt" numeric(14, 2);--> statement-breakpoint

-- Datos del negocio: sector económico del tenant
ALTER TABLE "tenants" ADD COLUMN "sector" varchar(120);--> statement-breakpoint

-- Saldo en caja / banco: colchón mínimo de seguridad (fracción, ej. 0.10 = 10%)
ALTER TABLE "cash_flow_sheet_settings" ADD COLUMN "min_cash_buffer_pct" numeric(6, 4);--> statement-breakpoint

-- RLS: nuevas columnas no requieren políticas adicionales (heredan de la tabla)
