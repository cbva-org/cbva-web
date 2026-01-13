import { mutationOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import random from "lodash-es/random";
import type z from "zod";
import { requirePermissions } from "@/auth/shared";
import { db } from "@/db/connection";
import {
	matchSets,
	poolMatches,
	selectTournamentDivisionSchema,
	type UpdateMatchSet,
	type UpdatePoolMatch,
} from "@/db/schema";

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
