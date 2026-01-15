import { mutationOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import z from "zod";
import { requirePermissions } from "@/auth/shared";
import {
	selectTournamentDivisionSchema,
	tournamentDivisions,
} from "@/db/schema";
import { db } from "@/db/connection";
import { eq } from "drizzle-orm";

export const updateDivisionSchema = selectTournamentDivisionSchema.pick({
	id: true,
	capacity: true,
	waitlistCapacity: true,
});

export const updateDivisionBatchSchema = z.object({
	divisions: z.array(updateDivisionSchema),
});

export const updateDivisionBatch = createServerFn()
	.middleware([
		requirePermissions({
			tournament: ["update"],
		}),
	])
	.inputValidator(updateDivisionBatchSchema)
	.handler(async ({ data: { divisions } }) => {
		await db.transaction(async (txn) => {
			await Promise.all(
				divisions.map(({ id, capacity, waitlistCapacity }) =>
					txn
						.update(tournamentDivisions)
						.set({ capacity, waitlistCapacity })
						.where(eq(tournamentDivisions.id, id)),
				),
			);
		});

		return {
			success: true,
		};
	});

export const updateDivisionBatchMutationOptions = () =>
	mutationOptions({
		mutationFn: (data: z.infer<typeof updateDivisionBatchSchema>) =>
			updateDivisionBatch({ data }),
	});
