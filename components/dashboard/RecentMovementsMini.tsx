import Link from "next/link";
import { ArrowRight, History } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import type { StockMovement } from "@/modules/inventory/types/inventory.types";

export interface RecentMovementsMiniProps {
  movements: StockMovement[];
}

export function RecentMovementsMini({ movements }: RecentMovementsMiniProps) {
  if (movements.length === 0) return null;

  return (
    <SectionCard
      title="Biến động sổ cái kho gần nhất"
      icon={<History size={17} className="text-teal-600" />}
      action={
        <Link
          href="/inventory"
          className="text-xs font-semibold text-[var(--brand-primary)] hover:underline inline-flex items-center gap-1"
        >
          <span>Xem sổ cái</span>
          <ArrowRight size={13} aria-hidden="true" />
        </Link>
      }
      bodyClassName="p-0 sm:p-0"
    >
      <div className="divide-y divide-slate-100">
        {movements.map((m) => {
          const isIncrease =
            m.movementType === "STOCK_IN" || m.movementType === "STOCK_OUT_REVERSAL";
          return (
            <div
              key={m.id}
              className="py-2.5 px-4 sm:px-5 flex items-center justify-between gap-3 text-xs hover:bg-slate-50/60 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                    isIncrease
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-slate-100 text-slate-800"
                  }`}
                  aria-hidden="true"
                >
                  {isIncrease ? "+" : "−"}
                </span>

                <div className="min-w-0">
                  <div className="font-semibold text-slate-900 truncate">
                    {m.medicineName}
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-2">
                    <span className="font-mono text-[10.5px]">Lô: {m.lotNumber}</span>
                    <span>·</span>
                    <span className="truncate">Phiếu: {m.referenceCode}</span>
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
                  bởi {m.performedBy}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}
