import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import { PageHeader } from "@/components/shared/PageHeader";
import { can, requirePermission, permissions } from "@/lib/auth/permissions";
import { IssueDetailView } from "@/modules/inventory/components/IssueDetailView";
import { getStockOutService } from "@/modules/inventory/services";

export const metadata: Metadata = { title: "Chi tiết phiếu xuất kho" };

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function StockIssueDetailPage({ params }: PageProps) {
  await connection();
  await requirePermission(permissions.stockOutRead);

  const { id } = await params;
  const issueId = Number(id);
  if (isNaN(issueId)) notFound();

  const [issue, canConfirm, canCancel] = await Promise.all([
    getStockOutService().getIssueById(issueId),
    can(permissions.stockOutConfirm),
    can(permissions.stockOutCancel),
  ]);

  if (!issue) notFound();

  return (
    <div className="page-stack">
      <PageHeader
        title={`Phiếu xuất kho: ${issue.issueCode}`}
        description="Chi tiết số lượng xuất và phân bổ lô theo FEFO."
        parent={{ href: "/stock-out", label: "Xuất kho" }}
      />

      <IssueDetailView
        issue={issue}
        canConfirm={canConfirm}
        canCancel={canCancel}
      />
    </div>
  );
}
