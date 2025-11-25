"use client";
import clsx from "clsx";
import { ChevronRight } from "lucide-react";
import type React from "react";
import { useContext } from "react";
import {
	Disclosure as AriaDisclosure,
	DisclosureGroup as AriaDisclosureGroup,
	type DisclosureGroupProps as AriaDisclosureGroupProps,
	DisclosurePanel as AriaDisclosurePanel,
	type DisclosurePanelProps as AriaDisclosurePanelProps,
	type DisclosureProps as AriaDisclosureProps,
	Button,
	composeRenderProps,
	DisclosureGroupStateContext,
	DisclosureStateContext,
	Heading,
} from "react-aria-components";
import { tv } from "tailwind-variants";
import { dbg } from "@/utils/dbg";
import { composeTailwindRenderProps, focusRing } from "./utils";

const disclosure = tv({
	base: "group min-w-64 border border-gray-200 dark:border-zinc-600 rounded-lg text-gray-900",
	variants: {
		isInGroup: {
			true: "border-0 border-b rounded-t-none first:rounded-t-lg last:border-b-0 rounded-b-none last:rounded-b-lg",
		},
	},
});

const disclosureButton = tv({
	extend: focusRing,
	base: "bg-transparent border-0 rounded-lg flex gap-2 items-center w-full text-start p-2 cursor-default",
	variants: {
		isDisabled: {
			true: "text-gray-500 dark:text-zinc-600 forced-colors:text-[GrayText]",
		},
		isInGroup: {
			true: "-outline-offset-2 rounded-none group-first:rounded-t-lg group-last:rounded-b-lg",
		},
	},
});

const chevron = tv({
	base: "w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-200 ease-in-out",
	variants: {
		isExpanded: {
			true: "transform rotate-90",
		},
		isDisabled: {
			true: "text-gray-300 dark:text-zinc-600 forced-colors:text-[GrayText]",
		},
	},
});

export interface DisclosureProps extends AriaDisclosureProps {
	children: React.ReactNode;
}

export function Disclosure({ children, ...props }: DisclosureProps) {
	const isInGroup = useContext(DisclosureGroupStateContext) !== null;

	return (
		<AriaDisclosure
			{...props}
			className={composeRenderProps(props.className, (className, renderProps) =>
				disclosure({ ...renderProps, isInGroup, className }),
			)}
		>
			{children}
		</AriaDisclosure>
	);
}

export interface DisclosureHeaderProps {
	className?: string;
	children: React.ReactNode;
}

export function DisclosureHeader({
	className,
	children,
}: DisclosureHeaderProps) {
	const { isExpanded } = useContext(DisclosureStateContext)!;
	const isInGroup = useContext(DisclosureGroupStateContext) !== null;
	return (
		<Heading className={clsx("text-lg font-semibold m-0", className)}>
			<Button
				slot="trigger"
				className={(renderProps) =>
					dbg(disclosureButton({ ...renderProps, isInGroup }))
				}
			>
				{({ isDisabled }) => (
					<>
						<ChevronRight
							aria-hidden
							className={chevron({ isExpanded, isDisabled })}
						/>
						{children}
					</>
				)}
			</Button>
		</Heading>
	);
}

export interface DisclosurePanelProps extends AriaDisclosurePanelProps {
	children: React.ReactNode;
}

export function DisclosurePanel({ children, ...props }: DisclosurePanelProps) {
	return (
		<AriaDisclosurePanel
			{...props}
			className={composeTailwindRenderProps(
				props.className,
				"h-(--disclosure-panel-height) motion-safe:transition-[height] overflow-clip",
			)}
		>
			<div className="px-4 py-2">{children}</div>
		</AriaDisclosurePanel>
	);
}

export interface DisclosureGroupProps extends AriaDisclosureGroupProps {
	children: React.ReactNode;
}

export function DisclosureGroup({ children, ...props }: DisclosureGroupProps) {
	return (
		<AriaDisclosureGroup
			{...props}
			className={composeTailwindRenderProps(
				props.className,
				"border border-gray-200 dark:border-zinc-600 rounded-lg",
			)}
		>
			{children}
		</AriaDisclosureGroup>
	);
}
