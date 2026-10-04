import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import { PageHeader } from "@/components/shared/PageHeader";
import { can, requirePermission, permissions } from "@/lib/auth/permissions";
import { ReceiptDetailView } from "@/modules/inventory/components/ReceiptDetailView";
import { getStockInService } from "@/modules/inventory/services";

export const metadata: Metadata = { title: "Chi tiết phiếu nhập kho" };

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function StockReceiptDetailPage({ params }: PageProps) {
  await connection();
  await requirePermission(permissions.stockInRead);

  const { id } = await params;
  const receiptId = Number(id);
  if (isNaN(receiptId)) notFound();

  const [receipt, canConfirm, canCancel] = await Promise.all([
    getStockInService().getReceiptById(receiptId),
    can(permissions.stockInConfirm),
    can(permissions.stockInCancel),
  ]);

  if (!receipt) notFound();

  return (
    <div className="page-stack">
      <PageHeader
        title={`Phiếu nhập kho: ${receipt.receiptCode}`}
        description="Chi tiết các mặt hàng thuốc, số lô, hạn dùng và trạng thái xác nhận nhập tồn."
        parent={{ href: "/stock-in", label: "Nhập kho" }}
      />

      <ReceiptDetailView
        receipt={receipt}
        canConfirm={canConfirm}
        canCancel={canCancel}
      />
    </div>
  );
}
