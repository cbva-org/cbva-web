import { mutationOptions } from "@tanstack/react-query";
import { createServerFn, createServerOnlyFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import z from "zod";

import { requirePermissions } from "@/auth/shared";
import { db } from "@/db/connection";
import { playoffMatches, pools } from "@/db/schema";
import { isDefined } from "@/utils/types";
import { badRequest, internalServerError } from "@/lib/responses";

export const setMatchCourtSchema = z.object({
	poolId: z.number().optional(),
	playoffMatchId: z.number().optional(),
	court: z.string(),
	followWinnerInBracket: z.boolean().optional(),
});

export const setMatchCourtHandler = createServerOnlyFn(
	async ({
		playoffMatchId,
		poolId,
		court,
	}: z.infer<typeof setMatchCourtSchema>) => {
		if (!isDefined(playoffMatchId) && !isDefined(poolId)) {
			throw badRequest("Must provide either `playoffMatchId` or `poolId`.");
		}

		if (isDefined(poolId)) {
			await db
				.update(pools)
				.set({
					court,
				})
				.where(eq(pools.id, poolId));
		}

		if (!isDefined(playoffMatchId)) {
			throw internalServerError("boolean logic failed");
		}

		// TODO: find all matches where the winner would be the higher seed
		await db
			.update(playoffMatches)
			.set({
				court,
			})
			.where(eq(playoffMatches.id, playoffMatchId));

		return {
			success: true,
		};
	},
);

export const setMatchCourtFn = createServerFn()
	.middleware([
		requirePermissions({
			tournament: ["update"],
		}),
	])
	.inputValidator(setMatchCourtSchema)
	.handler(async ({ data }) => setMatchCourtHandler(data));

export const setMatchCourtMutationOptions = () =>
	mutationOptions({
		mutationFn: (data: z.infer<typeof setMatchCourtSchema>) =>
			setMatchCourtFn({ data }),
	});
