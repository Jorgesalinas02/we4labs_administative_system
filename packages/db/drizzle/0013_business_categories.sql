CREATE TABLE "business_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"kind" varchar(16) NOT NULL,
	"parent_code" varchar(100) NOT NULL,
	"parent_label" varchar(200) NOT NULL,
	"code" varchar(100) NOT NULL,
	"label" varchar(200) NOT NULL,
	"asks_client" varchar(16) NOT NULL DEFAULT 'none',
	"sort_order" integer NOT NULL DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "business_categories" ADD CONSTRAINT "business_categories_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_categories" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "business_categories" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "tenant_isolation_biz_cat" ON "business_categories" AS PERMISSIVE FOR ALL TO public USING (tenant_id::text = current_setting('app.tenant_id', true));
