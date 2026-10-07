import type { ReactNode } from "react";

export interface SectionCardProps {
  title: string;
  badge?: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}

export function SectionCard({
  title,
  badge,
  action,
  icon,
  children,
  className = "",
  bodyClassName = "",
}: SectionCardProps) {
  return (
    <section
      className={`panel bg-white border border-[var(--border-default)] rounded-[var(--radius-lg)] shadow-[var(--shadow-elevation-1)] overflow-hidden ${className}`}
    >
      <header className="px-5 py-3.5 border-b border-[var(--border-default)] bg-slate-50/60 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          {icon && <span className="text-slate-600 shrink-0">{icon}</span>}
          <h2 className="text-sm font-semibold text-[var(--text-primary)] m-0 truncate">
            {title}
          </h2>
          {badge}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </header>
      <div className={`p-4 sm:p-5 ${bodyClassName}`}>{children}</div>
    </section>
  );
}
