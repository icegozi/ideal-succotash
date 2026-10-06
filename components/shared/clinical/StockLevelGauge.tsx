import React from "react";
import { AlertCircle, CheckCircle2, ShoppingCart, Lock } from "lucide-react";
import { Button } from "@/components/shared/Button";

export interface StockLevelGaugeProps {
  onHandQuantity: number;
  availableQuantity: number;
  reservedQuantity?: number;
  minimumStock: number;
  unitName: string;
  medicineName?: string;
  showReorderAction?: boolean;
  onReorderClick?: () => void;
  compact?: boolean;
  className?: string;
}

/**
 * StockLevelGauge visualizes clinical inventory levels against minimum safety thresholds.
 * Thresholds:
 * - OUT_OF_STOCK: availableQuantity <= 0
 * - LOW_STOCK: 0 < availableQuantity < minimumStock
 * - HEALTHY: availableQuantity >= minimumStock
 */
export function StockLevelGauge({
  onHandQuantity,
  availableQuantity,
  reservedQuantity,
  minimumStock,
  unitName,
  medicineName,
  showReorderAction = false,
  onReorderClick,
  compact = false,
  className = "",
}: StockLevelGaugeProps) {
  const calculatedReserved =
    reservedQuantity !== undefined ? reservedQuantity : Math.max(0, onHandQuantity - availableQuantity);

  const isOutOfStock = availableQuantity <= 0;
  const isLowStock = availableQuantity < minimumStock && !isOutOfStock;

  // Visual gauge scaling: baseline bounded by minimum stock and physical quantity
  // Max scale giả định = max(minimumStock * 2.5, onHandQuantity * 1.2, 100)
  const maxScale = Math.max(minimumStock * 2.5, onHandQuantity * 1.2, 50);
  const availablePercent = Math.min(100, Math.max(0, (availableQuantity / maxScale) * 100));
  const minPercent = Math.min(100, Math.max(0, (minimumStock / maxScale) * 100));

  if (compact) {
    return (
      <div className={`inline-flex flex-col gap-1 min-w-[140px] text-xs ${className}`}>
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold tabular-nums text-slate-800">
            {availableQuantity.toLocaleString("vi-VN")}{" "}
            <span className="text-[11px] font-normal text-slate-500">{unitName}</span>
          </span>
          {isLowStock || isOutOfStock ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.2 rounded">
              <AlertCircle size={10} /> {isOutOfStock ? "HẾT TỒN" : "DƯỚI MIN"}
            </span>
          ) : (
            <span className="text-[10px] text-emerald-700 font-medium">Đủ tồn</span>
          )}
        </div>

        {/* Thanh đo mini */}
        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden relative border border-slate-200/60">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              isOutOfStock ? "bg-red-500" : isLowStock ? "bg-amber-500" : "bg-emerald-600"
            }`}
            style={{ width: `${availablePercent}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`p-4 rounded-[var(--radius-lg)] border bg-white shadow-[var(--shadow-elevation-1)] ${
        isOutOfStock
          ? "border-red-300 bg-red-50/30"
          : isLowStock
          ? "border-amber-300 bg-amber-50/20"
          : "border-[var(--border-default)]"
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          {medicineName && (
            <div className="font-semibold text-sm text-slate-900 mb-0.5">{medicineName}</div>
          )}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Trạng thái tồn kho:</span>
            {isOutOfStock ? (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-red-700 bg-red-100 border border-red-300 px-2 py-0.5 rounded-[var(--radius-sm)]">
                <AlertCircle size={13} /> HẾT TỒN KHẢ DỤNG
              </span>
            ) : isLowStock ? (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-[var(--radius-sm)]">
                <AlertCircle size={13} /> DƯỚI ĐỊNH MỨC AN TOÀN
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-[var(--radius-sm)]">
                <CheckCircle2 size={13} /> ĐẠT CHỈ TIÊU AN TOÀN
              </span>
            )}
          </div>
        </div>

        {showReorderAction && (isLowStock || isOutOfStock) && onReorderClick && (
          <Button
            size="sm"
            variant="primary"
            leftIcon={<ShoppingCart size={14} />}
            onClick={onReorderClick}
          >
            Lập dự trù
          </Button>
        )}
      </div>

      {/* Bộ 3 chỉ số tồn kho */}
      <div className="grid grid-cols-3 gap-2 p-2.5 rounded-[var(--radius-md)] bg-slate-50 border border-slate-200/80 mb-3 text-center">
        <div>
          <div className="text-[11px] text-slate-500 font-medium">Tồn khả dụng</div>
          <div className="text-base font-bold tabular-nums text-slate-900">
            {availableQuantity.toLocaleString("vi-VN")}{" "}
            <span className="text-xs font-normal text-slate-500">{unitName}</span>
          </div>
        </div>
        <div className="border-x border-slate-200">
          <div className="text-[11px] text-slate-500 font-medium flex items-center justify-center gap-1">
            <Lock size={11} className="text-amber-600" /> Tồn giữ / khóa
          </div>
          <div className="text-base font-bold tabular-nums text-slate-700">
            {calculatedReserved.toLocaleString("vi-VN")}{" "}
            <span className="text-xs font-normal text-slate-500">{unitName}</span>
          </div>
        </div>
        <div>
          <div className="text-[11px] text-slate-500 font-medium">Định mức tối thiểu (Min)</div>
          <div className="text-base font-bold tabular-nums text-slate-700">
            {minimumStock.toLocaleString("vi-VN")}{" "}
            <span className="text-xs font-normal text-slate-500">{unitName}</span>
          </div>
        </div>
      </div>

      {/* Visual Gauge Bar có vạch mốc Min */}
      <div className="relative pt-1">
        <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden relative">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              isOutOfStock
                ? "bg-red-500"
                : isLowStock
                ? "bg-amber-500"
                : "bg-[var(--brand-primary)]"
            }`}
            style={{ width: `${availablePercent}%` }}
          />
        </div>

        {/* Vạch mốc Minimum Stock */}
        {minimumStock > 0 && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-slate-900 z-10"
            style={{ left: `${minPercent}%` }}
            title={`Ngưỡng an toàn tối thiểu: ${minimumStock} ${unitName}`}
          >
            <div className="absolute -top-4 -translate-x-1/2 text-[9px] font-bold text-slate-600 whitespace-nowrap">
              Min
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center mt-2 text-[11px] text-slate-500">
        <span>0</span>
        <span>
          Tổng tồn vật lý: <strong>{onHandQuantity.toLocaleString("vi-VN")}</strong> {unitName}
        </span>
      </div>
    </div>
  );
}
