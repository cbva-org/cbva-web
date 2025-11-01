import { relations } from "drizzle-orm";
import { boolean, integer, pgTable, serial, text, uuid } from "drizzle-orm/pg-core";
import { createSchemaFactory } from "drizzle-zod";
import { z } from "zod";
import { poolMatches } from "./pool-matches";
import { poolTeams } from "./pool-teams";
import { tournamentDivisions } from "./tournament-divisions";

const { createInsertSchema, createSelectSchema, createUpdateSchema } =
	createSchemaFactory({ zodInstance: z });

export const pools = pgTable("pools", {
	id: serial().primaryKey(),
	name: text().notNull(),
	tournamentDivisionId: integer()
		.notNull()
		.references(() => tournamentDivisions.id),
	court: text(),
	done: boolean().notNull().default(false),
	externalRef: uuid().unique().notNull(),
});

export const selectPoolSchema = createSelectSchema(pools);
export const createPoolSchema = createInsertSchema(pools).omit({
	id: true,
});
export const updatePoolSchema = createUpdateSchema(pools);

export type Pool = z.infer<typeof selectPoolSchema>;
export type CreatePool = z.infer<typeof createPoolSchema>;
export type UpdatePool = z.infer<typeof updatePoolSchema>;

export const poolRelations = relations(pools, ({ one, many }) => ({
	tournamentDivision: one(tournamentDivisions, {
		fields: [pools.tournamentDivisionId],
		references: [tournamentDivisions.id],
	}),
	teams: many(poolTeams),
	matches: many(poolMatches),
}));
