import type { Metadata } from "next";
import { connection } from "next/server";

import { PageHeader } from "@/components/shared/PageHeader";
import { requirePermission, permissions } from "@/lib/auth/permissions";
import { StockReceiptForm } from "@/modules/inventory/components/StockReceiptForm";
import { getInventoryService } from "@/modules/inventory/services";

export const metadata: Metadata = { title: "Tạo phiếu nhập kho" };

export default async function NewStockReceiptPage() {
  await connection();
  await requirePermission(permissions.stockInCreate);

  const inventoryService = getInventoryService();
  const [warehouses, suppliers, medicines] = await Promise.all([
    inventoryService.listWarehouses(),
    inventoryService.listSuppliers(),
    inventoryService.listMedicines(),
  ]);

  return (
    <div className="page-stack narrow-page">
      <PageHeader
        title="Tạo phiếu nhập kho"
        description="Nhập thuốc theo lô, kiểm soát hạn dùng và đơn giá từ nhà cung cấp."
        parent={{ href: "/stock-in", label: "Nhập kho" }}
      />

      <StockReceiptForm
        warehouses={warehouses}
        suppliers={suppliers}
        medicines={medicines}
      />
    </div>
  );
}
