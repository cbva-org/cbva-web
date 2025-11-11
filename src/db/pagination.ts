// Solution for paginated query with page info returned taken from this issue:
//
// - https://github.com/drizzle-team/drizzle-orm/issues/2403#issuecomment-3126072359
//
import { count, sql } from "drizzle-orm";
import type { DBQueryConfig } from "drizzle-orm/relations";
import type { KnownKeysOnly } from "drizzle-orm/utils";

import { db } from "./connection";

export interface PagingOptions {
	page: number;
	size: number;
}
type TableNames = keyof typeof db.query;
type Schema = NonNullable<typeof db._.schema>;
export type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

interface FindPagedOptions<
	TTableName extends TableNames,
	TConfig extends Omit<
		DBQueryConfig<"many", true, Schema, Schema[TTableName]>,
		"limit" | "offset"
	>,
> {
	paging: PagingOptions;
	config?: KnownKeysOnly<
		TConfig,
		Omit<
			DBQueryConfig<"many", true, Schema, Schema[TTableName]>,
			"limit" | "offset"
		>
	>;
	tx?: Transaction;
}

/**
 * Runs a findMany query with paging and returns the result and total count.
 *
 * Config is identical to the one used in `drizzle-orm` findMany, minus the limit and offset.
 */
export async function findPaged<
	TTableName extends TableNames,
	TConfig extends DBQueryConfig<"many", true, Schema, Schema[TTableName]>,
>(table: TTableName, options: FindPagedOptions<TTableName, TConfig>) {
	const { paging, config, tx } = options;
	const txOrDb = tx || db;
	const { with: _, ...countConfig } = config ?? {};
	const qCount = txOrDb.query[table].findMany({
		...countConfig,
		columns: { id: true },
	});

	const [result, countResult] = await Promise.all([
		txOrDb.query[table].findMany({
			...config,
			limit: paging.size,
			offset: paging.size * (paging.page - 1),
		} as KnownKeysOnly<
			TConfig,
			DBQueryConfig<"many", true, Schema, Schema[TTableName]>
		>),
		txOrDb.select({ totalCount: count() }).from(sql`${qCount}`),
	]);

	const totalItems = countResult?.[0]?.totalCount ?? 0;

	return {
		data: result,
		pageInfo: {
			totalItems,
			totalPages: Math.ceil(totalItems / paging.size),
		},
	};
}
