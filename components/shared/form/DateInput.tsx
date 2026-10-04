import { type ComponentProps, forwardRef } from "react";

export interface DateInputProps
  extends Omit<ComponentProps<"input">, "type"> {
  hasError?: boolean;
}

// Normalized HTML5 date input supporting YYYY-MM-DD values.
export const DateInput = forwardRef<HTMLInputElement, DateInputProps>(
  function DateInput({ hasError, className, ...props }, ref) {
    return (
      <input
        ref={ref}
        type="date"
        aria-invalid={hasError || undefined}
        className={className}
        {...props}
      />
    );
  },
);
