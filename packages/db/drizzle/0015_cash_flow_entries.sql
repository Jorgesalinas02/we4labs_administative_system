-- Migration: cash_flow_entries
-- Stores individual transaction records per business category + month.
-- Replaces the single-amount model in cash_flow_sheet_cells for category-based rows.

CREATE TABLE IF NOT EXISTS "cash_flow_entries" (
  "id"            uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id"     uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "category_code" varchar(100) NOT NULL,
  "period_ym"     varchar(7)  NOT NULL,
  "occurred_on"   varchar(10),
  "description"   text,
  "amount"        numeric(18, 2) NOT NULL DEFAULT 0,
  "created_at"    timestamp with time zone DEFAULT now(),
  "updated_at"    timestamp with time zone DEFAULT now()
);

-- RLS
ALTER TABLE "cash_flow_entries" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON "cash_flow_entries"
  USING ("tenant_id" = current_setting('app.tenant_id')::uuid);
