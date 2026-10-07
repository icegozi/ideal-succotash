import { PackageCheck } from "lucide-react";
import { connection } from "next/server";

import { isDemoDataMode } from "@/modules/medicines/repositories";
import {
  getInventoryService,
  getStockInService,
  getStockOutService,
} from "@/modules/inventory/services";
import { calculateDaysUntilExpiry } from "@/components/shared/clinical";
import { permissions, requirePermission } from "@/lib/auth/permissions";
import {
  DashboardHeader,
  StatsOverview,
  FefoAlertCard,
  PendingActions,
  RecentMovementsMini,
  type FefoAlertItem,
} from "@/components/dashboard";

export default async function DashboardPage() {
  await connection();
  await requirePermission(permissions.inventoryRead);
  const demo = isDemoDataMode();

  const inventoryService = getInventoryService();
  const stockInService = getStockInService();
  const stockOutService = getStockOutService();

  const [metrics, recentMovements, nearExpiryPage, draftReceipts, draftIssues] =
    await Promise.all([
      inventoryService.getDashboardMetrics(),
      inventoryService.listMovements({ limit: 5 }),
      inventoryService.listInventory({ expiryStatus: "NEAR_EXPIRY", pageSize: 6 }),
      stockInService.listReceipts({ status: "DRAFT", pageSize: 1 }),
      stockOutService.listIssues({ status: "DRAFT", pageSize: 1 }),
    ]);

  // Fetch detailed batch balance information for the top near-expiry items
  const alertBatches: FefoAlertItem[] = (
    await Promise.all(
      nearExpiryPage.items.slice(0, 6).map(async (item) => {
        const batches = await inventoryService.getMedicineBatches(
          item.medicineId,
          item.warehouseId,
        );
        return batches.map((b) => ({
          id: b.id,
          medicineId: b.medicineId,
          medicineCode: b.medicineCode,
          medicineName: b.medicineName,
          activeIngredient: b.medicineActiveIngredient,
          lotNumber: b.lotNumber,
          batchId: b.batchId,
          expiryDate: b.expiryDate,
          daysRemaining: b.daysUntilExpiry,
          availableQuantity: b.availableQuantity,
          unitName: b.unitName,
          warehouseName: b.warehouseName,
        }));
      }),
    )
  )
    .flat()
    .filter((b) => b.daysRemaining <= 90 && b.availableQuantity > 0)
    .sort((a, b) => a.daysRemaining - b.daysRemaining)
    .slice(0, 6);

  // Fallback to summary items if no individual batch rows were resolved
  const displayAlertItems: FefoAlertItem[] =
    alertBatches.length > 0
      ? alertBatches
      : nearExpiryPage.items.map((item, idx) => {
          const daysRemaining = item.nearestExpiryDate
            ? calculateDaysUntilExpiry(item.nearestExpiryDate)
            : 0;
          return {
            id: idx + 1,
            medicineId: item.medicineId,
            medicineCode: item.medicineCode,
            medicineName: item.medicineName,
            activeIngredient: item.activeIngredient,
            lotNumber: `${item.batchCount} lô`,
            batchId: 0,
            expiryDate: item.nearestExpiryDate || "",
            daysRemaining,
            availableQuantity: item.availableQuantity,
            unitName: item.unitName,
            warehouseName: item.warehouseName,
          };
        });

  return (
    <div className="page-stack">
      {/* Demo Mode Alert Banner */}
      {demo && (
        <div
          className="notice notice-info py-2 px-3 text-xs shadow-[var(--shadow-elevation-1)]"
          role="status"
        >
          <PackageCheck size={16} aria-hidden="true" className="shrink-0" />
          <span>
            Hệ thống đang hoạt động với dữ liệu Demo cục bộ. Toàn bộ tính năng đã sẵn sàng.
          </span>
        </div>
      )}

      {/* 1. Compact Dashboard Header with Integrated Quick Actions */}
      <DashboardHeader />

      {/* 2. 4 Clinical KPI Widgets */}
      <StatsOverview metrics={metrics} />

      {/* 3. Main Operational Grid: 65% FEFO Alerts & 35% Pending Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column (65%): FEFO Alerts & Critical Lots */}
        <div className="lg:col-span-8">
          <FefoAlertCard
            items={displayAlertItems}
            totalAlertCount={metrics.nearExpiryBatchCount}
          />
        </div>

        {/* Right Column (35%): Pending Operations & Tasks */}
        <div className="lg:col-span-4">
          <PendingActions
            draftReceiptsCount={draftReceipts.total}
            draftIssuesCount={draftIssues.total}
            lowStockCount={metrics.lowStockMedicineCount}
            expiredBatchCount={metrics.expiredBatchCount}
          />
        </div>
      </div>

      {/* 4. Recent Immutable Ledger Movements (Compact Audit Trail) */}
      <RecentMovementsMini movements={recentMovements} />
    </div>
  );
}
