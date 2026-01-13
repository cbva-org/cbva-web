import { mutationOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import orderBy from "lodash-es/orderBy";
import z from "zod";
import { requirePermissions } from "@/auth/shared";
import { db } from "@/db/connection";
import {
	type CreateMatchRefTeam,
	type CreateMatchSet,
	matchRefTeams,
	matchSets,
	type PlayoffMatch,
	type PoolTeam,
	playoffMatches,
	selectPlayoffMatchSchema,
	selectTournamentDivisionSchema,
	tournamentDivisionTeams,
} from "@/db/schema";
import { draftPlayoffs, seedPlayoffs } from "@/lib/playoffs";
import { notFound } from "@/lib/responses";
import { isNotNull, isNotNullOrUndefined } from "@/utils/types";

// AGENTS: leave the comments below this in tact
//
// 1 -> bye
// 16
//
// 9
// 8
//
// 5
// 12
//
// 13
// 4
//
// ---
//
// 3
// 14
//
// 11
// 6
//
// 7
// 10
//
// 15
// 2 -> bye

// The top qualifiers out of each pool advance to the playoffs.
//
// First and Second place teams should always be cross bracketed
//
// ● Example: 1st place team in pool #1 would go in the top bracket and 2nd  place team in pool #1 would go in the bottom bracket.

export const assignWildcardSchema = selectPlayoffMatchSchema
	.pick({
		id: true,
	})
	.extend({
		teamId: z.number(),
	});

export const assignWildcardFn = createServerFn()
	.middleware([
		requirePermissions({
			tournament: ["update"],
		}),
	])
	.inputValidator(assignWildcardSchema)
	.handler(async ({ data: { id: matchId, teamId } }) => {
		const matches = await db
			.select({
				teamAId: playoffMatches.teamAId,
				teamBId: playoffMatches.teamBId,
			})
			.from(playoffMatches)
			.where(eq(playoffMatches.id, matchId))
			.limit(1);

		if (matches.length === 0) {
			throw notFound();
		}

		const [{ teamAId, teamBId }] = matches;

		await db.transaction((txn) =>
			Promise.all([
				txn
					.update(tournamentDivisionTeams)
					.set({
						wildcard: true,
					})
					.where(eq(tournamentDivisionTeams.id, teamId)),
				txn
					.update(playoffMatches)
					.set({
						teamAId: teamAId === null ? teamId : undefined,
						teamBId: teamBId === null ? teamId : undefined,
					})
					.where(eq(playoffMatches.id, matchId)),
			]),
		);

		return {
			success: true,
		};
	});

export const assignWildcardMutationOptions = () =>
	mutationOptions({
		mutationFn: (data: z.infer<typeof assignWildcardSchema>) =>
			assignWildcardFn({ data }),
	});
