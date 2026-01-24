CREATE TABLE "membership_pricing" (
	"id" serial PRIMARY KEY,
	"price" numeric NOT NULL,
	"effective_start_date" date NOT NULL,
	"effective_end_date" date,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"key" text PRIMARY KEY,
	"value" text NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "tournament_divisions" ADD COLUMN "registration_price" numeric;