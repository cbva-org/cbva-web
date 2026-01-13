import { mutationOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import random from "lodash-es/random";
import z from "zod";
import { requirePermissions } from "@/auth/shared";
import { db } from "@/db/connection";
import { isNotNullOrUndefined } from "@/utils/types";
import { overrideScoreHandler } from "@/functions/matches/override-score";

export const simulateMatchSchema = z
	.object({
		playoffMatchId: z.number().optional(),
		poolMatchId: z.number().optional(),
	})
	.refine(
		(v) => {
			const values = [v.playoffMatchId, v.poolMatchId].filter(
				isNotNullOrUndefined,
			);

			return values.length > 0;
		},
		{
			message: "Must set either `playoffMatchId` or `poolMatchId`.",
			path: ["playoffMatchId", "poolMatchId"],
		},
	);

export const simulateMatchFn = createServerFn()
	.middleware([
		requirePermissions({
			tournament: ["update"],
		}),
	])
	.inputValidator(simulateMatchSchema)
	.handler(async ({ data: { playoffMatchId, poolMatchId } }) => {
		const sets = await db._query.matchSets.findMany({
			where: (t, { eq }) =>
				isNotNullOrUndefined(playoffMatchId)
					? eq(t.playoffMatchId, playoffMatchId)
					: eq(t.poolMatchId, poolMatchId!),
		});

		for (const set of sets) {
			const teamAWins = random(0, 1) === 0;

			const teamAScore = teamAWins ? set.winScore : random(0, set.winScore - 2);
			const teamBScore = !teamAWins
				? set.winScore
				: random(0, set.winScore - 2);

			const result = await overrideScoreHandler({
				id: set.id,
				teamAScore,
				teamBScore,
			});

			if (result.data?.winnerId) {
				break;
			}
		}

		return {
			success: true,
		};
	});

export const simulateMatchMutationOptions = () =>
	mutationOptions({
		mutationFn: async (data: z.infer<typeof simulateMatchSchema>) => {
			return await simulateMatchFn({ data });
		},
	});
