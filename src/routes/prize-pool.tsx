import {
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense, useState } from "react";
import { useViewerHasPermission } from "@/auth/shared";
import { title } from "@/components/base/primitives";
import { RichTextDisplay } from "@/components/base/rich-text-editor/display";
import {
	contentPageBlocksQueryOptions,
	updateContentBlockMutationOptions,
} from "@/data/blocks";
import type { LexicalState } from "@/db/schema/shared";
import { DefaultLayout } from "@/layouts/default";
import { NumberInput } from "@/components/base/number-input";
import {
	Table,
	TableBody,
	TableCell,
	TableColumn,
	TableHeader,
	TableRow,
} from "@/components/base/table";

export const Route = createFileRoute("/prize-pool")({
	ssr: "data-only",
	loader: async ({ context: { queryClient } }) => {
		await queryClient.ensureQueryData(
			contentPageBlocksQueryOptions("prize-pool"),
		);
	},
	component: RouteComponent,
});

// Number of Teams,Total Prize Pool ($),1st Place ($),2nd Place ($),3rd Place ($),
const moneyData = [
	[12, 480, 336, 144],
	[13, 520, 364, 156],
	[14, 560, 392, 168],
	[15, 600, 420, 180],
	[16, 640, 448, 192],
	[17, 680, 476, 204],
	[18, 720, 504, 216],
	[19, 760, 532, 228],
	[20, 800, 560, 240],
	[21, 840, 588, 252],
	[22, 880, 616, 264],
	[23, 920, 644, 276],
	[24, 960, 672, 288],
	[25, 1000, 700, 300],
	[26, 1040, 728, 312],
	[27, 1080, 756, 324],
	[28, 1120, 784, 336],
	[29, 1160, 812, 348],
	[30, 1200, 840, 360],
	[31, 1240, 620, 372, 248],
	[32, 1280, 640, 384, 256],
	[33, 1320, 660, 396, 264],
	[34, 1360, 680, 408, 272],
	[35, 1400, 700, 420, 280],
	[36, 1440, 720, 432, 288],
	[37, 1480, 740, 444, 296],
	[38, 1520, 760, 456, 304],
	[39, 1560, 780, 468, 312],
	[40, 1600, 800, 480, 320],
	[41, 1640, 820, 492, 328],
	[42, 1680, 840, 504, 336],
	[43, 1720, 860, 516, 344],
	[44, 1760, 880, 528, 352],
	[45, 1800, 900, 540, 360],
	[46, 1840, 920, 552, 368],
	[47, 1880, 940, 564, 376],
	[48, 1920, 960, 576, 384],
	[49, 1960, 980, 588, 392],
	[50, 2000, 1000, 600, 400],
];

const moneyFormatter = Intl.NumberFormat("EN-us", {
	style: "currency",
	currency: "usd",
});

function RouteComponent() {
	const canEdit = useViewerHasPermission({
		content: ["update"],
	});

	const { data: firstBlock } = useSuspenseQuery({
		...contentPageBlocksQueryOptions("prize-pool"),
		select: (data) => data.find(({ key }) => key === "prize-pool-1")?.content,
	});

	const { data: secondBlock } = useSuspenseQuery({
		...contentPageBlocksQueryOptions("prize-pool"),
		select: (data) => data.find(({ key }) => key === "prize-pool-2")?.content,
	});

	const queryClient = useQueryClient();

	const { mutateAsync } = useMutation({
		...updateContentBlockMutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: [],
			});
		},
	});

	const [teams, setTeams] = useState(12);

	const [_teamCount, total, firstPrize, secondPrize, thirdPrize] =
		moneyData.find(([count]) => count === teams) ?? [];

	return (
		<DefaultLayout
			classNames={{
				content: "py-12 px-2 max-w-2xl mx-auto flex flex-col space-y-12",
			}}
		>
			<Suspense>
				<h1
					className={title({
						class: "w-full text-center ",
					})}
				>
					Open Division Prize Money
				</h1>

				{firstBlock && (
					<RichTextDisplay
						name="prize-pool"
						content={firstBlock}
						onSave={
							canEdit
								? async (state) => {
										await mutateAsync({
											page: "prize-pool",
											key: "prize-pool-1",
											content: state as LexicalState,
										});
									}
								: undefined
						}
					/>
				)}

				<div className="flex flex-col gap-y-2">
					<NumberInput
						className="w-full"
						inputClassName="bg-white  max-w-32"
						label="Number of Teams (12-50)"
						minValue={12}
						maxValue={50}
						value={teams}
						onChange={setTeams}
					/>
					<Table>
						<TableHeader>
							<TableColumn isRowHeader={true} width={1} allowsSorting={false}>
								Total ($)
							</TableColumn>
							<TableColumn width={1} allowsSorting={false}>
								1st ($)
							</TableColumn>
							<TableColumn width={1} allowsSorting={false}>
								2nd ($)
							</TableColumn>
							<TableColumn width={1} allowsSorting={false}>
								3rd ($)
							</TableColumn>
						</TableHeader>
						<TableBody>
							<TableRow>
								<TableCell>{moneyFormatter.format(total)}</TableCell>
								<TableCell>{moneyFormatter.format(firstPrize)}</TableCell>
								<TableCell>{moneyFormatter.format(secondPrize)}</TableCell>
								<TableCell>
									{thirdPrize ? moneyFormatter.format(thirdPrize) : "-"}
								</TableCell>
							</TableRow>
						</TableBody>
					</Table>
				</div>

				{secondBlock && (
					<RichTextDisplay
						name="prize-pool"
						content={secondBlock}
						onSave={
							canEdit
								? async (state) => {
										await mutateAsync({
											page: "prize-pool",
											key: "prize-pool-2",
											content: state as LexicalState,
										});
									}
								: undefined
						}
					/>
				)}
			</Suspense>
		</DefaultLayout>
	);
}
