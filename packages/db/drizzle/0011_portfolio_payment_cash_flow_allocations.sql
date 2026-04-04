ALTER TABLE "portfolio_items" ADD COLUMN IF NOT EXISTS "payment_cash_flow_allocations" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
