import clsx from "clsx";

import { Minus, Plus } from "lucide-react";
import {
	NumberField as AriaNumberField,
	type NumberFieldProps as AriaNumberFieldProps,
	Button,
	type ButtonProps,
	Input,
} from "react-aria-components";
import { useIsMounted } from "@/lib/dom";
import {
	// baseInputStyles,
	Description,
	ErrorsProps,
	// Group,
	Label,
	Errors,
} from "./field";
import { ReactNode } from "react";
import { baseInputStyles, Group } from "./form/fields/shared";

export type NumberInputProps = AriaNumberFieldProps &
	ErrorsProps & {
		label: ReactNode;
		description?: ReactNode;
		placeholder?: string;
		inputClassName?: string;
	};

export function NumberInput({
	className,
	label,
	description,
	placeholder,
	errors,
	inputClassName,
	...props
}: Omit<NumberInputProps, "type">) {
	const isMounted = useIsMounted();

	return (
		<AriaNumberField
			{...props}
			className={clsx(className, "flex flex-col gap-1")}
			isDisabled={!isMounted || props.isDisabled}
		>
			{label && <Label isRequired={props.isRequired}>{label}</Label>}

			<Group className={inputClassName}>
				<StepperButton slot="decrement" className="rounded-l-lg border-e">
					<Minus aria-hidden className="w-4 h-4" />
				</StepperButton>

				<Input
					placeholder={placeholder}
					className={clsx("px-3 py-1.5 text-center", baseInputStyles)}
				/>

				<StepperButton slot="increment" className="rounded-r-lg border-s">
					<Plus aria-hidden className="w-4 h-4" />
				</StepperButton>
			</Group>

			{description && <Description>{description}</Description>}
			<Errors errors={errors} />
		</AriaNumberField>
	);
}

function StepperButton({ className, ...props }: ButtonProps) {
	return (
		<Button
			{...props}
			className={clsx(
				"px-2 py-1.5 cursor-pointer text-gray-600 hover:bg-gray-200 pressed:bg-gray-100",
				"disabled:text-gray-200 forced-colors:group-disabled:text-[GrayText] disabled:cursor-not-allowed disabled:bg-transparent",
				className,
			)}
		/>
	);
}
