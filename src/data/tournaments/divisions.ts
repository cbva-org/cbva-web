import { mutationOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import z from "zod";
import { requirePermissions } from "@/auth/shared";
import {
	createTournamentDivisionSchema,
	selectTournamentDivisionSchema,
} from "@/db/schema";

export const upsertTournamentDivisionSchema =
	createTournamentDivisionSchema.extend({
		id: z.number().optional(),
	});

export const upsertTournamentDivisionFn = createServerFn()
	.middleware([
		requirePermissions({
			tournament: ["update"],
		}),
	])
	.inputValidator(upsertTournamentDivisionSchema)
	.handler(async ({ data: { id: tournamentDivisionId, ...data } }) => {
		// ...
		console.log(tournamentDivisionId, data);
		// ...
	});

export const upsertTournamentDivisionMutationOptions = () =>
	mutationOptions({
		mutationFn: (data: z.infer<typeof upsertTournamentDivisionSchema>) =>
			upsertTournamentDivisionFn({ data }),
	});

export const removeTournamentDivisionSchema =
	selectTournamentDivisionSchema.pick({
		id: true,
	});

export const removeTournamentDivisionFn = createServerFn()
	.middleware([
		requirePermissions({
			tournament: ["update"],
		}),
	])
	.inputValidator(removeTournamentDivisionSchema)
	.handler(async ({ data: { id: tournamentDivisionId } }) => {
		console.log(tournamentDivisionId);
	});

export const removeTournamentDivisionMutationOptions = () =>
	mutationOptions({
		mutationFn: (data: z.infer<typeof removeTournamentDivisionSchema>) =>
			removeTournamentDivisionFn({ data }),
	});
