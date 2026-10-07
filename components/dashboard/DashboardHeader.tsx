import { PageHeader } from "@/components/shared/PageHeader";
import { QuickActions } from "./QuickActions";

export function DashboardHeader() {
  return (
    <PageHeader
      title="Tổng quan kho"
      description="Theo dõi tồn kho, FEFO và các cảnh báo cần xử lý."
      actions={<QuickActions />}
    />
  );
}
