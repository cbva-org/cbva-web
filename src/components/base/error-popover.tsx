import { AlertCircleIcon } from "lucide-react";
import { useState, type ReactNode } from "react";
import { DialogTrigger } from "react-aria-components";
import { Button } from "./button";
import { Popover } from "./popover";

export function ErrorPopover({
	triggerClassName,
	children,
}: {
	triggerClassName?: string;
	children: ReactNode;
}) {
	const [isOpen, onOpenChange] = useState(false);

	return (
		<DialogTrigger isOpen={isOpen} onOpenChange={onOpenChange}>
			<Button
				aria-label="Error"
				className={triggerClassName}
				variant="text"
				color="primary"
			>
				<AlertCircleIcon size={20} />
			</Button>
			<Popover className="bg-red-50 border border-red-300">
				<div className="flex flex-col p-3">{children}</div>
			</Popover>
		</DialogTrigger>
	);
}
