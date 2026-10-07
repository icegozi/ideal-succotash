import Link from "next/link";
import { RotateCcw, SlidersHorizontal } from "lucide-react";
import { SearchInput, Select } from "@/components/shared/form";

export interface MedicineFilterBarProps {
  query?: string;
  active?: string;
  controlled?: string;
  sort?: string;
  direction?: string;
}

export function MedicineFilterBar({
  query = "",
  active = "ALL",
  controlled = "ALL",
  sort = "code",
}: MedicineFilterBarProps) {
  const isFiltered = Boolean(
    query ||
      (active && active !== "ALL") ||
      (controlled && controlled !== "ALL") ||
      (sort && sort !== "code"),
  );

  return (
    <section
      className="panel bg-white border border-[var(--border-default)] rounded-[var(--radius-lg)] p-3 sm:p-4 shadow-[var(--shadow-elevation-1)]"
      aria-label="Bộ lọc danh mục thuốc"
    >
      <form method="get" className="flex flex-col lg:flex-row items-stretch lg:items-end gap-3">
        {/* Primary Search Input */}
        <div className="flex-1 min-w-[240px]">
          <span className="block text-xs font-semibold text-slate-700 mb-1.5">
            Tìm kiếm thuốc
          </span>
          <SearchInput
            defaultValue={query}
            name="query"
            placeholder="Tìm theo mã thuốc, tên biệt dược hoặc hoạt chất…"
          />
        </div>

        {/* Filter Group */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 lg:w-auto lg:shrink-0">
          {/* 1. Trạng thái */}
          <div>
            <span className="block text-xs font-semibold text-slate-700 mb-1.5">
              Trạng thái
            </span>
            <Select
              defaultValue={active} aria-label="Trạng thái"
              name="active"
              options={[
                { value: "ALL", label: "Tất cả trạng thái" },
                { value: "Y", label: "Đang hoạt động" },
                { value: "N", label: "Ngừng hoạt động" },
              ]}
            />
          </div>

          {/* 2. Quy chế kiểm soát */}
          <div>
            <span className="block text-xs font-semibold text-slate-700 mb-1.5">
              Quy chế quản lý
            </span>
            <Select
              defaultValue={controlled} aria-label="Quy chế quản lý"
              name="controlled"
              options={[
                { value: "ALL", label: "Tất cả quy chế" },
                { value: "Y", label: "Kiểm soát đặc biệt" },
                { value: "N", label: "Thuốc thông thường" },
              ]}
            />
          </div>

          {/* 3. Sắp xếp */}
          <div>
            <span className="block text-xs font-semibold text-slate-700 mb-1.5">
              Sắp xếp theo
            </span>
            <Select
              defaultValue={sort} aria-label="Sắp xếp theo"
              name="sort"
              options={[
                { value: "code", label: "Mã thuốc (A-Z)" },
                { value: "name", label: "Tên thuốc (A-Z)" },
                { value: "minimumStock", label: "Định mức tồn kho" },
              ]}
            />
          </div>
        </div>

        <input type="hidden" name="direction" value="asc" />

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-1 lg:pt-0 shrink-0">
          <button
            type="submit"
            className="btn btn-secondary btn-md flex-1 lg:flex-initial"
            title="Áp dụng bộ lọc tìm kiếm"
          >
            <SlidersHorizontal size={15} aria-hidden="true" />
            <span>Áp dụng</span>
          </button>

          {isFiltered && (
            <Link
              href="/medicines"
              className="btn btn-outline btn-md text-slate-600 hover:text-slate-900 flex-1 lg:flex-initial"
              title="Đặt lại toàn bộ bộ lọc về mặc định"
            >
              <RotateCcw size={14} aria-hidden="true" />
              <span>Đặt lại</span>
            </Link>
          )}
        </div>
      </form>
    </section>
  );
}
