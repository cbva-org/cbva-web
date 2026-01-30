import "dotenv/config";

import { createClient } from "gel";
import { db } from "../connection";
import { runAllRollups } from "@/functions/ratings/rollup";

type Rating = "AAA" | "AA" | "A" | "B" | "Unrated" | "Novice";

interface LegacyUser {
	id: string;
	rating: Rating | null;
	rated_points: number;
	juniors_points: number;
	rank: number | null;
	gender: "Male" | "Female";
	first_name: string;
	last_name: string;
}

interface Discrepancy {
	legacyId: string;
	name: string;
	field: string;
	legacy: string | number | null;
	current: string | number | null;
}

// Map legacy rating enum to new level names
function mapRatingToLevel(rating: Rating | null): string | null {
	if (!rating) return null;

	const mapping: Record<Rating, string | null> = {
		AAA: "aaa",
		AA: "aa",
		A: "a",
		B: "b",
		Unrated: "unrated",
		Novice: null, // Novice means never played, maps to null level
	};

	return mapping[rating];
}

async function main() {
	console.log("Connecting to legacy EdgeDB...");

	const legacy = createClient({
		instanceName: "legacy",
		tlsSecurity: "insecure",
	});

	console.log("Connected to legacy DB");

	// Fetch all levels from the new database
	const allLevels = await db.query.levels.findMany();
	const levelIdToName = new Map(allLevels.map((l) => [l.id, l.name]));
	const levelNameToId = new Map(allLevels.map((l) => [l.name, l.id]));

	console.log("Fetching legacy users...");

	const legacyUsers = await legacy.query<LegacyUser>(`
		select User {
			id,
			rating,
			rated_points,
			juniors_points,
			rank,
			gender,
			first_name,
			last_name,
		}
	`);

	console.log(`Found ${legacyUsers.length} legacy users`);

	// Run the rollup on the new database first
	console.log("\nRunning rollup on current database...\n");
	await runAllRollups();
	console.log("\nRollup complete.\n");

	// Fetch all player profiles from new database
	console.log("Fetching current player profiles...");

	const currentProfiles = await db.query.playerProfiles.findMany({
		where: { externalRef: { isNotNull: true } },
		columns: {
			id: true,
			externalRef: true,
			levelId: true,
			ratedPoints: true,
			juniorsPoints: true,
			rank: true,
			firstName: true,
			lastName: true,
		},
	});

	console.log(`Found ${currentProfiles.length} current profiles`);

	// Create lookup map by externalRef
	const profilesByExternalRef = new Map(
		currentProfiles.map((p) => [p.externalRef, p]),
	);

	const discrepancies: Discrepancy[] = [];
	let matched = 0;
	let notFound = 0;

	for (const legacyUser of legacyUsers) {
		const currentProfile = profilesByExternalRef.get(legacyUser.id);

		if (!currentProfile) {
			notFound++;
			continue;
		}

		matched++;
		const name = `${legacyUser.first_name} ${legacyUser.last_name}`;

		// Compare rating/level
		const expectedLevelName = mapRatingToLevel(legacyUser.rating);
		const currentLevelName = currentProfile.levelId
			? levelIdToName.get(currentProfile.levelId)
			: null;

		if (expectedLevelName !== currentLevelName) {
			discrepancies.push({
				legacyId: legacyUser.id,
				name,
				field: "rating/level",
				legacy: legacyUser.rating,
				current: currentLevelName ?? null,
			});
		}

		// Compare rated_points (allow small floating point differences)
		const ratedPointsDiff = Math.abs(
			legacyUser.rated_points - currentProfile.ratedPoints,
		);
		if (ratedPointsDiff > 0.01) {
			discrepancies.push({
				legacyId: legacyUser.id,
				name,
				field: "rated_points",
				legacy: legacyUser.rated_points,
				current: currentProfile.ratedPoints,
			});
		}

		// Compare juniors_points
		const juniorsPointsDiff = Math.abs(
			legacyUser.juniors_points - currentProfile.juniorsPoints,
		);
		if (juniorsPointsDiff > 0.01) {
			discrepancies.push({
				legacyId: legacyUser.id,
				name,
				field: "juniors_points",
				legacy: legacyUser.juniors_points,
				current: currentProfile.juniorsPoints,
			});
		}

		// Compare rank (both null or both equal)
		if (legacyUser.rank !== currentProfile.rank) {
			// Allow rank differences due to clamping (current may have clamped ranks)
			const isClampedRank =
				currentProfile.rank !== null &&
				legacyUser.rank !== null &&
				currentProfile.rank < legacyUser.rank;

			if (!isClampedRank) {
				discrepancies.push({
					legacyId: legacyUser.id,
					name,
					field: "rank",
					legacy: legacyUser.rank,
					current: currentProfile.rank,
				});
			}
		}
	}

	// Summary
	console.log("\n=== COMPARISON SUMMARY ===\n");
	console.log(`Legacy users: ${legacyUsers.length}`);
	console.log(`Current profiles: ${currentProfiles.length}`);
	console.log(`Matched: ${matched}`);
	console.log(`Not found in current DB: ${notFound}`);
	console.log(`Discrepancies: ${discrepancies.length}`);

	if (discrepancies.length > 0) {
		console.log("\n=== DISCREPANCIES ===\n");

		// Group by field
		const byField = new Map<string, Discrepancy[]>();
		for (const d of discrepancies) {
			const existing = byField.get(d.field) ?? [];
			existing.push(d);
			byField.set(d.field, existing);
		}

		for (const [field, fieldDiscrepancies] of byField) {
			console.log(`\n--- ${field} (${fieldDiscrepancies.length} issues) ---`);

			// Show first 10 examples
			for (const d of fieldDiscrepancies.slice(0, 10)) {
				console.log(`  ${d.name}: legacy=${d.legacy}, current=${d.current}`);
			}

			if (fieldDiscrepancies.length > 10) {
				console.log(`  ... and ${fieldDiscrepancies.length - 10} more`);
			}
		}
	} else {
		console.log("\n✓ No discrepancies found!");
	}
}

await main();

process.exit(0);
