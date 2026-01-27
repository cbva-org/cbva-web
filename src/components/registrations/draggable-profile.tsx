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
	onRemove,
	...profile
}: CartProfile & {
	className?: string;
	draggable?: boolean;
	error?: string;
	onRemove: () => void;
}) {
	return (
		<div className={twMerge("flex flex-row gap-x-2 items-center", className)}>
			{draggable && <GripVerticalIcon className="text-gray-400" size={16} />}
			<ProfilePhoto {...profile} />
			<ProfileName
				{...profile}
				link={false}
				className="whitespace-nowrap text-ellipsis"
			/>
			{error && <ErrorPopover>{error}</ErrorPopover>}
			{onRemove && (
				<Button variant="text" onPress={onRemove}>
					<Trash2Icon size={16} />
				</Button>
			)}
		</div>
	);
}
