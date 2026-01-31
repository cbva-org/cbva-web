import { mutationOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import z from "zod";
import { requirePermissions } from "@/auth/shared";
import { db } from "@/db/connection";
import { venues } from "@/db/schema";

export const setVenuesOrderSchema = z.object({
	order: z.array(z.number()),
});

export const setVenuesOrderFn = createServerFn()
	.inputValidator(setVenuesOrderSchema)
	.middleware([requirePermissions({ venues: ["update"] })])
	.handler(async ({ data: { order } }) => {
		await db.transaction((txn) =>
			Promise.all(
				order.map((id, i) =>
					txn.update(venues).set({ order: i }).where(eq(venues.id, id)),
				),
			),
		);

		return {
			success: true,
		};
	});

export const setVenuesOrderMutationOptions = () =>
	mutationOptions({
		mutationFn: (data: z.infer<typeof setVenuesOrderSchema>) =>
			setVenuesOrderFn({ data }),
	});
