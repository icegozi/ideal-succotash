import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Eye,
  Package,
  Pill,
  SlidersHorizontal,
} from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { SearchInput, Select } from "@/components/shared/form";
import { requirePermission, permissions } from "@/lib/auth/permissions";
import { ExpiryBadge } from "@/modules/inventory/components/StockStatusBadge";
import { getInventoryService } from "@/modules/inventory/services";
import type { InventoryListQuery } from "@/modules/inventory/types/inventory.types";

export const metadata: Metadata = { title: "Tồn kho thuốc" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const one = (val: string | string[] | undefined) => (Array.isArray(val) ? val[0] : val);

function pageHref(params: URLSearchParams, page: number) {
  const next = new URLSearchParams(params);
  next.set("page", String(page));
  return `/inventory?${next.toString()}`;
}

export default async function InventoryPage({ searchParams }: { searchParams: SearchParams }) {
  await connection();
  await requirePermission(permissions.inventoryRead);

  const raw = await searchParams;
  const rawWarehouse = one(raw.warehouseId);
  const warehouseId = rawWarehouse && rawWarehouse !== "ALL" ? Number(rawWarehouse) : "ALL";

  const query: InventoryListQuery = {
    query: one(raw.query),
    warehouseId,
    stockStatus: one(raw.stockStatus) as InventoryListQuery["stockStatus"],
    expiryStatus: one(raw.expiryStatus) as InventoryListQuery["expiryStatus"],
    page: Number(one(raw.page) || 1),
    pageSize: Number(one(raw.pageSize) || 10),
  };

  const inventoryService = getInventoryService();
  const [metrics, result, warehouses] = await Promise.all([
    inventoryService.getDashboardMetrics(),
    inventoryService.listInventory(query),
    inventoryService.listWarehouses(),
  ]);

  const keptParams = new URLSearchParams();
  for (const key of ["query", "warehouseId", "stockStatus", "expiryStatus", "pageSize"]) {
    const value = one(raw[key]);
    if (value) keptParams.set(key, value);
  }

  return (
    <div className="page-stack">
      <PageHeader
        title="Tồn kho thuốc"
        description="Theo dõi tồn kho, hạn dùng và các lô thuốc."
        actions={
          <div className="button-row">
            <Link className="btn btn-secondary" href="/stock-in">
              Xem phiếu nhập
            </Link>
            <Link className="btn btn-primary" href="/stock-out/new">
              Tạo phiếu xuất (FEFO)
            </Link>
          </div>
        }
      />

      {/* Summary Metrics */}
      <section className="metric-grid" aria-label="Chỉ số tồn kho">
        <article className="metric-card">
          <div className="metric-icon">
            <Pill size={20} aria-hidden="true" />
          </div>
          <p>Tổng loại thuốc</p>
          <strong>{metrics.totalMedicineCount.toLocaleString("vi-VN")}</strong>
          <span>Đang theo dõi tồn kho</span>
        </article>

        <article className="metric-card">
          <div className="metric-icon" style={{ background: "var(--brand-primary-soft)", color: "var(--brand-primary)" }}>
            <Boxes size={20} aria-hidden="true" />
          </div>
          <p>Lô thuốc còn tồn</p>
          <strong>{metrics.totalBatchCount.toLocaleString("vi-VN")}</strong>
          <span>Tổng số lô vật lý</span>
        </article>

        <article className="metric-card">
          <div className="metric-icon" style={{ background: "var(--status-warning-bg)", color: "var(--status-warning-text)" }}>
            <CalendarClock size={20} aria-hidden="true" />
          </div>
          <p>Lô sắp hết hạn</p>
          <strong>{metrics.nearExpiryBatchCount.toLocaleString("vi-VN")}</strong>
          <span>Trong vòng 90 ngày</span>
        </article>

        <article className="metric-card">
          <div className="metric-icon" style={{ background: "var(--status-danger-bg)", color: "var(--status-danger-text)" }}>
            <AlertTriangle size={20} aria-hidden="true" />
          </div>
          <p>Lô đã hết hạn</p>
          <strong>{metrics.expiredBatchCount.toLocaleString("vi-VN")}</strong>
          <span>Khóa xuất khả dụng</span>
        </article>
      </section>

      {/* Filter Panel */}
      <section className="panel filter-panel">
        <form className="filter-form" method="get">
          <SearchInput
            defaultValue={one(raw.query)}
            name="query"
            placeholder="Tìm mã thuốc, tên, hoạt chất hoặc số lô…"
          />

          <label>
            <span>Kho thuốc</span>
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
            <span>Tình trạng tồn</span>
            <Select
              defaultValue={one(raw.stockStatus) || "ALL"}
              name="stockStatus"
              options={[
                { value: "ALL", label: "Tất cả" },
                { value: "IN_STOCK", label: "Còn tồn kho" },
                { value: "OUT_OF_STOCK", label: "Hết hàng" },
              ]}
            />
          </label>

          <label>
            <span>Trạng thái hạn dùng</span>
            <Select
              defaultValue={one(raw.expiryStatus) || "ALL"}
              name="expiryStatus"
              options={[
                { value: "ALL", label: "Tất cả" },
                { value: "NORMAL", label: "Bình thường" },
                { value: "NEAR_EXPIRY", label: "Sắp hết hạn" },
                { value: "EXPIRED", label: "Đã hết hạn" },
              ]}
            />
          </label>

          <button className="btn btn-secondary" type="submit">
            <SlidersHorizontal size={16} /> Áp dụng
          </button>
        </form>
      </section>

      {/* Inventory Main Panel (Dual View: Desktop Table + Mobile Cards) */}
      <section className="panel table-panel">
        <div className="table-heading">
          <div>
            <h2>Danh sách thuốc trong kho</h2>
            <p>{result.total.toLocaleString("vi-VN")} mặt hàng phù hợp</p>
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
                      <th>Kho thuốc</th>
                      <th className="number-cell">Số lượng tồn</th>
                      <th className="number-cell">Khả dụng</th>
                      <th className="number-cell">Số lô</th>
                      <th>Hạn dùng gần nhất</th>
                      <th>Trạng thái tồn</th>
                      <th>
                        <span className="sr-only">Thao tác</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.items.map((item) => (
                      <tr key={`${item.medicineId}-${item.warehouseId}`}>
                        <td>
                          <Link className="code-link" href={`/inventory/${item.medicineId}`}>
                            {item.medicineCode}
                          </Link>
                        </td>

                        <td>
                          <div className="medicine-name">
                            <span className="table-icon">
                              <Pill size={17} />
                            </span>
                            <span>
                              <strong>{item.medicineName}</strong>
                              <small>
                                {[item.activeIngredient, item.strength].filter(Boolean).join(" · ") ||
                                  "Chưa có hoạt chất"}
                              </small>
                            </span>
                          </div>
                        </td>

                        <td>{item.unitName}</td>
                        <td>{item.warehouseName}</td>

                        <td className="number-cell" style={{ fontWeight: 600 }}>
                          {item.onHandQuantity.toLocaleString("vi-VN")}
                        </td>

                        <td
                          className="number-cell"
                          style={{
                            fontWeight: 700,
                            color: item.availableQuantity > 0 ? "var(--brand-primary)" : "var(--text-muted)",
                          }}
                        >
                          {item.availableQuantity.toLocaleString("vi-VN")}
                        </td>

                        <td className="number-cell">{item.batchCount} lô</td>

                        <td>
                          {item.nearestExpiryDate ? (
                            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                              <span>{item.nearestExpiryDate}</span>
                              <ExpiryBadge status={item.expiryStatus} />
                            </div>
                          ) : (
                            <span className="muted">—</span>
                          )}
                        </td>

                        <td>
                          {item.isLowStock ? (
                            <span className="badge badge-warning">Dưới ngưỡng tồn ({item.minimumStock})</span>
                          ) : item.onHandQuantity > 0 ? (
                            <span className="badge badge-success">
                              <span className="badge-dot" /> Đủ hàng
                            </span>
                          ) : (
                            <span className="badge badge-neutral">
                              <span className="badge-dot" /> Hết hàng
                            </span>
                          )}
                        </td>

                        <td>
                          <div className="row-actions">
                            <Link
                              href={`/inventory/${item.medicineId}?warehouseId=${item.warehouseId}`}
                              aria-label={`Xem chi tiết các lô thuốc ${item.medicineName}`}
                              title="Xem chi tiết các lô (FEFO)"
                            >
                              <Eye size={17} />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Touch Cards View (Responsive Dual View) */}
            <div className="mobile-card-view">
              <div className="data-card-list">
                {result.items.map((item) => (
                  <article key={`mob-${item.medicineId}-${item.warehouseId}`} className="data-card">
                    <div className="data-card-header">
                      <div>
                        <Link className="code-link" href={`/inventory/${item.medicineId}`}>
                          {item.medicineCode}
                        </Link>
                        <h3 className="data-card-title">{item.medicineName}</h3>
                        <p className="data-card-subtitle">
                          {[item.activeIngredient, item.strength].filter(Boolean).join(" · ") ||
                            "Chưa có hoạt chất"}
                        </p>
                      </div>
                      <span className="badge badge-neutral">{item.warehouseName}</span>
                    </div>

                    <div className="data-card-grid">
                      <div className="data-card-prop">
                        <span className="data-card-prop-label">Tồn vật lý</span>
                        <span className="data-card-prop-val">
                          {item.onHandQuantity.toLocaleString("vi-VN")} {item.unitName}
                        </span>
                      </div>

                      <div className="data-card-prop">
                        <span className="data-card-prop-label">Khả dụng xuất</span>
                        <span
                          className="data-card-prop-val"
                          style={{
                            color: item.availableQuantity > 0 ? "var(--brand-primary)" : "var(--status-danger-text)",
                            fontWeight: 750,
                          }}
                        >
                          {item.availableQuantity.toLocaleString("vi-VN")} {item.unitName}
                        </span>
                      </div>

                      <div className="data-card-prop">
                        <span className="data-card-prop-label">Số lượng lô</span>
                        <span className="data-card-prop-val">{item.batchCount} lô</span>
                      </div>

                      <div className="data-card-prop">
                        <span className="data-card-prop-label">Hạn dùng gần nhất</span>
                        <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 2 }}>
                          <span style={{ fontSize: 12 }}>{item.nearestExpiryDate || "—"}</span>
                          {item.nearestExpiryDate && <ExpiryBadge status={item.expiryStatus} />}
                        </div>
                      </div>
                    </div>

                    <div className="data-card-footer">
                      <div>
                        {item.isLowStock ? (
                          <span className="badge badge-warning">Dưới ngưỡng ({item.minimumStock})</span>
                        ) : item.onHandQuantity > 0 ? (
                          <span className="badge badge-success">Đủ hàng</span>
                        ) : (
                          <span className="badge badge-neutral">Hết hàng</span>
                        )}
                      </div>

                      <Link
                        className="btn btn-secondary btn-sm"
                        style={{ minHeight: 38 }}
                        href={`/inventory/${item.medicineId}?warehouseId=${item.warehouseId}`}
                      >
                        Chi tiết lô FEFO <ArrowRight size={14} />
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
              <Package size={24} />
            </span>
            <h3>Không tìm thấy dữ liệu tồn kho</h3>
          </div>
        )}

        <footer className="pagination">
          <p>
            Trang {result.page} / {result.totalPages} ({result.total.toLocaleString("vi-VN")} mặt hàng)
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
