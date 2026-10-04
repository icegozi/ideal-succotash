import { type ComponentProps, forwardRef } from "react";

export interface TextareaProps extends ComponentProps<"textarea"> {
  hasError?: boolean;
}

// Multi-line text input for notes and descriptions.
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ hasError, className, rows = 3, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        aria-invalid={hasError || undefined}
        className={className}
        rows={rows}
        {...props}
      />
    );
  },
);
