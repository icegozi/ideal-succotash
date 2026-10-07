import Link from "next/link";
import { ArrowRight, CheckCircle2, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/shared/Badge";
import { SectionCard } from "@/components/ui/SectionCard";
import { DashboardEmptyState } from "@/components/ui/DashboardEmptyState";
import { FefoAlertTable, type FefoAlertItem } from "./FefoAlertTable";

export interface FefoAlertCardProps {
  items: FefoAlertItem[];
  totalAlertCount: number;
}

export function FefoAlertCard({ items, totalAlertCount }: FefoAlertCardProps) {
  const hasAlerts = items.length > 0;

  return (
    <SectionCard
      title="Cảnh báo FEFO"
      icon={<ShieldAlert size={17} className="text-amber-600" />}
      badge={
        totalAlertCount > 0 ? (
          <Badge variant="warning" showDot>
            {totalAlertCount} lô
          </Badge>
        ) : undefined
      }
      action={
        <Link
          href="/inventory?expiryStatus=NEAR_EXPIRY"
          className="text-xs font-semibold text-[var(--brand-primary)] hover:underline inline-flex items-center gap-1"
        >
          <span>Xem tất cả</span>
          <ArrowRight size={13} aria-hidden="true" />
        </Link>
      }
      bodyClassName={hasAlerts ? "p-0 sm:p-0" : "p-4 sm:p-5"}
    >
      {hasAlerts ? (
        <FefoAlertTable items={items} />
      ) : (
        <DashboardEmptyState
          icon={<CheckCircle2 size={24} className="text-emerald-600" />}
          title="Không có lô thuốc cần xử lý"
          description="Toàn bộ các lô thuốc đang lưu kho đều trong ngưỡng an toàn (> 90 ngày)."
          action={
            <Link href="/inventory" className="btn btn-outline btn-sm">
              Tra cứu kho thuốc
            </Link>
          }
        />
      )}
    </SectionCard>
  );
}
