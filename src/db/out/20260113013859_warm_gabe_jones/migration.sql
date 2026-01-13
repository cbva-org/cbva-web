ALTER TABLE "todos" DROP CONSTRAINT "todos_project_id_projects_id_fk";--> statement-breakpoint
DROP TABLE "files";--> statement-breakpoint
DROP TABLE "projects";--> statement-breakpoint
DROP TABLE "todos";--> statement-breakpoint
ALTER TABLE "users" RENAME CONSTRAINT "users_phoneNumber_unique" TO "users_phone_number_key";--> statement-breakpoint
ALTER TABLE "directors" RENAME CONSTRAINT "directors_profileId_unique" TO "directors_profile_id_key";--> statement-breakpoint
ALTER TABLE "match_sets" RENAME CONSTRAINT "match_sets_externalRef_unique" TO "match_sets_external_ref_key";--> statement-breakpoint
ALTER TABLE "player_profiles" RENAME CONSTRAINT "player_profiles_externalRef_unique" TO "player_profiles_external_ref_key";--> statement-breakpoint
ALTER TABLE "playoff_matches" RENAME CONSTRAINT "playoff_matches_externalRef_unique" TO "playoff_matches_external_ref_key";--> statement-breakpoint
ALTER TABLE "pool_matches" RENAME CONSTRAINT "pool_matches_externalRef_unique" TO "pool_matches_external_ref_key";--> statement-breakpoint
ALTER TABLE "pools" RENAME CONSTRAINT "pools_externalRef_unique" TO "pools_external_ref_key";--> statement-breakpoint
ALTER TABLE "tournament_division_teams" RENAME CONSTRAINT "tournament_division_teams_externalRef_unique" TO "tournament_division_teams_external_ref_key";--> statement-breakpoint
ALTER TABLE "tournament_divisions" RENAME CONSTRAINT "tournament_divisions_externalRef_unique" TO "tournament_divisions_external_ref_key";--> statement-breakpoint
ALTER TABLE "venues" RENAME CONSTRAINT "venues_externalRef_unique" TO "venues_external_ref_key";--> statement-breakpoint
ALTER TABLE "match_ref_teams" DROP CONSTRAINT "match_ref_teams_type_exclusive", ADD CONSTRAINT "match_ref_teams_type_exclusive" CHECK (("pool_match_id" IS NOT NULL AND "playoff_match_id" IS NULL) OR ("pool_match_id" IS NULL AND "playoff_match_id" IS NOT NULL));--> statement-breakpoint
ALTER TABLE "match_sets" DROP CONSTRAINT "match_type_exclusive", ADD CONSTRAINT "match_type_exclusive" CHECK (("pool_match_id" IS NOT NULL AND "playoff_match_id" IS NULL) OR ("pool_match_id" IS NULL AND "playoff_match_id" IS NOT NULL));--> statement-breakpoint
ALTER TABLE "match_sets" DROP CONSTRAINT "set_number_positive", ADD CONSTRAINT "set_number_positive" CHECK ("set_number" > 0);--> statement-breakpoint
ALTER TABLE "player_profiles" DROP CONSTRAINT "height_feet_check", ADD CONSTRAINT "height_feet_check" CHECK ("height_feet" >= 0 AND "height_feet" <= 8);--> statement-breakpoint
ALTER TABLE "player_profiles" DROP CONSTRAINT "height_inches_check", ADD CONSTRAINT "height_inches_check" CHECK ("height_inches" >= 0 AND "height_inches" < 12);--> statement-breakpoint
ALTER TABLE "playoff_matches" DROP CONSTRAINT "team_a_team_b_different_or_null", ADD CONSTRAINT "team_a_team_b_different_or_null" CHECK ("team_a_id" != "team_b_id" OR ("team_a_id" IS NULL AND "team_b_id" IS NULL));--> statement-breakpoint
ALTER TABLE "pool_matches" DROP CONSTRAINT "team_a_team_a_different", ADD CONSTRAINT "team_a_team_a_different" CHECK (("team_a_id" IS NULL AND "team_b_id" IS NULL) OR "team_a_id" != "team_b_id");