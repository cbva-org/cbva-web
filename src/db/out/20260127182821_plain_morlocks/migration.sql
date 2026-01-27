ALTER TABLE "tournament_division_teams" ADD COLUMN "invoice_id" integer;--> statement-breakpoint
ALTER TABLE "tournament_division_teams" ADD COLUMN "price_paid" numeric;--> statement-breakpoint
ALTER TABLE "tournament_division_teams" ADD CONSTRAINT "tournament_division_teams_invoice_id_invoices_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE SET NULL;