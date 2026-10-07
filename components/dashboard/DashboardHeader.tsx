import { QuickActions } from "./QuickActions";

export function DashboardHeader() {
  return (
    <header className="dashboard-header flex flex-col md:flex-row md:items-center justify-between gap-4 py-2 border-b border-[var(--border-subtle)] pb-4">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] tracking-tight m-0">
          Tổng quan kho
        </h1>
        <p className="text-xs sm:text-[13px] text-slate-500 m-0 mt-1">
          Theo dõi tồn kho, FEFO và các cảnh báo cần xử lý.
        </p>
      </div>

      <div className="shrink-0">
        <QuickActions />
      </div>
    </header>
  );
}
