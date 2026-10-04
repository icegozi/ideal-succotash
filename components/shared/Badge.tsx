import type { ReactNode } from "react";

export type BadgeVariant = "success" | "warning" | "danger" | "info" | "neutral";

export interface BadgeProps {
  variant?: BadgeVariant;
  showDot?: boolean;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Badge({
  variant = "neutral",
  showDot = false,
  icon,
  children,
  className = "",
}: BadgeProps) {
  const variantClass = `badge-${variant}`;
  const combined = ["badge", variantClass, className].filter(Boolean).join(" ");

  return (
    <span className={combined}>
      {showDot && <span className="badge-dot" aria-hidden="true" />}
      {icon && <span className="badge-icon" aria-hidden="true">{icon}</span>}
      <span>{children}</span>
    </span>
  );
}
