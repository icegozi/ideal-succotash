import Link from "next/link";
import { ArrowUpFromLine, ExternalLink } from "lucide-react";
import { Badge } from "@/components/shared/Badge";

export interface FefoAlertItem {
  id: number;
  medicineId: number;
  medicineCode: string;
  medicineName: string;
  activeIngredient?: string | null;
  lotNumber: string;
  batchId: number;
  expiryDate: string;
  daysRemaining: number;
  availableQuantity: number;
  unitName: string;
  warehouseName: string;
}

export function getAlertBadge(daysRemaining: number) {
  if (daysRemaining < 0) {
    return (
      <Badge variant="danger" showDot>
        Đã hết hạn
      </Badge>
    );
  }
  if (daysRemaining <= 30) {
    return (
      <Badge variant="danger" showDot>
        Critical (&lt; 30d)
      </Badge>
    );
  }
  if (daysRemaining <= 60) {
    return (
      <Badge variant="warning" showDot>
        Warning (30-60d)
      </Badge>
    );
  }
  return (
    <Badge variant="info" showDot>
      Notice (60-90d)
    </Badge>
  );
}

export function formatShortDate(dateStr: string): string {
  if (!dateStr) return "—";
  const parts = dateStr.split("T")[0].split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

export function FefoAlertTable({ items }: { items: FefoAlertItem[] }) {
  return (
    <div className="fefo-alert-table-wrapper">
      {/* Desktop Table View */}
      <div className="desktop-table-view overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-[var(--border-default)] text-slate-500 font-semibold bg-slate-50/50">
              <th className="py-2.5 px-3">Thuốc</th>
              <th className="py-2.5 px-3">Số lô</th>
              <th className="py-2.5 px-3">Hạn dùng</th>
              <th className="py-2.5 px-3 text-right">Tồn kho</th>
              <th className="py-2.5 px-3">Mức độ</th>
              <th className="py-2.5 px-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item) => (
              <tr
                key={item.id}
                className="hover:bg-slate-50/80 transition-colors"
              >
                {/* 1. Thuốc */}
                <td className="py-2.5 px-3">
                  <div className="font-semibold text-slate-900">
                    <Link
                      href={`/medicines/${item.medicineId}`}
                      className="hover:text-[var(--brand-primary)] hover:underline inline-flex items-center gap-1"
                    >
                      {item.medicineName}
                    </Link>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    {item.medicineCode} · {item.warehouseName}
                  </div>
                </td>

                {/* 2. Số lô */}
                <td className="py-2.5 px-3 font-mono font-medium text-slate-700 text-[11.5px]">
                  <Link
                    href={item.batchId > 0 ? `/inventory/batches/${item.batchId}` : `/inventory/${item.medicineId}`}
                    className="hover:underline hover:text-[var(--brand-primary)]"
                    title="Xem hồ sơ truy vết lô này"
                  >
                    {item.lotNumber}
                  </Link>
                </td>

                {/* 3. Hạn dùng */}
                <td className="py-2.5 px-3">
                  <div className="font-medium text-slate-800">
                    {formatShortDate(item.expiryDate)}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {item.daysRemaining < 0
                      ? `Quá ${Math.abs(item.daysRemaining)} ngày`
                      : `Còn ${item.daysRemaining} ngày`}
                  </div>
                </td>

                {/* 4. Tồn kho */}
                <td className="py-2.5 px-3 text-right font-semibold text-slate-900 tabular-nums">
                  {item.availableQuantity.toLocaleString("vi-VN")}{" "}
                  <span className="text-[11px] font-normal text-slate-500">
                    {item.unitName}
                  </span>
                </td>

                {/* 5. Mức độ */}
                <td className="py-2.5 px-3">
                  {getAlertBadge(item.daysRemaining)}
                </td>

                {/* 6. Thao tác */}
                <td className="py-2.5 px-3 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <Link
                      href={`/stock-out/new`}
                      className="btn btn-primary btn-sm py-1 px-2.5 text-[11px]"
                      title="Xuất kho lô thuốc này"
                    >
                      <ArrowUpFromLine size={12} aria-hidden="true" />
                      <span>Xuất FEFO</span>
                    </Link>
                    <Link
                      href={`/inventory/${item.medicineId}`}
                      className="btn btn-outline btn-sm py-1 px-1.5 text-slate-500"
                      title="Xem toàn bộ tồn kho thuốc này"
                    >
                      <ExternalLink size={12} aria-hidden="true" />
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View (< 780px) */}
      <div className="mobile-card-view space-y-2.5">
        {items.map((item) => (
          <article
            key={`mob-${item.id}`}
            className="p-3 rounded-[var(--radius-md)] border border-slate-200 bg-slate-50/50 hover:bg-white transition-all flex flex-col gap-2"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <Link
                  href={`/medicines/${item.medicineId}`}
                  className="font-semibold text-slate-900 text-[13px] hover:underline"
                >
                  {item.medicineName}
                </Link>
                <div className="text-[11px] text-slate-500 font-mono">
                  Lô: <strong className="text-slate-700">{item.lotNumber}</strong> · {item.warehouseName}
                </div>
              </div>
              <div className="shrink-0">{getAlertBadge(item.daysRemaining)}</div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60">
              <div>
                <span className="text-slate-500">Hạn dùng: </span>
                <strong className="text-slate-800">
                  {formatShortDate(item.expiryDate)}
                </strong>
                <span className="text-[10px] text-slate-400 ml-1">
                  ({item.daysRemaining < 0 ? `Quá ${Math.abs(item.daysRemaining)}d` : `${item.daysRemaining}d`})
                </span>
              </div>
              <div className="font-bold text-slate-900 tabular-nums">
                {item.availableQuantity.toLocaleString("vi-VN")} {item.unitName}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <Link
                href={item.batchId > 0 ? `/inventory/batches/${item.batchId}` : `/inventory/${item.medicineId}`}
                className="text-[11.5px] text-slate-600 hover:underline"
              >
                Chi tiết lô
              </Link>
              <Link
                href="/stock-out/new"
                className="btn btn-primary btn-sm py-1 px-3 text-[11px]"
              >
                <ArrowUpFromLine size={12} />
                Xuất kho FEFO
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
