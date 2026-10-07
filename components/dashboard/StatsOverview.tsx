import { Boxes, Clock, Pill, ShieldAlert } from "lucide-react";
import type { InventoryDashboardMetrics } from "@/modules/inventory/types/inventory.types";
import { StatCard } from "./StatCard";

export interface StatsOverviewProps {
  metrics: InventoryDashboardMetrics;
}

export function StatsOverview({ metrics }: StatsOverviewProps) {
  const hasNearExpiry = metrics.nearExpiryBatchCount > 0;
  const hasCritical = metrics.expiredBatchCount > 0 || metrics.lowStockMedicineCount > 0;

  return (
    <section className="stats-overview-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4" aria-label="Chỉ số hoạt động kho">
      {/* 1. Danh mục thuốc */}
      <StatCard
        title="Danh mục thuốc"
        value={metrics.totalMedicineCount.toLocaleString("vi-VN")}
        unit="loại"
        icon={Pill}
        colorVariant="emerald"
        href="/medicines"
        hint="Tổng số hoạt chất, tên biệt dược đang lưu hành trong danh mục"
      />

      {/* 2. Lô đang lưu kho */}
      <StatCard
        title="Lô đang lưu kho"
        value={metrics.totalBatchCount.toLocaleString("vi-VN")}
        unit="lô"
        icon={Boxes}
        colorVariant="teal"
        href="/inventory"
        hint="Tổng số lô thuốc vật lý phân bổ trên toàn bộ hệ thống kho"
      />

      {/* 3. Lô cận hạn */}
      <StatCard
        title="Lô cận hạn (≤ 90 ngày)"
        value={metrics.nearExpiryBatchCount.toLocaleString("vi-VN")}
        unit="lô"
        icon={Clock}
        colorVariant="amber"
        href="/inventory?expiryStatus=NEAR_EXPIRY"
        isWarning={hasNearExpiry}
        hint="Các lô thuốc cận hạn sử dụng trong vòng 90 ngày - Cần ưu tiên cấp phát FEFO"
        statusBadge={
          hasNearExpiry ? (
            <span className="text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-[var(--radius-sm)]">
              Ưu tiên xuất
            </span>
          ) : undefined
        }
      />

      {/* 4. Cần xử lý gấp */}
      <StatCard
        title="Hết hạn / Dưới Min"
        value={`${metrics.expiredBatchCount} / ${metrics.lowStockMedicineCount}`}
        unit="lô / loại"
        icon={ShieldAlert}
        colorVariant={hasCritical ? "red" : "neutral"}
        href="/inventory?expiryStatus=EXPIRED"
        isAlert={hasCritical}
        hint="Lô thuốc đã hết hạn (khóa xuất) / Loại thuốc dưới tồn an toàn tối thiểu"
        statusBadge={
          hasCritical ? (
            <span className="text-[10px] font-bold text-red-800 bg-red-100 border border-red-300 px-2 py-0.5 rounded-[var(--radius-sm)]">
              Khẩn cấp
            </span>
          ) : undefined
        }
      />
    </section>
  );
}
