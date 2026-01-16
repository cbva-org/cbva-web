import {
	ToggleButton as RACToggleButton,
	ToggleButtonProps,
	composeRenderProps,
} from "react-aria-components";
import { tv } from "tailwind-variants";
import { focusRing } from "./utils";
import { Link, LinkProps } from "@tanstack/react-router";
import { button } from "./button";

const styles = tv({
	extend: focusRing,
	base: "px-5 py-2 [&:has(svg:only-child)]:px-2 text-sm text-center transition rounded-lg border forced-colors:border-[ButtonBorder] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] cursor-default forced-color-adjust-none",
	variants: {
		isSelected: {
			false:
				"bg-navbar-background text-navbar-foreground forced-colors:bg-[ButtonFace]! forced-colors:text-[ButtonText]!",
			true: "bg-navbar-background text-navbar-foreground hover:bg-navbar-background-hover forced-colors:bg-[Highlight]! forced-colors:text-[HighlightText]!",
		},
		isDisabled: {
			true: "bg-gray-100 forced-colors:bg-[ButtonFace]! text-gray-300 forced-colors:text-[GrayText]! border-black/5 forced-colors:border-[GrayText]",
		},
	},
});

export function ToggleButton(props: ToggleButtonProps) {
	return (
		<RACToggleButton
			{...props}
			className={composeRenderProps(props.className, (className, renderProps) =>
				styles({ ...renderProps, className }),
			)}
		/>
	);
}

export function ToggleButtonLink(
	props: Pick<LinkProps, "to" | "params" | "search" | "children"> &
		Pick<ToggleButtonProps, "isSelected">,
) {
	return (
		<Link
			{...props}
			className={button({
				variant: props.isSelected ? undefined : "outline",
				color: "secondary",
				size: "sm",
			})}
		/>
	);
}
