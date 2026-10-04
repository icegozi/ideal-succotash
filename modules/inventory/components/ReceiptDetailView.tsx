"use client";

import { Check, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  cancelReceiptAction,
  confirmReceiptAction,
  type InventoryActionState,
} from "@/modules/inventory/actions/inventory.actions";
import { Button } from "@/components/shared/Button";
import { DocumentStatusBadge } from "@/modules/inventory/components/StockStatusBadge";
import type { StockReceipt } from "@/modules/inventory/types/inventory.types";

export function ReceiptDetailView({
  receipt,
  canConfirm,
  canCancel,
}: {
  receipt: StockReceipt;
  canConfirm: boolean;
  canCancel: boolean;
  }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [actionState, setActionState] = useState<InventoryActionState>({ status: "idle" });

  const handleConfirm = () => {
    if (!confirm("Bạn có chắc chắn muốn xác nhận nhập kho phiếu này? Tồn kho sẽ được cập nhật ngay lập tức.")) {
      return;
    }
    setActionState({ status: "idle" });
    startTransition(async () => {
      const res = await confirmReceiptAction(receipt.id);
      setActionState(res);
      router.refresh();
    });
  };

  const handleCancel = () => {
    if (!confirm("Bạn có chắc chắn muốn hủy phiếu nhập kho này?")) {
      return;
    }
    setActionState({ status: "idle" });
    startTransition(async () => {
      const res = await cancelReceiptAction(receipt.id);
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
                Phiếu nhập {receipt.receiptCode}
              </h2>
              <DocumentStatusBadge status={receipt.status} />
            </div>
            <p style={{ margin: 0, color: "var(--text-muted)", fontSize: 13 }}>
              Ngày nhập: <strong>{receipt.receiptDate}</strong> · Kho nhận: <strong>{receipt.warehouseName}</strong>
            </p>
          </div>

          <div className="button-row">
            {receipt.status === "DRAFT" && canConfirm ? (
              <Button
                variant="primary"
                isLoading={pending}
                onClick={handleConfirm}
                leftIcon={<Check size={16} />}
              >
                Xác nhận nhập kho
              </Button>
            ) : null}

            {receipt.status !== "CANCELLED" && canCancel ? (
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
            <h2>Thông tin nhà cung cấp &amp; Chứng từ</h2>
            <dl>
              <div>
                <dt>Nhà cung cấp</dt>
                <dd><strong>{receipt.supplierName}</strong></dd>
              </div>
              <div>
                <dt>Số chứng từ</dt>
                <dd>{receipt.documentNumber || "—"}</dd>
              </div>
              <div>
                <dt>Ghi chú</dt>
                <dd>{receipt.note || "—"}</dd>
              </div>
            </dl>
          </div>

          <div className="detail-card panel">
            <h2>Kiểm soát &amp; Phê duyệt</h2>
            <dl>
              <div>
                <dt>Người tạo phiếu</dt>
                <dd>{receipt.createdBy} ({receipt.createdAt.split(" ")[0]})</dd>
              </div>
              <div>
                <dt>Người xác nhận</dt>
                <dd>
                  {receipt.confirmedBy ? (
                    <strong style={{ color: "var(--brand-primary)" }}>
                      {receipt.confirmedBy} ({receipt.confirmedAt?.split(" ")[0]})
                    </strong>
                  ) : (
                    <span className="muted">Chưa duyệt</span>
                  )}
                </dd>
              </div>
              <div>
                <dt>Tổng mặt hàng</dt>
                <dd>
                  <strong>{receipt.totalItems} loại</strong> · Tổng SL:{" "}
                  <strong style={{ color: "var(--brand-primary)" }}>
                    {receipt.totalQuantity.toLocaleString("vi-VN")}
                  </strong>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <section className="panel table-panel">
        <div className="table-heading">
          <div>
            <h2>Danh sách thuốc nhập kho</h2>
            <p>Chi tiết các mặt hàng thuốc, số lô và hạn dùng cụ thể theo phiếu</p>
          </div>
        </div>

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Mã thuốc</th>
                <th>Tên thuốc</th>
                <th>Đơn vị</th>
                <th>Số lô</th>
                <th>Ngày SX</th>
                <th>Hạn dùng</th>
                <th className="number-cell">Số lượng nhập</th>
                <th className="number-cell">Đơn giá</th>
                <th className="number-cell">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              {(receipt.items || []).map((item) => (
                <tr key={item.id}>
                  <td>
                    <span className="code-link">{item.medicineCode}</span>
                  </td>
                  <td>
                    <strong>{item.medicineName}</strong>
                  </td>
                  <td>{item.unitName}</td>
                  <td>
                    <strong>{item.lotNumber}</strong>
                  </td>
                  <td>{item.manufacturingDate || "—"}</td>
                  <td style={{ fontWeight: 600 }}>{item.expiryDate}</td>
                  <td
                    className="number-cell"
                    style={{ fontWeight: 750, color: "var(--brand-primary)" }}
                  >
                    +{item.quantity.toLocaleString("vi-VN")}
                  </td>
                  <td className="number-cell">{item.unitCost.toLocaleString("vi-VN")} đ</td>
                  <td className="number-cell" style={{ fontWeight: 700 }}>
                    {item.totalCost.toLocaleString("vi-VN")} đ
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
