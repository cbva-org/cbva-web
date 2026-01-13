import { mutationOptions } from "@tanstack/react-query";
import { createServerFn, createServerOnlyFn } from "@tanstack/react-start";
import { eq, max, sql } from "drizzle-orm";
import random from "lodash-es/random";
import z from "zod";
import { requireAuthenticated, requirePermissions } from "@/auth/shared";
import { db } from "@/db/connection";
import {
	type MatchSet,
	matchRefTeams,
	matchSets,
	playoffMatches,
	poolMatches,
	selectMatchSetSchema,
	selectTournamentDivisionSchema,
	type Transaction,
	tournamentDivisionTeams,
	type UpdateMatchSet,
	type UpdatePlayoffMatch,
	type UpdatePoolMatch,
} from "@/db/schema";
import { isSetDone } from "@/lib/matches";
import { getFinishForRound } from "@/lib/playoffs";
import { assertFound, internalServerError, notFound } from "@/lib/responses";
import { isNotNullOrUndefined } from "@/utils/types";
import { overrideScoreHandler } from "@/functions/matches/override-score";
import {
	handleCompletedPlayoffMatchSet,
	handleCompletedPoolMatchSet,
} from "@/functions/matches/update-score";

const findMatchSetSchema = selectMatchSetSchema.pick({
	id: true,
});

const matchSetActionSchema = selectMatchSetSchema
	.pick({
		id: true,
	})
	.extend({
		action: z.enum(["increment", "decrement"]),
		teamA: z.boolean(),
	});

export function applyMatchSetAction(
	{ action, teamA }: z.infer<typeof matchSetActionSchema>,
	current: MatchSet,
) {
	const next = { ...current };

	const diff = action === "increment" ? 1 : -1;

	if (teamA) {
		next.teamAScore = Math.max(0, next.teamAScore + diff);
	} else {
		next.teamBScore = Math.max(0, next.teamBScore + diff);
	}

	// Calculate if the set is done: a team must reach winScore AND be ahead by at least 2 points
	const isDone = isSetDone(next.teamAScore, next.teamBScore, current.winScore);

	if (isDone) {
		next.status = "completed";
		next.endedAt = new Date();
	}

	return next;
}

const updateScoreFn = createServerFn()
	.middleware([requireAuthenticated])
	.inputValidator(matchSetActionSchema)
	.handler(async ({ data: { id, teamA, action } }) => {
		const matchSet = await db._query.matchSets.findFirst({
			where: (t, { and, eq }) => and(eq(t.id, id), eq(t.status, "in_progress")),
		});

		if (!matchSet) {
			throw notFound();
		}

		const next = applyMatchSetAction({ id, teamA, action }, matchSet);

		const { playoffMatchId, poolMatchId } = matchSet;

		await db.transaction(async (txn) => {
			await txn.update(matchSets).set(next).where(eq(matchSets.id, id));

			if (next.status === "completed") {
				if (poolMatchId) {
					return await handleCompletedPoolMatchSet(txn, poolMatchId);
				}

				if (playoffMatchId) {
					return await handleCompletedPlayoffMatchSet(txn, playoffMatchId);
				}
			}
		});
	});

export const updateScoreMutationOptions = () =>
	mutationOptions({
		mutationFn: async (data: z.infer<typeof matchSetActionSchema>) => {
			return await updateScoreFn({ data });
		},
	});

const startMatchFn = createServerFn()
	.middleware([requireAuthenticated])
	.inputValidator(findMatchSetSchema)
	.handler(async ({ data: { id } }) => {
		const matchSet = await db.query.matchSets.findFirst({
			where: {
				id,
				status: "not_started",
			},
		});

		assertFound(matchSet);

		await db
			.update(matchSets)
			.set({
				status: "in_progress",
				startedAt: new Date(),
			})
			.where(eq(matchSets.id, id));
	});

export const startMatchMutationOptions = (
	data: z.infer<typeof findMatchSetSchema>,
) =>
	mutationOptions({
		mutationFn: async () => {
			return await startMatchFn({ data });
		},
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

		if (!matchSet) {
			throw notFound();
		}

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
	data: z.infer<typeof findMatchSetSchema>,
) =>
	mutationOptions({
		mutationFn: async () => {
			return await undoSetCompletedMatchFn({ data });
		},
	});

export const simulateMatchesSchema = selectTournamentDivisionSchema.pick({
	tournamentId: true,
});

export const simulateMatchesFn = createServerFn()
	.middleware([
		requirePermissions({
			tournament: ["update"],
		}),
	])
	.inputValidator(simulateMatchesSchema)
	.handler(async ({ data: { tournamentId } }) => {
		const divisions = await db._query.tournamentDivisions.findMany({
			with: {
				pools: {
					with: {
						matches: {
							with: {
								sets: {
									where: (t, { not, eq }) => not(eq(t.status, "completed")),
								},
							},
						},
					},
				},
				// playoffMatches: {
				// 	with: {
				// 		sets: {
				// 			where: (t, { not, eq }) => not(eq(t.status, "completed")),
				// 		},
				// 	},
				// },
			},
			where: (t, { eq }) => eq(t.tournamentId, tournamentId),
		});

		const poolMatchUpdates: (Omit<UpdatePoolMatch, "id"> & { id: number })[] =
			[];
		// const playoffMatchUpdates: (Omit<UpdatePlayoffMatch, "id"> & {
		// 	id: number;
		// })[] = [];
		const setUpdates: (Omit<UpdateMatchSet, "id"> & { id: number })[] = [];

		for (const division of divisions) {
			// Simulate pool matches
			for (const pool of division.pools) {
				for (const match of pool.matches) {
					let aWins = 0;
					let bWins = 0;

					for (const set of match.sets) {
						const teamAWins = random(0, 1) === 0;

						if (teamAWins) {
							aWins += 1;
						} else {
							bWins += 1;
						}

						const teamAScore = teamAWins
							? set.winScore
							: random(0, set.winScore - 2);
						const teamBScore = !teamAWins
							? set.winScore
							: random(0, set.winScore - 2);

						setUpdates.push({
							id: set.id,
							teamAScore,
							teamBScore,
							winnerId: teamAWins ? match.teamAId : match.teamBId,
							status: "completed",
							startedAt: new Date(),
							endedAt: new Date(),
						});
					}

					poolMatchUpdates.push({
						id: match.id,
						winnerId: aWins > bWins ? match.teamAId : match.teamBId,
						status: "completed",
					});
				}
			}

			// // Simulate playoff matches
			// for (const match of division.playoffMatches) {
			// 	// Skip if either team is not assigned yet
			// 	if (!match.teamAId || !match.teamBId) {
			// 		continue;
			// 	}

			// 	let aWins = 0;
			// 	let bWins = 0;

			// 	for (const set of match.sets) {
			// 		const teamAWins = random(0, 1) === 0;

			// 		if (teamAWins) {
			// 			aWins += 1;
			// 		} else {
			// 			bWins += 1;
			// 		}

			// 		const teamAScore = teamAWins
			// 			? set.winScore
			// 			: random(0, set.winScore - 2);
			// 		const teamBScore = !teamAWins
			// 			? set.winScore
			// 			: random(0, set.winScore - 2);

			// 		setUpdates.push({
			// 			id: set.id,
			// 			teamAScore,
			// 			teamBScore,
			// 			winnerId: teamAWins ? match.teamAId : match.teamBId,
			// 			status: "completed",
			// 			startedAt: new Date(),
			// 			endedAt: new Date(),
			// 		});
			// 	}

			// 	playoffMatchUpdates.push({
			// 		id: match.id,
			// 		winnerId: aWins > bWins ? match.teamAId : match.teamBId,
			// 		status: "completed",
			// 	});
			// }
		}

		await db.transaction(async (txn) => {
			await Promise.all(
				setUpdates.map(({ id, ...values }) =>
					txn.update(matchSets).set(values).where(eq(matchSets.id, id)),
				),
			);

			await Promise.all(
				poolMatchUpdates.map(({ id, ...values }) =>
					txn.update(poolMatches).set(values).where(eq(poolMatches.id, id)),
				),
			);

			// await Promise.all(
			// 	playoffMatchUpdates.map(({ id, ...values }) =>
			// 		txn
			// 			.update(playoffMatches)
			// 			.set(values)
			// 			.where(eq(playoffMatches.id, id)),
			// 	),
			// );
		});
	});

export const simulateMatchesMutationOptions = () =>
	mutationOptions({
		mutationFn: async (data: z.infer<typeof simulateMatchesSchema>) => {
			return await simulateMatchesFn({ data });
		},
	});

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
