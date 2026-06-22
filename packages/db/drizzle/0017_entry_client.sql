-- Migration: link cash_flow_entries to clients (optional)
ALTER TABLE "cash_flow_entries"
  ADD COLUMN IF NOT EXISTS "client_id" uuid REFERENCES "clients"("id") ON DELETE SET NULL;
