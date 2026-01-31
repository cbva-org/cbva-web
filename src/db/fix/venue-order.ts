import "dotenv/config";

import { eq } from "drizzle-orm";
import { db } from "../connection";
import { venues } from "../schema";

async function main() {
	const results = await db._query.venues.findMany({
		columns: {
			id: true,
			name: true,
			city: true,
		},
		where: (venues, { eq }) => eq(venues.status, "active"),
		orderBy: (venues, { asc }) => [asc(venues.city), asc(venues.name)],
	});

	console.log("Setting venue order based on city, name:");

	for (let i = 0; i < results.length; i++) {
		const venue = results[i];
		console.log(`  ${i}: ${venue.name}, ${venue.city}`);

		await db.update(venues).set({ order: i }).where(eq(venues.id, venue.id));
	}

	console.log(`Updated ${results.length} venues`);

	process.exit(0);
}

await main();
