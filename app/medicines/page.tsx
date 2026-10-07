import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { ChevronLeft, ChevronRight, PackageSearch, Plus } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { can, permissions, requirePermission } from "@/lib/auth/permissions";
import { getMedicineService } from "@/modules/medicines/services";
import { getInventoryService } from "@/modules/inventory/services";
import type { MedicineListQuery } from "@/modules/medicines/types/medicine.types";
import {
  MedicineStatsOverview,
  MedicineFilterBar,
  MedicineTable,
  MedicineEmptyState,
} from "@/modules/medicines/components";

export const metadata: Metadata = { title: "Danh mục thuốc" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

function pageHref(params: URLSearchParams, page: number) {
  const next = new URLSearchParams(params);
  next.set("page", String(page));
  return `/medicines?${next.toString()}`;
}

export default async function MedicinesPage({ searchParams }: { searchParams: SearchParams }) {
  await connection();
  await requirePermission(permissions.medicineRead);

  const raw = await searchParams;
  const query: MedicineListQuery = {
    query: one(raw.query),
    active: one(raw.active) as MedicineListQuery["active"],
    controlled: one(raw.controlled) as MedicineListQuery["controlled"],
    sort: one(raw.sort) as MedicineListQuery["sort"],
    direction: one(raw.direction) as MedicineListQuery["direction"],
    page: Number(one(raw.page) || 1),
    pageSize: Number(one(raw.pageSize) || 10),
  };

  const medicineService = getMedicineService();
  const inventoryService = getInventoryService();

  // Parallelize list query, counts for KPI metrics, and user permissions
  const [
    result,
    allMedicinesRes,
    activeMedicinesRes,
    controlledMedicinesRes,
    inventoryMetrics,
    canCreate,
    canUpdate,
  ] = await Promise.all([
    medicineService.list(query),
    medicineService.list({ pageSize: 1 }),
    medicineService.list({ active: "Y", pageSize: 1 }),
    medicineService.list({ controlled: "Y", pageSize: 1 }),
    inventoryService.getDashboardMetrics(),
    can(permissions.medicineCreate),
    can(permissions.medicineUpdate),
  ]);

  const isFiltered = Boolean(
    query.query ||
      (query.active && query.active !== "ALL") ||
      (query.controlled && query.controlled !== "ALL") ||
      (query.sort && query.sort !== "code"),
  );

  const keptParams = new URLSearchParams();
  for (const key of ["query", "active", "controlled", "sort", "direction", "pageSize"]) {
    const value = one(raw[key]);
    if (value) keptParams.set(key, value);
  }

  return (
    <div className="page-stack space-y-4 sm:space-y-5">
      {/* 1. Page Header with compact actions */}
      <PageHeader
        title="Danh mục thuốc"
        description="Quản lý thuốc, hoạt chất và định mức tồn kho."
        actions={
          <div className="flex items-center gap-2">
            <Link
              className="btn btn-secondary btn-md"
              href="/inventory"
              title="Tra cứu số dư tồn kho dược phẩm"
            >
              <PackageSearch size={15} aria-hidden="true" />
              <span>Tra cứu tồn kho</span>
            </Link>
            {canCreate && (
              <Link
                className="btn btn-primary btn-md"
                href="/medicines/new"
                title="Khởi tạo thuốc mới trong danh mục"
              >
                <Plus size={16} aria-hidden="true" />
                <span>Thêm thuốc mới</span>
              </Link>
            )}
          </div>
        }
      />

      {/* 2. Medicine KPI Stat Cards */}
      <MedicineStatsOverview
        totalMedicines={allMedicinesRes.total}
        activeMedicines={activeMedicinesRes.total}
        controlledMedicines={controlledMedicinesRes.total}
        lowStockMedicines={inventoryMetrics.lowStockMedicineCount}
      />

      {/* 3. Filter and Search Bar */}
      <MedicineFilterBar
        query={query.query}
        active={query.active}
        controlled={query.controlled}
        sort={query.sort}
        direction={query.direction}
      />

      {/* 4. Medicine Data Presentation */}
      <section className="panel table-panel bg-white border border-[var(--border-default)] rounded-[var(--radius-lg)] shadow-[var(--shadow-elevation-1)] overflow-hidden">
        <div className="table-heading px-4 sm:px-5 py-3 border-b border-[var(--border-default)] flex items-center justify-between">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              Danh sách thuốc ({result.total.toLocaleString("vi-VN")})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {isFiltered
                ? "Đang hiển thị các thuốc phù hợp với bộ lọc tìm kiếm hiện tại"
                : "Toàn bộ danh mục dược phẩm đang quản lý trong hệ thống"}
            </p>
          </div>
          {isFiltered && (
            <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-[var(--radius-sm)]">
              Đang lọc
            </span>
          )}
        </div>

        {result.items.length > 0 ? (
          <>
            <MedicineTable medicines={result.items} canUpdate={canUpdate} />

            {/* Pagination Controls */}
            <footer className="pagination">
              <p>
                Trang {result.page} / {result.totalPages} ({result.total.toLocaleString("vi-VN")} thuốc)
              </p>
              <div>
                <Link
                  className={result.page <= 1 ? "disabled" : ""}
                  aria-disabled={result.page <= 1}
                  href={pageHref(keptParams, Math.max(1, result.page - 1))}
                  title="Trang trước"
                >
                  <ChevronLeft size={16} aria-hidden="true" /> Trước
                </Link>
                <span>{result.page}</span>
                <Link
                  className={result.page >= result.totalPages ? "disabled" : ""}
                  aria-disabled={result.page >= result.totalPages}
                  href={pageHref(keptParams, Math.min(result.totalPages, result.page + 1))}
                  title="Trang sau"
                >
                  Sau <ChevronRight size={16} aria-hidden="true" />
                </Link>
              </div>
            </footer>
          </>
        ) : (
          <MedicineEmptyState isFiltered={isFiltered} canCreate={canCreate} />
        )}
      </section>
    </div>
  );
}
