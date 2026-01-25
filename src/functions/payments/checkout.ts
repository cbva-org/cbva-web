import { requireAuthenticated } from "@/auth/shared";
import { db } from "@/db/connection";
import { invoices, memberships } from "@/db/schema";
import { settings } from "@/db/schema/settings";
import { getDefaultTimeZone } from "@/lib/dates";
import { postSale } from "@/services/usaepay";
import { today } from "@internationalized/date";
import { mutationOptions } from "@tanstack/react-query";
import { createServerFn, createServerOnlyFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import z from "zod";

export const cartSchema = z.object({
	memberships: z.array(z.number()).default([]),
});

export const checkoutSchema = z.object({
	billingInformation: z.object({
		firstName: z.string().nonempty(),
		lastName: z.string().nonempty(),
		address: z.array(z.string()).min(1).max(2),
		city: z.string().nonempty(),
		state: z.string().nonempty(),
		postalCode: z.string().nonempty(),
	}),
	paymentKey: z.string(),
	cart: cartSchema,
});

const createInvoice = createServerOnlyFn(
	async (purchaserId: string, transactionKey: string) => {
		const [invoice] = await db
			.insert(invoices)
			.values({
				transactionKey,
				purchaserId,
			})
			.returning({ id: invoices.id });

		return invoice.id;
	},
);

const createMemberships = createServerOnlyFn(
	async (invoiceId: number, profileIds: number[]) => {
		const validUntil = today(getDefaultTimeZone())
			.set({
				day: 1,
				month: 1,
			})
			.add({ years: 1 })
			.toString();

		await Promise.all(
			profileIds.map((profileId) =>
				db.insert(memberships).values({
					profileId,
					invoiceId,
					validUntil,
				}),
			),
		);
	},
);

const getMembershipPrice = createServerOnlyFn(async () => {
	const setting = await db
		.select({ value: settings.value })
		.from(settings)
		.where(eq(settings.key, "membership-price"))
		.then((rows) => rows[0]);

	if (!setting?.value) {
		throw new Error("Membership price not configured");
	}

	const price = Number(setting.value);

	if (Number.isNaN(price) || price <= 0) {
		throw new Error("Invalid membership price");
	}

	return price;
});

export const checkoutHandler = createServerOnlyFn(
	async (
		viewerId: string,
		data: z.infer<typeof checkoutSchema>,
	) => {
		const {
			paymentKey,
			billingInformation,
			cart: { memberships },
		} = data;

		if (memberships.length === 0) {
			throw new Error("No memberships in cart");
		}

		const membershipPrice = await getMembershipPrice();
		const amount = memberships.length * membershipPrice;

		const transaction = await postSale({
			paymentKey,
			amount,
			billingAddress: {
				firstName: billingInformation.firstName,
				lastName: billingInformation.lastName,
				street: billingInformation.address.filter(Boolean).join(", "),
				city: billingInformation.city,
				state: billingInformation.state,
				postalCode: billingInformation.postalCode,
			},
			description: `CBVA Membership (${memberships.length})`,
		});

		if (transaction.result_code !== "A") {
			throw new Error(transaction.error || `Payment declined: ${transaction.result}`);
		}

		const invoiceId = await createInvoice(viewerId, transaction.key);

		await createMemberships(invoiceId, memberships);

		return {
			success: true,
			transactionKey: transaction.key,
			refnum: transaction.refnum,
		};
	},
);

export const checkoutFn = createServerFn()
	.middleware([requireAuthenticated])
	.inputValidator(checkoutSchema)
	.handler(({ data, context: { viewer } }) => checkoutHandler(viewer.id, data));

export const checkoutMutationOptions = () =>
	mutationOptions({
		mutationFn: (data: z.infer<typeof checkoutSchema>) => checkoutFn({ data }),
	});
