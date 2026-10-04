import type { ReactNode } from "react";

export interface FormFieldProps {
  id?: string;
  label?: string;
  required?: boolean;
  error?: string | null;
  hint?: string | null;
  wide?: boolean;
  className?: string;
  children: ReactNode;
}

// Layout wrapper for labels, validation errors, and field hints.
export function FormField({
  id,
  label,
  required,
  error,
  hint,
  wide = false,
  className = "",
  children,
}: FormFieldProps) {
  const containerClasses = [
    "field",
    wide ? "field-wide" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <label className={containerClasses} htmlFor={id}>
      {label ? (
        <span>
          {label} {required ? <b>*</b> : null}
        </span>
      ) : null}
      {children}
      {hint ? <em>{hint}</em> : null}
      {error ? (
        <small id={id ? `${id}-error` : undefined} role="alert">
          {error}
        </small>
      ) : null}
    </label>
  );
}
