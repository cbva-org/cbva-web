CREATE TABLE "match_refs" (
	"id" serial PRIMARY KEY NOT NULL,
	"pool_match_id" integer,
	"playoff_match_id" integer,
	"team_id" integer,
	CONSTRAINT "match_refs_type_exclusive" CHECK (("match_refs"."pool_match_id" IS NOT NULL AND "match_refs"."playoff_match_id" IS NULL) OR ("match_refs"."pool_match_id" IS NULL AND "match_refs"."playoff_match_id" IS NOT NULL))
);
--> statement-breakpoint
ALTER TABLE "match_refs" ADD CONSTRAINT "match_refs_pool_match_id_pool_matches_id_fk" FOREIGN KEY ("pool_match_id") REFERENCES "public"."pool_matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_refs" ADD CONSTRAINT "match_refs_playoff_match_id_playoff_matches_id_fk" FOREIGN KEY ("playoff_match_id") REFERENCES "public"."playoff_matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_refs" ADD CONSTRAINT "match_refs_team_id_tournament_division_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."tournament_division_teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "match_refs_pool_match_idx" ON "match_refs" USING btree ("pool_match_id");--> statement-breakpoint
CREATE INDEX "match_refs_playoff_match_idx" ON "match_refs" USING btree ("playoff_match_id");