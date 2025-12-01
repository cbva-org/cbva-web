import {
	type QueryKey,
	queryOptions,
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { linkOptions, useRouterState } from "@tanstack/react-router";
import { createServerFn, useServerFn } from "@tanstack/react-start";
import { requirePermissions } from "@/auth/shared";
import { db } from "@/db/connection";
import { type UpdateVenue, venues } from "@/db/schema";

async function readVenues() {
	return await db.query.venues.findMany({
		where: (venues, { eq }) => eq(venues.status, "active"),
		orderBy: (venues, { asc }) => asc(venues.city),
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

export const updateVenueFn = createServerFn({ method: "POST" })
	.middleware([
		requirePermissions({
			venues: ["update"],
		}),
	])
	.inputValidator(({ directions, description }: UpdateVenue) => ({
		directions,
		description,
	}))
	.handler(async ({ data }) => {
		await db.update(venues).set(data);
	});

export function useUpdateVenueFn() {
	return useServerFn(updateVenueFn);
}

export function useUpdateVenue(deps: QueryKey[] = []) {
	const mutationFn = useServerFn(updateVenueFn);
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (input: UpdateVenue) => {
			return mutationFn({ data: input });
		},
		onSuccess: () => {
			for (const key of deps) {
				queryClient.invalidateQueries({
					queryKey: key,
				});
			}
		},
	});
}
