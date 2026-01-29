import type { Division, PlayerProfile } from "@/db/schema";
import type { Gender } from "@/db/schema/shared";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import {
	Button as AriaButton,
	DialogTrigger,
	DropZone,
	isTextDropItem,
	ListBox,
	ListBoxItem,
} from "react-aria-components";
import { tv } from "tailwind-variants";
import { CartProfile, useCartProfiles, useDraggedProfile } from "./context";
import { DraggableProfile } from "./draggable-profile";
import { without } from "lodash-es";
import { Button } from "../base/button";
import { Popover } from "../base/popover";
import { ProfilePhoto } from "../profiles/photo";
import { ProfileName } from "../profiles/name";
import { Trash2Icon } from "lucide-react";
import { getGenderDisplay } from "@/hooks/tournament";

const teamStyles = tv({
	base: "p-3 bg-gray-50 border border-gray-300 rounded-md flex flex-row items-center gap-x-4 transition-colors",
	variants: {
		dragState: {
			none: "",
			valid: "border-blue-500 bg-blue-50",
			invalid: "border-red-400 bg-red-50",
		},
	},
	defaultVariants: {
		dragState: "none",
	},
});

const slotStyles = tv({
	base: "p-2 border border-gray-200 bg-gray-200 rounded-sm text-sm max-w-42",
	variants: {
		dragState: {
			none: "",
			valid: "border-blue-500 bg-blue-100 text-blue-600",
			invalid: "border-red-400 bg-red-100 text-red-600",
		},
	},
	defaultVariants: {
		dragState: "none",
	},
});

type DragState = "none" | "valid" | "invalid";

function isProfileValidForDivision(
	profile: CartProfile,
	divisionGender: Gender,
	divisionMaxAge: number | null,
	currentProfileIds: number[],
	divisionOrder: number,
	adding: boolean,
	cartMembershipProfileIds: number[],
): { valid: boolean; reason?: string; needsMembership?: boolean } {
	// Check if profile is already on this team
	if (adding && currentProfileIds.includes(profile.id)) {
		return { valid: false, reason: "Already on this team" };
	}

	// Check gender compatibility
	if (divisionGender !== "coed" && profile.gender !== divisionGender) {
		return {
			valid: false,
			reason: getGenderDisplay(divisionGender, divisionMaxAge),
		};
	}

	if (profile.level && profile.level.order > divisionOrder) {
		return {
			valid: false,
			reason: "Invalid rating",
		};
	}

	// Check membership status - valid but flag if needs membership
	const hasMembership =
		profile.activeMembership !== null ||
		cartMembershipProfileIds.includes(profile.id);

	return { valid: true, needsMembership: !hasMembership };
}

export function RegistrationTeam({
	id,
	name,
	profileIds,
	teamSize,
	gender,
	division,
}: {
	id: string;
	name: string;
	profileIds: PlayerProfile["id"][];
	teamSize: number;
	gender: Gender;
	division: Division;
}) {
	const [dragState, setDragState] = useState<DragState>("none");
	const [invalidReason, setInvalidReason] = useState<string>();

	const emptySlots = teamSize - profileIds.length;

	const navigate = useNavigate();

	const cartProfiles = useCartProfiles();
	const draggedProfile = useDraggedProfile();
	const { memberships } = useSearch({ from: "/account/registrations/" });
	const cartMembershipProfileIds = memberships.map((m) => m.profileId);

	const teamProfiles = cartProfiles?.filter(({ id }) =>
		profileIds.includes(id),
	);

	const addProfileToTeam = (profile: CartProfile) => {
		const needsMembership =
			profile.activeMembership === null &&
			!cartMembershipProfileIds.includes(profile.id);

		navigate({
			to: "/account/registrations",
			replace: true,
			search: (search) => ({
				...search,
				teams: (search.teams ?? []).map((team) =>
					team.id === id
						? { ...team, profileIds: team.profileIds.concat(profile.id) }
						: team,
				),
				memberships: needsMembership
					? [
							...(search.memberships ?? []),
							{ profileId: profile.id, tshirtSize: null },
						]
					: search.memberships,
			}),
		});
	};

	const removeFromTeam = (profileId: number) => {
		navigate({
			to: "/account/registrations",
			replace: true,
			search: (search) => ({
				...search,
				teams: (search.teams ?? []).map((t) =>
					t.id === id
						? { ...t, profileIds: without(t.profileIds, profileId) }
						: t,
				),
			}),
		});
	};

	const removeTeam = () => {
		navigate({
			to: "/account/registrations",
			replace: true,
			search: (search) => ({
				...search,
				teams: (search.teams ?? []).filter((t) => t.id !== id),
			}),
		});
	};

	return (
		<DropZone
			className={teamStyles({ dragState })}
			getDropOperation={(types) =>
				types.has("profile") && emptySlots > 0 ? "copy" : "cancel"
			}
			onDropEnter={() => {
				if (draggedProfile) {
					const { valid, reason } = isProfileValidForDivision(
						draggedProfile,
						gender,
						division.maxAge,
						profileIds,
						division.order,
						true,
						cartMembershipProfileIds,
					);
					if (valid) {
						setDragState("valid");
						setInvalidReason(undefined);
					} else {
						setDragState("invalid");
						setInvalidReason(reason);
					}
				} else {
					setDragState("valid");
				}
			}}
			onDropExit={() => {
				setDragState("none");
				setInvalidReason(undefined);
			}}
			onDrop={async (e) => {
				const items = await Promise.all(
					e.items.filter(isTextDropItem).map(async (item) => {
						const text = await item.getText("profile");
						return JSON.parse(text) as { id: number };
					}),
				);

				for (const item of items) {
					const profile = cartProfiles.find((p) => p.id === item.id);
					if (!profile) continue;

					const { valid } = isProfileValidForDivision(
						profile,
						gender,
						division.maxAge,
						profileIds,
						division.order,
						true,
						cartMembershipProfileIds,
					);

					if (valid) {
						addProfileToTeam(profile);
					}
				}

				setDragState("none");
				setInvalidReason(undefined);
			}}
		>
			<span className="whitespace-nowrap">{name}</span>

			<div className="flex flex-row flex-wrap items-center gap-2 flex-1">
				{teamProfiles.map((profile) => {
					const validation = isProfileValidForDivision(
						profile,
						gender,
						division.maxAge,
						profileIds,
						division.order,
						false,
						cartMembershipProfileIds,
					);
					return (
						<DraggableProfile
							key={profile.id}
							{...profile}
							className={slotStyles()}
							error={validation.reason}
							warning={
								validation.needsMembership ? "Needs membership" : undefined
							}
							onRemove={() => removeFromTeam(profile.id)}
						/>
					);
				})}

				{emptySlots > 0 && (
					<AddPlayerSlot
						dragState={dragState}
						invalidReason={invalidReason}
						emptySlots={emptySlots}
						cartProfiles={cartProfiles}
						currentProfileIds={profileIds}
						divisionGender={gender}
						divisionOrder={division.order}
						cartMembershipProfileIds={cartMembershipProfileIds}
						onSelectProfile={addProfileToTeam}
					/>
				)}
			</div>

			<Button variant="text" className="justify-self-end" onPress={removeTeam}>
				<Trash2Icon size={16} />
			</Button>
		</DropZone>
	);
}

function AddPlayerSlot({
	dragState,
	invalidReason,
	emptySlots,
	cartProfiles,
	currentProfileIds,
	divisionGender,
	divisionMaxAge,
	divisionOrder,
	cartMembershipProfileIds,
	onSelectProfile,
}: {
	dragState: DragState;
	invalidReason?: string;
	emptySlots: number;
	cartProfiles: CartProfile[];
	currentProfileIds: number[];
	divisionGender: Gender;
	divisionMaxAge: number | null;
	divisionOrder: number;
	cartMembershipProfileIds: number[];
	onSelectProfile: (profile: CartProfile) => void;
}) {
	const [isOpen, setIsOpen] = useState(false);

	// Filter to profiles that can be added to this team
	const availableProfiles = cartProfiles.filter((profile) => {
		const { valid } = isProfileValidForDivision(
			profile,
			divisionGender,
			divisionMaxAge,
			currentProfileIds,
			divisionOrder,
			true,
			cartMembershipProfileIds,
		);
		return valid;
	});

	const handleSelectProfile = (profile: CartProfile) => {
		onSelectProfile(profile);
		setIsOpen(false);
	};

	// Show drag feedback when dragging, otherwise show clickable add button
	if (dragState !== "none") {
		return (
			<div className={slotStyles({ dragState })}>
				{dragState === "invalid" && invalidReason
					? invalidReason
					: `Add ${emptySlots} more player(s)`}
			</div>
		);
	}

	return (
		<DialogTrigger isOpen={isOpen} onOpenChange={setIsOpen}>
			<AriaButton
				className={`${slotStyles({ dragState })} cursor-pointer hover:bg-gray-300 flex items-center gap-1`}
			>
				Add {emptySlots} more player(s)
			</AriaButton>
			<Popover className="p-2 min-w-48 max-h-64 overflow-auto">
				{availableProfiles.length === 0 ? (
					<div className="p-2 text-sm text-gray-500">
						No eligible players available
					</div>
				) : (
					<ListBox
						aria-label="Select a player to add"
						selectionMode="single"
						onSelectionChange={(keys) => {
							const selectedId = [...keys][0];
							if (typeof selectedId === "number") {
								const profile = availableProfiles.find(
									(p) => p.id === selectedId,
								);
								if (profile) {
									handleSelectProfile(profile);
								}
							}
						}}
					>
						{availableProfiles.map((profile) => (
							<ListBoxItem
								key={profile.id}
								id={profile.id}
								textValue={`${profile.preferredName || profile.firstName} ${profile.lastName}`}
								className="p-2 flex flex-row items-center gap-2 cursor-pointer rounded hover:bg-gray-100 outline-none focus:bg-gray-100"
							>
								<ProfilePhoto {...profile} />
								<ProfileName {...profile} link={false} />
							</ListBoxItem>
						))}
					</ListBox>
				)}
			</Popover>
		</DialogTrigger>
	);
}
