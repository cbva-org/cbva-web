ALTER TABLE "playoff_matches" DROP CONSTRAINT "playoff_matches_team_a_pool_id_pools_id_fk";
--> statement-breakpoint
ALTER TABLE "playoff_matches" DROP CONSTRAINT "playoff_matches_team_b_pool_id_pools_id_fk";
--> statement-breakpoint
ALTER TABLE "pools" DROP CONSTRAINT "pools_tournament_division_id_tournament_divisions_id_fk";
--> statement-breakpoint
ALTER TABLE "tournament_division_requirements" DROP CONSTRAINT "tournament_division_requirements_tournament_division_id_tournament_divisions_id_fk";
--> statement-breakpoint
ALTER TABLE "tournament_division_teams" DROP CONSTRAINT "tournament_division_teams_tournament_division_id_tournament_divisions_id_fk";
--> statement-breakpoint
ALTER TABLE "tournament_divisions" DROP CONSTRAINT "tournament_divisions_tournament_id_tournaments_id_fk";
--> statement-breakpoint
ALTER TABLE "playoff_matches" ADD CONSTRAINT "playoff_matches_team_a_pool_id_pools_id_fk" FOREIGN KEY ("team_a_pool_id") REFERENCES "public"."pools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playoff_matches" ADD CONSTRAINT "playoff_matches_team_b_pool_id_pools_id_fk" FOREIGN KEY ("team_b_pool_id") REFERENCES "public"."pools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pools" ADD CONSTRAINT "pools_tournament_division_id_tournament_divisions_id_fk" FOREIGN KEY ("tournament_division_id") REFERENCES "public"."tournament_divisions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_division_requirements" ADD CONSTRAINT "tournament_division_requirements_tournament_division_id_tournament_divisions_id_fk" FOREIGN KEY ("tournament_division_id") REFERENCES "public"."tournament_divisions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_division_teams" ADD CONSTRAINT "tournament_division_teams_tournament_division_id_tournament_divisions_id_fk" FOREIGN KEY ("tournament_division_id") REFERENCES "public"."tournament_divisions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_divisions" ADD CONSTRAINT "tournament_divisions_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE cascade ON UPDATE no action;