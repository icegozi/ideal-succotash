import type { ReactNode } from "react";
import { Badge } from "@/components/shared/Badge";

export function StatusBadge({
  active,
  children,
}: {
  active: boolean;
  children: ReactNode;
}) {
  return (
    <Badge variant={active ? "success" : "neutral"} showDot>
      {children}
    </Badge>
  );
}
