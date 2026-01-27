import { GripVerticalIcon, Trash2Icon } from "lucide-react";
import { ProfilePhoto } from "../profiles/photo";
import { ProfileName } from "../profiles/name";
import { CartProfile } from "./context";
import { twMerge } from "tailwind-merge";
import { Button } from "../base/button";
import { ErrorPopover } from "../base/error-popover";

export function DraggableProfile({
	className,
	draggable,
	error,
	showLevel,
	onRemove,
	...profile
}: CartProfile & {
	className?: string;
	draggable?: boolean;
	showLevel?: boolean;
	error?: string;
	onRemove?: () => void;
}) {
	return (
		<div
			className={twMerge(
				"flex flex-row gap-x-2 items-center min-w-0",
				className,
			)}
		>
			{draggable && (
				<GripVerticalIcon className="text-gray-400 shrink-0" size={16} />
			)}
			<ProfilePhoto {...profile} className="h-6 w-6 shrink-0" />
			<ProfileName {...profile} link={false} className="truncate min-w-0" />
			{showLevel && <span className="uppercase">({profile.level?.name})</span>}
			{error && <ErrorPopover>{error}</ErrorPopover>}
			{onRemove && (
				<Button variant="text" className="shrink-0" onPress={onRemove}>
					<Trash2Icon size={16} />
				</Button>
			)}
		</div>
	);
}
