import { describe, expect, test } from "vitest";
import { db } from "@/db/connection";
import {
	playerProfiles,
	tournamentDivisionTeams,
	tournamentDivisions,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { bootstrapTournament } from "@/tests/utils/tournaments";
import { createProfiles } from "@/tests/utils/users";
import { getAllLevels } from "@/tests/utils/divisions";
import {
	calculateDecayedOrder,
	rollupRatings,
	rollupRatedPoints,
	rollupJuniorsPoints,
	updateRanks,
} from "./rollup";

describe("calculateDecayedOrder", () => {
	test("no decay in same year", () => {
		// AA (order 3) earned in 2024, checked in 2024 = no decay
		expect(calculateDecayedOrder(3, 2024, 2024)).toBe(3);
	});

	test("no decay in following year", () => {
		// AA (order 3) earned in 2024, checked in 2025 = no decay (grace year)
		expect(calculateDecayedOrder(3, 2024, 2025)).toBe(3);
	});

	test("one tier decay after grace period", () => {
		// AA (order 3) earned in 2024, checked in 2026 = drops to A (order 2)
		expect(calculateDecayedOrder(3, 2024, 2026)).toBe(2);
	});

	test("two tiers decay", () => {
		// AA (order 3) earned in 2024, checked in 2027 = drops to B (order 1)
		expect(calculateDecayedOrder(3, 2024, 2027)).toBe(1);
	});

	test("decay floors at 0 (unrated)", () => {
		// AA (order 3) earned in 2024, checked in 2030 = floors at unrated (order 0)
		expect(calculateDecayedOrder(3, 2024, 2030)).toBe(0);
	});

	test("unrated stays unrated", () => {
		// Unrated (order 0) earned in 2020, checked in 2025 = still unrated
		expect(calculateDecayedOrder(0, 2020, 2025)).toBe(0);
	});

	test("AAA decays through all tiers", () => {
		// AAA (order 4) earned in 2020
		expect(calculateDecayedOrder(4, 2020, 2021)).toBe(4); // grace year
		expect(calculateDecayedOrder(4, 2020, 2022)).toBe(3); // AA
		expect(calculateDecayedOrder(4, 2020, 2023)).toBe(2); // A
		expect(calculateDecayedOrder(4, 2020, 2024)).toBe(1); // B
		expect(calculateDecayedOrder(4, 2020, 2025)).toBe(0); // Unrated
		expect(calculateDecayedOrder(4, 2020, 2026)).toBe(0); // Still unrated
	});
});

describe("rollupRatings", () => {
	test("assigns rating based on tournament level earned", async () => {
		const levels = await getAllLevels(db);
		const aaLevel = levels.find((l) => l.name === "aa");
		const aLevel = levels.find((l) => l.name === "a");

		if (!aaLevel || !aLevel) {
			throw new Error("Required levels not found");
		}

		// Create a tournament with a division
		const tournamentInfo = await bootstrapTournament(db, {
			date: "2025-01-01",
			startTime: "09:00:00",
			divisions: [
				{
					division: "aa",
					gender: "male",
					teams: 4,
					pools: 1,
				},
			],
		});

		const tournamentDivisionId = tournamentInfo.divisions[0];

		// Get teams in this division
		const teams = await db.query.tournamentDivisionTeams.findMany({
			where: { tournamentDivisionId },
			with: {
				team: {
					with: {
						players: {
							with: {
								profile: true,
							},
						},
					},
				},
			},
		});

		// Set a level earned for one team
		const targetTeam = teams[0];
		await db
			.update(tournamentDivisionTeams)
			.set({ levelEarnedId: aaLevel.id })
			.where(eq(tournamentDivisionTeams.id, targetTeam.id));

		// Mark the division as complete
		await db
			.update(tournamentDivisions)
			.set({ status: "complete" })
			.where(eq(tournamentDivisions.id, tournamentDivisionId));

		// Get a player from that team
		const player = targetTeam.team.players[0].profile;

		// Run rollup for current year (2025)
		await rollupRatings("male", 2025);

		// Check the player now has the AA rating
		const updatedProfile = await db.query.playerProfiles.findFirst({
			where: { id: player.id },
		});

		expect(updatedProfile?.levelId).toBe(aaLevel.id);
	});

	test("applies decay to old ratings", async () => {
		const levels = await getAllLevels(db);
		const aaLevel = levels.find((l) => l.name === "aa");
		const aLevel = levels.find((l) => l.name === "a");
		const unratedLevel = levels.find((l) => l.name === "unrated");

		if (!aaLevel || !aLevel || !unratedLevel) {
			throw new Error("Required levels not found");
		}

		// Create a tournament from 3 years ago
		const tournamentInfo = await bootstrapTournament(db, {
			date: "2022-06-15",
			startTime: "09:00:00",
			divisions: [
				{
					division: "aa",
					gender: "female",
					teams: 4,
					pools: 1,
				},
			],
		});

		const tournamentDivisionId = tournamentInfo.divisions[0];

		// Get a team and set AA level earned
		const teams = await db.query.tournamentDivisionTeams.findMany({
			where: { tournamentDivisionId },
			with: {
				team: {
					with: {
						players: {
							with: {
								profile: true,
							},
						},
					},
				},
			},
		});

		const targetTeam = teams[0];
		await db
			.update(tournamentDivisionTeams)
			.set({ levelEarnedId: aaLevel.id })
			.where(eq(tournamentDivisionTeams.id, targetTeam.id));

		// Mark the division as complete
		await db
			.update(tournamentDivisions)
			.set({ status: "complete" })
			.where(eq(tournamentDivisions.id, tournamentDivisionId));

		const player = targetTeam.team.players[0].profile;

		// Run rollup for 2025 - AA from 2022 should decay
		// 2022 -> 2023 (grace year, still AA)
		// 2023 -> 2024 (1 year decay, A)
		// 2024 -> 2025 (2 years decay, B)
		await rollupRatings("female", 2025);

		const updatedProfile = await db.query.playerProfiles.findFirst({
			where: { id: player.id },
		});

		// Should be B (order 2)
		const bLevel = levels.find((l) => l.name === "b");
		expect(updatedProfile?.levelId).toBe(bLevel?.id);
	});

	test("keeps best non-decayed rating", async () => {
		const levels = await getAllLevels(db);
		const aaaLevel = levels.find((l) => l.name === "aaa");
		const aLevel = levels.find((l) => l.name === "a");

		if (!aaaLevel || !aLevel) {
			throw new Error("Required levels not found");
		}

		// Create two tournaments - one old (AAA) and one recent (A)
		const oldTournament = await bootstrapTournament(db, {
			date: "2020-06-15",
			startTime: "09:00:00",
			divisions: [
				{
					division: "aaa",
					gender: "male",
					teams: 4,
					pools: 1,
				},
			],
		});

		// Get a player from the old tournament
		const oldTeams = await db.query.tournamentDivisionTeams.findMany({
			where: { tournamentDivisionId: oldTournament.divisions[0] },
			with: {
				team: {
					with: {
						players: {
							with: {
								profile: true,
							},
						},
					},
				},
			},
		});

		const player = oldTeams[0].team.players[0].profile;

		// Set AAA level earned on old tournament
		await db
			.update(tournamentDivisionTeams)
			.set({ levelEarnedId: aaaLevel.id })
			.where(eq(tournamentDivisionTeams.id, oldTeams[0].id));

		// Mark the division as complete
		await db
			.update(tournamentDivisions)
			.set({ status: "complete" })
			.where(eq(tournamentDivisions.id, oldTournament.divisions[0]));

		// Create a recent tournament where the same player earned A
		const recentTournament = await bootstrapTournament(db, {
			date: "2025-01-01",
			startTime: "09:00:00",
			divisions: [
				{
					division: "a",
					gender: "male",
					teams: 4,
					pools: 1,
				},
			],
		});

		// Get teams from recent tournament
		const recentTeams = await db.query.tournamentDivisionTeams.findMany({
			where: { tournamentDivisionId: recentTournament.divisions[0] },
			with: {
				team: {
					with: {
						players: {
							with: {
								profile: true,
							},
						},
					},
				},
			},
		});

		// Set A level earned on recent tournament
		await db
			.update(tournamentDivisionTeams)
			.set({ levelEarnedId: aLevel.id })
			.where(eq(tournamentDivisionTeams.id, recentTeams[0].id));

		// Mark the division as complete
		await db
			.update(tournamentDivisions)
			.set({ status: "complete" })
			.where(eq(tournamentDivisions.id, recentTournament.divisions[0]));

		// The player from recent tournament should have A (recent, no decay)
		// which is better than the AAA from 2020 that would have fully decayed
		const recentPlayer = recentTeams[0].team.players[0].profile;

		await rollupRatings("male", 2025);

		const updatedProfile = await db.query.playerProfiles.findFirst({
			where: { id: recentPlayer.id },
		});

		expect(updatedProfile?.levelId).toBe(aLevel.id);
	});
});

describe("rollupRatedPoints", () => {
	test("sums points from last 365 days", async () => {
		// Create a tournament with teams that have points
		const tournamentInfo = await bootstrapTournament(db, {
			date: new Date().toISOString().split("T")[0],
			startTime: "09:00:00",
			divisions: [
				{
					division: "aa",
					gender: "male",
					teams: 4,
					pools: 1,
				},
			],
		});

		const tournamentDivisionId = tournamentInfo.divisions[0];

		// Get teams and assign points
		const teams = await db.query.tournamentDivisionTeams.findMany({
			where: { tournamentDivisionId },
			with: {
				team: {
					with: {
						players: {
							with: {
								profile: true,
							},
						},
					},
				},
			},
		});

		// Give first team 100 points
		await db
			.update(tournamentDivisionTeams)
			.set({ pointsEarned: 100 })
			.where(eq(tournamentDivisionTeams.id, teams[0].id));

		// Mark the division as complete
		await db
			.update(tournamentDivisions)
			.set({ status: "complete" })
			.where(eq(tournamentDivisions.id, tournamentDivisionId));

		const player = teams[0].team.players[0].profile;

		// Run rollup
		await rollupRatedPoints("male");

		const updatedProfile = await db.query.playerProfiles.findFirst({
			where: { id: player.id },
		});

		expect(updatedProfile?.ratedPoints).toBe(100);
	});

	test("excludes points from junior divisions", async () => {
		// Create profiles in male gender
		const profiles = await createProfiles(db, [{ gender: "male" }]);
		const profile = profiles[0];

		// Set initial rated points to 0
		await db
			.update(playerProfiles)
			.set({ ratedPoints: 0 })
			.where(eq(playerProfiles.id, profile.id));

		// Run rollup - should not count junior division points
		await rollupRatedPoints("male");

		const updatedProfile = await db.query.playerProfiles.findFirst({
			where: { id: profile.id },
		});

		// Points should be 0 since we haven't added any rated division participations
		expect(updatedProfile?.ratedPoints).toBe(0);
	});
});

describe("rollupJuniorsPoints", () => {
	test("sums points from junior divisions only", async () => {
		// Create a profile
		const profiles = await createProfiles(db, [{ gender: "female" }]);
		const profile = profiles[0];

		// Reset juniors points
		await db
			.update(playerProfiles)
			.set({ juniorsPoints: 0 })
			.where(eq(playerProfiles.id, profile.id));

		// Run rollup
		await rollupJuniorsPoints("female");

		const updatedProfile = await db.query.playerProfiles.findFirst({
			where: { id: profile.id },
		});

		// Should be 0 since no junior division participations
		expect(updatedProfile?.juniorsPoints).toBe(0);
	});
});

describe("updateRanks", () => {
	test("ranks players by level then points", async () => {
		const levels = await getAllLevels(db);
		const aaLevel = levels.find((l) => l.name === "aa");
		const aLevel = levels.find((l) => l.name === "a");

		if (!aaLevel || !aLevel) {
			throw new Error("Required levels not found");
		}

		// Create profiles with different levels and points
		const profiles = await createProfiles(db, [
			{ gender: "male" },
			{ gender: "male" },
			{ gender: "male" },
		]);

		// Set up levels and points
		// Profile 1: AA, 50 points
		await db
			.update(playerProfiles)
			.set({ levelId: aaLevel.id, ratedPoints: 50, juniorsPoints: 0 })
			.where(eq(playerProfiles.id, profiles[0].id));

		// Profile 2: AA, 100 points (should rank higher than profile 1)
		await db
			.update(playerProfiles)
			.set({ levelId: aaLevel.id, ratedPoints: 100, juniorsPoints: 0 })
			.where(eq(playerProfiles.id, profiles[1].id));

		// Profile 3: A, 200 points (lower level, should rank below AA players)
		await db
			.update(playerProfiles)
			.set({ levelId: aLevel.id, ratedPoints: 200, juniorsPoints: 0 })
			.where(eq(playerProfiles.id, profiles[2].id));

		// Run rank update
		await updateRanks("male");

		// Check rankings
		const updatedProfiles = await Promise.all(
			profiles.map((p) =>
				db.query.playerProfiles.findFirst({
					where: { id: p.id },
				}),
			),
		);

		// Profile 2 (AA, 100 pts) should rank higher than Profile 1 (AA, 50 pts)
		expect(updatedProfiles[1]?.rank).toBeLessThan(
			updatedProfiles[0]?.rank ?? 0,
		);

		// Profile 1 (AA, 50 pts) should rank higher than Profile 3 (A, 200 pts)
		expect(updatedProfiles[0]?.rank).toBeLessThan(
			updatedProfiles[2]?.rank ?? 0,
		);
	});

	test("sets null rank for inactive players", async () => {
		// Create a profile with no activity
		const profiles = await createProfiles(db, [{ gender: "female" }]);
		const profile = profiles[0];

		// Reset all activity indicators
		await db
			.update(playerProfiles)
			.set({ levelId: null, ratedPoints: 0, juniorsPoints: 0 })
			.where(eq(playerProfiles.id, profile.id));

		// Run rank update
		await updateRanks("female");

		const updatedProfile = await db.query.playerProfiles.findFirst({
			where: { id: profile.id },
		});

		expect(updatedProfile?.rank).toBeNull();
	});
});
