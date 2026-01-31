import { useMutation, useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { MoreVertical } from "lucide-react";
import { Suspense } from "react";
import { Header, TableBody } from "react-aria-components";
import {
	DropdownMenu,
	DropdownMenuItem,
} from "@/components/base/dropdown-menu";
import {
	Table,
	TableCell,
	TableColumn,
	TableHeader,
	TableRow,
} from "@/components/base/table";
import { title } from "@/components/base/primitives";
import {
	adminVenuesQueryOptions,
	adminUpdateVenueStatusMutationOptions,
} from "@/data/venues";
import { ReorderVenuesForm } from "@/components/venues/reorder-venues-form";

const statusLabels: Record<string, string> = {
	active: "Active",
	hidden: "Hidden",
	legacy: "Legacy",
};

export function VenuesList() {
	const queryClient = useQueryClient();
	const { data: venues } = useSuspenseQuery(adminVenuesQueryOptions());

	const { mutate: updateStatus } = useMutation({
		...adminUpdateVenueStatusMutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries(adminVenuesQueryOptions());
		},
	});

	return (
		<section className="flex flex-col space-y-6">
			<div className="flex flex-row justify-between items-center">
				<Header className={title({ size: "sm" })}>Venues</Header>
				<ReorderVenuesForm />
			</div>

			<Suspense>
				{venues && venues.length > 0 ? (
					<Table aria-label="Venues">
						<TableHeader>
							<TableColumn isRowHeader width="35%">
								Name
							</TableColumn>
							<TableColumn width="25%">City</TableColumn>
							<TableColumn width="20%">Status</TableColumn>
							<TableColumn width="20%">Actions</TableColumn>
						</TableHeader>
						<TableBody>
							{venues.map((venue) => (
								<TableRow key={venue.id}>
									<TableCell>
										<span className="font-medium">{venue.name}</span>
									</TableCell>
									<TableCell>{venue.city}</TableCell>
									<TableCell>
										<span
											className={
												venue.status === "active"
													? "text-green-600"
													: venue.status === "hidden"
														? "text-gray-500"
														: "text-orange-500"
											}
										>
											{statusLabels[venue.status] ?? venue.status}
										</span>
									</TableCell>
									<TableCell>
										<DropdownMenu
											label="Venue actions"
											buttonIcon={<MoreVertical size={16} />}
										>
											{venue.status === "active" ? (
												<DropdownMenuItem
													id="hide"
													onAction={() =>
														updateStatus({ id: venue.id, status: "hidden" })
													}
												>
													Hide Venue
												</DropdownMenuItem>
											) : venue.status === "hidden" ? (
												<DropdownMenuItem
													id="show"
													onAction={() =>
														updateStatus({ id: venue.id, status: "active" })
													}
												>
													Show Venue
												</DropdownMenuItem>
											) : null}
										</DropdownMenu>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				) : (
					<div className="bg-white rounded-lg px-4 py-3 border border-gray-300 text-gray-600">
						No venues found.
					</div>
				)}
			</Suspense>
		</section>
	);
}
