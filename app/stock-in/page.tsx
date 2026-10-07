import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Eye,
  Plus,
  SlidersHorizontal,
  Truck,
} from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { DateInput, SearchInput, Select } from "@/components/shared/form";
import { can, requirePermission, permissions } from "@/lib/auth/permissions";
import { DocumentStatusBadge } from "@/modules/inventory/components/StockStatusBadge";
import { getStockInService, getInventoryService } from "@/modules/inventory/services";
import type { StockReceiptListQuery } from "@/modules/inventory/types/inventory.types";

export const metadata: Metadata = { title: "Danh sách phiếu nhập kho" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const one = (val: string | string[] | undefined) => (Array.isArray(val) ? val[0] : val);

function pageHref(params: URLSearchParams, page: number) {
  const next = new URLSearchParams(params);
  next.set("page", String(page));
  return `/stock-in?${next.toString()}`;
}

export default async function StockInListPage({ searchParams }: { searchParams: SearchParams }) {
  await connection();
  await requirePermission(permissions.stockInRead);

  const raw = await searchParams;
  const rawWarehouse = one(raw.warehouseId);
  const warehouseId = rawWarehouse && rawWarehouse !== "ALL" ? Number(rawWarehouse) : "ALL";

  const query: StockReceiptListQuery = {
    query: one(raw.query),
    warehouseId,
    status: one(raw.status) as StockReceiptListQuery["status"],
    fromDate: one(raw.fromDate),
    toDate: one(raw.toDate),
    page: Number(one(raw.page) || 1),
    pageSize: Number(one(raw.pageSize) || 10),
  };

  const [receiptsPage, warehouses, canCreate] = await Promise.all([
    getStockInService().listReceipts(query),
    getInventoryService().listWarehouses(),
    can(permissions.stockInCreate),
  ]);

  const keptParams = new URLSearchParams();
  for (const key of ["query", "warehouseId", "status", "fromDate", "toDate", "pageSize"]) {
    const value = one(raw[key]);
    if (value) keptParams.set(key, value);
  }

  return (
    <div className="page-stack">
      <PageHeader
        title="Nhập kho dược phẩm"
        description="Quản lý phiếu nhập, nhà cung cấp và lô thuốc."
        actions={
          canCreate ? (
            <Link className="btn btn-primary" href="/stock-in/new">
              <Plus size={16} /> Tạo phiếu nhập mới
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
            placeholder="Tìm theo mã phiếu, nhà cung cấp hoặc số hóa đơn…"
          />

          <label>
            <span>Kho nhận</span>
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
            <span>Từ ngày</span>
            <DateInput name="fromDate" defaultValue={one(raw.fromDate)} />
          </label>

          <button className="btn btn-secondary" type="submit">
            <SlidersHorizontal size={16} /> Áp dụng
          </button>
        </form>
      </section>

      {/* Receipts Main Panel (Dual View: Desktop Table + Mobile Cards) */}
      <section className="panel table-panel">
        <div className="table-heading">
          <div>
            <h2>Danh sách phiếu nhập kho</h2>
            <p>{receiptsPage.total.toLocaleString("vi-VN")} phiếu phù hợp</p>
          </div>
        </div>

        {receiptsPage.items.length ? (
          <>
            {/* Desktop Table View */}
            <div className="desktop-table-view">
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Mã phiếu</th>
                      <th>Ngày nhập</th>
                      <th>Kho nhận</th>
                      <th>Nhà cung cấp</th>
                      <th>Số chứng từ</th>
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
                    {receiptsPage.items.map((rc) => (
                      <tr key={rc.id}>
                        <td>
                          <Link className="code-link" href={`/stock-in/${rc.id}`}>
                            {rc.receiptCode}
                          </Link>
                        </td>
                        <td>{rc.receiptDate}</td>
                        <td>{rc.warehouseName}</td>
                        <td><strong>{rc.supplierName}</strong></td>
                        <td>{rc.documentNumber || "—"}</td>
                        <td className="number-cell">{rc.totalItems}</td>
                        <td className="number-cell" style={{ fontWeight: 700, color: "var(--brand-primary)" }}>
                          +{rc.totalQuantity.toLocaleString("vi-VN")}
                        </td>
                        <td>
                          <DocumentStatusBadge status={rc.status} />
                        </td>
                        <td>{rc.createdBy}</td>
                        <td>
                          {rc.confirmedBy ? (
                            <span>
                              {rc.confirmedBy}
                              <small style={{ display: "block", color: "var(--text-muted)" }}>
                                {rc.confirmedAt?.split(" ")[0]}
                              </small>
                            </span>
                          ) : (
                            <span className="muted">—</span>
                          )}
                        </td>
                        <td>
                          <div className="row-actions">
                            <Link href={`/stock-in/${rc.id}`} title="Xem chi tiết phiếu nhập" aria-label={`Xem chi tiết ${rc.receiptCode}`}>
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
                {receiptsPage.items.map((rc) => (
                  <article key={`mob-${rc.id}`} className="data-card">
                    <div className="data-card-header">
                      <div>
                        <Link className="code-link" href={`/stock-in/${rc.id}`}>
                          {rc.receiptCode}
                        </Link>
                        <h3 className="data-card-title">{rc.supplierName}</h3>
                        <p className="data-card-subtitle">Kho: {rc.warehouseName}</p>
                      </div>
                      <DocumentStatusBadge status={rc.status} />
                    </div>

                    <div className="data-card-grid">
                      <div className="data-card-prop">
                        <span className="data-card-prop-label">Ngày nhập</span>
                        <span className="data-card-prop-val">{rc.receiptDate}</span>
                      </div>
                      <div className="data-card-prop">
                        <span className="data-card-prop-label">Số chứng từ / HĐ</span>
                        <span className="data-card-prop-val">{rc.documentNumber || "—"}</span>
                      </div>
                      <div className="data-card-prop">
                        <span className="data-card-prop-label">Số mặt hàng</span>
                        <span className="data-card-prop-val">{rc.totalItems} loại</span>
                      </div>
                      <div className="data-card-prop">
                        <span className="data-card-prop-label">Tổng số lượng</span>
                        <span className="data-card-prop-val" style={{ color: "var(--brand-primary)", fontWeight: 750 }}>
                          +{rc.totalQuantity.toLocaleString("vi-VN")}
                        </span>
                      </div>
                    </div>

                    <div className="data-card-footer">
                      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                        Tạo bởi: {rc.createdBy}
                      </span>
                      <Link className="btn btn-secondary btn-sm" href={`/stock-in/${rc.id}`}>
                        Chi tiết <ArrowRight size={14} />
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
              <Truck size={24} />
            </span>
            <h3>Không tìm thấy phiếu nhập nào</h3>
          </div>
        )}

        <footer className="pagination">
          <p>
            Trang {receiptsPage.page} / {receiptsPage.totalPages} ({receiptsPage.total.toLocaleString("vi-VN")} phiếu)
          </p>
          <div>
            <Link
              className={receiptsPage.page <= 1 ? "disabled" : ""}
              aria-disabled={receiptsPage.page <= 1}
              href={pageHref(keptParams, Math.max(1, receiptsPage.page - 1))}
            >
              <ChevronLeft size={16} /> Trước
            </Link>
            <span>{receiptsPage.page}</span>
            <Link
              className={receiptsPage.page >= receiptsPage.totalPages ? "disabled" : ""}
              aria-disabled={receiptsPage.page >= receiptsPage.totalPages}
              href={pageHref(keptParams, Math.min(receiptsPage.totalPages, receiptsPage.page + 1))}
            >
              Sau <ChevronRight size={16} />
            </Link>
          </div>
        </footer>
      </section>
    </div>
  );
}
