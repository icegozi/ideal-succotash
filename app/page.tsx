import Link from "next/link";
import {
  ArrowRight,
  Boxes,
  AlertTriangle,
  ClipboardCheck,
  PackageCheck,
  Pill,
  ShieldAlert,
  Clock,
  ArrowDownToLine,
  ArrowUpFromLine,
  FileText,
  Zap,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { connection } from "next/server";

import { isDemoDataMode } from "@/modules/medicines/repositories";
import {
  getInventoryService,
  getStockInService,
  getStockOutService,
} from "@/modules/inventory/services";
import { ExpiryThresholdMeter } from "@/components/shared/clinical";
import { Badge } from "@/components/shared/Badge";
import { permissions, requirePermission } from "@/lib/auth/permissions";

export default async function DashboardPage() {
  await connection();
  await requirePermission(permissions.inventoryRead);
  const demo = isDemoDataMode();

  // Fetch metrics and recent clinical activity in parallel
  const inventoryService = getInventoryService();
  const stockInService = getStockInService();
  const stockOutService = getStockOutService();

  const [metrics, recentMovements, nearExpiryPage, draftReceipts, draftIssues] =
    await Promise.all([
      inventoryService.getDashboardMetrics(),
      inventoryService.listMovements({ limit: 5 }),
      inventoryService.listInventory({ expiryStatus: "NEAR_EXPIRY", pageSize: 4 }),
      stockInService.listReceipts({ status: "DRAFT", pageSize: 3 }),
      stockOutService.listIssues({ status: "DRAFT", pageSize: 3 }),
    ]);

  const cards = [
    {
      label: "Tổng danh mục thuốc",
      value: `${metrics.totalMedicineCount.toLocaleString("vi-VN")}`,
      unit: "loại",
      note: "Đang lưu hành trong danh mục",
      icon: Pill,
      href: "/medicines",
      colorClass: "text-emerald-700 bg-emerald-50 border-emerald-200",
      accentBorder: "border-emerald-500",
    },
    {
      label: "Lô thuốc đang lưu kho",
      value: `${metrics.totalBatchCount.toLocaleString("vi-VN")}`,
      unit: "lô",
      note: "Phân bổ theo vị trí kệ kho",
      icon: Boxes,
      href: "/inventory",
      colorClass: "text-teal-700 bg-teal-50 border-teal-200",
      accentBorder: "border-teal-500",
    },
    {
      label: "Lô cận hạn (≤ 90 ngày)",
      value: `${metrics.nearExpiryBatchCount.toLocaleString("vi-VN")}`,
      unit: "lô",
      note: "Ưu tiên luân chuyển hoặc đổi trả",
      icon: Clock,
      href: "/inventory?expiryStatus=NEAR_EXPIRY",
      colorClass: "text-amber-800 bg-amber-50 border-amber-200",
      accentBorder: "border-amber-500",
      isPulse: metrics.nearExpiryBatchCount > 0,
    },
    {
      label: "Lô hết hạn / Dưới định mức",
      value: `${metrics.expiredBatchCount} / ${metrics.lowStockMedicineCount}`,
      unit: "lô / loại",
      note: "Khóa xuất & cần lập dự trù gấp",
      icon: ShieldAlert,
      href: "/inventory?expiryStatus=EXPIRED",
      colorClass: "text-red-700 bg-red-50 border-red-200",
      accentBorder: "border-red-500",
      isAlert: metrics.expiredBatchCount > 0 || metrics.lowStockMedicineCount > 0,
    },
  ];

  return (
    <div className="page-stack">
      {/* 1. Hero Command Panel with 3D Depth */}
      <section className="hero-panel">
        <div>
          <p className="eyebrow">Trung tâm Điều hành Kho Dược</p>
          <h1 className="hero-title">Quản trị kho dược chuẩn mực lâm sàng.</h1>
          <p className="hero-copy">
            Bảo vệ người bệnh bằng thuật toán xuất kho FEFO tự động, kiểm soát hạn dùng đa tầng và
            truy vết sổ cái biến động bất biến trên Oracle Database.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, zIndex: 1, flexWrap: "wrap" }}>
          <Link className="btn btn-primary btn-lg" href="/stock-out/new">
            <ArrowUpFromLine size={17} aria-hidden="true" />
            Xuất kho FEFO
          </Link>
          <Link className="btn btn-secondary btn-lg" href="/stock-in/new">
            <ArrowDownToLine size={17} aria-hidden="true" />
            Nhập kho NCC
          </Link>
          <Link className="btn btn-secondary btn-lg" href="/inventory">
            Tra cứu kho <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </section>

      {/* 2. Demo Mode Alert Notice */}
      {demo && (
        <div className="notice notice-info shadow-[var(--shadow-elevation-1)]" role="status">
          <PackageCheck size={20} aria-hidden="true" className="shrink-0" />
          <div>
            <strong>Hệ thống đang hoạt động với bộ dữ liệu Demo cục bộ.</strong>
            <span>
              Đã kích hoạt toàn bộ các mô đun Danh mục thuốc, Tồn kho lô, Nhập kho và Xuất kho FEFO tự động.
            </span>
          </div>
        </div>
      )}

      {/* 3. 4 Clinical Stats Widgets (Elevation 1 with Tactile Elevation 2 Hover) */}
      <section className="metric-grid" aria-label="Chỉ số vận hành kho dược">
        {cards.map(({ label, value, unit, note, icon: Icon, href, colorClass, isPulse, isAlert }) => (
          <Link href={href} key={label} style={{ textDecoration: "none" }}>
            <article
              className={`metric-card panel-interactive relative overflow-hidden ${
                isAlert ? "border-red-300" : isPulse ? "border-amber-300" : ""
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className={`w-9 h-9 rounded-[var(--radius-md)] border flex items-center justify-center shrink-0 ${colorClass}`}
                >
                  <Icon size={19} aria-hidden="true" />
                </div>
                {isPulse && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-[var(--radius-sm)] pulse-subtle">
                    <Clock size={10} /> Cần xử lý
                  </span>
                )}
                {isAlert && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-800 bg-red-100 border border-red-300 px-2 py-0.5 rounded-[var(--radius-sm)]">
                    <AlertTriangle size={10} /> Chú ý
                  </span>
                )}
              </div>
              <p>{label}</p>
              <strong className="tabular-nums">
                {value} <span className="text-xs font-normal text-slate-500">{unit}</span>
              </strong>
              <span>{note}</span>
            </article>
          </Link>
        ))}
      </section>

      {/* 4. Main 2-Column Split: Clinical Queues & Ledger Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column (7 cols): Urgent Expiry Queue & Ledger Audit Trail */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          {/* Urgent Expiry Queue */}
          <section className="panel" aria-label="Hàng chờ xử lý thuốc cận hạn">
            <div className="flex items-center justify-between p-4 border-b border-[var(--border-default)]">
              <div className="flex items-center gap-2">
                <div className="w-2 h-4 rounded-full bg-amber-500" />
                <h2 className="text-sm font-bold text-slate-900 m-0">Lô Thuốc Cận Hạn Cần Xử Lý</h2>
                <Badge variant="warning" showDot>
                  {metrics.nearExpiryBatchCount} lô
                </Badge>
              </div>
              <Link
                href="/inventory?expiryStatus=NEAR_EXPIRY"
                className="text-xs font-semibold text-[var(--brand-primary)] hover:underline inline-flex items-center gap-1"
              >
                Xem toàn bộ <ArrowRight size={13} />
              </Link>
            </div>

            <div className="p-4">
              {nearExpiryPage.items.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">
                  <CheckCircle2 size={24} className="mx-auto mb-2 text-emerald-600" />
                  Hiện không có lô thuốc nào trong ngưỡng cận hạn 90 ngày.
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {nearExpiryPage.items.map((item) => (
                    <div
                      key={`${item.medicineId}-${item.warehouseId}`}
                      className="p-3 rounded-[var(--radius-md)] border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-slate-300 transition-all flex flex-wrap items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-[180px]">
                        <div className="font-semibold text-slate-900 text-[13px]">
                          {item.medicineName}
                        </div>
                        <div className="text-slate-500 text-[11px]">
                          Hoạt chất: {item.activeIngredient || "N/A"} · Kho: {item.warehouseName}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {item.nearestExpiryDate && (
                          <ExpiryThresholdMeter expiryDate={item.nearestExpiryDate} compact />
                        )}
                        <div className="text-right">
                          <div className="font-bold text-slate-800 tabular-nums">
                            {item.availableQuantity.toLocaleString("vi-VN")} {item.unitName}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {item.batchCount} lô tồn
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Recent Stock Ledger Movements */}
          <section className="panel" aria-label="Sổ cái biến động kho gần nhất">
            <div className="flex items-center justify-between p-4 border-b border-[var(--border-default)]">
              <div className="flex items-center gap-2">
                <div className="w-2 h-4 rounded-full bg-teal-600" />
                <h2 className="text-sm font-bold text-slate-900 m-0">Biến Động Sổ Cái Kho Gần Nhất</h2>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">Bất biến (Immutable)</span>
            </div>

            <div className="p-4">
              {recentMovements.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-500">
                  Chưa có giao dịch kho nào được ghi nhận.
                </div>
              ) : (
                <div className="flex flex-col divide-y divide-slate-100">
                  {recentMovements.map((m) => {
                    const isIncrease =
                      m.movementType === "STOCK_IN" || m.movementType === "STOCK_OUT_REVERSAL";
                    return (
                      <div key={m.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                              isIncrease
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-slate-100 text-slate-800"
                            }`}
                          >
                            {isIncrease ? "+" : "−"}
                          </span>
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-900 truncate">
                              {m.medicineName}
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-2">
                              <span className="cell-batch font-mono text-[10px]">Lô: {m.lotNumber}</span>
                              <span>·</span>
                              <span>Phiếu: {m.referenceCode}</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div
                            className={`font-bold tabular-nums text-xs ${
                              isIncrease ? "text-emerald-700" : "text-slate-900"
                            }`}
                          >
                            {isIncrease ? "+" : "−"}
                            {Math.abs(m.quantity).toLocaleString("vi-VN")}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Bởi: {m.performedBy}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Right Column (5 cols): Approvals, Draft Queue & Clinical FEFO Rules */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          {/* Action & Draft Queue Panel */}
          <section className="panel" aria-label="Hàng chờ phiếu thao tác">
            <div className="p-4 border-b border-[var(--border-default)]">
              <h2 className="text-sm font-bold text-slate-900 m-0 flex items-center gap-2">
                <FileText size={16} className="text-slate-600" />
                Hàng Chờ Phiếu Thao Tác
              </h2>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between p-3 rounded-[var(--radius-md)] bg-slate-50 border border-slate-200">
                <div>
                  <div className="text-xs font-semibold text-slate-800">Phiếu nhập kho bản nháp</div>
                  <div className="text-[11px] text-slate-500">Chờ hoàn tất và kiểm đếm thực tế</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm tabular-nums text-slate-900">
                    {draftReceipts.total}
                  </span>
                  <Link href="/stock-in" className="btn btn-secondary btn-sm">
                    Xem
                  </Link>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-[var(--radius-md)] bg-slate-50 border border-slate-200">
                <div>
                  <div className="text-xs font-semibold text-slate-800">Phiếu xuất kho bản nháp</div>
                  <div className="text-[11px] text-slate-500">Chờ xác nhận phân bổ FEFO</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm tabular-nums text-slate-900">
                    {draftIssues.total}
                  </span>
                  <Link href="/stock-out" className="btn btn-secondary btn-sm">
                    Xem
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* Clinical Pharmacy Principles & Rules */}
          <section className="panel p-5 bg-gradient-to-br from-white to-slate-50" aria-label="Nguyên tắc lâm sàng">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-[var(--radius-sm)] bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                <Zap size={16} />
              </div>
              <h3 className="text-sm font-bold text-slate-900 m-0">Nguyên Tắc Quản Trị FEFO</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Hệ thống thực thi nghiêm ngặt các quy chế của Bộ Y tế nhằm bảo vệ an toàn tính mạng người bệnh:
            </p>

            <ul className="space-y-2.5 text-xs text-slate-700 m-0 p-0 list-none">
              <li className="flex items-start gap-2">
                <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>First-Expired, First-Out (FEFO):</strong> Lô thuốc có hạn dùng gần nhất bắt buộc xuất trước.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Lock size={15} className="text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Khóa lô hết hạn &amp; biệt trữ:</strong> Tuyệt đối không cho phép đưa vào tồn khả dụng cấp phát.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <ClipboardCheck size={15} className="text-blue-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Bảo toàn giao dịch:</strong> Cập nhật số dư song song với việc ghi sổ cái bất biến trên Oracle.
                </span>
              </li>
            </ul>

            <div className="mt-4 pt-3 border-t border-slate-200 flex justify-between items-center text-[11px] text-slate-500">
              <span>Tiêu chuẩn GSP &amp; GDP Bệnh viện</span>
              <span className="font-mono">v2026.10</span>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
