CREATE TYPE "type" AS ENUM('string', 'float', 'int');--> statement-breakpoint
DROP TABLE "membership_pricing";--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "type" "type" NOT NULL;