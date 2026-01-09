import { mutationOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import type z from "zod";
import { requirePermissions } from "@/auth/shared";
import { selectTournamentSchema, tournaments } from "@/db/schema";
import { duplicateTournamentFn } from "@/data/schedule";
import { today } from "@internationalized/date";
import { getDefaultTimeZone } from "@/lib/dates";
import { db } from "@/db/connection";
import { and, eq } from "drizzle-orm";
import { assertFound, badRequest } from "@/lib/responses";

export const deleteDemoTournamentSchema = selectTournamentSchema.pick({
	id: true,
});

export const deleteDemoTournament = createServerFn()
	.middleware([
		requirePermissions({
			tournament: ["update"],
		}),
	])
	.inputValidator(deleteDemoTournamentSchema)
	.handler(async ({ data: { id } }) => {
		const tournament = await db.query.tournaments.findFirst({
			with: {
				directors: {
					with: {
						director: true,
					},
				},
			},
			where: (t, { eq }) => eq(t.id, id),
		});

		assertFound(tournament);

		if (!tournament.demo) {
			throw badRequest("Tournament is not a demo.");
		}

		if (true) {
			// ...
		}

		await db
			.delete(tournaments)
			.where(and(eq(tournaments.id, id), eq(tournaments.demo, true)));

		return {
			success: true,
			...res,
		};
	});

export const deleteDemoTournamentMuationOptions = () =>
	mutationOptions({
		mutationFn: (data: z.infer<typeof deleteDemoTournamentSchema>) =>
			deleteDemoTournament({ data }),
	});
