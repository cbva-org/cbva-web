import {
	type QueryKey,
	queryOptions,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";
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
