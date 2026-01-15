import { db } from "@/db/connection";
import { matchRefs } from "@/db/schema";
import { badRequest } from "@/lib/responses";
import { isDefined } from "@/utils/types";
import { mutationOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { eq, inArray } from "drizzle-orm";
import z from "zod";

export const removeRefSchema = z.object({
	ids: z.array(z.number()).optional(),
	teamId: z.number().optional().nullable(),
});

export const removeRef = createServerFn()
	.inputValidator(removeRefSchema)
	.handler(async ({ data: { ids, teamId } }) => {
		const filter = isDefined(teamId)
			? eq(matchRefs.teamId, teamId)
			: isDefined(ids)
				? inArray(matchRefs.id, ids)
				: null;

		if (!filter) {
			throw badRequest("Must provide either `id` or `teamId`.");
		}

		await db.delete(matchRefs).where(filter);

		return {
			success: true,
		};
	});

export const removeRefMutationOptions = () =>
	mutationOptions({
		mutationFn: (data: z.infer<typeof removeRefSchema>) => removeRef({ data }),
	});
