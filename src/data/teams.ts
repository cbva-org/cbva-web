import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import z from "zod";
import { db } from "@/db/connection";
import { selectTournamentDivisionTeamSchema } from "@/db/schema";
import { teamStatusSchema } from "@/db/schema/shared";
import { isNotNullOrUndefined } from "@/utils/types";

const getTeamsSchema = selectTournamentDivisionTeamSchema
	.pick({ tournamentDivisionId: true })
	.extend({
		statusIn: z.array(teamStatusSchema).optional(),
	});

async function readTeams({
	tournamentDivisionId,
	statusIn,
}: z.infer<typeof getTeamsSchema>) {
	return await db.query.tournamentDivisionTeams.findMany({
		with: {
			team: {
				with: {
					players: {
						with: {
							profile: {
								with: {
									level: true,
								},
							},
						},
					},
				},
			},
			poolTeam: {
				with: {
					pool: true,
				},
			},
		},
		where: (t, { eq, and, or, inArray }) =>
			and(
				eq(t.tournamentDivisionId, tournamentDivisionId),
				statusIn
					? inArray(t.status, statusIn)
					: or(eq(t.status, "confirmed"), eq(t.status, "registered")),
			),
		orderBy: (t, { asc }) => [asc(t.finish), asc(t.seed)],
	});
}

export const getTeams = createServerFn({
	method: "GET",
})
	.inputValidator(getTeamsSchema)
	.handler(async ({ data }) => await readTeams(data));

export const teamsQueryOptions = ({
	tournamentDivisionId,
	statusIn,
}: z.infer<typeof getTeamsSchema>) =>
	queryOptions({
		queryKey: ["teams", tournamentDivisionId, statusIn?.join(":")].filter(
			isNotNullOrUndefined,
		),
		queryFn: () =>
			getTeams({
				data: {
					tournamentDivisionId,
					statusIn,
				},
			}),
	});
