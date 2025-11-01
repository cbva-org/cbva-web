import {
	TextField as AriaTextField,
	Input,
	type TextFieldProps as RACTextFieldProps,
	ToggleButton,
} from "react-aria-components";

import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useState } from "react";

import {
	Description,
	Errors,
	type FieldProps,
	Group,
	Label,
	baseInputStyles,
} from "./shared";

export type PasswordFieldProps = FieldProps & RACTextFieldProps;

export function PasswordField({
	label,
	description,
	field,
	placeholder,
	...props
}: Omit<PasswordFieldProps, "type">) {
	const [isVisible, setVisible] = useState(false);

	return (
		<AriaTextField
			{...props}
			className="flex flex-col gap-1"
			name={field.name}
			onChange={field.handleChange}
			onBlur={field.handleBlur}
			isInvalid={field.state.meta.isBlurred && !field.state.meta.isValid}
		>
			{label && <Label isRequired={props.isRequired}>{label}</Label>}

			<Group>
				<Input
					placeholder={placeholder}
					type={isVisible ? "text" : "password"}
					className={baseInputStyles}
				/>

				<ToggleButton
					excludeFromTabOrder={true}
					isSelected={isVisible}
					onChange={setVisible}
					className="px-3 text-gray-500 cursor-pointer hover:text-gray-600 bg-transparent"
					aria-label="Toggle password visibility"
				>
					{({ isSelected }) =>
						isSelected ? (
							<EyeIcon className="h-4 w-4" />
						) : (
							<EyeOffIcon className="h-4 w-4" />
						)
					}
				</ToggleButton>
			</Group>

			{description && <Description>{description}</Description>}
			<Errors field={field} />
		</AriaTextField>
	);
}
