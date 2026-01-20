import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { db } from "@/db/connection";
import { isDefined } from "@/utils/types";
import { selectFaqSchema } from "@/db/schema";

export const getFaqsSchema = selectFaqSchema.pick({
	key: true,
});

export const getFaqs = createServerFn({
	method: "GET",
})
	.inputValidator(getFaqsSchema)
	.handler(async ({ data: { key } }) => {
		return await db.query.faqs.findMany({
			where: {
				key: key === null ? { isNull: true } : { eq: key },
			},
			orderBy: (t, { asc }) => [asc(t.order)],
		});
	});

export const getFaqsQueryOptions = (key: string | null = null) =>
	queryOptions({
		queryKey: ["getFaqs", key].filter(isDefined),
		queryFn: () => getFaqs({ data: { key } }),
	});
