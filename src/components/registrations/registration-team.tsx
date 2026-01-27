import type { PlayerProfile } from "@/db/schema";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { DropZone, isTextDropItem } from "react-aria-components";
import { tv } from "tailwind-variants";
import { useCartProfiles } from "./context";
import { dbg } from "@/utils/dbg";
import { DraggableProfile } from "./draggable-profile";
import { without } from "lodash-es";

const teamStyles = tv({
	base: "p-3 bg-gray-50 border border-gray-300 rounded-md flex flex-row items-center gap-x-4 transition-colors",
	variants: {
		isDragOver: {
			true: "border-blue-500 bg-blue-50",
		},
	},
});

const slotStyles = tv({
	base: "p-2 border border-gray-200 bg-gray-200 rounded-sm text-sm",
	variants: {
		isDragOver: {
			true: "border-blue-500 bg-blue-100 text-blue-600",
		},
	},
});

export function RegistrationTeam({
	id,
	name,
	profileIds,
	teamSize,
}: {
	id: string;
	name: string;
	profileIds: PlayerProfile["id"][];
	teamSize: number;
}) {
	const [isDragOver, setIsDragOver] = useState(false);

	const emptySlots = teamSize - profileIds.length;

	const navigate = useNavigate();

	const cartProfiles = useCartProfiles();

	const teamProfiles = cartProfiles?.filter(({ id }) =>
		profileIds.includes(id),
	);

	const addProfileToTeam = (profile: PlayerProfile) => {
		navigate({
			to: "/account/registrations",
			replace: true,
			search: (search) => {
				return dbg({
					...search,
					teams: search.teams.map((team) =>
						dbg(team.id, "teamId") === dbg(id, "id")
							? { ...team, profileIds: team.profileIds.concat(profile.id) }
							: team,
					),
				});
			},
		});
	};

	const removeFromTeam = (profileId: number) => {
		navigate({
			to: "/account/registrations",
			replace: true,
			search: (search) => ({
				...search,
				teams: search.teams
					?.map((t) =>
						t.id === id
							? { ...t, profileIds: without(t.profileIds, profileId) }
							: t,
					)
					.filter((d) => d.profileIds.length > 0),
			}),
		});
	};

	return (
		<DropZone
			className={teamStyles({ isDragOver })}
			getDropOperation={(types) =>
				types.has("profile") && emptySlots > 0 ? "copy" : "cancel"
			}
			onDropEnter={() => setIsDragOver(true)}
			onDropExit={() => setIsDragOver(false)}
			onDrop={async (e) => {
				setIsDragOver(false);

				const items = await Promise.all(
					e.items.filter(isTextDropItem).map(async (item) => {
						const text = await item.getText("profile");
						return JSON.parse(text) as PlayerProfile;
					}),
				);

				for (const profile of items) {
					addProfileToTeam(profile);
				}
			}}
		>
			<span>{name}</span>

			<div className="flex flex-row items-center gap-x-2">
				{teamProfiles.map((profile) => (
					<DraggableProfile
						key={profile.id}
						{...profile}
						className={slotStyles()}
						onRemove={() => removeFromTeam(profile.id)}
					/>
				))}

				{teamSize > profileIds.length && (
					<div className="text-gray-600 text-sm ml-2">
						Add {teamSize - profileIds.length} more player(s)
					</div>
				)}
			</div>
		</DropZone>
	);
}
