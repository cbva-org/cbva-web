import { date, integer, pgTable, serial, text } from "drizzle-orm/pg-core";
import { createSchemaFactory } from "drizzle-zod";
import { z } from "zod";
import { playerProfiles } from "./player-profiles";
import { users } from "./auth";
import { timestamps } from "./shared";

const { createSelectSchema } = createSchemaFactory({ zodInstance: z });

export const memberships = pgTable("memberships", {
	id: serial(),
	transactionKey: text().notNull(),
	validUntil: date().notNull(),
	profileId: integer()
		.notNull()
		.references(() => playerProfiles.id),
	purchaserId: text()
		.notNull()
		.references(() => users.id),
	...timestamps,
});

export const selectMembershipSchema = createSelectSchema(memberships);

export type Membership = z.infer<typeof selectMembershipSchema>;
