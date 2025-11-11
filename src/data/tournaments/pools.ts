import { mutationOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { setResponseStatus } from "@tanstack/react-start/server";
import range from "lodash/range";
import z from "zod";
import { requirePermissions } from "@/auth/shared";
import { db } from "@/db/connection";
import {
	CreatePoolTeam,
	pools,
	poolTeams,
	selectTournamentDivisionSchema,
} from "@/db/schema";
import { snake } from "@/lib/snake-draft";
import { badRequest } from "@/lib/responses";
import { eq } from "drizzle-orm";

export const createPoolsSchema = selectTournamentDivisionSchema
	.pick({
		id: true,
	})
	.extend({
		count: z.number(),
		overwrite: z.boolean(),
	});

const createPoolsFn = createServerFn()
	.middleware([
		requirePermissions({
			tournament: ["update"],
		}),
	])
	.inputValidator(createPoolsSchema)
	.handler(async ({ data: { id: tournamentDivisionId, count, overwrite } }) => {
		const alphabet = "abcdefghijklmnopqrstuvwxyz";

		if (count > alphabet.length) {
			setResponseStatus(400);

			throw new Error("Pool count exceeds limit");
		}

		const createPoolsQuery = db
			.insert(pools)
			.values(
				range(0, count).map((i) => ({
					tournamentDivisionId,
					name: alphabet[i],
				})),
			)
			.returning({
				id: pools.id,
				name: pools.name,
			});

		if (overwrite) {
			await db
				.delete(pools)
				.where(eq(pools.tournamentDivisionId, tournamentDivisionId));
		}

		// TODO: maybe delete and let db clean up team assignments, games, etc
		const createdPools = await (overwrite
			? createPoolsQuery.onConflictDoNothing()
			: createPoolsQuery);

		const teams = await db.query.tournamentDivisionTeams.findMany({
			columns: {
				id: true,
				seed: true,
			},
			where: (t, { eq, and }) =>
				and(
					eq(t.tournamentDivisionId, tournamentDivisionId),
					eq(t.status, "confirmed"),
				),
			orderBy: (t, { asc }) => asc(t.seed),
		});

		const draft = snake(teams.length, createdPools.length);

		const poolTeamValues: CreatePoolTeam[] = [];

		for (const [poolIdx, pool] of draft.entries()) {
			for (const [seedIdx, seed] of pool.entries()) {
				const team = teams.find((team) => team.seed === seed);

				if (!team) {
					throw badRequest(
						"Missing team with seed. Have you calculated seeds yet?",
					);
				}

				poolTeamValues.push({
					teamId: team.id,
					poolId: createdPools[poolIdx].id,
					seed: seedIdx + 1,
				});
			}
		}

		await db.insert(poolTeams).values(poolTeamValues);
	});

export const createPoolsMutationOptions = () =>
	mutationOptions({
		mutationFn: (data: z.infer<typeof createPoolsSchema>) =>
			createPoolsFn({ data }),
	});
