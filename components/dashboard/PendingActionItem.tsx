import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { ElementType } from "react";

export interface PendingActionItemProps {
  icon: ElementType<{ size?: number; className?: string; "aria-hidden"?: boolean }>;
  title: string;
  description: string;
  count: number;
  status: string;
  href: string;
  severity?: "normal" | "warning" | "danger";
}

export function PendingActionItem({
  icon: Icon,
  title,
  description,
  count,
  status,
  href,
  severity = "normal",
}: PendingActionItemProps) {
  const isUrgent = count > 0;

  const countBadgeClasses = {
    normal: isUrgent
      ? "text-slate-800 bg-slate-100 border-slate-200"
      : "text-slate-400 bg-slate-50 border-slate-100",
    warning: isUrgent
      ? "text-amber-800 bg-amber-100 border-amber-300"
      : "text-slate-400 bg-slate-50 border-slate-100",
    danger: isUrgent
      ? "text-red-800 bg-red-100 border-red-300"
      : "text-slate-400 bg-slate-50 border-slate-100",
  }[severity];

  return (
    <Link
      href={href}
      className="pending-action-item group block no-underline p-3 sm:p-3.5 rounded-[var(--radius-md)] border border-slate-200/80 bg-slate-50/40 hover:bg-white hover:border-slate-300 transition-all shadow-none hover:shadow-[var(--shadow-elevation-1)]"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-[var(--radius-sm)] bg-white border border-slate-200 flex items-center justify-center shrink-0 text-slate-600 group-hover:text-[var(--brand-primary)] group-hover:border-emerald-200 transition-colors">
            <Icon size={16} aria-hidden={true} />
          </div>

          <div className="min-w-0">
            <div className="text-xs font-semibold text-slate-900 group-hover:text-[var(--brand-primary)] transition-colors truncate">
              {title}
            </div>
            <div className="text-[11px] text-slate-500 truncate mt-0.5">
              {description}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`text-xs font-bold px-2 py-0.5 rounded-[var(--radius-sm)] border tabular-nums ${countBadgeClasses}`}
          >
            {count} {status}
          </span>
          <ChevronRight
            size={14}
            className="text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all"
            aria-hidden={true}
          />
        </div>
      </div>
    </Link>
  );
}
