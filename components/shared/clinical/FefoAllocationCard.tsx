import React from "react";
import { Zap, AlertTriangle, ShieldCheck, CheckCircle2, Info } from "lucide-react";
import type { FefoProposalResult } from "@/modules/inventory/types/inventory.types";
import { ExpiryThresholdMeter } from "./ExpiryThresholdMeter";

export interface FefoAllocationCardProps {
  medicineName: string;
  medicineCode: string;
  unitName: string;
  proposal: FefoProposalResult;
  onOverrideReasonChange?: (batchId: number, reason: string) => void;
  onToggleOverride?: (batchId: number, isOverride: boolean) => void;
  allowOverride?: boolean;
  className?: string;
}

/**
 * FefoAllocationCard renders automated FEFO allocation proposals for medicine dispatch.
 * Enforces:
 * - Priority order of earliest-expiring batch first
 * - Visual warning for near-expiry and expired candidates
 * - Mandatory clinical justification on manual FEFO overrides
 * - Prominent alert on stock deficit / insufficient allocatable balance
 */
export function FefoAllocationCard({
  medicineName,
  medicineCode,
  unitName,
  proposal,
  onOverrideReasonChange,
  onToggleOverride,
  allowOverride = false,
  className = "",
}: FefoAllocationCardProps) {
  const totalAllocated = proposal.allocations.reduce((sum, item) => sum + item.allocatedQuantity, 0);
  const hasOverride = proposal.allocations.some((item) => item.isFefoOverride);

  return (
    <div
      className={`panel overflow-hidden border border-[var(--border-default)] rounded-[var(--radius-lg)] bg-white shadow-[var(--shadow-elevation-1)] ${className}`}
    >
      {/* Header đề xuất FEFO */}
      <div className="bg-slate-50 border-b border-[var(--border-default)] px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[var(--radius-md)] bg-teal-50 border border-teal-200 text-[var(--brand-accent)] flex items-center justify-center shrink-0">
            <Zap size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-sm">{medicineName}</span>
              <span className="text-xs text-slate-500 font-mono">({medicineCode})</span>
            </div>
            <div className="text-xs text-slate-500">
              Yêu cầu xuất: <strong className="text-slate-800 tabular-nums">{proposal.requestedQuantity}</strong> {unitName} · 
              Khả dụng toàn kho: <strong className="text-emerald-700 tabular-nums">{proposal.availableStock}</strong> {unitName}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {proposal.insufficient ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-sm)] text-xs font-bold bg-red-100 text-red-800 border border-red-300">
              <AlertTriangle size={13} /> Thiếu {proposal.missingQuantity} {unitName}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-sm)] text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
              <ShieldCheck size={13} /> Đáp ứng đủ 100% FEFO
            </span>
          )}
        </div>
      </div>

      {/* Cảnh báo thiếu tồn nếu không đủ thuốc */}
      {proposal.insufficient && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2.5 flex items-center gap-2.5 text-xs text-red-800">
          <AlertTriangle size={15} className="shrink-0 text-red-600" />
          <span>
            <strong>Cảnh báo thiếu hụt:</strong> Kho hiện chỉ có {proposal.availableStock} {unitName}. 
            Còn thiếu <strong>{proposal.missingQuantity} {unitName}</strong> để hoàn tất phiếu xuất.
          </span>
        </div>
      )}

      {/* Danh sách các lô được phân bổ theo thứ tự FEFO */}
      <div className="p-4 space-y-3">
        {proposal.allocations.length === 0 ? (
          <div className="text-center py-6 text-slate-500 text-xs">
            <Info size={24} className="mx-auto mb-2 text-slate-400" />
            Không có lô thuốc nào khả dụng để xuất cho mặt hàng này.
          </div>
        ) : (
          proposal.allocations.map((item, index) => {
            const isFirstBatch = index === 0 && !item.isFefoOverride;

            return (
              <div
                key={item.batchId}
                className={`p-3 rounded-[var(--radius-md)] border transition-all ${
                  item.isFefoOverride
                    ? "bg-amber-50/40 border-amber-300 shadow-sm"
                    : isFirstBatch
                    ? "bg-emerald-50/30 border-emerald-300 shadow-sm"
                    : "bg-slate-50/50 border-slate-200"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center justify-center shrink-0">
                      {index + 1}
                    </span>
                    <span className="font-mono font-bold text-xs text-slate-900 cell-batch">
                      Lô: {item.lotNumber}
                    </span>

                    {isFirstBatch && (
                      <span className="fefo-badge-priority text-[10px] px-2 py-0.5 rounded-[var(--radius-sm)] border flex items-center gap-1">
                        <CheckCircle2 size={11} /> ƯU TIÊN FEFO #1
                      </span>
                    )}

                    {item.isFefoOverride && (
                      <span className="fefo-badge-override text-[10px] px-2 py-0.5 rounded-[var(--radius-sm)] border flex items-center gap-1 font-bold">
                        <AlertTriangle size={11} /> ĐÃ GHI ĐÈ THỦ CÔNG
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2.5 text-xs">
                    <ExpiryThresholdMeter expiryDate={item.expiryDate} compact />
                    <div className="text-slate-700">
                      Xuất: <strong className="text-slate-900 text-sm tabular-nums">{item.allocatedQuantity}</strong>{" "}
                      <span className="text-slate-500">{unitName}</span>
                    </div>

                    {allowOverride && onToggleOverride && (
                      <button
                        type="button"
                        onClick={() => onToggleOverride(item.batchId, !item.isFefoOverride)}
                        className={`text-[11px] font-medium px-2 py-0.5 rounded-[var(--radius-sm)] border transition-all cursor-pointer ${
                          item.isFefoOverride
                            ? "border-amber-400 bg-amber-100 text-amber-900 hover:bg-amber-200"
                            : "border-slate-300 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                        }`}
                        title={item.isFefoOverride ? "Hủy ghi đè FEFO (khôi phục đề xuất tự động)" : "Ghi đè thủ công lô thuốc này"}
                      >
                        {item.isFefoOverride ? "Hủy ghi đè" : "Ghi đè FEFO"}
                      </button>
                    )}
                  </div>
                </div>

                {/* Khung nhập lý do lâm sàng khi ghi đè FEFO */}
                {allowOverride && item.isFefoOverride && (
                  <div className="mt-2.5 pt-2.5 border-t border-amber-200/80">
                    <label className="block text-[11px] font-semibold text-amber-900 mb-1">
                      ⚠️ Bắt buộc nhập lý do lâm sàng khi ghi đè lô FEFO:
                    </label>
                    <input
                      type="text"
                      className="w-full text-xs px-2.5 py-1.5 rounded-[var(--radius-md)] border border-amber-300 bg-white focus:outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200/50"
                      placeholder="Ví dụ: Chỉ định phác đồ của bác sĩ điều trị, đóng gói khay thuốc chuyên khoa..."
                      value={item.overrideReason || ""}
                      onChange={(e) => onOverrideReasonChange?.(item.batchId, e.target.value)}
                    />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer tổng kết phân bổ */}
      <div className="bg-slate-50 border-t border-[var(--border-default)] px-4 py-2.5 flex items-center justify-between text-xs text-slate-600">
        <div>
          Tổng đã phân bổ: <strong className="text-slate-900 tabular-nums">{totalAllocated}</strong> /{" "}
          <span className="tabular-nums">{proposal.requestedQuantity}</span> {unitName}
        </div>
        {hasOverride && (
          <div className="text-amber-800 text-[11px] font-medium flex items-center gap-1">
            <AlertTriangle size={12} /> Phiếu này có lô ghi đè FEFO
          </div>
        )}
      </div>
    </div>
  );
}
