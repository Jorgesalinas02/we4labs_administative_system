-- Row Level Security multi-tenant (requiere set_config app.tenant_id por sesión/transacción)
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "users" FORCE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_users" ON "users" AS PERMISSIVE FOR ALL TO public
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

ALTER TABLE "scenarios" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "scenarios" FORCE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_scenarios" ON "scenarios" AS PERMISSIVE FOR ALL TO public
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

ALTER TABLE "cash_movements" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "cash_movements" FORCE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_cash" ON "cash_movements" AS PERMISSIVE FOR ALL TO public
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

ALTER TABLE "portfolio_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "portfolio_items" FORCE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_portfolio" ON "portfolio_items" AS PERMISSIVE FOR ALL TO public
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

ALTER TABLE "tax_calendar_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tax_calendar_events" FORCE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_cal" ON "tax_calendar_events" AS PERMISSIVE FOR ALL TO public
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

ALTER TABLE "tax_obligations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tax_obligations" FORCE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_tax_ob" ON "tax_obligations" AS PERMISSIVE FOR ALL TO public
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

ALTER TABLE "tax_obligation_steps" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tax_obligation_steps" FORCE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_tax_steps" ON "tax_obligation_steps" AS PERMISSIVE FOR ALL TO public
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

ALTER TABLE "audit_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "audit_logs" FORCE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_audit" ON "audit_logs" AS PERMISSIVE FOR ALL TO public
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

ALTER TABLE "payroll_parameters" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payroll_parameters" FORCE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_payroll" ON "payroll_parameters" AS PERMISSIVE FOR ALL TO public
  USING (
    tenant_id IS NULL
    OR tenant_id = current_setting('app.tenant_id', true)::uuid
  )
  WITH CHECK (
    tenant_id IS NULL
    OR tenant_id = current_setting('app.tenant_id', true)::uuid
  );

ALTER TABLE "tenants" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tenants" FORCE ROW LEVEL SECURITY;
CREATE POLICY "tenant_self" ON "tenants" AS PERMISSIVE FOR ALL TO public
  USING (id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (id = current_setting('app.tenant_id', true)::uuid);
