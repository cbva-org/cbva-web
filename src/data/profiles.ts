import {
	queryOptions,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";
import { notFound } from "@tanstack/react-router";
import { createServerFn, useServerFn } from "@tanstack/react-start";
import { round } from "lodash-es";
import { titleCase } from "title-case";
import z from "zod";
import type { Viewer } from "@/auth";
import { getViewer } from "@/auth/server";
import { requireAuthenticated } from "@/auth/shared";
import { db } from "@/db/connection";
import {
	type CreatePlayerProfile,
	createPlayerProfileSchema,
	playerProfiles,
	selectPlayerProfileSchema,
	updatePlayerProfileSchema,
} from "@/db/schema/player-profiles";
import { genderSchema } from "@/db/schema/shared";
import { getTournamentDivisionDisplay } from "@/hooks/tournament";
import { isNotNull, isNotNullOrUndefined } from "@/utils/types";

async function readViewerProfiles(userId: Viewer["id"]) {
	return await db.query.playerProfiles.findMany({
		where: (t, { eq }) => eq(t.userId, userId),
	});
}

const getViewerProfiles = createServerFn({
	method: "GET",
}).handler(async () => {
	const viewer = await getViewer();

	if (!viewer) {
		throw new Error("UNAUTHENTICATED");
	}

	return await readViewerProfiles(viewer.id);
});

export const viewerProfileQueryOptions = () =>
	queryOptions({
		queryKey: ["viewer_profiles"],
		queryFn: () => getViewerProfiles(),
	});

export const insertPlayerProfileFn = createServerFn({ method: "POST" })
	.inputValidator(createPlayerProfileSchema)
	.handler(async ({ data }) => {
		const viewer = await getViewer();

		if (!viewer) {
			throw new Error("UNAUTHENTICATED");
		}

		await db.insert(playerProfiles).values({
			...data,
			userId: viewer.id,
		});
	});

export function useInsertPlayerProfile() {
	const mutationFn = useServerFn(insertPlayerProfileFn);
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (input: CreatePlayerProfile) => {
			return mutationFn({ data: input });
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["viewer_profiles"],
			});
		},
	});
}

async function readProfile(id: number, viewerId: Viewer["id"]) {
	const result = await db.query.playerProfiles.findFirst({
		where: (t, { eq, and }) => and(eq(t.id, id), eq(t.userId, viewerId)),
	});

	if (!result) {
		throw notFound();
	}

	return result;
}

const getProfile = createServerFn({
	method: "GET",
})
	.middleware([requireAuthenticated])
	.inputValidator(selectPlayerProfileSchema.pick({ id: true }))
	.handler(async ({ data: { id } }) => {
		const viewer = await getViewer();

		if (!viewer) {
			throw new Error("UNAUTHENTICATED");
		}

		return await readProfile(id, viewer.id);
	});

export const profileQueryOptions = (id: number) =>
	queryOptions({
		queryKey: ["profile", id],
		queryFn: () => getProfile({ data: { id } }),
	});

const getProfileOverview = createServerFn({
	method: "GET",
})
	.inputValidator(selectPlayerProfileSchema.pick({ id: true }))
	.handler(async ({ data: { id } }) => {
		const result = await db.query.playerProfiles.findFirst({
			columns: {
				id: true,
				userId: true,
				firstName: true,
				preferredName: true,
				lastName: true,
				imageSource: true,
				ratedPoints: true,
				juniorsPoints: true,
				rank: true,
				bio: true,
				heightFeet: true,
				heightInches: true,
				dominantArm: true,
				preferredRole: true,
				preferredSide: true,
				club: true,
				highSchoolGraduationYear: true,
				collegeTeam: true,
				collegeTeamYearsParticipated: true,
			},
			with: {
				level: true,
			},
			where: (t, { eq }) => eq(t.id, id),
		});

		if (!result) {
			throw notFound();
		}

		return result;
	});

export const profileOverviewQueryOptions = (id: number) =>
	queryOptions({
		queryKey: ["profile", id],
		queryFn: () => getProfileOverview({ data: { id } }),
	});

const getProfileResults = createServerFn({
	method: "GET",
})
	.inputValidator(selectPlayerProfileSchema.pick({ id: true }))
	.handler(async ({ data: { id } }) => {
		const result = await db.query.teamPlayers.findMany({
			with: {
				team: {
					with: {
						players: {
							with: {
								profile: true,
							},
							where: (t, { eq, not }) => not(eq(t.playerProfileId, id)),
						},
						tournamentDivisionTeams: {
							with: {
								tournamentDivision: {
									with: {
										division: true,
										tournament: true,
									},
								},
							},
							where: (t, { eq }) => eq(t.status, "confirmed"),
						},
					},
				},
			},
			where: (t, { eq }) => eq(t.playerProfileId, id),
		});

		const venues = await db.query.venues.findMany({
			where: (t, { inArray }) =>
				inArray(
					t.id,
					result.flatMap((t) =>
						t.team.tournamentDivisionTeams.map(
							({ tournamentDivision }) => tournamentDivision.tournament.venueId,
						),
					),
				),
		});

		const venuesMap = new Map(
			venues.map(({ id, name, city }) => [id, `${name}, ${city}`]),
		);

		return result
			.filter((data) =>
				data.team.tournamentDivisionTeams.some(
					(team) => team.status === "confirmed",
				),
			)
			.flatMap((t) =>
				t.team.tournamentDivisionTeams.map((tdt) => {
					return {
						id: tdt.id,
						date: tdt.tournamentDivision.tournament.date,
						event:
							tdt.tournamentDivision.tournament.name ??
							getTournamentDivisionDisplay(tdt.tournamentDivision),
						venue: venuesMap.get(tdt.tournamentDivision.tournament.venueId),
						division: ["unrated", "open"].includes(
							tdt.tournamentDivision.division.name,
						)
							? titleCase(tdt.tournamentDivision.division.name)
							: (tdt.tournamentDivision.division.name.toUpperCase() ?? "-"),
						players: t.team.players, //.map(({ profile }) => profile),
						finish: tdt.finish,
						rating: tdt.ratingEarned?.toUpperCase() ?? "-",
						points: tdt.pointsEarned ? round(tdt.pointsEarned) : "-",
					};
				}),
			);
	});

export const profileResultsQueryOptions = (id: number) =>
	queryOptions({
		queryKey: ["profile_results", id],
		queryFn: () => getProfileResults({ data: { id } }),
	});

export const updatePlayerProfileFn = createServerFn({ method: "POST" })
	.inputValidator(updatePlayerProfileSchema)
	.handler(async ({ data }) => {
		const viewer = await getViewer();

		if (!viewer) {
			throw new Error("UNAUTHENTICATED");
		}

		const {
			preferredName,
			gender,
			bio,
			imageSource,
			heightFeet,
			heightInches,
			dominantArm,
			preferredRole,
			preferredSide,
			club,
			highSchoolGraduationYear,
			collegeTeam,
			collegeTeamYearsParticipated,
		} = data;

		const [result] = await db
			.update(playerProfiles)
			.set({
				preferredName,
				gender,
				bio,
				imageSource,
				heightFeet,
				heightInches,
				dominantArm,
				preferredRole,
				preferredSide,
				club,
				highSchoolGraduationYear,
				collegeTeam,
				collegeTeamYearsParticipated,
			})
			.returning({
				id: playerProfiles.id,
			});

		return result;
	});

export function useUpdatePlayerProfile() {
	const mutationFn = useServerFn(updatePlayerProfileFn);
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (input: CreatePlayerProfile) => {
			return mutationFn({ data: input });
		},
		onSuccess: (data) => {
			queryClient.invalidateQueries({
				queryKey: ["viewer_profiles"],
			});

			queryClient.invalidateQueries({
				queryKey: ["profile", data.id],
			});
		},
	});
}

export const searchProfilesSchema = z.object({
	name: z.string().min(3),
	gender: genderSchema.optional(),
	levels: z.array(z.number().nonoptional()).optional(),
});

export const searchProfiles = createServerFn({
	method: "GET",
})
	.inputValidator(searchProfilesSchema)
	.handler(async ({ data: { name, gender, levels } }) => {
		const profiles = await db.query.playerProfiles.findMany({
			limit: 25,
			where: (t, { and, ilike, eq, inArray, sql }) => {
				const filters = [
					ilike(
						sql`
            CASE
              WHEN ${t.preferredName} IS NOT NULL
              THEN ${t.preferredName} || ' ' || ${t.lastName}
              ELSE ${t.firstName} || ' ' || ${t.lastName}
            END
            `,
						`%${name}%`,
					),
					gender ? eq(t.gender, gender) : null,
					levels ? inArray(t.levelId, levels) : null,
				].filter(isNotNull);

				return and(...filters);
			},
		});

		return profiles;
	});

export const searchProfilesQueryOptions = (
	filter: z.infer<typeof searchProfilesSchema>,
	signal?: AbortSignal,
) =>
	queryOptions({
		queryKey: ["searchProfiles", JSON.stringify(filter)],
		queryFn: ({ signal: queryFnSignal }) =>
			searchProfiles({
				data: filter,
				signal: AbortSignal.any(
					[signal, queryFnSignal].filter(isNotNullOrUndefined),
				),
			}),
	});
