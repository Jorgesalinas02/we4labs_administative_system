CREATE TABLE "legal_parameters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid,
	"effective_from" varchar(10) NOT NULL,
	"initial_cash_balance" numeric(18, 2) NOT NULL,
	"employee_count" integer NOT NULL,
	"average_monthly_salary_cop" numeric(18, 2) NOT NULL,
	"general_vat_rate_pct" numeric(6, 4),
	"clients_withholding_share_pct" numeric(6, 4),
	"withholding_services_rate_pct" numeric(6, 4),
	"ica_withholding_rate_pct" numeric(6, 4),
	"income_self_retention_rate_pct" numeric(6, 4),
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "legal_parameters" ADD CONSTRAINT "legal_parameters_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "legal_parameters" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "legal_parameters" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "tenant_isolation_legal_params" ON "legal_parameters" AS PERMISSIVE FOR ALL TO public
  USING (
    tenant_id IS NULL
    OR tenant_id = current_setting('app.tenant_id', true)::uuid
  )
  WITH CHECK (
    tenant_id IS NULL
    OR tenant_id = current_setting('app.tenant_id', true)::uuid
  );
