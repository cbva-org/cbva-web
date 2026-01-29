import { CopyIcon } from "lucide-react";
import { Button, ButtonProps } from "./button";

export function CopyButton({
	value,
	...props
}: { value: string | undefined | null } & Omit<
	ButtonProps,
	"children" | "onPress" | "aria-tooltip"
>) {
	const handleCopyPress = () => {
		if (value) {
			navigator.clipboard.writeText(value);
		}
	};

	return (
		<Button
			{...props}
			variant={props.variant ?? "icon"}
			tooltip="Copy"
			onPress={handleCopyPress}
		>
			<CopyIcon />
		</Button>
	);
}
