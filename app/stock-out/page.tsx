import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Eye,
  Plus,
  SlidersHorizontal,
} from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/shared/Badge";
import { SearchInput, Select } from "@/components/shared/form";
import { can, requirePermission, permissions } from "@/lib/auth/permissions";
import { DocumentStatusBadge } from "@/modules/inventory/components/StockStatusBadge";
import { getStockOutService, getInventoryService } from "@/modules/inventory/services";
import type { StockIssueListQuery } from "@/modules/inventory/types/inventory.types";

export const metadata: Metadata = { title: "Danh sách phiếu xuất kho" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const one = (val: string | string[] | undefined) => (Array.isArray(val) ? val[0] : val);

function pageHref(params: URLSearchParams, page: number) {
  const next = new URLSearchParams(params);
  next.set("page", String(page));
  return `/stock-out?${next.toString()}`;
}

export default async function StockOutListPage({ searchParams }: { searchParams: SearchParams }) {
  await connection();
  await requirePermission(permissions.stockOutRead);

  const raw = await searchParams;
  const rawWarehouse = one(raw.warehouseId);
  const warehouseId = rawWarehouse && rawWarehouse !== "ALL" ? Number(rawWarehouse) : "ALL";

  const query: StockIssueListQuery = {
    query: one(raw.query),
    warehouseId,
    status: one(raw.status) as StockIssueListQuery["status"],
    issueType: one(raw.issueType) as StockIssueListQuery["issueType"],
    fromDate: one(raw.fromDate),
    toDate: one(raw.toDate),
    page: Number(one(raw.page) || 1),
    pageSize: Number(one(raw.pageSize) || 10),
  };

  const [issuesPage, warehouses, canCreate] = await Promise.all([
    getStockOutService().listIssues(query),
    getInventoryService().listWarehouses(),
    can(permissions.stockOutCreate),
  ]);

  const keptParams = new URLSearchParams();
  for (const key of ["query", "warehouseId", "status", "issueType", "fromDate", "toDate", "pageSize"]) {
    const value = one(raw[key]);
    if (value) keptParams.set(key, value);
  }

  const getIssueTypeLabel = (type: string) => {
    switch (type) {
      case "DEPARTMENT_ISSUE": return "Khoa phòng";
      case "PATIENT_ISSUE": return "Bệnh nhân";
      case "TRANSFER": return "Chuyển kho";
      case "DISPOSAL": return "Hủy";
      default: return "Khác";
    }
  };

  return (
    <div className="page-stack">
      <PageHeader
        title="Xuất kho dược phẩm (FEFO)"
        description="Quản lý phiếu xuất và cấp phát thuốc theo FEFO."
        actions={
          canCreate ? (
            <Link className="btn btn-primary" href="/stock-out/new">
              <Plus size={16} /> Tạo phiếu xuất mới
            </Link>
          ) : undefined
        }
      />

      {/* Filter Panel */}
      <section className="panel filter-panel">
        <form className="filter-form" method="get">
          <SearchInput
            defaultValue={one(raw.query)}
            name="query"
            placeholder="Tìm theo mã phiếu, người nhận, khoa phòng hoặc tên thuốc…"
          />

          <label>
            <span>Kho xuất</span>
            <Select
              defaultValue={one(raw.warehouseId) || "ALL"}
              name="warehouseId"
              options={[
                { value: "ALL", label: "Tất cả kho" },
                ...warehouses.map((w) => ({ value: w.id, label: w.name })),
              ]}
            />
          </label>

          <label>
            <span>Trạng thái</span>
            <Select
              defaultValue={one(raw.status) || "ALL"}
              name="status"
              options={[
                { value: "ALL", label: "Tất cả trạng thái" },
                { value: "DRAFT", label: "Bản nháp" },
                { value: "CONFIRMED", label: "Đã xác nhận" },
                { value: "CANCELLED", label: "Đã hủy" },
              ]}
            />
          </label>

          <label>
            <span>Loại xuất</span>
            <Select
              defaultValue={one(raw.issueType) || "ALL"}
              name="issueType"
              options={[
                { value: "ALL", label: "Tất cả loại" },
                { value: "DEPARTMENT_ISSUE", label: "Khoa phòng" },
                { value: "PATIENT_ISSUE", label: "Bệnh nhân" },
                { value: "TRANSFER", label: "Chuyển kho" },
                { value: "DISPOSAL", label: "Hủy" },
              ]}
            />
          </label>

          <button className="btn btn-secondary" type="submit">
            <SlidersHorizontal size={16} /> Áp dụng
          </button>
        </form>
      </section>

      {/* Issues Main Panel (Dual View: Desktop Table + Mobile Cards) */}
      <section className="panel table-panel">
        <div className="table-heading">
          <div>
            <h2>Danh sách phiếu xuất kho</h2>
            <p>{issuesPage.total.toLocaleString("vi-VN")} phiếu phù hợp</p>
          </div>
        </div>

        {issuesPage.items.length ? (
          <>
            {/* Desktop Table View */}
            <div className="desktop-table-view">
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Mã phiếu</th>
                      <th>Ngày xuất</th>
                      <th>Kho xuất</th>
                      <th>Loại xuất</th>
                      <th>Người / Đơn vị nhận</th>
                      <th>Khoa / Phòng</th>
                      <th className="number-cell">Số mặt hàng</th>
                      <th className="number-cell">Tổng số lượng</th>
                      <th>Trạng thái</th>
                      <th>Người tạo</th>
                      <th>Xác nhận bởi</th>
                      <th>
                        <span className="sr-only">Thao tác</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {issuesPage.items.map((is) => (
                      <tr key={is.id}>
                        <td>
                          <Link className="code-link" href={`/stock-out/${is.id}`}>
                            {is.issueCode}
                          </Link>
                        </td>
                        <td>{is.issueDate}</td>
                        <td>{is.warehouseName}</td>
                        <td>
                          <Badge variant="info">{getIssueTypeLabel(is.issueType)}</Badge>
                        </td>
                        <td><strong>{is.receiver}</strong></td>
                        <td>{is.departmentName || "—"}</td>
                        <td className="number-cell">{is.totalItems}</td>
                        <td className="number-cell" style={{ fontWeight: 700, color: "var(--status-danger-text)" }}>
                          -{is.totalQuantity.toLocaleString("vi-VN")}
                        </td>
                        <td>
                          <DocumentStatusBadge status={is.status} />
                        </td>
                        <td>{is.createdBy}</td>
                        <td>
                          {is.confirmedBy ? (
                            <span>
                              {is.confirmedBy}
                              <small style={{ display: "block", color: "var(--text-muted)" }}>
                                {is.confirmedAt?.split(" ")[0]}
                              </small>
                            </span>
                          ) : (
                            <span className="muted">—</span>
                          )}
                        </td>
                        <td>
                          <div className="row-actions">
                            <Link href={`/stock-out/${is.id}`} title="Xem chi tiết phiếu xuất & phân bổ FEFO" aria-label={`Xem chi tiết ${is.issueCode}`}>
                              <Eye size={16} />
                            </Link>
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
                {issuesPage.items.map((is) => (
                  <article key={`mob-${is.id}`} className="data-card">
                    <div className="data-card-header">
                      <div>
                        <Link className="code-link" href={`/stock-out/${is.id}`}>
                          {is.issueCode}
                        </Link>
                        <h3 className="data-card-title">{is.receiver}</h3>
                        <p className="data-card-subtitle">
                          {is.departmentName ? `Khoa/Phòng: ${is.departmentName}` : `Kho: ${is.warehouseName}`}
                        </p>
                      </div>
                      <DocumentStatusBadge status={is.status} />
                    </div>

                    <div className="data-card-grid">
                      <div className="data-card-prop">
                        <span className="data-card-prop-label">Loại xuất</span>
                        <div>
                          <Badge variant="info">{getIssueTypeLabel(is.issueType)}</Badge>
                        </div>
                      </div>
                      <div className="data-card-prop">
                        <span className="data-card-prop-label">Ngày xuất</span>
                        <span className="data-card-prop-val">{is.issueDate}</span>
                      </div>
                      <div className="data-card-prop">
                        <span className="data-card-prop-label">Số mặt hàng</span>
                        <span className="data-card-prop-val">{is.totalItems} loại</span>
                      </div>
                      <div className="data-card-prop">
                        <span className="data-card-prop-label">Tổng số lượng</span>
                        <span className="data-card-prop-val" style={{ color: "var(--status-danger-text)", fontWeight: 750 }}>
                          -{is.totalQuantity.toLocaleString("vi-VN")}
                        </span>
                      </div>
                    </div>

                    <div className="data-card-footer">
                      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                        Kho: {is.warehouseName}
                      </span>
                      <Link className="btn btn-secondary btn-sm" href={`/stock-out/${is.id}`}>
                        Chi tiết FEFO <ArrowRight size={14} />
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="empty-state">
            <span>
              <ClipboardList size={24} />
            </span>
            <h3>Không tìm thấy phiếu xuất nào</h3>
          </div>
        )}

        <footer className="pagination">
          <p>
            Trang {issuesPage.page} / {issuesPage.totalPages} ({issuesPage.total.toLocaleString("vi-VN")} phiếu)
          </p>
          <div>
            <Link
              className={issuesPage.page <= 1 ? "disabled" : ""}
              aria-disabled={issuesPage.page <= 1}
              href={pageHref(keptParams, Math.max(1, issuesPage.page - 1))}
            >
              <ChevronLeft size={16} /> Trước
            </Link>
            <span>{issuesPage.page}</span>
            <Link
              className={issuesPage.page >= issuesPage.totalPages ? "disabled" : ""}
              aria-disabled={issuesPage.page >= issuesPage.totalPages}
              href={pageHref(keptParams, Math.min(issuesPage.totalPages, issuesPage.page + 1))}
            >
              Sau <ChevronRight size={16} />
            </Link>
          </div>
        </footer>
      </section>
    </div>
  );
}
