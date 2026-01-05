import { db } from "@/db/connection";
import {
	selectTournamentDivisionTeamSchema,
	tournamentDivisionTeams,
} from "@/db/schema";
import { badRequest, notFound } from "@/lib/responses";
import { mutationOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import z from "zod";

export const updatePoolSchema = selectTournamentDivisionTeamSchema
	.pick({
		id: true,
	})
	.extend({
		poolId: z.number(),
	});

export const updatePool = createServerFn()
	.inputValidator(updatePoolSchema)
	.handler(async ({ data: { id: tournamentDivisionTeamId, seed } }) => {
		const targetTeam = await db.query.tournamentDivisionTeams.findFirst({
			where: (table, { eq }) => eq(table.id, tournamentDivisionTeamId),
		});

		if (!targetTeam) {
			throw notFound();
		}

		// TODO: update poolId for targetTeam
		// TODO: set the team's pool seed to the last seed in the pool

		return {
			success: true,
		};
	});

export const updatePoolMutationOptions = () =>
	mutationOptions({
		mutationFn: (data: z.infer<typeof updatePoolSchema>) =>
			updatePool({ data }),
	});
