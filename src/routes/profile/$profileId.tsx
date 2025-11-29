import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { round } from "lodash-es";
import { CircleCheckIcon } from "lucide-react";
import { Suspense } from "react";
import { pill, title } from "@/components/base/primitives";
import {
	Table,
	TableBody,
	TableCell,
	TableColumn,
	TableHeader,
	TableRow,
} from "@/components/base/table";
import { ImpersonateButton } from "@/components/impersonator/impersonate-button";
import { ProfileName } from "@/components/profiles/name";
import { ProfilePhoto } from "@/components/profiles/photo";
import { TeamNames } from "@/components/teams/names";
import {
	profileOverviewQueryOptions,
	profileResultsQueryOptions,
} from "@/data/profiles";
import { DefaultLayout } from "@/layouts/default";

export const Route = createFileRoute("/profile/$profileId")({
	loader: async ({ params: { profileId }, context: { queryClient } }) => {
		const result = await queryClient.ensureQueryData(
			profileOverviewQueryOptions(Number.parseInt(profileId, 10)),
		);

		return result;
	},
	head: () => ({
		meta: [{ title: "Player Profile" }],
	}),
	component: RouteComponent,
});

function RouteComponent() {
	const { profileId } = Route.useParams();

	const { data: profile } = useSuspenseQuery({
		...profileOverviewQueryOptions(Number.parseInt(profileId, 10)),
	});

	const { data: results } = useSuspenseQuery({
		...profileResultsQueryOptions(Number.parseInt(profileId, 10)),
	});

	const accolades = [
		{
			label: "Rating",
			value: profile?.level?.name,
		},
		{
			label: "Rank",
			value: profile?.rank,
		},
		{
			label: "Points",
			value: round(profile?.ratedPoints),
		},
		{
			label: "Junior Points",
			value: round(profile?.juniorsPoints),
		},
	];

	return (
		<DefaultLayout
			classNames={{
				content: "pt-18 w-full relative bg-white",
			}}
		>
			<ImpersonateButton userId={profile?.userId} />

			<Suspense fallback={<>Nope</>}>
				<div className="px-4 pb-18 max-w-5xl mx-auto flex flex-row space-x-8">
					<div>
						<ProfilePhoto {...profile} className="w-48 h-48" />
					</div>

					<div className="flex flex-col space-y-4 w-full items-start sm:items-stretch">
						<div className="py-2 flex flex-row space-x-6 items-center w-full">
							<h1 className={title({ size: "sm" })}>
								<ProfileName {...profile} link={false} />
							</h1>

							<span className={pill({ class: "font-semibold", size: "sm" })}>
								<CircleCheckIcon size={16} /> <span>Active Member</span>
							</span>
						</div>

						<div className="grid grid-cols-2 sm:flex sm:flex-row sm:justify-between gap-4 sm:w-full">
							{accolades.map(({ label, value }) => (
								<div key={label}>
									<span className="font-semibold">{label}</span>
									<div className="uppercase text-5xl font-semibold">
										{value}
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			</Suspense>

			<Suspense>
				<div className="flex flex-col space-y-12 bg-content-background w-full py-16">
					<div className="px-4 max-w-5xl w-full mx-auto">
						<h2 className={title()}>Results</h2>
						<Table aria-label="Player's tournament results">
							<TableHeader className="bg-navbar-background">
								<TableColumn id="date" allowsSorting minWidth={100}>
									Date
								</TableColumn>
								<TableColumn id="tournament" isRowHeader minWidth={100}>
									Event
								</TableColumn>
								<TableColumn id="venue" isRowHeader minWidth={90}>
									Beach
								</TableColumn>
								<TableColumn id="division" isRowHeader minWidth={90}>
									Division
								</TableColumn>
								<TableColumn id="players" isRowHeader minWidth={90}>
									Players
								</TableColumn>
								<TableColumn id="finish" isRowHeader minWidth={90}>
									Finish
								</TableColumn>
								<TableColumn id="rating" isRowHeader minWidth={90}>
									Rating
								</TableColumn>
								<TableColumn id="points" isRowHeader minWidth={90}>
									Points
								</TableColumn>
							</TableHeader>
							<TableBody items={results}>
								{({
									id,
									date,
									event,
									venue,
									division,
									players,
									finish,
									rating,
									points,
								}) => {
									return (
										<TableRow key={id}>
											<TableCell>{date}</TableCell>
											<TableCell>{event}</TableCell>
											<TableCell>{venue}</TableCell>
											<TableCell>{division}</TableCell>
											<TableCell>
												<TeamNames players={players} />
											</TableCell>
											<TableCell>{finish}</TableCell>
											<TableCell>{rating}</TableCell>
											<TableCell>{points}</TableCell>
										</TableRow>
									);
								}}
							</TableBody>
						</Table>
					</div>
				</div>
			</Suspense>
		</DefaultLayout>
	);
}
