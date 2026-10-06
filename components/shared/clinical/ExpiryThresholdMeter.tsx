import React from "react";
import { AlertTriangle, Clock, CheckCircle2, ShieldAlert } from "lucide-react";

export interface ExpiryThresholdMeterProps {
  expiryDate: string; // YYYY-MM-DD hoặc ISO string
  manufacturingDate?: string | null;
  totalShelfLifeDays?: number; // Tổng số ngày hạn sử dụng (nếu biết)
  compact?: boolean;
  className?: string;
}

/**
 * Calculate days remaining until expiration date.
 * Returns a negative integer if already expired.
 */
export function calculateDaysUntilExpiry(expiryDateStr: string): number {
  if (!expiryDateStr) return 0;
  const target = new Date(expiryDateStr);
  const now = new Date();
  // Normalize to midnight for calendar-day accuracy
  const targetDay = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.round((targetDay - today) / (1000 * 60 * 60 * 24));
}

/**
 * Format YYYY-MM-DD date string to Vietnamese clinical standard DD/MM/YYYY.
 */
export function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return "N/A";
  const parts = dateStr.split("T")[0].split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

/**
 * ExpiryThresholdMeter displays a multi-tier clinical countdown meter.
 * Tiers:
 * - EXPIRED: < 0 days (Locked)
 * - CRITICAL: 1 - 30 days (High emergency alert)
 * - NEAR_EXPIRY: 31 - 90 days (Standard near-expiry warning)
 * - CAUTION: 91 - 180 days (Active monitoring)
 * - SAFE: > 180 days (Normal safe inventory)
 */
export function ExpiryThresholdMeter({
  expiryDate,
  manufacturingDate,
  totalShelfLifeDays,
  compact = false,
  className = "",
}: ExpiryThresholdMeterProps) {
  const daysRemaining = calculateDaysUntilExpiry(expiryDate);
  const formattedDate = formatDisplayDate(expiryDate);

  // Determine clinical risk tier
  let tier: "EXPIRED" | "CRITICAL" | "NEAR_EXPIRY" | "CAUTION" | "SAFE";
  let statusText: string;
  let colorVar: string;
  let bgVar: string;
  let borderVar: string;
  let IconComponent = CheckCircle2;

  if (daysRemaining < 0) {
    tier = "EXPIRED";
    statusText = `Đã hết hạn (${Math.abs(daysRemaining)} ngày trước)`;
    colorVar = "var(--status-danger-text)";
    bgVar = "var(--status-danger-bg)";
    borderVar = "var(--status-danger-border)";
    IconComponent = ShieldAlert;
  } else if (daysRemaining <= 30) {
    tier = "CRITICAL";
    statusText = `Cận hạn nguy cấp (Còn ${daysRemaining} ngày)`;
    colorVar = "#b91c1c";
    bgVar = "#fef2f2";
    borderVar = "#f87171";
    IconComponent = AlertTriangle;
  } else if (daysRemaining <= 90) {
    tier = "NEAR_EXPIRY";
    statusText = `Sắp hết hạn (Còn ${daysRemaining} ngày)`;
    colorVar = "var(--status-warning-text)";
    bgVar = "var(--status-warning-bg)";
    borderVar = "var(--status-warning-border)";
    IconComponent = Clock;
  } else if (daysRemaining <= 180) {
    tier = "CAUTION";
    statusText = `Theo dõi (Còn ${daysRemaining} ngày)`;
    colorVar = "var(--status-info-text)";
    bgVar = "var(--status-info-bg)";
    borderVar = "var(--status-info-border)";
    IconComponent = Clock;
  } else {
    tier = "SAFE";
    statusText = `Hạn dùng an toàn (Còn ${daysRemaining} ngày)`;
    colorVar = "var(--status-success-text)";
    bgVar = "var(--status-success-bg)";
    borderVar = "var(--status-success-border)";
    IconComponent = CheckCircle2;
  }

  // Calculate shelf-life percentage (default to 2 years / 730 days if not provided)
  const maxDays = totalShelfLifeDays || 730;
  const percentage = Math.max(0, Math.min(100, Math.round((daysRemaining / maxDays) * 100)));

  if (compact) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[var(--radius-sm)] border text-xs font-semibold select-none ${
          tier === "CRITICAL" ? "pulse-subtle" : ""
        } ${className}`}
        style={{ color: colorVar, backgroundColor: bgVar, borderColor: borderVar }}
        title={`Hạn dùng: ${formattedDate} (${statusText})`}
      >
        <IconComponent size={13} className="shrink-0" />
        <span className="font-mono tabular-nums">{formattedDate}</span>
        <span className="text-[10px] opacity-85">({daysRemaining >= 0 ? `${daysRemaining}d` : "Hết hạn"})</span>
      </div>
    );
  }

  return (
    <div
      className={`p-3 rounded-[var(--radius-md)] border text-xs transition-all ${
        tier === "CRITICAL" ? "pulse-subtle shadow-sm" : ""
      } ${className}`}
      style={{ backgroundColor: bgVar, borderColor: borderVar }}
    >
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5 font-semibold" style={{ color: colorVar }}>
          <IconComponent size={15} className="shrink-0" />
          <span>{statusText}</span>
        </div>
        <div className="font-mono tabular-nums font-bold text-slate-800 text-[13px]">
          {formattedDate}
        </div>
      </div>

      {/* Thanh đo tiến trình tuổi thọ thuốc (Shelf-life Progress Bar) */}
      <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${tier === "EXPIRED" ? 100 : percentage}%`,
            backgroundColor: colorVar,
          }}
        />
      </div>

      <div className="flex justify-between items-center mt-1 text-[10px] text-slate-500 font-medium">
        <span>{manufacturingDate ? `NSX: ${formatDisplayDate(manufacturingDate)}` : "Chuẩn GSP"}</span>
        <span>Ngưỡng chuẩn: 90 ngày</span>
      </div>
    </div>
  );
}
