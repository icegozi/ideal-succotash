import { type ComponentProps, forwardRef } from "react";

export interface SelectOption {
  label: string;
  value: string | number;
  disabled?: boolean;
}

export interface SelectProps extends ComponentProps<"select"> {
  hasError?: boolean;
  options?: SelectOption[];
  emptyOptionLabel?: string;
}

// Select dropdown supporting both options prop and custom children.
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { hasError, options, emptyOptionLabel, children, className, ...props },
  ref,
) {
  return (
    <select
      ref={ref}
      aria-invalid={hasError || undefined}
      className={className}
      {...props}
    >
      {emptyOptionLabel !== undefined ? (
        <option value="">{emptyOptionLabel}</option>
      ) : null}
      {options
        ? options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))
        : children}
    </select>
  );
});
