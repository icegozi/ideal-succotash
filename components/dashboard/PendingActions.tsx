import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  ClipboardList,
  ShieldAlert,
} from "lucide-react";
import { Badge } from "@/components/shared/Badge";
import { SectionCard } from "@/components/ui/SectionCard";
import { PendingActionItem } from "./PendingActionItem";

export interface PendingActionsProps {
  draftReceiptsCount: number;
  draftIssuesCount: number;
  lowStockCount: number;
  expiredBatchCount: number;
}

export function PendingActions({
  draftReceiptsCount,
  draftIssuesCount,
  lowStockCount,
  expiredBatchCount,
}: PendingActionsProps) {
  const totalTasks =
    draftReceiptsCount + draftIssuesCount + lowStockCount + expiredBatchCount;

  return (
    <SectionCard
      title="Việc cần xử lý"
      icon={<ClipboardList size={17} className="text-slate-600" />}
      badge={
        totalTasks > 0 ? (
          <Badge variant={totalTasks > 5 ? "warning" : "neutral"} showDot>
            {totalTasks} mục
          </Badge>
        ) : undefined
      }
      bodyClassName="p-3.5 sm:p-4 space-y-2.5"
    >
      {/* 1. Phiếu nhập kho nháp */}
      <PendingActionItem
        icon={ArrowDownToLine}
        title="Phiếu nhập kho"
        description="Chờ kiểm đếm thực tế và xác nhận vào tồn"
        count={draftReceiptsCount}
        status="chờ duyệt"
        href="/stock-in?status=DRAFT"
        severity={draftReceiptsCount > 0 ? "warning" : "normal"}
      />

      {/* 2. Phiếu xuất kho nháp */}
      <PendingActionItem
        icon={ArrowUpFromLine}
        title="Phiếu xuất kho"
        description="Chờ xác nhận phân bổ xuất thuốc FEFO"
        count={draftIssuesCount}
        status="chờ xử lý"
        href="/stock-out?status=DRAFT"
        severity={draftIssuesCount > 0 ? "warning" : "normal"}
      />

      {/* 3. Thuốc dưới định mức an toàn */}
      <PendingActionItem
        icon={AlertTriangle}
        title="Thuốc dưới định mức"
        description="Tồn khả dụng thấp hơn mức an toàn tối thiểu"
        count={lowStockCount}
        status="cần bổ sung"
        href="/inventory"
        severity={lowStockCount > 0 ? "danger" : "normal"}
      />

      {/* 4. Lô thuốc đã hết hạn */}
      <PendingActionItem
        icon={ShieldAlert}
        title="Lô thuốc đã hết hạn"
        description="Đã khóa xuất kho tự động để bảo đảm an toàn"
        count={expiredBatchCount}
        status="đã khóa xuất"
        href="/inventory?expiryStatus=EXPIRED"
        severity={expiredBatchCount > 0 ? "danger" : "normal"}
      />
    </SectionCard>
  );
}
