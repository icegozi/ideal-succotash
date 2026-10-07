import Link from "next/link";
import type { ElementType, ReactNode } from "react";

export interface StatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: ElementType<{ size?: number; className?: string; "aria-hidden"?: boolean }>;
  statusBadge?: ReactNode;
  hint?: string;
  href?: string;
  isAlert?: boolean;
  isWarning?: boolean;
  colorVariant?: "emerald" | "teal" | "amber" | "red" | "neutral";
}

export function StatCard({
  title,
  value,
  unit,
  icon: Icon,
  statusBadge,
  hint,
  href,
  isAlert = false,
  isWarning = false,
  colorVariant = "neutral",
}: StatCardProps) {
  const iconColorMap = {
    emerald: "text-emerald-700 bg-emerald-50 border-emerald-200",
    teal: "text-teal-700 bg-teal-50 border-teal-200",
    amber: "text-amber-800 bg-amber-50 border-amber-200",
    red: "text-red-700 bg-red-50 border-red-200",
    neutral: "text-slate-700 bg-slate-50 border-slate-200",
  };

  const borderHighlight = isAlert
    ? "border-red-300 ring-1 ring-red-200/60"
    : isWarning
      ? "border-amber-300 ring-1 ring-amber-200/60"
      : "border-[var(--border-default)]";

  const content = (
    <article
      className={`stat-card panel panel-interactive bg-white border ${borderHighlight} rounded-[var(--radius-lg)] p-4 sm:p-4.5 shadow-[var(--shadow-elevation-1)] transition-all hover:shadow-[var(--shadow-elevation-2)] flex flex-col justify-between gap-3 h-full`}
      title={hint}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`w-8 h-8 rounded-[var(--radius-md)] border flex items-center justify-center shrink-0 ${iconColorMap[colorVariant]}`}
          >
            <Icon size={17} aria-hidden={true} />
          </div>
          <span className="text-xs font-medium text-slate-600 truncate">
            {title}
          </span>
        </div>

        {statusBadge && <div className="shrink-0">{statusBadge}</div>}
      </div>

      <div className="flex items-baseline gap-1.5 mt-1">
        <span className="text-2xl sm:text-[26px] font-bold text-slate-900 tracking-tight tabular-nums">
          {value}
        </span>
        {unit && (
          <span className="text-xs font-normal text-slate-500">
            {unit}
          </span>
        )}
      </div>
    </article>
  );

  if (href) {
    return (
      <Link href={href} className="block no-underline group focus:outline-none">
        {content}
      </Link>
    );
  }

  return content;
}
