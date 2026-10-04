import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { ArrowLeft, Building2, CheckCircle2, Pencil, Pill, Route, Scale, ShieldAlert } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/shared/Badge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { can, permissions, requirePermission } from "@/lib/auth/permissions";
import { AppError } from "@/lib/errors/app-error";
import { getMedicineService } from "@/modules/medicines/services";

export const metadata: Metadata = { title: "Chi tiết thuốc" };

export default async function MedicineDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  await requirePermission(permissions.medicineRead);
  const id = Number((await params).id);
  let medicine;
  try {
    medicine = await getMedicineService().getById(id);
  } catch (error) {
    if (error instanceof AppError && error.code === "NOT_FOUND") notFound();
    throw error;
  }
  const canUpdate = await can(permissions.medicineUpdate);

  return (
    <div className="page-stack">
      <PageHeader
        title={medicine.name}
        description={`Mã thuốc ${medicine.code}`}
        parent={{ href: "/medicines", label: "Danh mục thuốc" }}
        actions={
          <div className="button-row">
            <Link className="btn btn-secondary" href="/medicines">
              <ArrowLeft size={16} /> Danh sách
            </Link>
            {canUpdate ? (
              <Link className="btn btn-primary" href={`/medicines/${id}/edit`}>
                <Pencil size={15} /> Chỉnh sửa
              </Link>
            ) : null}
          </div>
        }
      />

      <section className="detail-hero panel">
        <div className="medicine-avatar">
          <Pill size={28} />
        </div>
        <div>
          <div className="detail-badges">
            <StatusBadge active={medicine.active === "Y"}>
              {medicine.active === "Y" ? "Đang hoạt động" : "Ngừng hoạt động"}
            </StatusBadge>
            {medicine.controlled === "Y" ? (
              <Badge variant="warning" icon={<ShieldAlert size={13} />}>
                Thuốc kiểm soát
              </Badge>
            ) : null}
          </div>
          <h2>{medicine.name}</h2>
          <p>
            {medicine.activeIngredient || "Chưa có hoạt chất"}
            {medicine.strength ? ` · ${medicine.strength}` : ""}
          </p>
        </div>
      </section>

      <div className="detail-grid">
        <section className="panel detail-card">
          <h2>Thông tin thuốc</h2>
          <dl>
            <div>
              <dt>Dạng bào chế</dt>
              <dd>
                <Pill size={15} /> {medicine.dosageForm || "—"}
              </dd>
            </div>
            <div>
              <dt>Đường dùng</dt>
              <dd>
                <Route size={15} /> {medicine.route || "—"}
              </dd>
            </div>
            <div>
              <dt>Hãng sản xuất</dt>
              <dd>
                <Building2 size={15} /> {medicine.manufacturer || "—"}
              </dd>
            </div>
          </dl>
        </section>

        <section className="panel detail-card">
          <h2>Thiết lập tồn kho</h2>
          <dl>
            <div>
              <dt>Đơn vị cơ sở</dt>
              <dd>
                <Scale size={15} /> {medicine.baseUnitName} ({medicine.baseUnitCode})
              </dd>
            </div>
            <div>
              <dt>Hệ số cơ sở</dt>
              <dd>
                <CheckCircle2 size={15} /> 1 {medicine.baseUnitName}
              </dd>
            </div>
            <div>
              <dt>Tồn tối thiểu</dt>
              <dd>
                <strong>{medicine.minimumStock.toLocaleString("vi-VN")}</strong> {medicine.baseUnitName.toLowerCase()}
              </dd>
            </div>
          </dl>
        </section>
      </div>

      <div className="notice notice-info">
        <Scale size={19} />
        <div>
          <strong>Quy đổi đơn vị</strong>
          <span>Đơn vị cơ sở hệ số 1 được tạo tự động. Quy trình quản lý thêm đơn vị giao dịch sẽ được triển khai cùng nghiệp vụ nhập/xuất.</span>
        </div>
      </div>
    </div>
  );
}
