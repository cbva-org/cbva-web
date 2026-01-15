import { db } from "@/db/connection";
import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import z from "zod";

export const getProfilesSchema = z.object({
	ids: z.array(z.number()),
});

export const getProfilesFn = createServerFn()
	.inputValidator(getProfilesSchema)
	.handler(({ data: { ids } }) => {
		return db.query.playerProfiles.findMany({
			where: {
				id: {
					in: ids,
				},
			},
		});
	});

export const getProfilesQueryOptions = (
	data: z.infer<typeof getProfilesSchema>,
) =>
	queryOptions({
		queryKey: ["getProfilesQueryOptions", JSON.stringify(data)],
		queryFn: () => getProfilesFn({ data }),
	});
