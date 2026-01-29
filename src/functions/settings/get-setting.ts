import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { db } from "@/db/connection";
import { settingSchema } from "@/db/schema/settings";

const getSettingSchema = settingSchema.pick({ key: true });

export const getSetting = createServerFn({
	method: "GET",
})
	.inputValidator(getSettingSchema)
	.handler(({ data: { key } }) => {
		return db.query.settings.findFirst({
			where: { key },
		});
	});

export const getSettingQueryOptions = (key: string) =>
	queryOptions({
		queryKey: ["getSetting", key],
		queryFn: () => getSetting({ data: { key } }),
	});
