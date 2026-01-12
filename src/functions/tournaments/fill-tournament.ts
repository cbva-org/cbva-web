import { requirePermissions } from "@/auth/shared";
import { db } from "@/db/connection";
import {
	levels,
	selectTournamentSchema,
	teamPlayers,
	teams,
	tournamentDivisionTeams,
} from "@/db/schema";
import { notFound } from "@/lib/responses";
import { mutationOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { eq, lte, sql } from "drizzle-orm";
import { chunk, shuffle } from "lodash-es";
import type z from "zod";

export const fillTournamentSchema = selectTournamentSchema.pick({
	id: true,
});

export async function fillTournament(tournamentId: number) {
	const tournament = await db.query.tournaments.findFirst({
		with: {
			tournamentDivisions: {
				with: {
					division: true,
					teams: true,
				},
			},
		},
		where: { id: tournamentId },
	});

	if (!tournament) {
		throw notFound();
	}

	for (const {
		id: tournamentDivisionId,
		capacity,
		teamSize,
		gender,
		division: { order },
		teams: existingTeams,
	} of tournament.tournamentDivisions) {
		const validLevelIds = (
			await db.select().from(levels).where(lte(levels.order, order))
		).map(({ id }) => id);

		const randomTeams = chunk(
			shuffle(
				await db._query.playerProfiles.findMany({
					where: (t, { inArray, and, eq }) =>
						and(inArray(t.levelId, validLevelIds), eq(t.gender, gender)),
					limit: (capacity - existingTeams.length) * teamSize,
				}),
			),
			2,
		);

		const createdTeams = await db
			.insert(teams)
			.values(
				randomTeams.map((players) => ({
					name: players.map(({ id }) => id).join(":"),
				})),
			)
			.returning({
				id: teams.id,
				name: teams.name,
			});

		const createdTeamMap = createdTeams.reduce<{ [key: string]: number }>(
			(memo, team) => {
				memo[team.name as string] = team.id;
				return memo;
			},
			{},
		);

		await db.insert(teamPlayers).values(
			randomTeams.flatMap((players) => {
				const teamId = createdTeamMap[players.map(({ id }) => id).join(":")];

				return players.map(({ id }) => ({
					teamId: teamId,
					playerProfileId: id,
				}));
			}),
		);

		// Get the highest order for this tournament division
		const maxOrderResult = await db
			.select({
				maxOrder: sql<number | null>`MAX(${tournamentDivisionTeams.order})`,
			})
			.from(tournamentDivisionTeams)
			.where(
				eq(
					tournamentDivisionTeams.tournamentDivisionId,
					tournamentDivisionId,
				),
			);

		const startOrder = (maxOrderResult[0]?.maxOrder ?? -1) + 1;

		await db.insert(tournamentDivisionTeams).values(
			createdTeams.map(({ id }, index) => ({
				tournamentDivisionId,
				teamId: id,
				status: "confirmed" as const,
				order: startOrder + index,
			})),
		);
	}
}

export const fillTournamentFn = createServerFn()
	.middleware([
		requirePermissions({
			tournament: ["update"],
		}),
	])
	.inputValidator(fillTournamentSchema)
	.handler(async ({ data: { id: tournamentId } }) => {
		await fillTournament(tournamentId);
	});

export const fillTournamentMutationOptions = () =>
	mutationOptions({
		mutationFn: (data: z.infer<typeof fillTournamentSchema>) =>
			fillTournamentFn({ data }),
	});
