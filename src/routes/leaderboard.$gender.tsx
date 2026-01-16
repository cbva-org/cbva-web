import { createFileRoute, redirect } from "@tanstack/react-router";
import { DefaultLayout } from "@/layouts/default";
import { RadioGroup, RadioLink } from "@/components/base/radio-group";
import { title } from "@/components/base/primitives";
import { Gender } from "@/db/schema/shared";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import {
	Table,
	TableBody,
	TableCell,
	TableColumn,
	TableHeader,
	TableRow,
} from "@/components/base/table";
import { ProfileName } from "@/components/profiles/name";
import { getLeaderboardQueryOptions } from "@/functions/profiles/get-leaderboard";
import { zodValidator } from "@tanstack/zod-adapter";
import z from "zod";
import { Pagination } from "@/components/base/pagination";
import { levelsQueryOptions } from "@/data/levels";
import { ToggleButtonGroup } from "@/components/base/toggle-button-group";
import { ToggleButtonLink } from "@/components/base/toggle-button";
import { withoutItem } from "@/lib/array";

function displayToGender(display: string): Gender | null {
	const gender: Gender | null =
		display === "mens" ? "male" : display === "womens" ? "female" : null;

	return gender;
}

export const Route = createFileRoute("/leaderboard/$gender")({
	validateSearch: zodValidator(
		z.object({
			levels: z.array(z.number()).default([]),
			page: z.number().default(1),
			pageSize: z.number().default(25),
		}),
	),
	loaderDeps: ({ search }) => search,
	loader: async ({
		params: { gender: genderStr },
		deps: { page, pageSize, levels },
		context: { queryClient },
	}) => {
		const gender = displayToGender(genderStr);

		if (!gender) {
			throw redirect({
				to: "/not-found",
			});
		}

		const profiles = await queryClient.ensureQueryData(
			getLeaderboardQueryOptions({
				gender,
				levels,
				page,
				pageSize,
			}),
		);

		return profiles;
	},
	component: RouteComponent,
});

function RouteComponent() {
	const { gender: genderStr } = Route.useParams();
	const { levels: selectedLevels, page, pageSize } = Route.useLoaderDeps();

	const gender = displayToGender(genderStr) as Gender;

	const {
		data: { data: profiles, pageInfo },
	} = useSuspenseQuery(
		getLeaderboardQueryOptions({
			gender,
			levels: selectedLevels,
			page,
			pageSize,
		}),
	);

	const { data: levels } = useQuery({
		...levelsQueryOptions(),
		select: (data) =>
			data
				.filter(({ order }) => order > 0)
				.map((level) => ({
					...level,
					selected: selectedLevels.includes(level.id),
				})),
	});

	return (
		<DefaultLayout
			classNames={{
				content:
					"w-full max-w-lg mx-auto py-12 px-3 flex flex-col items-center space-y-6",
			}}
		>
			<h1 className={title()}>Rated Leaderboard</h1>

			<div className="flex flex-col items-center space-y-3">
				<RadioGroup defaultValue={gender} orientation="horizontal">
					<RadioLink
						to="/leaderboard/$gender"
						params={{ gender: "mens" }}
						value="male"
					>
						Men's
					</RadioLink>
					<RadioLink
						to="/leaderboard/$gender"
						params={{ gender: "womens" }}
						value="female"
					>
						Women's
					</RadioLink>
				</RadioGroup>

				<ToggleButtonGroup>
					{levels?.map(({ id, name, abbreviated, selected }) => (
						<ToggleButtonLink
							key={id}
							to="/leaderboard/$gender"
							params={{ gender: genderStr }}
							search={{
								page: 1,
								pageSize,
								levels: selected
									? withoutItem(selectedLevels, id)
									: selectedLevels.concat(id),
							}}
							isSelected={selected}
						>
							{(abbreviated ?? name).toUpperCase()}
						</ToggleButtonLink>
					))}
				</ToggleButtonGroup>
			</div>
			<Table aria-label="Teams">
				<TableHeader>
					<TableColumn id="rank" allowsSorting>
						Rank
					</TableColumn>
					<TableColumn id="points" isRowHeader allowsSorting>
						Points
					</TableColumn>
					<TableColumn id="player" isRowHeader>
						Player
					</TableColumn>
					<TableColumn id="level" isRowHeader>
						Level
					</TableColumn>
				</TableHeader>
				<TableBody items={profiles || []}>
					{(profile) => {
						return (
							<TableRow key={profile.id}>
								<TableCell>{profile.rank}</TableCell>
								<TableCell>{Math.round(profile.ratedPoints)}</TableCell>
								<TableCell>
									<ProfileName {...profile} />
								</TableCell>
								<TableCell>
									{(
										profile.level?.abbreviated ??
										profile.level?.name ??
										""
									).toUpperCase()}
								</TableCell>
							</TableRow>
						);
					}}
				</TableBody>
			</Table>
			<Pagination
				to="/leaderboard/$gender"
				page={page}
				pageSize={pageSize}
				pageInfo={pageInfo}
			/>
		</DefaultLayout>
	);
}
