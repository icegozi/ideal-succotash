import type { Metadata } from "next";
import { connection } from "next/server";

import { PageHeader } from "@/components/shared/PageHeader";
import { requirePermission, permissions } from "@/lib/auth/permissions";
import { StockIssueForm } from "@/modules/inventory/components/StockIssueForm";
import { getInventoryService } from "@/modules/inventory/services";

export const metadata: Metadata = { title: "Tạo phiếu xuất kho FEFO" };

export default async function NewStockIssuePage() {
  await connection();
  await requirePermission(permissions.stockOutCreate);

  const inventoryService = getInventoryService();
  const [warehouses, departments, medicines] = await Promise.all([
    inventoryService.listWarehouses(),
    inventoryService.listDepartments(),
    inventoryService.listMedicines(),
  ]);

  return (
    <div className="page-stack narrow-page">
      <PageHeader
        title="Tạo phiếu xuất kho"
        description="Xuất thuốc theo lô tự động theo FEFO (lô hạn dùng gần nhất được ưu tiên cấp phát)."
        parent={{ href: "/stock-out", label: "Xuất kho" }}
      />

      <StockIssueForm
        warehouses={warehouses}
        departments={departments}
        medicines={medicines}
      />
    </div>
  );
}
