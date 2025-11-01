import {
	NumberField as AriaNumberField,
	type NumberFieldProps as AriaNumberFieldProps,
	Button,
	type ButtonProps,
	Input,
} from "react-aria-components";

import { ChevronDown, ChevronUp } from "lucide-react";

import clsx from "clsx";
import {
	Description,
	Errors,
	type FieldProps,
	Group,
	Label,
	baseInputStyles,
} from "./shared";

export type NumberFieldProps = FieldProps & AriaNumberFieldProps;

export function NumberField({
	className,
	label,
	description,
	field,
	placeholder,
	...props
}: Omit<NumberFieldProps, "type">) {
	return (
		<AriaNumberField
			{...props}
			className={clsx(className, "flex flex-col gap-1")}
			name={field.name}
			value={field.state.value}
			onChange={field.handleChange}
			onBlur={field.handleBlur}
			isInvalid={field.state.meta.isBlurred && !field.state.meta.isValid}
		>
			{label && <Label isRequired={props.isRequired}>{label}</Label>}

			<Group>
				<Input
					placeholder={placeholder}
					className={clsx("pl-3 py-1.5", baseInputStyles)}
				/>

				<div className="flex flex-col rounded-r-lg border-s-1 overflow-hidden">
					<StepperButton slot="increment">
						<ChevronUp aria-hidden className="w-4 h-4" />
					</StepperButton>
					<div className="border-b-1" />
					<StepperButton slot="decrement">
						<ChevronDown aria-hidden className="w-4 h-4" />
					</StepperButton>
				</div>
			</Group>

			{description && <Description>{description}</Description>}
			<Errors field={field} />
		</AriaNumberField>
	);
}

function StepperButton(props: ButtonProps) {
	return (
		<Button
			{...props}
			className={clsx(
				"px-0.5 cursor-pointer text-gray-600 hover:bg-gray-200 pressed:bg-gray-100 group-disabled:text-gray-200 forced-colors:group-disabled:text-[GrayText]",
			)}
		/>
	);
}
