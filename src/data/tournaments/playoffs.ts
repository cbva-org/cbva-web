import { mutationOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { setResponseStatus } from "@tanstack/react-start/server";
import { eq } from "drizzle-orm";
import orderBy from "lodash/orderBy";
import z from "zod";
import { requirePermissions } from "@/auth/shared";
import { db } from "@/db/connection";
import {
	type CreateMatchSet,
	type CreatePlayoffMatch,
	matchSets,
	playoffMatches,
	pools,
	selectTournamentDivisionSchema,
} from "@/db/schema";
import type { PlayoffNode } from "@/lib/playoffs";
import { draftPlayoffs } from "@/lib/playoffs";
import { badRequest } from "@/lib/responses";
import { snake, snake2 } from "@/lib/snake-draft";

export type MatchKind = "set-to-21" | "set-to-28" | "best-of-3";

export const createPlayoffsSchema = selectTournamentDivisionSchema
	.pick({
		id: true,
	})
	.extend({
		count: z.number(),
		matchKind: z.enum<MatchKind[]>(["set-to-21", "set-to-28", "best-of-3"]),
		overwrite: z.boolean(),
	});

const createPlayoffsFn = createServerFn()
	.middleware([
		requirePermissions({
			tournament: ["update"],
		}),
	])
	.inputValidator(createPlayoffsSchema)
	.handler(
		async ({
			data: { id: tournamentDivisionId, count, matchKind, overwrite },
		}) => {
			const pools = await db.query.pools.findMany({
				with: {
					teams: {
						where: (t, { isNotNull }) => isNotNull(t.finish),
					},
				},
				where: (t, { eq }) => eq(t.tournamentDivisionId, tournamentDivisionId),
			});

			const teams = orderBy(
				pools.flatMap(({ name, teams }) =>
					teams.map((team) => ({
						id: team.id,
						finish: team.finish,
						pool: name,
					})),
				),
				["finish", "pool"],
				["asc", "asc"],
			);

			// const trimmedCount = count - (count % pools.length);
			// const roundedCount = trimmedCount - (trimmedCount % 2);

			const bracket = draftPlayoffs(pools, count);

			console.log(JSON.stringify(bracket, null, 2));

			// Generate playoffMatches from the bracket
			const matches = generatePlayoffMatchesFromBracket(
				bracket,
				tournamentDivisionId,
			);

			// Insert playoff matches into the database
			const matchInserts: CreatePlayoffMatch[] = [];
			if (overwrite) {
				// Delete existing playoff matches if overwrite is true
				await db
					.delete(playoffMatches)
					.where(eq(playoffMatches.tournamentDivisionId, tournamentDivisionId));
			}

			// console.log(matches);

			// if (matches.length > 0) {
			// 	matchInserts = await db
			// 		.insert(playoffMatches)
			// 		.values(matches)
			// 		.returning();
			// }

			return { success: true, matchesCreated: matchInserts.length };
		},
	);

function generatePlayoffMatchesFromBracket(
	bracket: PlayoffNode,
	tournamentDivisionId: number,
): CreatePlayoffMatch[] {
	const matches: CreatePlayoffMatch[] = [];

	let matchNumber = 1;

	function traverseNode(node: PlayoffNode, round: string): number | null {
		if (node.type === "team") {
			// Return the seed for team nodes
			return node.seed;
		}

		// For game nodes, recursively process both sides
		const aSeed = traverseNode(node.a, getNextRound(round));
		const bSeed = traverseNode(node.b, getNextRound(round));

		// Create a match for this game node
		const match: CreatePlayoffMatch = {
			tournamentDivisionId,
			round,
			matchNumber: matchNumber++,
			teamAPreviousMatchId: null,
			teamBPreviousMatchId: null,
			status: "scheduled",
		};

		matches.push(match);

		// Return the match number for parent nodes to reference
		return matchNumber - 1;
	}

	// Start traversal from the root node
	traverseNode(bracket, "Finals");

	return matches;
}

function getNextRound(round: string): string {
	const roundOrder = [
		"Finals",
		"Semifinals",
		"Quarterfinals",
		"Round of 16",
		"Round of 32",
	];

	const currentIndex = roundOrder.indexOf(round);

	return currentIndex >= 0 && currentIndex < roundOrder.length - 1
		? roundOrder[currentIndex + 1]
		: `Round ${roundOrder.length - currentIndex}`;
}

export const createPlayoffsMutationOptions = () =>
	mutationOptions({
		mutationFn: (data: z.infer<typeof createPlayoffsSchema>) =>
			createPlayoffsFn({ data }),
	});

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
