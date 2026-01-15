import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { db } from "@/db/connection";
import z from "zod";

async function readPlayoffs({
	tournamentDivisionId,
}: {
	tournamentDivisionId: number;
}) {
	// const a = await db._query.playoffMatches.findMany({
	//   with: {
	//     refs:
	//   }
	// })

	return await db.query.playoffMatches.findMany({
		with: {
			sets: true,
			teamA: {
				with: {
					poolTeam: {
						with: {
							pool: true,
						},
					},
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
				},
			},
			teamB: {
				with: {
					poolTeam: {
						with: {
							pool: true,
						},
					},
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
				},
			},
			refs: {
				with: {
					profile: true,
				},
				where: {
					abandoned: {
						OR: [
							{
								isNull: true,
							},
							{
								eq: false,
							},
						],
					},
				},
			},
		},
		where: { tournamentDivisionId },
		orderBy: (t, { asc }) => asc(t.matchNumber),
	});
}

export const getPlayoffsSchema = z.object({
	tournamentDivisionId: z.number(),
});

export const getPlayoffs = createServerFn({
	method: "GET",
})
	.inputValidator(getPlayoffsSchema)
	.handler(async ({ data }) => await readPlayoffs(data));

export const playoffsQueryOptions = ({
	tournamentDivisionId,
}: {
	tournamentDivisionId: number;
}) =>
	queryOptions({
		queryKey: ["playoffs", tournamentDivisionId].filter(Boolean),
		queryFn: () =>
			getPlayoffs({
				data: {
					tournamentDivisionId,
				},
			}),
	});
