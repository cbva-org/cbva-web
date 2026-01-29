import { Link, useRouter } from "@tanstack/react-router";
import z from "zod";
import { button } from "@/components/base/button";
import { Checkbox } from "@/components/base/checkbox";
import { genderSchema } from "@/db/schema/shared";
import { FilterDateRange } from "./date-range";
import { FilterDivisions } from "./divisions";
import { FilterGender } from "./gender";
import { FilterVenues } from "./venues";

export const tournamentListFilterSchema = z.object({
	page: z.number().default(1),
	pageSize: z.number().default(25),
	divisions: z.array(z.number()).default([]),
	venues: z.array(z.number()).default([]),
	genders: z.array(genderSchema).default([]),
	past: z.boolean().default(false),
	startDate: z.string().nullable().default(null),
	endDate: z.string().nullable().default(null),
});

export type TournamentListFiltersProps = z.infer<
	typeof tournamentListFilterSchema
>;

export function TournamentListFilters({
	past,
	startDate,
	endDate,
	divisions,
	venues,
	genders,
}: TournamentListFiltersProps) {
	const router = useRouter();

	return (
		<div className="max-w-xl mx-auto flex flex-col space-y-2 px-2">
			<FilterDateRange startDate={startDate} endDate={endDate} />
			<FilterVenues values={new Set(venues)} />
			<FilterDivisions values={new Set(divisions)} />
			<FilterGender values={new Set(genders)} />
			<Checkbox
				isSelected={past}
				onChange={(value) => {
					router.navigate({
						to: "/tournaments",
						search: (prev) => ({
							...prev,
							page: 1,
							past: value,
						}),
					});
				}}
				label={<>Past Tournaments Only</>}
			/>
			<Link
				to="/tournaments"
				className={button({ class: "mt-2" })}
				search={{}}
			>
				Clear Filters
			</Link>
		</div>
	);
}
