ALTER TABLE "match_refs" RENAME TO "match_ref_teams";--> statement-breakpoint
ALTER TABLE "match_ref_teams" DROP CONSTRAINT "match_refs_type_exclusive";--> statement-breakpoint
ALTER TABLE "match_ref_teams" DROP CONSTRAINT "match_refs_pool_match_id_pool_matches_id_fk";
--> statement-breakpoint
ALTER TABLE "match_ref_teams" DROP CONSTRAINT "match_refs_playoff_match_id_playoff_matches_id_fk";
--> statement-breakpoint
ALTER TABLE "match_ref_teams" DROP CONSTRAINT "match_refs_team_id_tournament_division_teams_id_fk";
--> statement-breakpoint
DROP INDEX "match_refs_pool_match_idx";--> statement-breakpoint
DROP INDEX "match_refs_playoff_match_idx";--> statement-breakpoint
ALTER TABLE "match_ref_teams" ADD CONSTRAINT "match_ref_teams_pool_match_id_pool_matches_id_fk" FOREIGN KEY ("pool_match_id") REFERENCES "public"."pool_matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_ref_teams" ADD CONSTRAINT "match_ref_teams_playoff_match_id_playoff_matches_id_fk" FOREIGN KEY ("playoff_match_id") REFERENCES "public"."playoff_matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_ref_teams" ADD CONSTRAINT "match_ref_teams_team_id_tournament_division_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."tournament_division_teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "match_ref_teams_pool_match_idx" ON "match_ref_teams" USING btree ("pool_match_id");--> statement-breakpoint
CREATE INDEX "match_ref_teams_playoff_match_idx" ON "match_ref_teams" USING btree ("playoff_match_id");--> statement-breakpoint
ALTER TABLE "match_ref_teams" ADD CONSTRAINT "match_ref_teams_type_exclusive" CHECK (("match_ref_teams"."pool_match_id" IS NOT NULL AND "match_ref_teams"."playoff_match_id" IS NULL) OR ("match_ref_teams"."pool_match_id" IS NULL AND "match_ref_teams"."playoff_match_id" IS NOT NULL));