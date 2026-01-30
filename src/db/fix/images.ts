import "dotenv/config";

import { eq } from "drizzle-orm";
import { db } from "../connection";
import { venues } from "../schema";

async function main() {
	const res = await db
		.select({
			id: venues.id,
			headerImageSource: venues.headerImageSource,
		})
		.from(venues);

	const fixed = res.map(({ id, headerImageSource }) => ({
		id,
		thumbnailImageSource: headerImageSource,
	}));

	await Promise.all(
		fixed.map(({ id, ...values }) =>
			db.update(venues).set(values).where(eq(venues.id, id)),
		),
	);

	process.exit(0);
}

await main();
