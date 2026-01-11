import { describe, expect, test } from "vitest";
import { db } from "@/db/connection";
import { bootstrapTournament } from "@/tests/utils/tournaments";
import { createProfiles } from "@/tests/utils/users";
import { getQualifiedLevels } from "@/tests/utils/divisions";
import { tournamentDivisions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { fillTournament } from "./fill-tournament";

describe("fillTournament", () => {
	test("fills tournament to capacity with valid teams", async () => {
		// Create a tournament with one division that has 2 existing teams
		const tournamentInfo = await bootstrapTournament(db, {
			date: "2025-01-01",
			startTime: "09:00:00",
			divisions: [
				{
					division: "b",
					gender: "male",
					teams: 4,
					pools: 1,
				},
			],
		});

		const tournamentDivisionId = tournamentInfo.divisions[0];

		// Set capacity to 5 teams (we have 2, so should add 3 more)
		const capacity = 5;
		const teamSize = 2;
		await db
			.update(tournamentDivisions)
			.set({
				capacity,
				teamSize,
			})
			.where(eq(tournamentDivisions.id, tournamentDivisionId));

		// Create enough player profiles to fill the remaining teams
		const levels = await getQualifiedLevels(db, "b");
		const neededPlayers = (capacity - 2) * teamSize;
		await createProfiles(
			db,
			Array.from({ length: neededPlayers }, () => ({
				gender: "male" as const,
				levelId: levels[0].id,
			})),
		);

		// Get initial state
		const teamsBefore = await db.query.tournamentDivisionTeams.findMany({
			where: { tournamentDivisionId },
		});

		expect(teamsBefore).toHaveLength(2);

		// Fill the tournament
		await fillTournament(tournamentInfo.id);

		// Verify teams were added
		const teamsAfter = await db.query.tournamentDivisionTeams.findMany({
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

		// Should have exactly capacity teams
		expect(teamsAfter).toHaveLength(capacity);

		// Verify all new teams are confirmed
		const newTeams = teamsAfter.filter(
			(t) => !teamsBefore.some((oldTeam) => oldTeam.id === t.id),
		);
		expect(newTeams).toHaveLength(capacity - 2);
		expect(newTeams.every((t) => t.status === "confirmed")).toBe(true);

		// Verify each new team has correct number of players
		for (const tournamentTeam of newTeams) {
			expect(tournamentTeam.team.players).toHaveLength(teamSize);

			// Verify all players are male and have valid levels
			for (const { profile } of tournamentTeam.team.players) {
				expect(profile.gender).toBe("male");
				expect(levels.some((level) => level.id === profile.levelId)).toBe(true);
			}
		}

		// Verify teams have sequential order starting from existing teams
		const orders = teamsAfter.map((t) => t.order).sort((a, b) => a - b);
		expect(orders).toEqual([0, 1, 2, 3, 4]);
	});

	test("fills multiple divisions with different genders and levels", async () => {
		// Create a tournament with multiple divisions
		const tournamentInfo = await bootstrapTournament(db, {
			date: "2025-01-01",
			startTime: "09:00:00",
			divisions: [
				{
					division: "a",
					gender: "female",
					teams: 1,
					pools: 1,
				},
				{
					division: "bb",
					gender: "male",
					teams: 1,
					pools: 1,
				},
			],
		});

		const [division1Id, division2Id] = tournamentInfo.divisions;

		// Set capacity for both divisions
		const capacity1 = 3;
		const capacity2 = 4;
		await db
			.update(tournamentDivisions)
			.set({ capacity: capacity1, teamSize: 2 })
			.where(eq(tournamentDivisions.id, division1Id));

		await db
			.update(tournamentDivisions)
			.set({ capacity: capacity2, teamSize: 2 })
			.where(eq(tournamentDivisions.id, division2Id));

		// Create player profiles for both divisions
		const levelsA = await getQualifiedLevels(db, "a");
		const levelsBB = await getQualifiedLevels(db, "bb");

		await createProfiles(
			db,
			Array.from({ length: (capacity1 - 1) * 2 }, () => ({
				gender: "female" as const,
				levelId: levelsA[0].id,
			})),
		);

		await createProfiles(
			db,
			Array.from({ length: (capacity2 - 1) * 2 }, () => ({
				gender: "male" as const,
				levelId: levelsBB[0].id,
			})),
		);

		// Fill the tournament
		await fillTournament(tournamentInfo.id);

		// Verify division 1
		const division1Teams = await db.query.tournamentDivisionTeams.findMany({
			where: { tournamentDivisionId: division1Id },
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

		expect(division1Teams).toHaveLength(capacity1);
		expect(division1Teams.every((t) => t.status === "confirmed")).toBe(true);
		for (const { team } of division1Teams) {
			expect(team.players).toHaveLength(2);
			for (const { profile } of team.players) {
				expect(profile.gender).toBe("female");
			}
		}

		// Verify division 2
		const division2Teams = await db.query.tournamentDivisionTeams.findMany({
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
			where: { tournamentDivisionId: division2Id },
		});

		expect(division2Teams).toHaveLength(capacity2);
		expect(division2Teams.every((t) => t.status === "confirmed")).toBe(true);
		for (const { team } of division2Teams) {
			expect(team.players).toHaveLength(2);
			for (const { profile } of team.players) {
				expect(profile.gender).toBe("male");
			}
		}
	});

	test("does not overfill when not enough players available", async () => {
		// Create a tournament with one division
		const tournamentInfo = await bootstrapTournament(db, {
			date: "2025-01-01",
			startTime: "09:00:00",
			divisions: [
				{
					division: "b",
					gender: "male",
					teams: 1,
					pools: 1,
				},
			],
		});

		const tournamentDivisionId = tournamentInfo.divisions[0];

		// Set capacity high but don't create enough players
		const capacity = 10;
		await db
			.update(tournamentDivisions)
			.set({ capacity, teamSize: 2 })
			.where(eq(tournamentDivisions.id, tournamentDivisionId));

		// Only create enough players for 2 additional teams
		const levels = await getQualifiedLevels(db, "b");
		await createProfiles(
			db,
			Array.from({ length: 4 }, () => ({
				gender: "male" as const,
				levelId: levels[0].id,
			})),
		);

		// Fill the tournament
		await fillTournament(tournamentInfo.id);

		// Should have 3 teams (1 existing + 2 new), not 10
		const teamsAfter = await db.query.tournamentDivisionTeams.findMany({
			where: { tournamentDivisionId },
		});

		expect(teamsAfter.length).toBeLessThanOrEqual(capacity);
		expect(teamsAfter.length).toBeGreaterThanOrEqual(1);
	});
});
