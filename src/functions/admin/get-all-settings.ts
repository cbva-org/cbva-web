import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { db } from "@/db/connection";

export const getAllSettings = createServerFn({
	method: "GET",
}).handler(() => {
	return db.query.settings.findMany({
		orderBy: {
			label: "asc",
		},
	});
});

export const getAllSettingsQueryOptions = (key: string | null = null) =>
	queryOptions({
		queryKey: ["getAllSettings", key],
		queryFn: () => getAllSettings(),
	});
