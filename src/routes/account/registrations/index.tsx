import { Button } from "@/components/base/button";
import { title } from "@/components/base/primitives";
import { ProfileName } from "@/components/profiles/name";
import { ProfilePhoto } from "@/components/profiles/photo";
import { PlayerProfile } from "@/db/schema";
import { getViewerProfilesQueryOptions } from "@/functions/profiles/get-viewer-profiles";
import { DefaultLayout } from "@/layouts/default";
import { assert } from "@/utils/assert";
import { isDefined } from "@/utils/types";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { GripVerticalIcon, PlusIcon } from "lucide-react";
import { ListBox, ListBoxItem, useDragAndDrop } from "react-aria-components";
import z from "zod";

const searchSchema = z.object({
	memberships: z.array(z.number()).default([]),
});

export const Route = createFileRoute("/account/registrations/")({
	validateSearch: searchSchema,
	component: RouteComponent,
});

function RouteComponent() {
	const { memberships } = Route.useSearch();

	const { data: profiles } = useSuspenseQuery({
		...getViewerProfilesQueryOptions(),
		select: (data) => {
			return data.map((profile) => ({
				...profile,
				registrations: 0,
			}));
		},
	});

	const membershipProfiles = memberships
		.map((id) => profiles.find((profile) => profile.id === id))
		.filter(isDefined);

	return (
		<DefaultLayout>
			<div className="text-center py-8">
				<h1 className={title()}>Registration</h1>
			</div>

			<div className="grid grid-cols-6 gap-x-3 px-3 min-h-screen max-w-6xl mx-auto">
				<div className="col-span-4 bg-white rounded-lg grid grid-cols-10">
					<div className="col-span-3 border-r border-gray-200">
						<div className="py-3 px-4 flex flex-row items-center justify-between">
							<span>Players</span>

							<Button color="primary" variant="text" size="xs">
								<PlusIcon size={12} /> Add
							</Button>
						</div>
						<DraggableProfileList profiles={profiles} />
					</div>
					<div className="col-span-7">
						<div className="py-3 px-4 flex flex-col gap-y-3 border-b border-gray-200">
							<div className="flex flex-row items-center justify-between">
								<span>Memberships</span>

								<Button color="primary" variant="text" size="xs">
									<PlusIcon size={12} /> Add Membership
								</Button>
							</div>
							<DraggableProfileList
								profiles={membershipProfiles}
								emptyStateMessage="No memberships in cart..."
							/>
						</div>
						<div className="py-3 px-4 flex flex-row items-center justify-between">
							<span>Tournaments</span>

							<Button color="primary" variant="text" size="xs">
								<PlusIcon size={12} /> Add Tournament
							</Button>
						</div>
					</div>
				</div>

				<div className="col-span-2 min-h-screen bg-white rounded-lg p-3">
					Cart
				</div>
			</div>
		</DefaultLayout>
	);
}

function DraggableProfileList({
	profiles,
	emptyStateMessage,
}: {
	profiles: (PlayerProfile & { registrations: number })[];
	emptyStateMessage?: string;
}) {
	const { dragAndDropHooks } = useDragAndDrop<PlayerProfile>({
		getItems(keys, items) {
			return items.map((item) => {
				return {
					"text/plain": `${item.preferredName || item.firstName} ${item.lastName}`,
					"text/html": `<strong>${item.preferredName || item.firstName} ${item.lastName}</strong>`,
					profile: JSON.stringify(item),
				};
			});
		},
		onDrop: (e) => {
			console.log("onDrop", e);
		},
		onItemDrop: (e) => {
			console.log("onItemDrop", e.target.key);
		},
	});

	return (
		<ListBox
			items={profiles}
			dragAndDropHooks={dragAndDropHooks}
			renderEmptyState={
				emptyStateMessage
					? () => (
							<div className="p-4 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-600">
								{emptyStateMessage}
							</div>
						)
					: undefined
			}
		>
			{(profile) => (
				<ListBoxItem
					key={profile.id}
					className="p-2 flex flex-row items-center justify-between border-b border-gray-200"
				>
					<div className="flex flex-row gap-x-2">
						<GripVerticalIcon />
						<ProfilePhoto {...profile} />
						<ProfileName {...profile} />
					</div>
					{profile.registrations && (
						<span className="text-gray-400">({profile.registrations})</span>
					)}
				</ListBoxItem>
			)}
		</ListBox>
	);
}
