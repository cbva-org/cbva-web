import { describe, expect, test } from "vitest";
import { tournamentDivisionTeams } from "@/db";
import { db } from "@/db/connection";
import { bootstrapTournament } from "@/tests/utils/tournaments";
import { createProfiles, createTeams } from "@/tests/utils/users";

import { getProfileResults } from "./profiles";

describe("getProfileResults", () => {
	test("can filter results", async () => {
		const [
			{ id: profileId },
			{ id: teammateAId },
			{ id: teammateBId },
			{ id: teammateCId },
		] = await createProfiles(db, [
			{ gender: "male" as const },
			{ gender: "male" as const },
			{ gender: "male" as const },
			{ gender: "male" as const },
		]);

		const [{ id: teamAId }, { id: teamBId }, { id: teamCId }] =
			await createTeams(db, [
				{
					players: [{ id: profileId }, { id: teammateAId }],
				},
				{
					players: [{ id: profileId }, { id: teammateBId }],
				},
				{
					players: [{ id: profileId }, { id: teammateCId }],
				},
			]);

		const aTournament = await bootstrapTournament(db, {
			date: "2025-01-01",
			startTime: "09:00:00",
			divisions: [
				{
					division: "b",
					gender: "male",
					teams: 30,
					pools: 6,
				},
			],
			poolMatches: true,
			simulatePoolMatches: false,
		});

		await db.insert(tournamentDivisionTeams).values({
			tournamentDivisionId: aTournament.divisions[0],
			teamId: teamAId,
		});

		const bTournament = await bootstrapTournament(db, {
			date: "2025-01-02",
			startTime: "09:00:00",
			divisions: [
				{
					division: "b",
					gender: "male",
					teams: 30,
					pools: 6,
				},
			],
			poolMatches: true,
			simulatePoolMatches: false,
		});

		await db.insert(tournamentDivisionTeams).values({
			tournamentDivisionId: bTournament.divisions[0],
			teamId: teamBId,
		});

		const cTournament = await bootstrapTournament(db, {
			date: "2025-01-02",
			startTime: "09:00:00",
			divisions: [
				{
					division: "b",
					gender: "male",
					teams: 30,
					pools: 6,
				},
			],
			poolMatches: true,
			simulatePoolMatches: false,
		});

		await db.insert(tournamentDivisionTeams).values({
			tournamentDivisionId: cTournament.divisions[0],
			teamId: teamCId,
		});

		const result = await getProfileResults({
			data: {
				id: profileId,
				venues: [],
				divisions: [],
				paging: {
					page: 1,
					size: 3,
				},
			},
		});

		expect(result.data).toHaveLength(3);
		expect(result.pageInfo.totalItems).toBe(3);
		expect(result.pageInfo.totalPages).toBe(1);
	});
});
