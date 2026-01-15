import { requireAuthenticated } from "@/auth/shared";
import { db } from "@/db/connection";
import { matchRefs, playoffMatches, poolMatches } from "@/db/schema";
import { badRequest } from "@/lib/responses";
import { mutationOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import z from "zod";

const setMatchRefsSchema = z.object({
	poolMatchId: z.number().optional(),
	playoffMatchId: z.number().optional(),
	clear: z.boolean(),
	profileIds: z.array(z.number()),
});

const setMatchRefsFn = createServerFn()
	.middleware([requireAuthenticated])
	.inputValidator(setMatchRefsSchema)
	.handler(
		async ({ data: { poolMatchId, playoffMatchId, profileIds, clear } }) => {
			const filter = poolMatchId
				? eq(poolMatches.id, poolMatchId)
				: playoffMatchId
					? eq(playoffMatches.id, playoffMatchId)
					: undefined;

			if (!filter) {
				throw badRequest(
					"Must provide either `poolMatchId` or `playoffMatchId`",
				);
			}

			if (clear) {
				await db.delete(matchRefs).where(filter);
			}

			await db.insert(matchRefs).values(
				profileIds.map((id) => ({
					profileId: id,
				})),
			);
		},
	);

export const setMatchRefsMutationOptions = (
	data: z.infer<typeof setMatchRefsSchema>,
) =>
	mutationOptions({
		mutationFn: async () => setMatchRefsFn({ data }),
	});
