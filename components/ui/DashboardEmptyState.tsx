import type { ReactNode } from "react";
import { CheckCircle2 } from "lucide-react";

export interface DashboardEmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

export function DashboardEmptyState({
  icon = <CheckCircle2 size={24} className="text-emerald-600" />,
  title,
  description,
  action,
  className = "",
}: DashboardEmptyStateProps) {
  return (
    <div
      className={`py-8 px-4 text-center flex flex-col items-center justify-center gap-2 text-slate-500 ${className}`}
    >
      <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0 mb-1">
        {icon}
      </div>
      <h3 className="text-xs font-semibold text-slate-800 m-0">{title}</h3>
      <p className="text-[11.5px] text-slate-500 m-0 max-w-sm leading-relaxed">
        {description}
      </p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
