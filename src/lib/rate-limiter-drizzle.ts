import { and, eq, gt, isNull, lt, or, sql } from "drizzle-orm";
import { RateLimiterRes } from "rate-limiter-flexible";
import type { rateLimiterFlexibleSchema } from "@/db/schema";
import type { db } from "@/db/connection";

const CLEANUP_INTERVAL_MS = 300000; // 5 minutes
const EXPIRED_THRESHOLD_MS = 3600000; // 1 hour

type DrizzleClient = typeof db;
type RateLimiterSchema = typeof rateLimiterFlexibleSchema;

export interface RateLimiterDrizzleOptions {
	storeClient: DrizzleClient;
	schema: RateLimiterSchema;
	keyPrefix?: string;
	points?: number;
	duration?: number;
	blockDuration?: number;
	clearExpiredByTimeout?: boolean;
}

/**
 * Custom RateLimiterDrizzle that statically imports drizzle-orm operators
 * to avoid the dynamic import issue in bundled environments.
 *
 * This is a standalone implementation that doesn't extend the abstract class
 * from rate-limiter-flexible, since that class is not exported.
 */
export class RateLimiterDrizzle {
	private schema: RateLimiterSchema;
	private drizzleClient: DrizzleClient;
	private clearExpiredByTimeout: boolean;
	private _clearExpiredTimeoutId: ReturnType<typeof setTimeout> | null = null;

	public keyPrefix: string;
	public points: number;
	public duration: number;
	public blockDuration: number;

	constructor(opts: RateLimiterDrizzleOptions) {
		if (!opts.schema) {
			throw new Error("Drizzle schema is required");
		}

		if (!opts.storeClient) {
			throw new Error("Drizzle client is required");
		}

		this.schema = opts.schema;
		this.drizzleClient = opts.storeClient;
		this.keyPrefix = opts.keyPrefix ?? "rlflx";
		this.points = opts.points ?? 4;
		this.duration = opts.duration ?? 1;
		this.blockDuration = opts.blockDuration ?? 0;
		this.clearExpiredByTimeout = opts.clearExpiredByTimeout ?? true;

		if (this.clearExpiredByTimeout) {
			this._clearExpiredHourAgo();
		}
	}

	/**
	 * Get the full key with prefix
	 */
	private getKey(key: string): string {
		return this.keyPrefix ? `${this.keyPrefix}:${key}` : key;
	}

	/**
	 * Create RateLimiterRes from store result
	 */
	private _getRateLimiterRes(
		changedPoints: number,
		result: { points: number; expire: Date | null },
	): RateLimiterRes {
		const consumedPoints = result.points;
		const remainingPoints = Math.max(this.points - consumedPoints, 0);
		const msBeforeNext =
			result.expire !== null
				? Math.max(new Date(result.expire).getTime() - Date.now(), 0)
				: -1;
		const isFirstInDuration = result.points === changedPoints;

		return new RateLimiterRes(
			remainingPoints,
			msBeforeNext,
			consumedPoints,
			isFirstInDuration,
		);
	}

	/**
	 * Upsert a rate limit record
	 */
	private async _upsert(
		rlKey: string,
		points: number,
		msDuration: number,
		forceExpire = false,
	): Promise<{ points: number; expire: Date | null }> {
		const now = new Date();
		const newExpire =
			msDuration > 0 ? new Date(now.getTime() + msDuration) : null;

		const query = await this.drizzleClient.transaction(async (tx) => {
			const [existingRecord] = await tx
				.select()
				.from(this.schema)
				.where(eq(this.schema.key, rlKey))
				.limit(1);

			const shouldUpdateExpire =
				forceExpire ||
				!existingRecord?.expire ||
				existingRecord?.expire <= now ||
				newExpire === null;

			const [data] = await tx
				.insert(this.schema)
				.values({
					key: rlKey,
					points,
					expire: newExpire,
				})
				.onConflictDoUpdate({
					target: this.schema.key,
					set: {
						points: !shouldUpdateExpire
							? sql`${this.schema.points} + ${points}`
							: points,
						...(shouldUpdateExpire && { expire: newExpire }),
					},
				})
				.returning();

			return data;
		});

		return query;
	}

	/**
	 * Get a rate limit record
	 */
	private async _get(
		rlKey: string,
	): Promise<{ points: number; expire: Date | null } | null> {
		const [response] = await this.drizzleClient
			.select()
			.from(this.schema)
			.where(
				and(
					eq(this.schema.key, rlKey),
					or(gt(this.schema.expire, new Date()), isNull(this.schema.expire)),
				),
			)
			.limit(1);

		return response || null;
	}

	/**
	 * Delete a rate limit record
	 */
	private async _delete(rlKey: string): Promise<boolean> {
		const [result] = await this.drizzleClient
			.delete(this.schema)
			.where(eq(this.schema.key, rlKey))
			.returning({ key: this.schema.key });

		return !!result?.key;
	}

	/**
	 * Consume points for a key
	 */
	async consume(key: string, pointsToConsume = 1): Promise<RateLimiterRes> {
		const rlKey = this.getKey(key);
		const msDuration = this.duration * 1000;

		const storeResult = await this._upsert(rlKey, pointsToConsume, msDuration);
		let res = this._getRateLimiterRes(pointsToConsume, storeResult);

		if (res.consumedPoints > this.points) {
			// Block if blockDuration is set and this is the first time exceeding
			if (
				this.blockDuration > 0 &&
				res.consumedPoints <= this.points + pointsToConsume
			) {
				const msBlockDuration = this.blockDuration * 1000;
				res = new RateLimiterRes(
					res.remainingPoints,
					msBlockDuration,
					res.consumedPoints,
					res.isFirstInDuration,
				);
				await this._upsert(rlKey, res.consumedPoints, msBlockDuration, true);
			}

			throw res;
		}

		return res;
	}

	/**
	 * Get current rate limit status for a key
	 */
	async get(key: string): Promise<RateLimiterRes | null> {
		const rlKey = this.getKey(key);
		const result = await this._get(rlKey);

		if (result === null) {
			return null;
		}

		return this._getRateLimiterRes(0, result);
	}

	/**
	 * Delete rate limit for a key
	 */
	async delete(key: string): Promise<boolean> {
		const rlKey = this.getKey(key);
		return this._delete(rlKey);
	}

	/**
	 * Block a key for a specified duration
	 */
	async block(key: string, secDuration: number): Promise<RateLimiterRes> {
		const rlKey = this.getKey(key);
		const msDuration = secDuration * 1000;

		await this._upsert(rlKey, this.points + 1, msDuration, true);

		return new RateLimiterRes(0, msDuration > 0 ? msDuration : -1, this.points + 1);
	}

	/**
	 * Clear expired records older than 1 hour
	 */
	private _clearExpiredHourAgo(): void {
		if (this._clearExpiredTimeoutId) {
			clearTimeout(this._clearExpiredTimeoutId);
		}

		this._clearExpiredTimeoutId = setTimeout(async () => {
			try {
				await this.drizzleClient
					.delete(this.schema)
					.where(
						lt(this.schema.expire, new Date(Date.now() - EXPIRED_THRESHOLD_MS)),
					);
			} catch (error) {
				console.warn("Failed to clear expired records:", error);
			}

			this._clearExpiredHourAgo();
		}, CLEANUP_INTERVAL_MS);

		this._clearExpiredTimeoutId.unref();
	}
}
