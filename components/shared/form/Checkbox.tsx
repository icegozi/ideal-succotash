import { type ComponentProps, type ReactNode, forwardRef } from "react";

export interface CheckboxProps
  extends Omit<ComponentProps<"input">, "type"> {
  label?: ReactNode;
  containerClassName?: string;
}

// Checkbox control with associated label text.
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  function Checkbox(
    { label, containerClassName = "", className = "", id, ...props },
    ref,
  ) {
    return (
      <label
        className={`checkbox-label ${containerClassName}`.trim()}
        htmlFor={id}
      >
        <input
          id={id}
          ref={ref}
          type="checkbox"
          className={className}
          {...props}
        />
        {label ? <span>{label}</span> : null}
      </label>
    );
  },
);
