import { type ComponentProps, forwardRef } from "react";

export interface InputProps extends ComponentProps<"input"> {
  hasError?: boolean;
  isReadonlyView?: boolean;
  readonlyContent?: string;
}

// Standard text and number input with React Hook Form ref support.
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { hasError, isReadonlyView, readonlyContent, className, ...props },
  ref,
) {
  if (isReadonlyView) {
    return (
      <div className="readonly-field">
        {readonlyContent ?? (props.value as string) ?? props.defaultValue}
      </div>
    );
  }

  return (
    <input
      ref={ref}
      aria-invalid={hasError || undefined}
      className={className}
      {...props}
    />
  );
});
