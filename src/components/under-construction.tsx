import { ConstructionIcon } from "lucide-react";
import { Alert } from "./base/alert";
import { ReactNode } from "react";

export function UnderConstruction({
	description = <>This area is under construction.</>,
}: {
	description?: ReactNode;
}) {
	return (
		<Alert
			color="warning"
			title={
				<span className="flex flex-row gap-2 items-center">
					<ConstructionIcon size={32} /> <span>Under Construction!</span>
				</span>
			}
			description={description}
		/>
	);
}
