import { GripVerticalIcon } from "lucide-react";
import { ProfilePhoto } from "../profiles/photo";
import { ProfileName } from "../profiles/name";
import { CartProfile } from "./context";
import { twMerge } from "tailwind-merge";

export function DraggableProfile({
	className,
	...profile
}: CartProfile & { className?: string }) {
	return (
		<div className={twMerge("flex flex-row gap-x-2 items-center", className)}>
			<GripVerticalIcon className="text-gray-400" size={16} />
			<ProfilePhoto {...profile} />
			<ProfileName {...profile} />
		</div>
	);
}
