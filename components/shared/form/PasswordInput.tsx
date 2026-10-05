"use client";

import { type ComponentProps, forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export interface PasswordInputProps extends Omit<ComponentProps<"input">, "type"> {
  hasError?: boolean;
}

// Password input control with an accessible toggle button to show/hide plaintext.
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput({ hasError, className, ...props }, ref) {
    const [showPassword, setShowPassword] = useState(false);

    return (
      <div className="password-input-wrapper">
        <input
          ref={ref}
          type={showPassword ? "text" : "password"}
          aria-invalid={hasError || undefined}
          className={className}
          {...props}
        />
        <button
          type="button"
          tabIndex={-1}
          className="password-toggle-btn"
          onClick={() => setShowPassword((prev) => !prev)}
          aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    );
  },
);
