import { selectTournamentDivisionTeamSchema } from "@/db/schema";
import { mutationOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import z from "zod";

export const editSeedSchema = selectTournamentDivisionTeamSchema
	.pick({
		id: true,
	})
	.extend({
		seed: z.number(),
	});

export const editSeed = createServerFn()
	.inputValidator(editSeedSchema)
	.handler(({ data: { id, seed } }) => {
		console.log({ id, seed });

		// TODO: place the team at the desired seed and shift the teams currently with that seed or greater than by one

		return {
			success: true,
		};
	});

export const editSeedMutationOptions = () =>
	mutationOptions({
		mutationFn: (data: z.infer<typeof editSeedSchema>) => editSeed({ data }),
	});
