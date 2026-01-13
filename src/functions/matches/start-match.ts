import { requireAuthenticated } from "@/auth/shared";
import { db } from "@/db/connection";
import { matchSets, selectMatchSetSchema } from "@/db/schema";
import { assertFound } from "@/lib/responses";
import { mutationOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import type z from "zod";

const startMatchSchema = selectMatchSetSchema.pick({
	id: true,
});

const startMatchFn = createServerFn()
	.middleware([requireAuthenticated])
	.inputValidator(startMatchSchema)
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
	data: z.infer<typeof startMatchSchema>,
) =>
	mutationOptions({
		mutationFn: async () => {
			return await startMatchFn({ data });
		},
	});
