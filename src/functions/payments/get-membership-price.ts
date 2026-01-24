import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { db } from "@/db/connection";
import { today } from "@internationalized/date";
import { getDefaultTimeZone } from "@/lib/dates";

export const getMembershipPrice = createServerFn({
	method: "GET",
}).handler(async () => {
	const todaysDate = today(getDefaultTimeZone()).toString();

	return db.query.membershipPricing.findFirst({
		where: {
			effectiveStartDate: {
				lte: todaysDate,
			},
			effectiveEndDate: {
				gt: todaysDate,
			},
		},
	});
});

export const getMembershipPriceQueryOptions = () =>
	queryOptions({
		queryKey: ["getMembershipPrice"],
		queryFn: () => getMembershipPrice(),
	});
