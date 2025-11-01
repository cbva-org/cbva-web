import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import clsx from "clsx";
import type { ReactNode } from "react";

import { type AlertProps, Alert as BaseAlert } from "@/components/base/alert";
import { Button, type ButtonProps } from "@/components/base/button";

import { ComboBoxField } from "./fields/combo-box";
import { DateField } from "./fields/date";
import { DatePickerField } from "./fields/date-picker";
import { ImageField } from "./fields/image";
import { MultiSelectField } from "./fields/multi-select";
import { NumberField } from "./fields/number";
import { PasswordField } from "./fields/password";
import { SelectField } from "./fields/select";
import { TextField } from "./fields/text";
import { TextAreaField } from "./fields/text-area";
import { TimeField } from "./fields/time";

function Alert({ className, ...props }: AlertProps) {
  return <BaseAlert className={clsx("mb-2", className)} {...props} />;
}

function Footer({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={clsx("mt-4 flex gap-4 justify-end", className)}>
      {children}
    </div>
  );
}

function Row({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={clsx("flex flex-row gap-3 items-end", className)}>
      {children}
    </div>
  );
}

const { fieldContext, formContext, useFormContext } = createFormHookContexts();

function SubmitButton({
  isDisabled,
  className,
  children = <>Submit</>,
  ...props
}: Omit<ButtonProps, "type">) {
  const form = useFormContext();

  return (
    <form.Subscribe
      selector={(state) => [state.canSubmit, state.isSubmitting]}
      children={([canSubmit, isSubmitting]) => (
        <Button
          type="submit"
          color="primary"
          className={clsx(className)}
          isDisabled={!canSubmit || isSubmitting || isDisabled}
          {...props}
        >
          {children}
        </Button>
      )}
    />
  );
}

function StateDebugger({ className }: { className: string }) {
  const form = useFormContext();

  return (
    <form.Subscribe
      selector={({ values, errors }) => [values, errors]}
      children={([values, errors]) => (
        <pre className={className}>
          {JSON.stringify({ values, errors }, null, 2)}
        </pre>
      )}
    />
  );
}

export const { useAppForm } = createFormHook({
  fieldComponents: {
    Text: TextField,
    Password: PasswordField,
    TextArea: TextAreaField,
    Number: NumberField,
    Select: SelectField,
    ComboBox: ComboBoxField,
    Image: ImageField,
    Date: DateField,
    DatePicker: DatePickerField,
    Time: TimeField,
    MultiSelect: MultiSelectField,
  },
  formComponents: {
    Alert,
    SubmitButton,
    Button,
    Footer,
    Row,
    StateDebugger,
  },
  fieldContext,
  formContext,
});
