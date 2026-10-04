"use client";

import { Check, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  cancelIssueAction,
  confirmIssueAction,
  type InventoryActionState,
} from "@/modules/inventory/actions/inventory.actions";
import { Button } from "@/components/shared/Button";
import { DocumentStatusBadge } from "@/modules/inventory/components/StockStatusBadge";
import type { StockIssue } from "@/modules/inventory/types/inventory.types";

export function IssueDetailView({
  issue,
  canConfirm,
  canCancel,
}: {
  issue: StockIssue;
  canConfirm: boolean;
  canCancel: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [actionState, setActionState] = useState<InventoryActionState>({ status: "idle" });

  const handleConfirm = () => {
    if (!confirm("Bạn có chắc chắn muốn xác nhận xuất kho phiếu này? Tồn kho sẽ được trừ theo thuật toán FEFO.")) {
      return;
    }
    setActionState({ status: "idle" });
    startTransition(async () => {
      const res = await confirmIssueAction(issue.id);
      setActionState(res);
      router.refresh();
    });
  };

  const handleCancel = () => {
    if (!confirm("Bạn có chắc chắn muốn hủy phiếu xuất kho này?")) {
      return;
    }
    setActionState({ status: "idle" });
    startTransition(async () => {
      const res = await cancelIssueAction(issue.id);
      setActionState(res);
      router.refresh();
    });
  };

  return (
    <div className="page-stack">
      {actionState.status === "error" ? (
        <div className="notice notice-error" role="alert">
          {actionState.message}
        </div>
      ) : actionState.status === "success" ? (
        <div className="notice notice-info" role="status">
          {actionState.message}
        </div>
      ) : null}

      <div className="panel" style={{ padding: 22 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 14 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <h2 style={{ margin: 0, fontSize: 20, color: "var(--text-primary)" }}>
                Phiếu xuất {issue.issueCode}
              </h2>
              <DocumentStatusBadge status={issue.status} />
            </div>
            <p style={{ margin: 0, color: "var(--text-muted)", fontSize: 13 }}>
              Ngày xuất: <strong>{issue.issueDate}</strong> · Kho xuất: <strong>{issue.warehouseName}</strong>
            </p>
          </div>

          <div className="button-row">
            {issue.status === "DRAFT" && canConfirm ? (
              <Button
                variant="primary"
                isLoading={pending}
                onClick={handleConfirm}
                leftIcon={<Check size={16} />}
              >
                Xác nhận xuất kho (FEFO)
              </Button>
            ) : null}

            {issue.status !== "CANCELLED" && canCancel ? (
              <Button
                variant="secondary"
                isLoading={pending}
                onClick={handleCancel}
                leftIcon={<X size={16} />}
                style={{ color: "var(--status-danger-text)", borderColor: "var(--status-danger-border)" }}
              >
                Hủy phiếu
              </Button>
            ) : null}
          </div>
        </div>

        <div className="detail-grid" style={{ marginBottom: 20 }}>
          <div className="detail-card panel">
            <h2>Thông tin đơn vị nhận &amp; Loại hình xuất</h2>
            <dl>
              <div>
                <dt>Người / Đơn vị nhận</dt>
                <dd><strong>{issue.receiver}</strong></dd>
              </div>
              <div>
                <dt>Khoa / Phòng</dt>
                <dd>{issue.departmentName || "—"}</dd>
              </div>
              <div>
                <dt>Loại hình xuất</dt>
                <dd>
                  <span className="badge badge-info">
                    {issue.issueType === "DEPARTMENT_ISSUE"
                      ? "Khoa phòng nội viện"
                      : issue.issueType === "PATIENT_ISSUE"
                      ? "Cấp phát bệnh nhân"
                      : issue.issueType === "TRANSFER"
                      ? "Chuyển kho"
                      : issue.issueType === "DISPOSAL"
                      ? "Xuất hủy"
                      : "Khác"}
                  </span>
                </dd>
              </div>
              <div>
                <dt>Ghi chú</dt>
                <dd>{issue.note || "—"}</dd>
              </div>
            </dl>
          </div>

          <div className="detail-card panel">
            <h2>Kiểm soát &amp; Phê duyệt</h2>
            <dl>
              <div>
                <dt>Người tạo phiếu</dt>
                <dd>{issue.createdBy} ({issue.createdAt.split(" ")[0]})</dd>
              </div>
              <div>
                <dt>Người xác nhận</dt>
                <dd>
                  {issue.confirmedBy ? (
                    <strong style={{ color: "var(--brand-primary)" }}>
                      {issue.confirmedBy} ({issue.confirmedAt?.split(" ")[0]})
                    </strong>
                  ) : (
                    <span className="muted">Chưa duyệt</span>
                  )}
                </dd>
              </div>
              <div>
                <dt>Tổng mặt hàng</dt>
                <dd>
                  <strong>{issue.totalItems} loại</strong> · Tổng SL xuất:{" "}
                  <strong style={{ color: "var(--status-danger-text)" }}>
                    {issue.totalQuantity.toLocaleString("vi-VN")}
                  </strong>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Items Table & FEFO Allocations */}
      <section className="panel table-panel">
        <div className="table-heading">
          <div>
            <h2>Danh sách thuốc &amp; Phân bổ lô FEFO thực tế</h2>
            <p>Chi tiết các lô thuốc được trừ tự động theo thứ tự hạn dùng gần nhất</p>
          </div>
        </div>

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Mã thuốc</th>
                <th>Tên thuốc</th>
                <th>Đơn vị</th>
                <th className="number-cell">Yêu cầu</th>
                <th className="number-cell">Đã cấp</th>
                <th>Chi tiết các lô được xuất (FEFO)</th>
              </tr>
            </thead>
            <tbody>
              {(issue.items || []).map((item) => {
                const totalAllocated = (item.allocations || []).reduce((sum, a) => sum + a.allocatedQuantity, 0);
                return (
                  <tr key={item.id}>
                    <td>
                      <span className="code-link">{item.medicineCode}</span>
                    </td>
                    <td>
                      <strong>{item.medicineName}</strong>
                    </td>
                    <td>{item.unitName}</td>
                    <td className="number-cell" style={{ fontWeight: 600 }}>
                      {item.requestedQuantity.toLocaleString("vi-VN")}
                    </td>
                    <td
                      className="number-cell"
                      style={{ fontWeight: 750, color: "var(--status-danger-text)" }}
                    >
                      -{totalAllocated.toLocaleString("vi-VN")}
                    </td>
                    <td>
                    {item.allocations && item.allocations.length > 0 ? (
                      <div style={{ display: "grid", gap: 4 }}>
                        {item.allocations.map((a) => (
                          <div
                            key={a.id}
                            style={{
                              display: "inline-flex",
                              gap: 8,
                              alignItems: "center",
                              background: "var(--surface-muted)",
                              padding: "4px 8px",
                              borderRadius: "var(--radius-xs)",
                              border: "1px solid var(--border-subtle)",
                              fontSize: 12,
                            }}
                          >
                            <span>
                              Lô: <strong>{a.lotNumber}</strong> (HSD: {a.expiryDate})
                            </span>
                            <span style={{ color: "var(--brand-primary)", fontWeight: 700 }}>
                              -{a.allocatedQuantity.toLocaleString("vi-VN")} {item.unitName}
                            </span>
                            {a.isFefoOverride && (
                              <span className="badge badge-warning" style={{ fontSize: 10 }}>
                                Ghi đè FEFO
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="muted">Chưa phân bổ lô</span>
                    )}
                  </td>
                </tr>
              );
            })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
