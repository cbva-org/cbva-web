import { eq } from "drizzle-orm";
import { RateLimiterRes } from "rate-limiter-flexible";
import { describe, expect, test, beforeEach } from "vitest";
import { db } from "@/db/connection";
import { rateLimiterFlexibleSchema } from "@/db/schema";
import { RateLimiterDrizzle } from "./rate-limiter-drizzle";

describe("RateLimiterDrizzle", () => {
	beforeEach(async () => {
		await db.delete(rateLimiterFlexibleSchema);
	});

	test("consumes points and tracks correctly", async () => {
		const limiter = new RateLimiterDrizzle({
			storeClient: db,
			schema: rateLimiterFlexibleSchema,
			keyPrefix: "test",
			points: 10,
			duration: 60,
			clearExpiredByTimeout: false,
		});

		const result = await limiter.consume("user-1", 1);

		expect(result.consumedPoints).toBe(1);
		expect(result.remainingPoints).toBe(9);
		expect(result.isFirstInDuration).toBe(true);
	});

	test("accumulates points across multiple consumes", async () => {
		const limiter = new RateLimiterDrizzle({
			storeClient: db,
			schema: rateLimiterFlexibleSchema,
			keyPrefix: "test",
			points: 10,
			duration: 60,
			clearExpiredByTimeout: false,
		});

		await limiter.consume("user-2", 3);
		const result = await limiter.consume("user-2", 2);

		expect(result.consumedPoints).toBe(5);
		expect(result.remainingPoints).toBe(5);
		expect(result.isFirstInDuration).toBe(false);
	});

	test("rejects when limit is exceeded", async () => {
		const limiter = new RateLimiterDrizzle({
			storeClient: db,
			schema: rateLimiterFlexibleSchema,
			keyPrefix: "test",
			points: 5,
			duration: 60,
			clearExpiredByTimeout: false,
		});

		await limiter.consume("user-3", 5);

		try {
			await limiter.consume("user-3", 1);
			expect.fail("Should have thrown");
		} catch (error) {
			expect(error).toBeInstanceOf(RateLimiterRes);
			const res = error as RateLimiterRes;
			expect(res.consumedPoints).toBe(6);
			expect(res.remainingPoints).toBe(0);
		}
	});

	test("resets points after duration expires", async () => {
		const limiter = new RateLimiterDrizzle({
			storeClient: db,
			schema: rateLimiterFlexibleSchema,
			keyPrefix: "test",
			points: 5,
			duration: 1, // 1 second
			clearExpiredByTimeout: false,
		});

		await limiter.consume("user-4", 5);

		// Wait for duration to expire
		await new Promise((resolve) => setTimeout(resolve, 1100));

		const result = await limiter.consume("user-4", 1);

		expect(result.consumedPoints).toBe(1);
		expect(result.remainingPoints).toBe(4);
		expect(result.isFirstInDuration).toBe(true);
	});

	test("get returns null for non-existent key", async () => {
		const limiter = new RateLimiterDrizzle({
			storeClient: db,
			schema: rateLimiterFlexibleSchema,
			keyPrefix: "test",
			points: 10,
			duration: 60,
			clearExpiredByTimeout: false,
		});

		const result = await limiter.get("nonexistent-key");

		expect(result).toBeNull();
	});

	test("get returns consumed points for existing key", async () => {
		const limiter = new RateLimiterDrizzle({
			storeClient: db,
			schema: rateLimiterFlexibleSchema,
			keyPrefix: "test",
			points: 10,
			duration: 60,
			clearExpiredByTimeout: false,
		});

		await limiter.consume("user-5", 3);

		const result = await limiter.get("user-5");

		expect(result).not.toBeNull();
		expect(result?.consumedPoints).toBe(3);
		expect(result?.remainingPoints).toBe(7);
	});

	test("delete removes rate limit record", async () => {
		const limiter = new RateLimiterDrizzle({
			storeClient: db,
			schema: rateLimiterFlexibleSchema,
			keyPrefix: "test",
			points: 10,
			duration: 60,
			clearExpiredByTimeout: false,
		});

		await limiter.consume("user-6", 5);

		const deleted = await limiter.delete("user-6");
		expect(deleted).toBe(true);

		const result = await limiter.get("user-6");
		expect(result).toBeNull();
	});

	test("delete returns false for non-existent key", async () => {
		const limiter = new RateLimiterDrizzle({
			storeClient: db,
			schema: rateLimiterFlexibleSchema,
			keyPrefix: "test",
			points: 10,
			duration: 60,
			clearExpiredByTimeout: false,
		});

		const deleted = await limiter.delete("nonexistent");

		expect(deleted).toBe(false);
	});

	test("uses keyPrefix for storage key", async () => {
		const limiter = new RateLimiterDrizzle({
			storeClient: db,
			schema: rateLimiterFlexibleSchema,
			keyPrefix: "myprefix",
			points: 10,
			duration: 60,
			clearExpiredByTimeout: false,
		});

		await limiter.consume("user-7", 1);

		const [record] = await db
			.select()
			.from(rateLimiterFlexibleSchema)
			.where(eq(rateLimiterFlexibleSchema.key, "myprefix:user-7"));

		expect(record).toBeDefined();
		expect(record.points).toBe(1);
	});

	test("throws error when schema is not provided", () => {
		expect(
			() =>
				new RateLimiterDrizzle({
					storeClient: db,
					schema: undefined as never,
					keyPrefix: "test",
					points: 10,
					duration: 60,
				}),
		).toThrow("Drizzle schema is required");
	});

	test("throws error when storeClient is not provided", () => {
		expect(
			() =>
				new RateLimiterDrizzle({
					storeClient: undefined as never,
					schema: rateLimiterFlexibleSchema,
					keyPrefix: "test",
					points: 10,
					duration: 60,
				}),
		).toThrow("Drizzle client is required");
	});

	test("isolates different key prefixes", async () => {
		const limiter1 = new RateLimiterDrizzle({
			storeClient: db,
			schema: rateLimiterFlexibleSchema,
			keyPrefix: "prefix1",
			points: 10,
			duration: 60,
			clearExpiredByTimeout: false,
		});

		const limiter2 = new RateLimiterDrizzle({
			storeClient: db,
			schema: rateLimiterFlexibleSchema,
			keyPrefix: "prefix2",
			points: 10,
			duration: 60,
			clearExpiredByTimeout: false,
		});

		await limiter1.consume("same-user", 5);
		const result = await limiter2.consume("same-user", 2);

		expect(result.consumedPoints).toBe(2);
		expect(result.remainingPoints).toBe(8);
	});

	test("block sets points above limit for specified duration", async () => {
		const limiter = new RateLimiterDrizzle({
			storeClient: db,
			schema: rateLimiterFlexibleSchema,
			keyPrefix: "test",
			points: 5,
			duration: 60,
			clearExpiredByTimeout: false,
		});

		const result = await limiter.block("user-8", 30);

		expect(result.consumedPoints).toBe(6); // points + 1
		expect(result.msBeforeNext).toBe(30000);

		// Should be blocked now
		try {
			await limiter.consume("user-8", 1);
			expect.fail("Should have thrown");
		} catch (error) {
			expect(error).toBeInstanceOf(RateLimiterRes);
		}
	});
});
