-- Migration: team_members + link cash_flow_entries
-- CRUD de equipo: empleados, contratistas, socios.

CREATE TABLE IF NOT EXISTS "team_members" (
  "id"         uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id"  uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "name"       varchar(200) NOT NULL,
  "kind"       varchar(32) NOT NULL DEFAULT 'empleado',
  "email"      varchar(320),
  "notes"      text,
  "active"     boolean NOT NULL DEFAULT true,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);

ALTER TABLE "team_members" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_team_members" ON "team_members"
  AS PERMISSIVE FOR ALL TO public
  USING (tenant_id::text = current_setting('app.tenant_id', true));

ALTER TABLE "cash_flow_entries"
  ADD COLUMN IF NOT EXISTS "team_member_id" uuid REFERENCES "team_members"("id") ON DELETE SET NULL;
