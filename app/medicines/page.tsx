import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { ArrowRight, ChevronLeft, ChevronRight, Eye, Pencil, Pill, Plus, SlidersHorizontal } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/shared/Badge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { SearchInput, Select } from "@/components/shared/form";
import { can, permissions, requirePermission } from "@/lib/auth/permissions";
import { getMedicineService } from "@/modules/medicines/services";
import type { MedicineListQuery } from "@/modules/medicines/types/medicine.types";

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
  const [result, canCreate, canUpdate] = await Promise.all([
    getMedicineService().list(query),
    can(permissions.medicineCreate),
    can(permissions.medicineUpdate),
  ]);
  const keptParams = new URLSearchParams();
  for (const key of ["query", "active", "controlled", "sort", "direction", "pageSize"]) {
    const value = one(raw[key]);
    if (value) keptParams.set(key, value);
  }

  return (
    <div className="page-stack">
      <PageHeader
        title="Danh mục thuốc"
        description="Quản lý thông tin chuẩn, đơn vị cơ sở và ngưỡng tồn của từng thuốc."
        actions={
          canCreate ? (
            <Link className="btn btn-primary" href="/medicines/new">
              <Plus size={16} /> Thêm thuốc mới
            </Link>
          ) : undefined
        }
      />

      <section className="panel filter-panel">
        <form className="filter-form" method="get">
          <SearchInput
            defaultValue={one(raw.query)}
            name="query"
            placeholder="Tìm theo mã, tên hoặc hoạt chất…"
          />
          <label>
            <span>Trạng thái</span>
            <Select
              defaultValue={one(raw.active) || "ALL"}
              name="active"
              options={[
                { value: "ALL", label: "Tất cả" },
                { value: "Y", label: "Đang hoạt động" },
                { value: "N", label: "Ngừng hoạt động" },
              ]}
            />
          </label>
          <label>
            <span>Kiểm soát</span>
            <Select
              defaultValue={one(raw.controlled) || "ALL"}
              name="controlled"
              options={[
                { value: "ALL", label: "Tất cả" },
                { value: "Y", label: "Có kiểm soát" },
                { value: "N", label: "Thông thường" },
              ]}
            />
          </label>
          <label>
            <span>Sắp xếp</span>
            <Select
              defaultValue={one(raw.sort) || "code"}
              name="sort"
              options={[
                { value: "code", label: "Mã thuốc" },
                { value: "name", label: "Tên thuốc" },
                { value: "minimumStock", label: "Tồn tối thiểu" },
              ]}
            />
          </label>
          <input type="hidden" name="direction" value="asc" />
          <button className="btn btn-secondary" type="submit">
            <SlidersHorizontal size={16} /> Áp dụng
          </button>
        </form>
      </section>

      <section className="panel table-panel">
        <div className="table-heading">
          <div>
            <h2>Thuốc trong danh mục</h2>
            <p>{result.total.toLocaleString("vi-VN")} bản ghi phù hợp</p>
          </div>
        </div>

        {result.items.length ? (
          <>
            {/* Desktop Table View */}
            <div className="desktop-table-view">
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Mã thuốc</th>
                      <th>Tên thuốc</th>
                      <th>Đơn vị</th>
                      <th className="number-cell">Tồn tối thiểu</th>
                      <th>Kiểm soát</th>
                      <th>Trạng thái</th>
                      <th>
                        <span className="sr-only">Thao tác</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.items.map((medicine) => (
                      <tr key={medicine.id}>
                        <td>
                          <Link className="code-link" href={`/medicines/${medicine.id}`}>
                            {medicine.code}
                          </Link>
                        </td>
                        <td>
                          <div className="medicine-name">
                            <span className="table-icon">
                              <Pill size={17} />
                            </span>
                            <span>
                              <strong>{medicine.name}</strong>
                              <small>
                                {[medicine.activeIngredient, medicine.strength]
                                  .filter(Boolean)
                                  .join(" · ") || "Chưa có hoạt chất"}
                              </small>
                            </span>
                          </div>
                        </td>
                        <td>{medicine.baseUnitName}</td>
                        <td className="number-cell">{medicine.minimumStock.toLocaleString("vi-VN")}</td>
                        <td>
                          {medicine.controlled === "Y" ? (
                            <Badge variant="warning">Kiểm soát</Badge>
                          ) : (
                            <span className="muted">Thông thường</span>
                          )}
                        </td>
                        <td>
                          <StatusBadge active={medicine.active === "Y"}>
                            {medicine.active === "Y" ? "Hoạt động" : "Đã ngừng"}
                          </StatusBadge>
                        </td>
                        <td>
                          <div className="row-actions">
                            <Link href={`/medicines/${medicine.id}`} aria-label={`Xem ${medicine.name}`} title="Xem chi tiết">
                              <Eye size={16} />
                            </Link>
                            {canUpdate ? (
                              <Link href={`/medicines/${medicine.id}/edit`} aria-label={`Sửa ${medicine.name}`} title="Chỉnh sửa">
                                <Pencil size={15} />
                              </Link>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Touch Cards View */}
            <div className="mobile-card-view">
              <div className="data-card-list">
                {result.items.map((medicine) => (
                  <article key={`mob-${medicine.id}`} className="data-card">
                    <div className="data-card-header">
                      <div>
                        <Link className="code-link" href={`/medicines/${medicine.id}`}>
                          {medicine.code}
                        </Link>
                        <h3 className="data-card-title">{medicine.name}</h3>
                        <p className="data-card-subtitle">
                          {[medicine.activeIngredient, medicine.strength].filter(Boolean).join(" · ") ||
                            "Chưa có hoạt chất"}
                        </p>
                      </div>
                      <StatusBadge active={medicine.active === "Y"}>
                        {medicine.active === "Y" ? "Hoạt động" : "Đã ngừng"}
                      </StatusBadge>
                    </div>

                    <div className="data-card-grid">
                      <div className="data-card-prop">
                        <span className="data-card-prop-label">Đơn vị cơ sở</span>
                        <span className="data-card-prop-val">{medicine.baseUnitName}</span>
                      </div>
                      <div className="data-card-prop">
                        <span className="data-card-prop-label">Tồn tối thiểu</span>
                        <span className="data-card-prop-val">
                          {medicine.minimumStock.toLocaleString("vi-VN")} {medicine.baseUnitName}
                        </span>
                      </div>
                      <div className="data-card-prop">
                        <span className="data-card-prop-label">Kiểm soát đặc biệt</span>
                        <div>
                          {medicine.controlled === "Y" ? (
                            <Badge variant="warning">Có kiểm soát</Badge>
                          ) : (
                            <span className="muted">Không</span>
                          )}
                        </div>
                      </div>
                      <div className="data-card-prop">
                        <span className="data-card-prop-label">Dạng bào chế</span>
                        <span className="data-card-prop-val">{medicine.dosageForm || "—"}</span>
                      </div>
                    </div>

                    <div className="data-card-footer">
                      <Link className="btn btn-secondary btn-sm" href={`/medicines/${medicine.id}`}>
                        Chi tiết <ArrowRight size={14} />
                      </Link>

                      {canUpdate && (
                        <Link className="btn btn-secondary btn-sm" href={`/medicines/${medicine.id}/edit`}>
                          <Pencil size={14} /> Sửa
                        </Link>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="empty-state">
            <span>
              <Pill size={24} />
            </span>
            <h3>Không tìm thấy thuốc</h3>
            <p>Thử thay đổi từ khóa hoặc bộ lọc hiện tại.</p>
          </div>
        )}

        <footer className="pagination">
          <p>
            Trang {result.page} / {result.totalPages} ({result.total.toLocaleString("vi-VN")} thuốc)
          </p>
          <div>
            <Link
              className={result.page <= 1 ? "disabled" : ""}
              aria-disabled={result.page <= 1}
              href={pageHref(keptParams, Math.max(1, result.page - 1))}
            >
              <ChevronLeft size={16} /> Trước
            </Link>
            <span>{result.page}</span>
            <Link
              className={result.page >= result.totalPages ? "disabled" : ""}
              aria-disabled={result.page >= result.totalPages}
              href={pageHref(keptParams, Math.min(result.totalPages, result.page + 1))}
            >
              Sau <ChevronRight size={16} />
            </Link>
          </div>
        </footer>
      </section>
    </div>
  );
}
