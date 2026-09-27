import type { Metadata } from "next";
import { connection } from "next/server";

import { PageHeader } from "@/components/shared/PageHeader";
import { permissions, requirePermission } from "@/lib/auth/permissions";
import { MedicineForm } from "@/modules/medicines/components/MedicineForm";
import { getMedicineService } from "@/modules/medicines/services";

export const metadata: Metadata = { title: "Thêm thuốc" };

export default async function NewMedicinePage() {
  await connection();
  await requirePermission(permissions.medicineCreate);
  const units = await getMedicineService().listActiveUnits();
  return <div className="page-stack narrow-page"><PageHeader title="Thêm thuốc mới" description="Tạo hồ sơ thuốc và đơn vị lưu tồn cơ sở." parent={{ href: "/medicines", label: "Danh mục thuốc" }} /><MedicineForm units={units} /></div>;
}
