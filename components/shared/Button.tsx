import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { LoaderCircle } from "lucide-react";

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  isFullWidth?: boolean;
  children?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    isLoading = false,
    leftIcon,
    rightIcon,
    isFullWidth = false,
    disabled,
    className = "",
    children,
    type = "button",
    ...props
  },
  ref,
) {
  const variantClass = `btn-${variant}`;
  const sizeClass = `btn-${size}`;
  const fullWidthClass = isFullWidth ? "btn-full" : "";
  const combinedClasses = ["btn", variantClass, sizeClass, fullWidthClass, className]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || isLoading}
      className={combinedClasses}
      {...props}
    >
      {isLoading ? <LoaderCircle size={16} className="spin" aria-hidden="true" /> : leftIcon}
      {children}
      {!isLoading && rightIcon}
    </button>
  );
});
