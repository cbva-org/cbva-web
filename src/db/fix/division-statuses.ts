import "dotenv/config";

import { sql } from "drizzle-orm";
import { db } from "../connection";

/**
 * Script to set tournament_division.status for tournaments before 2026:
 * - If there is a tournament_division_team with a finish of 1st, then it is complete
 * - Otherwise it remains closed (default)
 */
async function main() {
	console.log("Updating tournament division statuses...");

	// Set status to 'complete' for divisions that have a team with finish = 1
	const result = await db.execute(sql`
		UPDATE tournament_divisions td
		SET status = 'complete'
		FROM tournaments t
		WHERE td.tournament_id = t.id
		AND t.date < '2026-01-01'
		AND EXISTS (
			SELECT 1 FROM tournament_division_teams tdt
			WHERE tdt.tournament_division_id = td.id
			AND tdt.finish = 1
		)
	`);

	console.log(`Updated divisions to 'complete'`);

	// Count how many were updated
	const stats = await db.execute<{ status: string; count: string }>(sql`
		SELECT
			status,
			COUNT(*) as count
		FROM tournament_divisions td
		JOIN tournaments t ON t.id = td.tournament_id
		WHERE t.date < '2026-01-01'
		GROUP BY status
	`);

	console.log("\nDivision status counts (for tournaments before 2026):");
	for (const row of stats) {
		console.log(`  ${row.status}: ${row.count}`);
	}
}

await main();

process.exit(0);
