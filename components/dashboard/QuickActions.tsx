import Link from "next/link";
import { ArrowDownToLine, ArrowUpFromLine, ClipboardCheck, Search } from "lucide-react";

export function QuickActions({ className = "" }: { className?: string }) {
  return (
    <div className={`quick-actions-container ${className}`}>
      <Link
        href="/stock-out/new"
        className="btn btn-primary btn-sm flex-1 sm:flex-initial"
        title="Xuất kho theo thuật toán FEFO ưu tiên hạn dùng gần nhất"
      >
        <ArrowUpFromLine size={15} aria-hidden="true" />
        <span>Xuất kho FEFO</span>
      </Link>

      <Link
        href="/stock-in/new"
        className="btn btn-secondary btn-sm flex-1 sm:flex-initial"
        title="Tạo phiếu nhập kho từ nhà cung cấp"
      >
        <ArrowDownToLine size={15} aria-hidden="true" />
        <span>Nhập kho</span>
      </Link>

      <Link
        href="/inventory"
        className="btn btn-outline btn-sm flex-1 sm:flex-initial"
        title="Tra cứu danh sách thuốc và tồn kho theo lô"
      >
        <Search size={14} aria-hidden="true" />
        <span>Tra cứu kho</span>
      </Link>

      <span
        className="btn btn-outline btn-sm opacity-60 cursor-not-allowed flex-1 sm:flex-initial hidden md:inline-flex"
        title="Tính năng kiểm kê kho nâng cao đang phát triển"
      >
        <ClipboardCheck size={14} aria-hidden="true" />
        <span>Kiểm kê</span>
        <small className="text-[9px] uppercase tracking-wider text-slate-500 font-bold ml-1">
          Sắp có
        </small>
      </span>
    </div>
  );
}
