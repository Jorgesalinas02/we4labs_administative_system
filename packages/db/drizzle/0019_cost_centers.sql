-- Migration: cost_centers + link cash_flow_entries
-- Centros de costos / proyectos con integración al flujo de caja.

CREATE TABLE IF NOT EXISTS "cost_centers" (
  "id"             uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id"      uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "name"           varchar(200) NOT NULL,
  "client_id"      uuid REFERENCES "clients"("id") ON DELETE SET NULL,
  "quoted_amount"  numeric(18, 2) NOT NULL DEFAULT 0,
  "start_date"     varchar(10),
  "end_date"       varchar(10),
  "status"         varchar(32) NOT NULL DEFAULT 'en_progreso',
  "description"    text,
  "active"         boolean NOT NULL DEFAULT true,
  "created_at"     timestamp with time zone DEFAULT now(),
  "updated_at"     timestamp with time zone DEFAULT now()
);

ALTER TABLE "cost_centers" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_cost_centers" ON "cost_centers"
  AS PERMISSIVE FOR ALL TO public
  USING (tenant_id::text = current_setting('app.tenant_id', true));

ALTER TABLE "cash_flow_entries"
  ADD COLUMN IF NOT EXISTS "cost_center_id" uuid REFERENCES "cost_centers"("id") ON DELETE SET NULL;
