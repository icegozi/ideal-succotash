import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { ArrowLeft, Box, Calendar, Clock, History, Truck } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { requirePermission, permissions } from "@/lib/auth/permissions";
import {
  BatchStatusBadge,
  ExpiryBadge,
} from "@/modules/inventory/components/StockStatusBadge";
import { getInventoryService } from "@/modules/inventory/services";
import { getExpiryStatus } from "@/lib/config/inventory";

export const metadata: Metadata = { title: "Truy vết lô thuốc" };

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function BatchTraceabilityPage({ params }: PageProps) {
  await connection();
  await requirePermission(permissions.inventoryRead);

  const { id } = await params;
  const batchId = Number(id);
  if (isNaN(batchId)) notFound();

  const traceability = await getInventoryService().getBatchTraceability(batchId);
  if (!traceability) notFound();

  const { batch, currentBalances, receiptHistory, issueHistory, movements } = traceability;
  const expInfo = getExpiryStatus(batch.expiryDate);

  const totalOnHand = currentBalances.reduce((s, b) => s + b.onHandQuantity, 0);
  const totalAvailable = currentBalances.reduce((s, b) => s + b.availableQuantity, 0);

  return (
    <div className="page-stack">
      <PageHeader
        title={`Truy vết lô thuốc: ${batch.lotNumber}`}
        description={`Hồ sơ vòng đời và lịch sử biến động kho của lô thuốc ${batch.medicineName}.`}
        parent={{ href: "/inventory", label: "Tồn kho" }}
        actions={
          <div className="button-row">
            <Link className="btn btn-secondary" href={`/inventory/${batch.medicineId}`}>
              <ArrowLeft size={16} /> Xem các lô cùng thuốc
            </Link>
          </div>
        }
      />

      {/* Batch Overview Cards */}
      <div className="detail-grid">
        <div className="detail-card panel">
          <h2>Thông tin định danh lô thuốc</h2>
          <dl>
            <div>
              <dt>Thuốc</dt>
              <dd>
                <Link className="code-link" href={`/medicines/${batch.medicineId}`}>
                  {batch.medicineName} ({batch.medicineCode})
                </Link>
              </dd>
            </div>
            <div>
              <dt>Số lô (Lot number)</dt>
              <dd><strong>{batch.lotNumber}</strong></dd>
            </div>
            <div>
              <dt>Ngày sản xuất</dt>
              <dd>{batch.manufacturingDate || "—"}</dd>
            </div>
            <div>
              <dt>Hạn dùng (Expiry)</dt>
              <dd>
                <strong>{batch.expiryDate}</strong>
                <ExpiryBadge status={expInfo.status} days={expInfo.daysUntilExpiry} />
              </dd>
            </div>
            <div>
              <dt>Trạng thái kiểm soát</dt>
              <dd><BatchStatusBadge status={batch.status} /></dd>
            </div>
            <div>
              <dt>Nhà cung cấp gốc</dt>
              <dd>{batch.supplierName || "—"}</dd>
            </div>
          </dl>
        </div>

        <div className="detail-card panel">
          <h2>Hiện trạng tồn kho theo kho</h2>
          <dl>
            <div>
              <dt>Tổng tồn vật lý</dt>
              <dd><strong>{totalOnHand.toLocaleString("vi-VN")}</strong></dd>
            </div>
            <div>
              <dt>Tổng tồn khả dụng</dt>
              <dd>
                <strong style={{ color: "var(--brand-primary)", fontWeight: 750 }}>
                  {totalAvailable.toLocaleString("vi-VN")}
                </strong>
              </dd>
            </div>
          </dl>

          <div style={{ marginTop: 14 }}>
            <table className="item-table">
              <thead>
                <tr>
                  <th>Kho lưu trữ</th>
                  <th className="number-cell">Tồn vật lý</th>
                  <th className="number-cell">Khả dụng</th>
                </tr>
              </thead>
              <tbody>
                {currentBalances.map((bal) => (
                  <tr key={bal.warehouseId}>
                    <td>{bal.warehouseName}</td>
                    <td className="number-cell">{bal.onHandQuantity.toLocaleString("vi-VN")}</td>
                    <td className="number-cell" style={{ fontWeight: 700, color: "var(--brand-primary)" }}>
                      {bal.availableQuantity.toLocaleString("vi-VN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Origin Receipt History */}
      <section className="panel table-panel">
        <div className="table-heading">
          <div>
            <h2>Phiếu nhập tạo nguồn lô thuốc</h2>
            <p>Thông tin chứng từ nhập kho ban đầu của lô thuốc</p>
          </div>
        </div>

        {receiptHistory.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Mã phiếu nhập</th>
                  <th>Ngày nhập</th>
                  <th>Nhà cung cấp</th>
                  <th className="number-cell">Số lượng nhập</th>
                  <th className="number-cell">Đơn giá</th>
                </tr>
              </thead>
              <tbody>
                {receiptHistory.map((rc) => (
                  <tr key={rc.receiptId}>
                    <td>
                      <Link className="code-link" href={`/stock-in/${rc.receiptId}`}>
                        {rc.receiptCode}
                      </Link>
                    </td>
                    <td>{rc.receiptDate}</td>
                    <td><strong>{rc.supplierName}</strong></td>
                    <td className="number-cell" style={{ color: "var(--brand-primary)", fontWeight: 750 }}>
                      +{rc.quantity.toLocaleString("vi-VN")}
                    </td>
                    <td className="number-cell">{rc.unitCost.toLocaleString("vi-VN")} đ</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: 20, color: "var(--text-muted)", fontStyle: "italic" }}>
            Lô thuốc thuộc dữ liệu ban đầu hoặc được khởi tạo qua kiểm kê.
          </div>
        )}
      </section>

      {/* Issue Distribution History */}
      <section className="panel table-panel">
        <div className="table-heading">
          <div>
            <h2>Lịch sử xuất kho cấp phát</h2>
            <p>Các phiếu xuất kho đã phân bổ lấy từ lô thuốc này (FEFO)</p>
          </div>
        </div>

        {issueHistory.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Mã phiếu xuất</th>
                  <th>Ngày xuất</th>
                  <th>Người nhận</th>
                  <th>Khoa / Phòng nhận</th>
                  <th className="number-cell">Số lượng xuất</th>
                </tr>
              </thead>
              <tbody>
                {issueHistory.map((is, idx) => (
                  <tr key={`${is.issueId}-${idx}`}>
                    <td>
                      <Link className="code-link" href={`/stock-out/${is.issueId}`}>
                        {is.issueCode}
                      </Link>
                    </td>
                    <td>{is.issueDate}</td>
                    <td><strong>{is.receiver}</strong></td>
                    <td>{is.departmentName || "—"}</td>
                    <td className="number-cell" style={{ color: "var(--status-danger-text)", fontWeight: 750 }}>
                      -{is.quantity.toLocaleString("vi-VN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: 20, color: "var(--text-muted)", fontStyle: "italic" }}>
            Lô thuốc này chưa từng xuất kho.
          </div>
        )}
      </section>

      {/* Movement Ledger History */}
      <section className="panel table-panel">
        <div className="table-heading">
          <div>
            <h2>Sổ giao dịch kho bất biến (Stock Movement Ledger)</h2>
            <p>Ghi nhận mọi biến động tồn vật lý trước và sau giao dịch</p>
          </div>
        </div>

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Thời gian</th>
                <th>Kho</th>
                <th>Loại giao dịch</th>
                <th className="number-cell">Biến động</th>
                <th className="number-cell">Tồn trước</th>
                <th className="number-cell">Tồn sau</th>
                <th>Chứng từ đối chiếu</th>
                <th>Người thực hiện</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((m) => (
                <tr key={m.id}>
                  <td>{m.createdAt}</td>
                  <td>{m.warehouseName}</td>
                  <td>
                    <span
                      className={`badge ${
                        m.movementType.includes("IN") ? "badge-success" : "badge-danger"
                      }`}
                    >
                      {m.movementType}
                    </span>
                  </td>
                  <td
                    className="number-cell"
                    style={{
                      fontWeight: 750,
                      color: m.quantity > 0 ? "var(--brand-primary)" : "var(--status-danger-text)",
                    }}
                  >
                    {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                  </td>
                  <td className="number-cell">{m.quantityBefore.toLocaleString("vi-VN")}</td>
                  <td className="number-cell">{m.quantityAfter.toLocaleString("vi-VN")}</td>
                  <td>
                    {m.referenceType === "PHIEU_NHAP" ? (
                      <Link className="code-link" href={`/stock-in/${m.referenceId}`}>
                        {m.referenceCode}
                      </Link>
                    ) : (
                      <Link className="code-link" href={`/stock-out/${m.referenceId}`}>
                        {m.referenceCode}
                      </Link>
                    )}
                  </td>
                  <td>{m.performedBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
