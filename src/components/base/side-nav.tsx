import { createLink, type LinkOptions } from "@tanstack/react-router";
import { SidebarCloseIcon, SidebarOpenIcon } from "lucide-react";
import { useState } from "react";
import {
	Tree as AriaTree,
	TreeItem as AriaTreeItem,
	TreeItemContent as AriaTreeItemContent,
	type TreeItemProps as AriaTreeItemProps,
	type TreeProps,
} from "react-aria-components";
import { tv } from "tailwind-variants";
import { Button } from "./button";
import { composeTailwindRenderProps, focusRing } from "./utils";

const containerStyles = tv({
	base: "absolute left-0 top-0 bottom-0 z-10 md:relative md:w-fit flex flex-row",
	variants: {
		expanded: {
			false: "w-0",
			true: "w-fit",
		},
	},
});

const treeStyles = tv({
	base: "order-1 overflow-hidden md:relative border-r-2 border-gray-300 bg-white min-h-full md:w-auto transition-[width] delay-150 duration-300 ease-in-out",
	variants: {
		expanded: {
			false: "w-0",
			true: "w-full",
		},
	},
});

const toggleButtonStyles = tv({
	base: "md:hidden z-11 order-2 mt-2 ml-2",
	variants: {
		expanded: {
			false: "", // "abso!lute top-2 left-2",
			true: "", // "absol!ute top-2 -right-2 transl!ate-x-full",
		},
	},
});

export function SideNav<T extends object>({
	children,
	...props
}: TreeProps<T>) {
	const [expanded, setExpanded] = useState(false);

	return (
		<div className={containerStyles({ expanded })}>
			<Button
				className={toggleButtonStyles({ expanded })}
				variant="icon"
				radius="full"
				color="alternate"
				onPress={() => {
					setExpanded((s) => !s);
				}}
			>
				{expanded ? <SidebarCloseIcon /> : <SidebarOpenIcon />}
			</Button>
			<AriaTree
				{...props}
				className={composeTailwindRenderProps(
					props.className,
					treeStyles({ expanded }),
				)}
			>
				{children}
			</AriaTree>
		</div>
	);
}

const itemStyles = tv({
	extend: focusRing,
	base: "relative w-48 flex group gap-3 cursor-default select-none py-2 px-3 text-sm text-gray-900 bg-white border-y border-transparent first:border-t-0 last:border-b-0 -mb-px last:mb-0 -outline-offset-2",
	variants: {
		isSelected: {
			false: "hover:bg-gray-100",
			true: "bg-blue-100 hover:bg-blue-200 border-y-blue-200 z-20",
		},
		isDisabled: {
			true: "text-slate-300 forced-colors:text-[GrayText] z-10",
		},
	},
});

export interface SideNavItemProps
	extends Partial<AriaTreeItemProps>,
		Partial<Pick<LinkOptions, "to">> {
	title: string;
}

export function SideNavItem(props: SideNavItemProps) {
	if (props.to) {
		return <SideNavItemLink {...props} />;
	}

	return (
		<AriaTreeItem className={itemStyles} textValue={props.title} {...props}>
			<AriaTreeItemContent {...props}>
				{(/*{ hasChildItems, isExpanded, isDisabled }*/) => (
					<div className={"flex items-center"}>
						<div className="shrink-0 w-[calc(calc(var(--SideNav-item-level)-1)*calc(var(--spacing)*3))]" />
						{/*{hasChildItems ? (
							<Button slot="chevron" className={expandButton({ isDisabled })}>
								<ChevronRight
									aria-hidden
									className={chevron({ isExpanded, isDisabled })}
								/>
							</Button>
						) : (
							<div className="shrink-0 w-8 h-8" />
						)}*/}
						{props.title}
					</div>
				)}
			</AriaTreeItemContent>
			{props.children}
		</AriaTreeItem>
	);
}

export const SideNavItemLink = createLink(SideNavItem);
