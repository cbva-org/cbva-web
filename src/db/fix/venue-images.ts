import { eq, inArray } from "drizzle-orm";
import { dbg } from "@/utils/dbg";
import { db } from "../connection";
import { venueDirectors, venues } from "../schema";

async function main() {
	const results = await db.query.venues.findMany({
		columns: {
			id: true,
			imageSource: true,
		},
	});

	const values = results
		.filter(({ tournaments }) => tournaments.length > 0)
		.flatMap(({ id: venueId, tournaments: [{ directors }] }) =>
			directors.map(({ directorId, order }) => ({
				venueId,
				directorId,
				order,
			})),
		);

	await db.insert(venueDirectors).values(values).onConflictDoNothing();

	process.exit(0);
}

await main();
