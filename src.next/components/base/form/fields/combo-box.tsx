import type { Key } from "react-aria-components";
import { ComboBox, ComboBoxItem, type ComboBoxProps } from "../../combo-box";
import type { Option } from "../../select";
import type { FieldProps } from "./shared";

export type ComboBoxFieldProps<T extends Key> = {
  options?: Option<T>[] | null;
} & Omit<ComboBoxProps<T>, "children"> &
  FieldProps;

export function ComboBoxField<T extends Key>({
  field,
  options,
  isDisabled,
  disabledKeys,
  ...props
}: ComboBoxFieldProps<T>) {
  return (
    <ComboBox
      {...props}
      name={field.name}
      items={options || []}
      disabledKeys={disabledKeys}
      selectedKey={field.state.value}
      onSelectionChange={(value) => field.handleChange(value)}
      onOpenChange={(open) => {
        if (!open) {
          field.handleBlur();
        }
      }}
      isInvalid={field.state.meta.isBlurred && !field.state.meta.isValid}
      isDisabled={!Boolean(options) || isDisabled}
    >
      {(item) => <ComboBoxItem id={item.value}>{item.display}</ComboBoxItem>}
    </ComboBox>
  );
}
