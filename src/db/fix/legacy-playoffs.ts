import "dotenv/config";

import { eq } from "drizzle-orm";
import { createClient } from "gel";
import { db } from "../connection";
import { playoffMatches } from "../schema";

async function main() {
	console.log("connecting to legacy db...");

	const legacy = createClient({
		instanceName: "legacy",
	});

	console.log("connected");

	const legacyMatches = await legacy.query<{
		id: string;
		team_a: { id: string } | null;
		team_b: { id: string } | null;
	}>(`
		select PlayoffMatch {
			id,
			team_a: { id },
			team_b: { id }
		}
		filter exists .team_a or exists .team_b
	`);

	console.log(`found ${legacyMatches.length} playoff matches with teams`);

	let updated = 0;
	let notFound = 0;
	let teamNotFound = 0;

	for (const match of legacyMatches) {
		// Find the new playoff match by externalRef
		const newMatch = await db._query.playoffMatches.findFirst({
			where: (t, { eq }) => eq(t.externalRef, match.id),
		});

		if (!newMatch) {
			notFound += 1;
			console.log(`playoff match not found for legacy id ${match.id}`);
			continue;
		}

		let teamAId: number | null = null;
		let teamBId: number | null = null;

		// Find team A
		if (match.team_a) {
			const teamA = await db._query.tournamentDivisionTeams.findFirst({
				where: (t, { eq }) => eq(t.externalRef, match.team_a!.id),
			});

			if (teamA) {
				teamAId = teamA.id;
			} else {
				teamNotFound += 1;
				console.log(`team A not found for legacy id ${match.team_a.id}`);
			}
		}

		// Find team B
		if (match.team_b) {
			const teamB = await db._query.tournamentDivisionTeams.findFirst({
				where: (t, { eq }) => eq(t.externalRef, match.team_b!.id),
			});

			if (teamB) {
				teamBId = teamB.id;
			} else {
				teamNotFound += 1;
				console.log(`team B not found for legacy id ${match.team_b.id}`);
			}
		}

		// Update if we found at least one team
		if (teamAId !== null || teamBId !== null) {
			await db
				.update(playoffMatches)
				.set({
					...(teamAId !== null ? { teamAId } : {}),
					...(teamBId !== null ? { teamBId } : {}),
				})
				.where(eq(playoffMatches.id, newMatch.id));

			updated += 1;
		}
	}

	console.log(`updated ${updated} playoff matches`);
	console.log(`matches not found: ${notFound}`);
	console.log(`teams not found: ${teamNotFound}`);
}

await main();

process.exit(0);
