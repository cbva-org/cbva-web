CREATE TABLE "memberships" (
	"id" serial,
	"transaction_key" text NOT NULL,
	"valid_until" date NOT NULL,
	"profile_id" integer NOT NULL,
	"purchaser_id" text NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "player_profiles" ADD COLUMN "created_at" timestamp;--> statement-breakpoint
ALTER TABLE "player_profiles" ADD COLUMN "updated_at" timestamp;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_profile_id_player_profiles_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "player_profiles"("id");--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_purchaser_id_users_id_fkey" FOREIGN KEY ("purchaser_id") REFERENCES "users"("id");