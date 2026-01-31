import {
	mutationOptions,
	queryOptions,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { linkOptions, notFound, useRouterState } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { eq, sql } from "drizzle-orm";
import z from "zod";
import { authMiddleware, requirePermissions, requireRole } from "@/auth/shared";
import { db } from "@/db/connection";
import {
	publicProfileColumns,
	selectVenueSchema,
	updateVenueSchema,
	venues,
} from "@/db/schema";

async function readVenues() {
	return await db.query.venues.findMany({
		where: { status: "active" },
		orderBy: (venues, { asc }) => [asc(venues.order), asc(venues.name)],
	});
}

const getVenues = createServerFn({
	method: "GET",
}).handler(() => readVenues());

export const venuesQueryOptions = () =>
	queryOptions({
		queryKey: ["venues"],
		queryFn: () => getVenues(),
	});

export function useVenueFilterOptions(link?: boolean) {
	const { location } = useRouterState();

	const { data: venues } = useSuspenseQuery({
		...venuesQueryOptions(),
		select: (data) =>
			data.map(({ id, name, city }) => ({
				value: id,
				display: `${name}, ${city}`,
				link: link
					? linkOptions({
							to: location.pathname,
							search: (search) => {
								const values = search.venues ?? [];

								return {
									...search,
									page: 1,
									venues: values.includes(id)
										? values.filter((v) => v !== id)
										: values.concat(id),
								};
							},
						})
					: undefined,
			})),
	});

	return venues;
}

export const updateVenueFnSchema = updateVenueSchema
	.pick({
		directions: true,
		description: true,
		headerImageSource: true,
		thumbnailImageSource: true,
	})
	.extend({
		id: z.number(),
	});

export const updateVenueFn = createServerFn({ method: "POST" })
	.middleware([
		requirePermissions({
			venues: ["update"],
		}),
	])
	.inputValidator(updateVenueFnSchema)
	.handler(async ({ data: { id, ...values } }) => {
		await db.update(venues).set(values).where(eq(venues.id, id));
	});

export const updateVenueMutationOptions = () =>
	mutationOptions({
		mutationFn: async (input: z.infer<typeof updateVenueFnSchema>) => {
			return updateVenueFn({ data: input });
		},
	});

export const getVenue = createServerFn({
	method: "GET",
})
	.middleware([authMiddleware])
	.inputValidator(selectVenueSchema.pick({ id: true }))
	.handler(async ({ data: { id }, context: { viewer } }) => {
		const venue = await db._query.venues.findFirst({
			with: {
				directors: {
					with: {
						director: {
							with: {
								profile: {
									columns: publicProfileColumns,
								},
							},
						},
					},
				},
			},
			where: (venues, { and, eq }) => {
				const filters = [eq(venues.id, id)];

				if (viewer?.role === "admin") {
					filters.push(eq(venues.status, "active"));
				}

				return and(...filters);
			},
			orderBy: (venues, { asc }) => asc(venues.city),
		});

		if (!venue) {
			throw notFound();
		}

		return venue;
	});

export const venueQueryOptions = (id: number) =>
	queryOptions({
		queryKey: ["venue", id],
		queryFn: () => getVenue({ data: { id } }),
	});

const getAdminVenues = createServerFn({
	method: "GET",
})
	.middleware([requireRole(["admin"])])
	.handler(async () => {
		return await db.query.venues.findMany({
			columns: {
				id: true,
				name: true,
				city: true,
				status: true,
				order: true,
			},
			orderBy: (v, { asc }) => [
				// Active venues with order set come first
				asc(
					sql`CASE WHEN ${v.status} = 'active' AND ${v.order} > 0 THEN 0 ELSE 1 END`,
				),
				// Then by order value for active ordered venues
				asc(
					sql`CASE WHEN ${v.status} = 'active' AND ${v.order} > 0 THEN ${v.order} ELSE NULL END`,
				),
				// Then alphabetically
				asc(v.name),
			],
		});
	});

export const adminVenuesQueryOptions = () =>
	queryOptions({
		queryKey: ["admin", "venues"],
		queryFn: () => getAdminVenues(),
	});

export const adminUpdateVenueStatusSchema = z.object({
	id: z.number(),
	status: z.enum(["active", "hidden"]),
});

export const adminUpdateVenueStatusFn = createServerFn({ method: "POST" })
	.middleware([requireRole(["admin"])])
	.inputValidator(adminUpdateVenueStatusSchema)
	.handler(async ({ data: { id, status } }) => {
		await db.update(venues).set({ status }).where(eq(venues.id, id));
		return { success: true };
	});

export const adminUpdateVenueStatusMutationOptions = () =>
	mutationOptions({
		mutationFn: async (data: z.infer<typeof adminUpdateVenueStatusSchema>) => {
			return adminUpdateVenueStatusFn({ data });
		},
	});
