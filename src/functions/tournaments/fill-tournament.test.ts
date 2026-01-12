import { assert, describe, expect, test } from "vitest";
import { db } from "@/db/connection";
import { bootstrapTournament } from "@/tests/utils/tournaments";
import { seedPlayerBase } from "@/tests/utils/users";
import { getQualifiedLevels } from "@/tests/utils/divisions";
import { fillTournament } from "./fill-tournament";

describe("fillTournament", () => {
	test("fills tournament to capacity with valid teams", async () => {
		const capacity = 10;

		const tournamentInfo = await bootstrapTournament(db, {
			date: "2025-01-01",
			startTime: "09:00:00",
			divisions: [
				{
					division: "b",
					gender: "male",
					teams: 0,
					capacity,
				},
			],
		});

		const tournamentDivisionId = tournamentInfo.divisions[0];

		await seedPlayerBase({
			capacity,
			gender: "male",
			division: "b",
		});

		const teamsBefore = await db.query.tournamentDivisionTeams.findMany({
			where: { tournamentDivisionId },
		});

		expect(teamsBefore).toHaveLength(0);

		await fillTournament(tournamentInfo.id);

		const teamsAfter = await db.query.tournamentDivisionTeams.findMany({
			where: { tournamentDivisionId },
			with: {
				team: {
					with: {
						players: {
							with: {
								profile: {
									with: {
										level: true,
									},
								},
							},
						},
						profiles: {
							with: {
								level: true,
							},
						},
					},
				},
			},
		});

		expect(teamsAfter).toHaveLength(capacity);

		assert(
			teamsAfter.every(
				({ team }) =>
					team.players
						.map(({ profile: { gender } }) => gender)
						.every((gender) => gender === "male"),
				// .profiles.every(({ gender }) => gender === "male"),
			),
			"not all correct gender",
		);

		for (const team of teamsAfter) {
			expect(team.team.players).toHaveLength(2);
		}

		const validLevels = await getQualifiedLevels(db, "b");

		assert(
			teamsAfter.every(({ team }) =>
				team.players.every(({ profile: { level } }) => {
					// Unrated always valid
					if (!level) {
						return true;
					}

					return validLevels.map(({ id }) => id).includes(level.id);
				}),
			),
			"not all valid levels",
		);
	});

	test("if division already has teams, does not overfill", async () => {
		const capacity = 10;

		const tournamentInfo = await bootstrapTournament(db, {
			date: "2025-01-02",
			startTime: "09:00:00",
			divisions: [
				{
					division: "b",
					gender: "male",
					teams: 5,
					capacity,
				},
			],
		});

		const tournamentDivisionId = tournamentInfo.divisions[0];

		const teamsBefore = await db.query.tournamentDivisionTeams.findMany({
			where: { tournamentDivisionId },
		});

		expect(teamsBefore).toHaveLength(5);

		await seedPlayerBase({
			capacity,
			gender: "male",
			division: "b",
		});

		await fillTournament(tournamentInfo.id);

		const teamsAfter = await db.query.tournamentDivisionTeams.findMany({
			where: { tournamentDivisionId },
		});

		expect(teamsAfter).toHaveLength(capacity);
	});
});
