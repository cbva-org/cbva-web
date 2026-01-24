import { db } from "@/db/connection";
import { invoices, memberships } from "@/db/schema";
import { createProfiles, createUsers } from "@/tests/utils/users";
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, test, vi } from "vitest";
import type { TransactionResponse } from "@/services/usaepay";

const mockPostSale = vi.fn<() => Promise<TransactionResponse>>();

vi.mock("@/services/usaepay", () => ({
	postSale: (...args: unknown[]) => mockPostSale(...args),
}));

// Import after mocking
const { checkoutHandler } = await import("./checkout");

function createCheckoutInput(profileIds: number[]) {
	return {
		billingInformation: {
			firstName: "John",
			lastName: "Doe",
			address: ["123 Main St"],
			city: "Los Angeles",
			state: "CA",
			postalCode: "90001",
		},
		paymentKey: "test-payment-key",
		cart: {
			memberships: profileIds,
		},
	};
}

function createSuccessResponse(): TransactionResponse {
	return {
		type: "transaction",
		key: "txn-123",
		refnum: "ref-456",
		result_code: "A",
		result: "Approved",
		authcode: "AUTH123",
		auth_amount: 100,
	};
}

function createDeclinedResponse(): TransactionResponse {
	return {
		type: "transaction",
		key: "txn-123",
		refnum: "ref-456",
		result_code: "D",
		result: "Declined",
		authcode: "",
		auth_amount: 0,
		error: "Insufficient funds",
	};
}

describe("checkout", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test("creates memberships on successful payment", async () => {
		const [user] = await createUsers(db, 1);
		const profiles = await createProfiles(db, [
			{ userId: user.id },
			{ userId: user.id },
		]);
		const profileIds = profiles.map((p) => p.id);

		mockPostSale.mockResolvedValueOnce(createSuccessResponse());

		const result = await checkoutHandler(user.id, createCheckoutInput(profileIds));

		expect(result.success).toBe(true);
		expect(result.transactionKey).toBe("txn-123");
		expect(result.refnum).toBe("ref-456");

		// Verify invoice was created
		const [invoice] = await db
			.select()
			.from(invoices)
			.where(eq(invoices.purchaserId, user.id));

		expect(invoice).toBeDefined();
		expect(invoice.transactionKey).toBe("txn-123");

		// Verify memberships were created for each profile
		const createdMemberships = await db
			.select()
			.from(memberships)
			.where(eq(memberships.invoiceId, invoice.id));

		expect(createdMemberships).toHaveLength(2);
		expect(createdMemberships.map((m) => m.profileId).sort()).toEqual(
			profileIds.sort(),
		);
	});

	test("does not create memberships on declined payment", async () => {
		const [user] = await createUsers(db, 1);
		const profiles = await createProfiles(db, [{ userId: user.id }]);
		const profileIds = profiles.map((p) => p.id);

		mockPostSale.mockResolvedValueOnce(createDeclinedResponse());

		await expect(
			checkoutHandler(user.id, createCheckoutInput(profileIds)),
		).rejects.toThrow("Insufficient funds");

		// Verify no invoice was created for this user
		const userInvoices = await db
			.select()
			.from(invoices)
			.where(eq(invoices.purchaserId, user.id));

		expect(userInvoices).toHaveLength(0);

		// Verify no memberships were created for these profiles
		for (const profileId of profileIds) {
			const profileMemberships = await db
				.select()
				.from(memberships)
				.where(eq(memberships.profileId, profileId));

			expect(profileMemberships).toHaveLength(0);
		}
	});

	test("throws error when cart is empty", async () => {
		const [user] = await createUsers(db, 1);

		mockPostSale.mockResolvedValueOnce(createSuccessResponse());

		await expect(
			checkoutHandler(user.id, createCheckoutInput([])),
		).rejects.toThrow("No memberships in cart");

		// Verify postSale was never called
		expect(mockPostSale).not.toHaveBeenCalled();
	});

	test("calculates correct amount based on number of memberships", async () => {
		const [user] = await createUsers(db, 1);
		const profiles = await createProfiles(db, [
			{ userId: user.id },
			{ userId: user.id },
			{ userId: user.id },
		]);
		const profileIds = profiles.map((p) => p.id);

		mockPostSale.mockResolvedValueOnce(createSuccessResponse());

		await checkoutHandler(user.id, createCheckoutInput(profileIds));

		expect(mockPostSale).toHaveBeenCalledWith(
			expect.objectContaining({
				amount: 300, // 3 memberships * $100 each
				description: "CBVA Membership (3)",
			}),
		);
	});
});
