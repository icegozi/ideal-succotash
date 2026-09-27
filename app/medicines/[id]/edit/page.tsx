import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import { PageHeader } from "@/components/shared/PageHeader";
import { permissions, requirePermission } from "@/lib/auth/permissions";
import { AppError } from "@/lib/errors/app-error";
import { MedicineForm } from "@/modules/medicines/components/MedicineForm";
import { getMedicineService } from "@/modules/medicines/services";

export const metadata: Metadata = { title: "Chỉnh sửa thuốc" };

export default async function EditMedicinePage({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  await requirePermission(permissions.medicineUpdate);
  const id = Number((await params).id);
  const service = getMedicineService();
  let medicine;
  try { medicine = await service.getById(id); } catch (error) { if (error instanceof AppError && error.code === "NOT_FOUND") notFound(); throw error; }
  const units = await service.listActiveUnits();
  return <div className="page-stack narrow-page"><PageHeader title="Chỉnh sửa thuốc" description={`${medicine.code} · ${medicine.name}`} parent={{ href: `/medicines/${id}`, label: medicine.name }} /><MedicineForm medicine={medicine} units={units} /></div>;
}
