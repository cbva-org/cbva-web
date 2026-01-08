import { db } from "@/db/connection";
import {
	poolTeams,
	selectTournamentDivisionTeamSchema,
	tournamentDivisionTeams,
} from "@/db/schema";
import { mutationOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import z from "zod";
import { editSeedTransaction } from "./edit-seed";
import { notFound } from "@/lib/responses";
import { updatePoolTransaction } from "./update-pool";

export const promoteFromWaitlistSchema = selectTournamentDivisionTeamSchema
	.pick({
		id: true,
		seed: true,
	})
	.extend({
		poolId: z.number().optional().nullable(),
		poolSeed: z.number().optional().nullable(),
	});

export const promoteFromWaitlist = createServerFn()
	.inputValidator(promoteFromWaitlistSchema)
	.handler(async ({ data: { id, seed, poolId, poolSeed } }) => {
		const team = await db.query.tournamentDivisionTeams.findFirst({
			with: {
				poolTeam: true,
			},
			where: (t, { eq }) => eq(t.id, id),
		});

		if (!team) {
			throw notFound();
		}

		await db.transaction(async (txn) => {
			await txn
				.update(tournamentDivisionTeams)
				.set({
					status: "confirmed",
				})
				.where(eq(tournamentDivisionTeams.id, id));

			if (seed) {
				await editSeedTransaction(txn, team, seed, "division");
			}

			if (poolId) {
				await txn.insert(poolTeams).values({
					teamId: id,
					poolId,
				});

				await updatePoolTransaction(txn, team, poolId, poolSeed);
			}
		});

		return {
			success: true,
		};
	});

export const promoteFromWaitlistMutationOptions = () =>
	mutationOptions({
		mutationFn: (data: z.infer<typeof promoteFromWaitlistSchema>) =>
			promoteFromWaitlist({ data }),
	});
