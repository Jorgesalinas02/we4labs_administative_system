CREATE TABLE "cash_flow_sheet_settings" (
	"tenant_id" uuid PRIMARY KEY NOT NULL,
	"start_ym" varchar(7) DEFAULT '2026-04' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "cash_flow_sheet_settings" ADD CONSTRAINT "cash_flow_sheet_settings_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE TABLE "cash_flow_sheet_cells" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"line_code" varchar(128) NOT NULL,
	"period_ym" varchar(7) NOT NULL,
	"amount" numeric(18, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "cash_flow_sheet_cells" ADD CONSTRAINT "cash_flow_sheet_cells_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "cash_flow_sheet_cells_tenant_line_period_uq" ON "cash_flow_sheet_cells" USING btree ("tenant_id","line_code","period_ym");--> statement-breakpoint
ALTER TABLE "cash_flow_sheet_settings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "cash_flow_sheet_settings" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "tenant_isolation_cash_flow_settings" ON "cash_flow_sheet_settings" AS PERMISSIVE FOR ALL TO public
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);--> statement-breakpoint
ALTER TABLE "cash_flow_sheet_cells" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "cash_flow_sheet_cells" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "tenant_isolation_cash_flow_cells" ON "cash_flow_sheet_cells" AS PERMISSIVE FOR ALL TO public
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);
