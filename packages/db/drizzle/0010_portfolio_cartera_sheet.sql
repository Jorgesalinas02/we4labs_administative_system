ALTER TABLE "portfolio_items" ADD COLUMN "sort_order" integer;--> statement-breakpoint
ALTER TABLE "portfolio_items" ADD COLUMN "service_description" text;--> statement-breakpoint
ALTER TABLE "portfolio_items" ADD COLUMN "issued_on" varchar(10);--> statement-breakpoint
ALTER TABLE "portfolio_items" ADD COLUMN "gross_amount" numeric(18, 2);--> statement-breakpoint
ALTER TABLE "portfolio_items" ADD COLUMN "iva_amount" numeric(18, 2);--> statement-breakpoint
ALTER TABLE "portfolio_items" ADD COLUMN "retefuente_amount" numeric(18, 2);--> statement-breakpoint
ALTER TABLE "portfolio_items" ADD COLUMN "reteica_amount" numeric(18, 2);--> statement-breakpoint
ALTER TABLE "portfolio_items" ADD COLUMN "paid_amount" numeric(18, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "portfolio_items" ADD COLUMN "status" varchar(80);--> statement-breakpoint
ALTER TABLE "portfolio_items" ADD COLUMN "notes" text;
