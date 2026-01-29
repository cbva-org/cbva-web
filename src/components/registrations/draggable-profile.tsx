import { AlertTriangleIcon, GripVerticalIcon, Trash2Icon } from "lucide-react";
import { ProfilePhoto } from "../profiles/photo";
import { ProfileName } from "../profiles/name";
import { CartProfile } from "./context";
import { twMerge } from "tailwind-merge";
import { Button } from "../base/button";
import { ErrorPopover } from "../base/error-popover";
import { Tooltip, TooltipTrigger } from "react-aria-components";

export function DraggableProfile({
	className,
	draggable,
	error,
	warning,
	showLevel,
	onRemove,
	...profile
}: CartProfile & {
	className?: string;
	draggable?: boolean;
	showLevel?: boolean;
	error?: string;
	warning?: string;
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
			{showLevel && (
				<span className="uppercase">
					({profile.level?.abbreviated ?? profile.level?.name ?? "N"})
				</span>
			)}
			{error && <ErrorPopover>{error}</ErrorPopover>}
			{warning && (
				<TooltipTrigger delay={0}>
					<Button variant="text" className="shrink-0 text-amber-500">
						<AlertTriangleIcon size={16} />
					</Button>
					<Tooltip className="bg-amber-100 text-amber-800 px-2 py-1 rounded text-sm">
						{warning}
					</Tooltip>
				</TooltipTrigger>
			)}
			{onRemove && (
				<Button variant="text" className="shrink-0" onPress={onRemove}>
					<Trash2Icon size={16} />
				</Button>
			)}
		</div>
	);
}
