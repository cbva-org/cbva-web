import { and, eq, gt, isNull, lt, or, sql } from "drizzle-orm";
import {
	RateLimiterRes,
	RateLimiterStoreAbstract,
	type IRateLimiterStoreOptions,
} from "rate-limiter-flexible";
import type { rateLimiterFlexibleSchema } from "@/db/schema";
import type { db } from "@/db/connection";

const CLEANUP_INTERVAL_MS = 300000; // 5 minutes
const EXPIRED_THRESHOLD_MS = 3600000; // 1 hour

type DrizzleClient = typeof db;
type RateLimiterSchema = typeof rateLimiterFlexibleSchema;

interface RateLimiterDrizzleOptions extends IRateLimiterStoreOptions {
	storeClient: DrizzleClient;
	schema: RateLimiterSchema;
	clearExpiredByTimeout?: boolean;
}

/**
 * Custom RateLimiterDrizzle that statically imports drizzle-orm operators
 * to avoid the dynamic import issue in bundled environments.
 */
export class RateLimiterDrizzle extends RateLimiterStoreAbstract {
	private schema: RateLimiterSchema;
	private drizzleClient: DrizzleClient;
	private clearExpiredByTimeout: boolean;
	private _clearExpiredTimeoutId: ReturnType<typeof setTimeout> | null = null;

	constructor(opts: RateLimiterDrizzleOptions) {
		super(opts);

		if (!opts.schema) {
			throw new Error("Drizzle schema is required");
		}

		if (!opts.storeClient) {
			throw new Error("Drizzle client is required");
		}

		this.schema = opts.schema;
		this.drizzleClient = opts.storeClient;
		this.clearExpiredByTimeout = opts.clearExpiredByTimeout ?? true;

		if (this.clearExpiredByTimeout) {
			this._clearExpiredHourAgo();
		}
	}

	_getRateLimiterRes(
		_rlKey: string,
		changedPoints: number,
		result: { points: number; expire: Date | null },
	): RateLimiterRes {
		const res = new RateLimiterRes();

		res.isFirstInDuration = result.points === changedPoints;
		res.consumedPoints = result.points;
		res.remainingPoints = Math.max(this.points - res.consumedPoints, 0);
		res.msBeforeNext =
			result.expire !== null
				? Math.max(new Date(result.expire).getTime() - Date.now(), 0)
				: -1;

		return res;
	}

	async _upsert(
		key: string,
		points: number,
		msDuration: number,
		forceExpire = false,
	): Promise<{ points: number; expire: Date | null }> {
		const now = new Date();
		const newExpire = msDuration > 0 ? new Date(now.getTime() + msDuration) : null;

		const query = await this.drizzleClient.transaction(async (tx) => {
			const [existingRecord] = await tx
				.select()
				.from(this.schema)
				.where(eq(this.schema.key, key))
				.limit(1);

			const shouldUpdateExpire =
				forceExpire ||
				!existingRecord?.expire ||
				existingRecord?.expire <= now ||
				newExpire === null;

			const [data] = await tx
				.insert(this.schema)
				.values({
					key,
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

	async _get(
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

	async _delete(rlKey: string): Promise<boolean> {
		const [result] = await this.drizzleClient
			.delete(this.schema)
			.where(eq(this.schema.key, rlKey))
			.returning({ key: this.schema.key });

		return !!result?.key;
	}

	private _clearExpiredHourAgo(): void {
		if (this._clearExpiredTimeoutId) {
			clearTimeout(this._clearExpiredTimeoutId);
		}

		this._clearExpiredTimeoutId = setTimeout(async () => {
			try {
				await this.drizzleClient
					.delete(this.schema)
					.where(lt(this.schema.expire, new Date(Date.now() - EXPIRED_THRESHOLD_MS)));
			} catch (error) {
				console.warn("Failed to clear expired records:", error);
			}

			this._clearExpiredHourAgo();
		}, CLEANUP_INTERVAL_MS);

		this._clearExpiredTimeoutId.unref();
	}
}
