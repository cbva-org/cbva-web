import { db } from "@/db/connection";
import { findPaged, pagingOptionsSchema } from "@/db/pagination";
import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import z from "zod";
import { isNotNullOrUndefined } from "@/utils/types";
import { today } from "@internationalized/date";
import { getDefaultTimeZone } from "@/lib/dates";

const searchTournamentDivisionsSchema = z.object({
	divisionIds: z.array(z.number()).default([]),
	venueIds: z.array(z.number()).default([]),
	startDate: z.string().optional(),
	endDate: z.string().optional(),
	excludeIds: z.array(z.number()).default([]),
	paging: pagingOptionsSchema.default({ page: 1, size: 25 }),
});

export const searchTournamentDivisions = createServerFn({
	method: "GET",
})
	.inputValidator(searchTournamentDivisionsSchema)
	.handler(
		async ({
			data: { divisionIds, venueIds, startDate, endDate, excludeIds, paging },
		}) => {
			return findPaged(db, "tournamentDivisions", {
				paging,
				countColumn: "id",
				query: {
					where: {
						id:
							excludeIds.length > 0
								? {
										notIn: excludeIds,
									}
								: undefined,
						divisionId:
							divisionIds.length > 0
								? {
										in: divisionIds,
									}
								: undefined,
						tournament: {
							visible: true,
							demo: false,
							venueId:
								venueIds.length > 0
									? {
											in: venueIds,
										}
									: undefined,
							date: {
								gte: startDate ?? today(getDefaultTimeZone()).toString(),
								lte: endDate,
							},
						},
					},
					with: {
						tournament: {
							columns: {
								id: true,
								name: true,
								date: true,
								registrationOpenAt: true,
							},
							with: {
								venue: {
									columns: {
										id: true,
										name: true,
										city: true,
										slug: true,
									},
								},
							},
						},
						division: true,
					},
					orderBy: (td, { asc }) => asc(td.tournamentId),
				},
			});
		},
	);

export type SearchTournamentDivisionsInput = z.infer<
	typeof searchTournamentDivisionsSchema
>;

export const searchTournamentDivisionsQueryOptions = (
	data: SearchTournamentDivisionsInput,
) =>
	queryOptions({
		queryKey: [
			"searchTournamentDivisions",
			data.divisionIds?.join(","),
			data.venueIds?.join(","),
			data.startDate,
			data.endDate,
			data.excludeIds?.join(","),
			data.paging?.page,
			data.paging?.size,
		].filter(isNotNullOrUndefined),
		queryFn: () => searchTournamentDivisions({ data }),
	});
