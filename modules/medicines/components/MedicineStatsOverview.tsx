import { AlertTriangle, CheckCircle2, Pill, ShieldAlert } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";

export interface MedicineStatsOverviewProps {
  totalMedicines: number;
  activeMedicines: number;
  controlledMedicines: number;
  lowStockMedicines: number;
}

export function MedicineStatsOverview({
  totalMedicines,
  activeMedicines,
  controlledMedicines,
  lowStockMedicines,
}: MedicineStatsOverviewProps) {
  const hasLowStock = lowStockMedicines > 0;
  const hasControlled = controlledMedicines > 0;

  return (
    <section
      className="stats-overview-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4"
      aria-label="Chỉ số danh mục thuốc"
    >
      {/* 1. Tổng số thuốc */}
      <StatCard
        title="Tổng danh mục thuốc"
        value={totalMedicines.toLocaleString("vi-VN")}
        unit="loại"
        icon={Pill}
        colorVariant="emerald"
        href="/medicines"
        hint="Tổng số hoạt chất và biệt dược đang quản lý trong hệ thống"
      />

      {/* 2. Đang lưu hành */}
      <StatCard
        title="Đang lưu hành"
        value={activeMedicines.toLocaleString("vi-VN")}
        unit="loại"
        icon={CheckCircle2}
        colorVariant="teal"
        href="/medicines?active=Y"
        hint="Các thuốc ở trạng thái hoạt động bình thường, sẵn sàng nhập/xuất"
      />

      {/* 3. Thuốc kiểm soát đặc biệt */}
      <StatCard
        title="Kiểm soát đặc biệt"
        value={controlledMedicines.toLocaleString("vi-VN")}
        unit="loại"
        icon={ShieldAlert}
        colorVariant="amber"
        href="/medicines?controlled=Y"
        isWarning={hasControlled}
        hint="Thuốc gây nghiện, hướng thần, tiền chất tuân thủ quy chế kiểm soát đặc biệt"
        statusBadge={
          hasControlled ? (
            <span className="text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-[var(--radius-sm)]">
              Quy chế
            </span>
          ) : undefined
        }
      />

      {/* 4. Dưới định mức tối thiểu */}
      <StatCard
        title="Dưới định mức tồn (Min)"
        value={lowStockMedicines.toLocaleString("vi-VN")}
        unit="loại"
        icon={AlertTriangle}
        colorVariant={hasLowStock ? "red" : "neutral"}
        href="/inventory"
        isAlert={hasLowStock}
        hint="Các loại thuốc có tồn kho khả dụng thấp hơn mức an toàn tối thiểu"
        statusBadge={
          hasLowStock ? (
            <span className="text-[10px] font-bold text-red-800 bg-red-100 border border-red-300 px-2 py-0.5 rounded-[var(--radius-sm)]">
              Cần dự trù
            </span>
          ) : undefined
        }
      />
    </section>
  );
}
