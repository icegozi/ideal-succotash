import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { ArrowLeft, Boxes, Eye, Pill, ShieldCheck, Zap } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { requirePermission, permissions } from "@/lib/auth/permissions";
import {
  BatchStatusBadge,
  ExpiryBadge,
} from "@/modules/inventory/components/StockStatusBadge";
import { getInventoryService } from "@/modules/inventory/services";
import { getMedicineService } from "@/modules/medicines/services";

export const metadata: Metadata = { title: "Chi tiết tồn kho thuốc theo lô" };

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ warehouseId?: string }>;
};

export default async function MedicineInventoryDetailPage({
  params,
  searchParams,
}: PageProps) {
  await connection();
  await requirePermission(permissions.inventoryRead);

  const { id } = await params;
  const medicineId = Number(id);
  if (isNaN(medicineId)) notFound();

  const { warehouseId: rawWh } = await searchParams;
  const warehouseId = rawWh ? Number(rawWh) : undefined;

  const [medicine, batches] = await Promise.all([
    getMedicineService().getById(medicineId),
    getInventoryService().getMedicineBatches(medicineId, warehouseId),
  ]);

  if (!medicine) notFound();

  const totalOnHand = batches.reduce((s, b) => s + b.onHandQuantity, 0);
  const totalAvailable = batches.reduce((s, b) => s + b.availableQuantity, 0);

  return (
    <div className="page-stack">
      <PageHeader
        title={`Chi tiết tồn kho: ${medicine.name}`}
        description="Danh sách các lô thuốc thực tế trong kho, sắp xếp ưu tiên theo FEFO (hạn dùng gần nhất xuất trước)."
        parent={{ href: "/inventory", label: "Tồn kho" }}
        actions={
          <div className="button-row">
            <Link className="btn btn-secondary" href="/inventory">
              <ArrowLeft size={16} /> Quay lại tồn kho
            </Link>
            <Link className="btn btn-primary" href="/stock-out/new">
              Tạo phiếu xuất thuốc này
            </Link>
          </div>
        }
      />

      {/* Medicine Info Header */}
      <section className="panel detail-hero">
        <div className="medicine-avatar">
          <Pill size={28} />
        </div>
        <div style={{ flex: 1 }}>
          <h2>{medicine.name}</h2>
          <p>
            Mã thuốc: <strong>{medicine.code}</strong> · Hoạt chất:{" "}
            <strong>{medicine.activeIngredient || "—"}</strong> · Hàm lượng:{" "}
            <strong>{medicine.strength || "—"}</strong> · Đơn vị:{" "}
            <strong>{medicine.baseUnitName}</strong>
          </p>
          <div style={{ marginTop: 10, display: "flex", gap: 16, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13 }}>
              Tổng tồn vật lý: <strong>{totalOnHand.toLocaleString("vi-VN")}</strong> {medicine.baseUnitName}
            </span>
            <span style={{ fontSize: 13 }}>
              Tồn khả dụng xuất:{" "}
              <strong style={{ color: "var(--brand-primary)", fontWeight: 750 }}>
                {totalAvailable.toLocaleString("vi-VN")}
              </strong>{" "}
              {medicine.baseUnitName}
            </span>
          </div>
        </div>
      </section>

      {/* Batches Table in FEFO Order */}
      <section className="panel table-panel">
        <div className="table-heading">
          <div>
            <h2>Các lô thuốc hiện có (Thứ tự ưu tiên xuất FEFO)</h2>
            <p>Sắp xếp theo Hạn dùng tăng dần (lô hết hạn sớm nhất được ưu tiên cấp phát trước)</p>
          </div>
        </div>

        {batches.length ? (
          <>
            {/* Desktop Table View */}
            <div className="desktop-table-view">
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: 110 }}>Thứ tự FEFO</th>
                      <th>Số lô</th>
                      <th>Kho lưu trữ</th>
                      <th>Ngày sản xuất</th>
                      <th>Hạn dùng</th>
                      <th className="number-cell">Tồn vật lý</th>
                      <th className="number-cell">Khả dụng</th>
                      <th>Trạng thái lô</th>
                      <th>Cảnh báo hạn</th>
                      <th>Truy vết</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batches.map((b, index) => {
                      const isAvailableForIssue = b.availableQuantity > 0 && b.expiryStatus !== "EXPIRED";
                      const isFefoFirst = isAvailableForIssue && index === 0;

                      return (
                        <tr
                          key={`${b.warehouseId}-${b.batchId}`}
                          style={{
                            background: isFefoFirst ? "var(--brand-primary-soft)" : b.expiryStatus === "EXPIRED" ? "#fffbfb" : undefined,
                          }}
                        >
                          <td>
                            {isFefoFirst ? (
                              <span className="badge badge-success" style={{ fontWeight: 800 }}>
                                <Zap size={11} /> #1 Ưu tiên
                              </span>
                            ) : isAvailableForIssue ? (
                              <span style={{ fontWeight: 700, color: "var(--brand-primary)" }}>
                                #{index + 1}
                              </span>
                            ) : (
                              <span className="muted">—</span>
                            )}
                          </td>

                          <td>
                            <Link className="code-link" href={`/inventory/batches/${b.batchId}`}>
                              {b.lotNumber}
                            </Link>
                          </td>

                          <td>{b.warehouseName}</td>
                          <td>{b.manufacturingDate || "—"}</td>
                          <td style={{ fontWeight: 600 }}>{b.expiryDate}</td>

                          <td className="number-cell">{b.onHandQuantity.toLocaleString("vi-VN")}</td>

                          <td
                            className="number-cell"
                            style={{
                              fontWeight: 750,
                              color: b.availableQuantity > 0 ? "var(--brand-primary)" : "var(--status-danger-text)",
                            }}
                          >
                            {b.availableQuantity.toLocaleString("vi-VN")}
                          </td>

                          <td>
                            <BatchStatusBadge status={b.batchStatus} />
                          </td>

                          <td>
                            <ExpiryBadge status={b.expiryStatus} days={b.daysUntilExpiry} />
                          </td>

                          <td>
                            <div className="row-actions">
                              <Link
                                href={`/inventory/batches/${b.batchId}`}
                                title="Truy vết lịch sử lô thuốc"
                                aria-label={`Truy vết lô ${b.lotNumber}`}
                              >
                                <Eye size={16} />
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Touch Cards View */}
            <div className="mobile-card-view">
              <div className="data-card-list">
                {batches.map((b, index) => {
                  const isAvailableForIssue = b.availableQuantity > 0 && b.expiryStatus !== "EXPIRED";
                  const isFefoFirst = isAvailableForIssue && index === 0;

                  return (
                    <article
                      key={`mob-${b.warehouseId}-${b.batchId}`}
                      className="data-card"
                      style={{
                        borderColor: isFefoFirst ? "var(--brand-primary-border)" : undefined,
                        background: isFefoFirst ? "#fafdfb" : undefined,
                      }}
                    >
                      <div className="data-card-header">
                        <div>
                          <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4 }}>
                            {isFefoFirst && (
                              <span className="badge badge-success">
                                <Zap size={11} /> Ưu tiên xuất #1
                              </span>
                            )}
                            <span className="badge badge-neutral">{b.warehouseName}</span>
                          </div>
                          <h3 className="data-card-title">
                            Lô: <Link className="code-link" href={`/inventory/batches/${b.batchId}`}>{b.lotNumber}</Link>
                          </h3>
                        </div>
                        <BatchStatusBadge status={b.batchStatus} />
                      </div>

                      <div className="data-card-grid">
                        <div className="data-card-prop">
                          <span className="data-card-prop-label">Hạn dùng</span>
                          <span className="data-card-prop-val">{b.expiryDate}</span>
                          <div style={{ marginTop: 2 }}>
                            <ExpiryBadge status={b.expiryStatus} days={b.daysUntilExpiry} />
                          </div>
                        </div>

                        <div className="data-card-prop">
                          <span className="data-card-prop-label">Khả dụng xuất</span>
                          <span
                            className="data-card-prop-val"
                            style={{
                              color: b.availableQuantity > 0 ? "var(--brand-primary)" : "var(--status-danger-text)",
                              fontSize: 16,
                              fontWeight: 750,
                            }}
                          >
                            {b.availableQuantity.toLocaleString("vi-VN")} {medicine.baseUnitName}
                          </span>
                          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                            (Tồn vật lý: {b.onHandQuantity.toLocaleString("vi-VN")})
                          </span>
                        </div>
                      </div>

                      <div className="data-card-footer">
                        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                          Ngày SX: {b.manufacturingDate || "—"}
                        </span>

                        <Link
                          className="btn btn-secondary btn-sm"
                          style={{ minHeight: 38 }}
                          href={`/inventory/batches/${b.batchId}`}
                        >
                          Truy vết lô <Eye size={14} />
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          <div className="empty-state">
            <span>
              <Boxes size={24} />
            </span>
            <h3>Chưa có lô thuốc nào trong kho</h3>
            <p>Vui lòng tạo phiếu nhập kho để bổ sung lô thuốc mới.</p>
          </div>
        )}
      </section>
    </div>
  );
}
