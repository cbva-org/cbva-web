import { mutationOptions } from "@tanstack/react-query";
import { notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import type z from "zod";
import { requirePermissions } from "@/auth/shared";
import { db } from "@/db/connection";
import {
	type CreateTournamentDirector,
	type CreateTournamentDivision,
	createTournamentSchema,
	selectTournamentSchema,
	tournamentDirectors,
	tournamentDivisions,
	tournaments,
} from "@/db/schema";

const duplicateTournamentSchema = selectTournamentSchema.pick({
	id: true,
	date: true,
});

type DuplicateTournamentParams = z.infer<typeof duplicateTournamentSchema>;

export const duplicateTournamentFn = createServerFn({ method: "POST" })
	.middleware([
		requirePermissions({
			tournament: ["create"],
		}),
	])
	.inputValidator(duplicateTournamentSchema)
	.handler(async ({ data: { id, date } }) => {
		const template = await db.query.tournaments.findFirst({
			where: (table, { eq }) => eq(table.id, id),
			with: {
				venue: true,
				directors: true,
				tournamentDivisions: true,
			},
		});

		if (!template) {
			throw notFound();
		}

		const values = createTournamentSchema
			.pick({
				name: true,
				startTime: true,
				venueId: true,
			})
			.parse(template);

		const [tournament] = await db
			.insert(tournaments)
			.values({
				...values,
				date,
			})
			.returning({
				id: tournaments.id,
			});

		const divisionValues: CreateTournamentDivision[] =
			template.tournamentDivisions.map(
				({ divisionId, gender, name, teamSize }) => ({
					tournamentId: tournament.id,
					divisionId,
					gender,
					name,
					teamSize,
				}),
			);

		const directorValues: CreateTournamentDirector[] = template.directors.map(
			({ directorId, order }) => ({
				tournamentId: tournament.id,
				directorId,
				order,
			}),
		);

		await Promise.all([
			db.insert(tournamentDivisions).values(divisionValues),
			db.insert(tournamentDirectors).values(directorValues),
		]);

		return { data: tournament };
	});

export const duplicateTournamentOptions = () =>
	mutationOptions({
		mutationFn: async (data: DuplicateTournamentParams) => {
			return duplicateTournamentFn({ data });
		},
	});
