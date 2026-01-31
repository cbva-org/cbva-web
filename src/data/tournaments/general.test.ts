import { pick } from "lodash-es";
import { describe, expect, test } from "vitest";
import { db } from "@/db/connection";
import { bootstrapTournament } from "@/tests/utils/tournaments";
import { editTournamentFn } from "./general";

describe("Edit general info", () => {
	test("merges divisions when changing venue", async () => {
		const [aVenue, bVenue] = await db.query.venues.findMany({
			limit: 2,
		});

		const { id: aId } = await bootstrapTournament(db, {
			venue: aVenue.id,
			date: "2025-01-01",
			startTime: "09:00:00",
			divisions: [
				{
					division: "b",
					gender: "male",
					teams: 30,
					pools: 6,
				},
				{
					division: "a",
					gender: "female",
					teams: 30,
					pools: 6,
				},
			],
		});

		const { id: bId } = await bootstrapTournament(db, {
			venue: bVenue.id,
			date: "2025-01-01",
			startTime: "09:00:00",
			divisions: [
				{
					division: "b",
					gender: "male",
					teams: 30,
					pools: 6,
				},
				{
					division: "aa",
					gender: "male",
					teams: 30,
					pools: 6,
				},
			],
		});

		const aDivs = await db.query.tournamentDivisions.findMany({
			with: {
				division: true,
				tournament: true,
			},
			where: { tournamentId: aId },
		});

		const bDivs = await db.query.tournamentDivisions.findMany({
			with: {
				division: true,
				tournament: true,
			},
			where: { tournamentId: bId },
		});

		expect(aDivs).toHaveLength(2);
		expect(bDivs).toHaveLength(2);
		expect(aDivs.find(({ division }) => division.name === "a")).toBeDefined();
		expect(aDivs.find(({ division }) => division.name === "b")).toBeDefined();
		expect(bDivs.find(({ division }) => division.name === "b")).toBeDefined();
		expect(bDivs.find(({ division }) => division.name === "aa")).toBeDefined();

		const bTournament = bDivs[0].tournament;

		await editTournamentFn({
			data: {
				id: bId,
				venueId: aVenue.id,
				name: bTournament.name,
				date: bTournament.date,
				startTime: bTournament.startTime,
				mergeDivisions: true,
			},
		});

		// After merge, only one tournament should exist
		// When tournament B is moved to venue A, B gets merged into A and deleted
		const updatedA = await db.query.tournaments.findFirst({
			columns: {
				id: true,
			},
			with: {
				tournamentDivisions: {
					with: {
						division: true,
					},
				},
			},
			where: { id: aId },
		});

		const updatedB = await db.query.tournaments.findFirst({
			columns: {
				id: true,
			},
			where: { id: bId },
		});

		// bId tournament should be deleted after merge (it was merged into A)
		expect(updatedB).toBeUndefined();
		expect(updatedA).toBeDefined();
		expect(updatedA!.tournamentDivisions).toHaveLength(3);

		expect(
			pick(
				updatedA!.tournamentDivisions.find(
					({ division }) => division.name === "a",
				),
				["gender"],
			),
		).toStrictEqual({
			gender: "female",
		});

		expect(
			pick(
				updatedA!.tournamentDivisions.find(
					({ division }) => division.name === "b",
				),
				["gender"],
			),
		).toStrictEqual({
			gender: "male",
		});

		expect(
			pick(
				updatedA!.tournamentDivisions.find(
					({ division }) => division.name === "aa",
				),
				["gender"],
			),
		).toStrictEqual({
			gender: "male",
		});
	});
});
