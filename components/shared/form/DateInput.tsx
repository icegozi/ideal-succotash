"use client";

import { type ComponentProps, forwardRef, useRef } from "react";
import { Calendar } from "lucide-react";

export interface DateInputProps
  extends Omit<ComponentProps<"input">, "type"> {
  hasError?: boolean;
}

// Normalized HTML5 date input supporting YYYY-MM-DD values with right-aligned icon.
export const DateInput = forwardRef<HTMLInputElement, DateInputProps>(
  function DateInput({ hasError, className, ...props }, ref) {
    const inputRef = useRef<HTMLInputElement | null>(null);
    const combinedClassName = [
      "date-input",
      hasError && "has-error",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    const handleIconClick = () => {
      const el = inputRef.current;
      if (!el) return;
      if (typeof el.showPicker === "function") {
        try {
          el.showPicker();
        } catch {
          el.focus();
        }
      } else {
        el.focus();
      }
    };

    return (
      <div className="date-input-wrapper">
        <input
          ref={(node) => {
            inputRef.current = node;
            if (typeof ref === "function") {
              ref(node);
            } else if (ref) {
              ref.current = node;
            }
          }}
          type="date"
          aria-invalid={hasError || undefined}
          className={combinedClassName}
          {...props}
        />
        <button
          type="button"
          tabIndex={-1}
          aria-label="Chọn ngày"
          className="date-input-trigger"
          onClick={handleIconClick}
        >
          <Calendar size={16} className="date-picker-icon" aria-hidden="true" />
        </button>
      </div>
    );
  },
);
