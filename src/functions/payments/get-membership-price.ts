import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { db } from "@/db/connection";

export const getMembershipPrice = createServerFn({
	method: "GET",
}).handler(async () => {
	return db.query.settings.findFirst({
		where: {
			key: "membership-price",
		},
	});
});

export const getMembershipPriceQueryOptions = () =>
	queryOptions({
		queryKey: ["getMembershipPrice"],
		queryFn: () => getMembershipPrice(),
	});
