import { mutationOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import type z from "zod";
import { selectTournamentDivisionTeamSchema } from "@/db/schema";

export const editSeedSchema = selectTournamentDivisionTeamSchema.pick({
	id: true,
	seed: true,
});

export const editSeed = createServerFn()
	.inputValidator(editSeedSchema)
	.handler(async ({ data: { id: tournamentDivisionTeamId, seed } }) => {
		console.log({ tournamentDivisionTeamId, seed });

		return {
			success: true,
		};
	});

export const editSeedMutationOptions = () =>
	mutationOptions({
		mutationFn: (data: z.infer<typeof editSeedSchema>) => editSeed({ data }),
	});
