-- Migration: clients
-- CRUD de clientes del negocio.

CREATE TABLE IF NOT EXISTS "clients" (
  "id"          uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id"   uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "name"        varchar(200) NOT NULL,
  "nit"         varchar(30),
  "client_type" varchar(80),
  "notes"       text,
  "created_at"  timestamp with time zone DEFAULT now(),
  "updated_at"  timestamp with time zone DEFAULT now()
);

ALTER TABLE "clients" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_clients" ON "clients"
  AS PERMISSIVE FOR ALL TO public
  USING (tenant_id::text = current_setting('app.tenant_id', true));
