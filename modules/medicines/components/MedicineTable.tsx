import Link from "next/link";
import { ArrowRight, Eye, Pencil, Pill, ShieldAlert } from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import type { Medicine } from "@/modules/medicines/types/medicine.types";

export interface MedicineTableProps {
  medicines: Medicine[];
  canUpdate: boolean;
}

export function MedicineTable({ medicines, canUpdate }: MedicineTableProps) {
  return (
    <>
      {/* Desktop Table View */}
      <div className="desktop-table-view">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th style={{ width: "130px" }}>Mã thuốc</th>
                <th>Tên biệt dược &amp; Hoạt chất</th>
                <th style={{ width: "100px" }}>Đơn vị tính</th>
                <th className="number-cell" style={{ width: "120px" }}>
                  Tồn tối thiểu
                </th>
                <th style={{ width: "140px" }}>Quy chế</th>
                <th style={{ width: "130px" }}>Trạng thái</th>
                <th style={{ width: "90px" }}>
                  <span className="sr-only">Thao tác</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {medicines.map((medicine) => (
                <tr key={medicine.id}>
                  <td>
                    <Link
                      className="code-link font-mono font-semibold"
                      href={`/medicines/${medicine.id}`}
                    >
                      {medicine.code}
                    </Link>
                  </td>
                  <td>
                    <div className="flex items-center gap-2.5">
                      <span
                        className="p-1.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100 shrink-0"
                        aria-hidden="true"
                      >
                        <Pill size={16} />
                      </span>
                      <div className="flex flex-col min-w-0">
                        <Link
                          href={`/medicines/${medicine.id}`}
                          className="font-semibold text-slate-900 hover:text-emerald-700 transition-colors leading-snug"
                        >
                          {medicine.name}
                        </Link>
                        <span className="text-xs text-slate-500 truncate mt-0.5">
                          {[medicine.activeIngredient, medicine.strength]
                            .filter(Boolean)
                            .join(" · ") || "Chưa có hoạt chất"}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="text-xs text-slate-700 font-medium">
                      {medicine.baseUnitName}
                    </span>
                  </td>
                  <td className="number-cell font-mono font-medium text-slate-800">
                    {medicine.minimumStock.toLocaleString("vi-VN")}
                  </td>
                  <td>
                    {medicine.controlled === "Y" ? (
                      <span className="badge controlled-drug-badge inline-flex items-center gap-1 text-[11px]">
                        <ShieldAlert size={12} aria-hidden="true" />
                        Kiểm soát
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">Thông thường</span>
                    )}
                  </td>
                  <td>
                    <StatusBadge active={medicine.active === "Y"}>
                      {medicine.active === "Y" ? "Đang dùng" : "Ngừng dùng"}
                    </StatusBadge>
                  </td>
                  <td>
                    <div className="row-actions flex items-center justify-end gap-1">
                      <Link
                        href={`/medicines/${medicine.id}`}
                        className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-slate-100 rounded-md transition-colors"
                        aria-label={`Xem chi tiết ${medicine.name}`}
                        title="Xem chi tiết"
                      >
                        <Eye size={16} />
                      </Link>
                      {canUpdate ? (
                        <Link
                          href={`/medicines/${medicine.id}/edit`}
                          className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-slate-100 rounded-md transition-colors"
                          aria-label={`Chỉnh sửa ${medicine.name}`}
                          title="Chỉnh sửa"
                        >
                          <Pencil size={15} />
                        </Link>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Touch Cards View */}
      <div className="mobile-card-view">
        <div className="data-card-list">
          {medicines.map((medicine) => (
            <article key={`mob-${medicine.id}`} className="data-card">
              <div className="data-card-header">
                <div>
                  <Link className="code-link" href={`/medicines/${medicine.id}`}>
                    {medicine.code}
                  </Link>
                  <h3 className="data-card-title">{medicine.name}</h3>
                  <p className="data-card-subtitle">
                    {[medicine.activeIngredient, medicine.strength]
                      .filter(Boolean)
                      .join(" · ") || "Chưa có hoạt chất"}
                  </p>
                </div>
                <StatusBadge active={medicine.active === "Y"}>
                  {medicine.active === "Y" ? "Đang dùng" : "Ngừng dùng"}
                </StatusBadge>
              </div>

              <div className="data-card-grid">
                <div className="data-card-prop">
                  <span className="data-card-prop-label">Đơn vị cơ sở</span>
                  <span className="data-card-prop-val">{medicine.baseUnitName}</span>
                </div>
                <div className="data-card-prop">
                  <span className="data-card-prop-label">Tồn tối thiểu</span>
                  <span className="data-card-prop-val">
                    {medicine.minimumStock.toLocaleString("vi-VN")} {medicine.baseUnitName}
                  </span>
                </div>
                <div className="data-card-prop">
                  <span className="data-card-prop-label">Quy chế kiểm soát</span>
                  <div>
                    {medicine.controlled === "Y" ? (
                      <span className="badge controlled-drug-badge inline-flex items-center gap-1 text-[11px]">
                        <ShieldAlert size={11} aria-hidden="true" />
                        Kiểm soát
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">Thông thường</span>
                    )}
                  </div>
                </div>
                <div className="data-card-prop">
                  <span className="data-card-prop-label">Dạng bào chế</span>
                  <span className="data-card-prop-val">{medicine.dosageForm || "—"}</span>
                </div>
              </div>

              <div className="data-card-footer">
                <Link
                  className="btn btn-secondary btn-sm"
                  href={`/medicines/${medicine.id}`}
                >
                  Chi tiết <ArrowRight size={14} aria-hidden="true" />
                </Link>

                {canUpdate && (
                  <Link
                    className="btn btn-secondary btn-sm"
                    href={`/medicines/${medicine.id}/edit`}
                  >
                    <Pencil size={14} aria-hidden="true" /> Sửa
                  </Link>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </>
  );
}
