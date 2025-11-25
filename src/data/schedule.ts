import { type CalendarDate, parseDate } from "@internationalized/date";
import { mutationOptions } from "@tanstack/react-query";
import { notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { and, gte, lte } from "drizzle-orm";
import z from "zod";
import { requirePermissions, requireRole } from "@/auth/shared";
import { db } from "@/db/connection";
import {
	type CreateTournament,
	type CreateTournamentDirector,
	type CreateTournamentDivision,
	createTournamentSchema,
	type Director,
	selectTournamentSchema,
	type Tournament,
	type TournamentDirector,
	type TournamentDivision,
	tournamentDirectors,
	tournamentDivisions,
	tournaments,
	type Venue,
} from "@/db/schema";
import { calendarDateSchema } from "@/lib/schemas";

async function duplicateTournaments(
	templates: (Tournament & {
		tournamentDivisions: TournamentDivision[];
		directors: TournamentDirector[];
		venue: Venue;
	})[],
	getDate: (curr: CalendarDate) => string,
) {
	const values = templates
		.map((template) =>
			createTournamentSchema
				.pick({
					name: true,
					date: true,
					startTime: true,
					venueId: true,
				})
				.parse(template),
		)
		.map((values) => ({
			...values,
			date: getDate(parseDate(values.date)),
		}));

	const createdTournaments = await db
		.insert(tournaments)
		.values(values)
		.returning({
			id: tournaments.id,
		});

	if (createdTournaments.length !== templates.length) {
		throw new Error(
			"Received different length. Something went wrong with creation",
		);
	}

	const zipped = createdTournaments.map(({ id }, i) => ({
		id,
		template: templates[i],
	}));

	const divisionValues: CreateTournamentDivision[] = zipped.flatMap(
		({ id, template }) =>
			template.tournamentDivisions.map(
				({ divisionId, gender, name, teamSize }) => ({
					tournamentId: id,
					divisionId,
					gender,
					name,
					teamSize,
				}),
			),
	);

	const directorValues: CreateTournamentDirector[] = zipped.flatMap(
		({ id, template }) =>
			template.directors.map(({ directorId, order }) => ({
				tournamentId: id,
				directorId,
				order,
			})),
	);

	await Promise.all([
		db.insert(tournamentDivisions).values(divisionValues),
		db.insert(tournamentDirectors).values(directorValues),
	]);

	return createdTournaments;
}

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

		const [tournament] = await duplicateTournaments([template], () => date);

		return { data: tournament };
	});

export const duplicateTournamentOptions = () =>
	mutationOptions({
		mutationFn: async (data: DuplicateTournamentParams) => {
			return duplicateTournamentFn({ data });
		},
	});

export const duplicateScheduleSchema = z.object({
	startDate: calendarDateSchema(),
	endDate: calendarDateSchema(),
	addDays: z.number(),
});

export type DuplicateScheduleParams = z.infer<typeof duplicateScheduleSchema>;

export const duplicateScheduleFn = createServerFn()
	.middleware([requireRole("admin")])
	.inputValidator(duplicateScheduleSchema)
	.handler(async ({ data: { startDate, endDate, addDays } }) => {
		// consider doing this all at once using $with
		//
		// https://orm.drizzle.team/docs/insert#with-insert-clause
		const tournaments = await db.query.tournaments.findMany({
			with: {
				venue: true,
				directors: true,
				tournamentDivisions: true,
			},
			where: (t, { gte, lte, and }) =>
				and(gte(t.date, startDate.toString()), lte(t.date, endDate.toString())),
		});

		const created = await duplicateTournaments(tournaments, (date) =>
			date.add({ days: addDays }).toString(),
		);

		return created;
	});

export const duplicateScheduleOptions = () =>
	mutationOptions({
		mutationFn: async (data: z.infer<typeof duplicateScheduleSchema>) => {
			return duplicateScheduleFn({ data });
		},
	});

export const deleteScheduleSchema = z.object({
	startDate: calendarDateSchema(),
	endDate: calendarDateSchema(),
});

export type DeleteScheduleParams = z.infer<typeof deleteScheduleSchema>;

export const deleteScheduleFn = createServerFn()
	.middleware([requireRole("admin")])
	.inputValidator(deleteScheduleSchema)
	.handler(async ({ data: { startDate, endDate } }) => {
		await db
			.delete(tournaments)
			.where(
				and(
					gte(tournaments.date, startDate.toString()),
					lte(tournaments.date, endDate.toString()),
				),
			);
	});

export const deleteScheduleOptions = () =>
	mutationOptions({
		mutationFn: async (data: z.infer<typeof deleteScheduleSchema>) => {
			return deleteScheduleFn({ data });
		},
	});
