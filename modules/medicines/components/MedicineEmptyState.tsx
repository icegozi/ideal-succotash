import Link from "next/link";
import { Pill, Plus, RotateCcw, SearchX } from "lucide-react";

export interface MedicineEmptyStateProps {
  isFiltered?: boolean;
  canCreate?: boolean;
}

export function MedicineEmptyState({
  isFiltered = false,
  canCreate = false,
}: MedicineEmptyStateProps) {
  if (isFiltered) {
    return (
      <div className="empty-state py-12 px-4 text-center flex flex-col items-center justify-center">
        <span
          className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mb-3 shadow-inner"
          aria-hidden="true"
        >
          <SearchX size={24} />
        </span>
        <h3 className="text-base font-semibold text-slate-900 mb-1">
          Không tìm thấy thuốc phù hợp
        </h3>
        <p className="text-sm text-slate-500 max-w-sm mb-4">
          Không có thuốc nào thỏa mãn điều kiện tìm kiếm hoặc bộ lọc hiện tại. Thử thay đổi từ khóa hoặc điều kiện lọc.
        </p>
        <Link
          href="/medicines"
          className="btn btn-secondary btn-sm inline-flex items-center gap-1.5"
        >
          <RotateCcw size={14} aria-hidden="true" />
          <span>Đặt lại bộ lọc</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="empty-state py-12 px-4 text-center flex flex-col items-center justify-center">
      <span
        className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 border border-emerald-100"
        aria-hidden="true"
      >
        <Pill size={24} />
      </span>
      <h3 className="text-base font-semibold text-slate-900 mb-1">
        Chưa có thuốc trong danh mục
      </h3>
    </div>
  );
}
