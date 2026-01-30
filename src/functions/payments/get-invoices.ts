import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { db } from "@/db/connection";
import { publicProfileColumns } from "@/db/schema";
import { isDefined } from "@/utils/types";
import z from "zod";
import { findPaged, pagingOptionsSchema } from "@/db/pagination";
import { requirePermissions } from "@/auth/shared";

export const getInvoicesSchema = z.object({
	transactionKey: z.string().optional().nullable(),
	pageInfo: pagingOptionsSchema,
});

export const getInvoices = createServerFn({
	method: "GET",
})
	.middleware([
		requirePermissions({
			invoices: ["read"],
		}),
	])
	.inputValidator(getInvoicesSchema)
	.handler(async ({ data: { transactionKey, pageInfo } }) => {
		return findPaged(db, "invoices", {
			paging: pageInfo,
			countColumn: "id",
			query: {
				where: {
					transactionKey: transactionKey ? transactionKey : undefined,
				},
				with: {
					purchaser: true,
					memberships: {
						with: {
							profile: {
								columns: publicProfileColumns,
							},
						},
					},
					tournamentRegistrations: true,
					teamRegistrations: {
						with: {
							team: {
								with: {
									players: {
										with: {
											profile: {
												columns: publicProfileColumns,
											},
										},
									},
								},
							},
							tournamentDivision: {
								with: {
									tournament: {
										with: {
											venue: true,
										},
									},
									division: true,
								},
							},
						},
					},
				},
			},
		});
	});

export const getInvoicesQueryOptions = (
	data: z.infer<typeof getInvoicesSchema>,
) =>
	queryOptions({
		queryKey: ["getInvoices", JSON.stringify(data)].filter(isDefined),
		queryFn: () => getInvoices({ data }),
	});
