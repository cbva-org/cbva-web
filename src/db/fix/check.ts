import "dotenv/config";

import { sql } from "drizzle-orm";
import { db } from "../connection";

async function main() {
	await db.execute(sql`select 1`);

	await db.query.playerProfiles.findFirst({
		with: {
			activeMembership: true,
		},
	});
}

await main();

process.exit(0);
