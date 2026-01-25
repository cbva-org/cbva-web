import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { db } from "@/db/connection";

export const getSettings = createServerFn({
	method: "GET",
}).handler(() => {
	return db.query.settings.findMany({
		orderBy: {
			label: "asc",
		},
	});
});

export const getSettingsQueryOptions = (key: string | null = null) =>
	queryOptions({
		queryKey: ["getSettings", key],
		queryFn: () => getSettings(),
	});
