ALTER TABLE "match_ref_teams" ALTER COLUMN "team_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "tournament_divisions" ADD COLUMN "max_teams" integer DEFAULT 10 NOT NULL;--> statement-breakpoint
ALTER TABLE "tournament_divisions" ADD COLUMN "max_waitlist" integer DEFAULT 5 NOT NULL;--> statement-breakpoint
ALTER TABLE "tournament_divisions" ADD COLUMN "autopromote_waitlist" boolean DEFAULT true NOT NULL;