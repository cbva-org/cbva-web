import { db } from "@/db/connection";
import { matchRefs } from "@/db/schema";
import { badRequest } from "@/lib/responses";
import { isDefined } from "@/utils/types";
import { mutationOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import z from "zod";

export const abandonRefSchema = z.object({
	id: z.number().optional(),
	teamId: z.number().optional(),
});

export const abandonRef = createServerFn()
	.inputValidator(abandonRefSchema)
	.handler(async ({ data: { id, teamId } }) => {
		const filter = isDefined(teamId)
			? eq(matchRefs.teamId, teamId)
			: isDefined(id)
				? eq(matchRefs.id, id)
				: null;

		if (!filter) {
			throw badRequest("Must provide either `id` or `teamId`.");
		}

		await db
			.update(matchRefs)
			.set({
				abandoned: true,
			})
			.where(filter);

		return {
			success: true,
		};
	});

export const abandonRefMutationOptions = () =>
	mutationOptions({
		mutationFn: (data: z.infer<typeof abandonRefSchema>) =>
			abandonRef({ data }),
	});
