import {
	TimeField as AriaTimeField,
	type TimeFieldProps as AriaTimeFieldProps,
} from "react-aria-components";
import { Time } from "@internationalized/date";

import { type FieldProps, Label } from "./shared";
import { composeTailwindRenderProps } from "@/components/base/utils";
import { DateInput } from "./date";

export type TimeFieldProps = FieldProps & AriaTimeFieldProps<Time>;

export function TimeField({
	className,
	field,
	label,
	isRequired,
}: TimeFieldProps) {
	return (
		<AriaTimeField
			className={composeTailwindRenderProps(className, "flex flex-col gap-1")}
			isRequired={isRequired}
			value={field.state.value}
			onChange={field.handleChange}
			onBlur={field.handleBlur}
		>
			{label && <Label isRequired={isRequired}>{label}</Label>}

			<DateInput />
		</AriaTimeField>
	);
}
