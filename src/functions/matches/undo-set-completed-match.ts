import { requireAuthenticated } from "@/auth/shared";
import { db } from "@/db/connection";
import { matchSets, selectMatchSetSchema } from "@/db/schema";
import { assertFound } from "@/lib/responses";
import { mutationOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import type z from "zod";

const undoSetMatchCompletedSchema = selectMatchSetSchema.pick({
	id: true,
});

const undoSetCompletedMatchFn = createServerFn()
	.middleware([requireAuthenticated])
	.inputValidator(
		selectMatchSetSchema.pick({
			id: true,
		}),
	)
	.handler(async ({ data: { id } }) => {
		const matchSet = await db._query.matchSets.findFirst({
			where: (t, { and, eq }) => and(eq(t.id, id), eq(t.status, "completed")),
		});

		assertFound(matchSet);

		const { teamAScore, teamBScore } = matchSet;
		const isTeamAWinner = teamAScore > teamBScore;

		await db
			.update(matchSets)
			.set({
				status: "in_progress",
				endedAt: null,
				teamAScore: isTeamAWinner ? Math.max(0, teamAScore - 1) : teamAScore,
				teamBScore: isTeamAWinner ? teamBScore : Math.max(0, teamBScore - 1),
			})
			.where(eq(matchSets.id, id));
	});

export const undoSetCompletedMutationOptions = (
	data: z.infer<typeof undoSetMatchCompletedSchema>,
) =>
	mutationOptions({
		mutationFn: async () => {
			return await undoSetCompletedMatchFn({ data });
		},
	});
