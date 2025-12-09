import { InfoIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Button, TooltipTrigger } from "react-aria-components";
import { Tooltip } from "./tooltip";

export function Information({ children }: { children: ReactNode }) {
	return (
		<TooltipTrigger delay={100} closeDelay={50}>
			<Button>
				<InfoIcon className="inline" size={16} />
			</Button>

			<Tooltip className="bg-white">
				<div className="max-w-48 ">{children}</div>
			</Tooltip>
		</TooltipTrigger>
	);
}
