"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, LoaderCircle, Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import { createMedicineAction, type MedicineActionState, updateMedicineAction } from "@/modules/medicines/actions/medicine.actions";
import { medicineInputSchema, type MedicineFormValues } from "@/modules/medicines/schemas/medicine.schema";
import type { Medicine, MedicineInput, UnitOption } from "@/modules/medicines/types/medicine.types";

export function MedicineForm({ medicine, units }: { medicine?: Medicine; units: UnitOption[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [actionState, setActionState] = useState<MedicineActionState>({ status: "idle" });
  const { register, handleSubmit, formState: { errors } } = useForm<MedicineFormValues, unknown, MedicineInput>({
    resolver: zodResolver(medicineInputSchema),
    defaultValues: {
      code: medicine?.code ?? "", name: medicine?.name ?? "", activeIngredient: medicine?.activeIngredient ?? "",
      strength: medicine?.strength ?? "", dosageForm: medicine?.dosageForm ?? "", route: medicine?.route ?? "",
      manufacturer: medicine?.manufacturer ?? "", baseUnitId: medicine?.baseUnitId ?? units[0]?.id,
      minimumStock: medicine?.minimumStock ?? 0, controlled: medicine?.controlled ?? "N", active: medicine?.active ?? "Y",
    },
  });

  const fieldError = (name: keyof MedicineFormValues) => errors[name]?.message || actionState.fieldErrors?.[name]?.[0];
  const submit = (values: MedicineInput) => {
    setActionState({ status: "idle" });
    startTransition(async () => {
      const result = medicine ? await updateMedicineAction(medicine.id, values) : await createMedicineAction(values);
      setActionState(result);
      if (result.status === "success" && result.id) { router.push(`/medicines/${result.id}`); router.refresh(); }
    });
  };

  return <form className="form-stack" onSubmit={handleSubmit(submit)} noValidate>
    {actionState.status === "error" ? <div className="notice notice-error" role="alert">{actionState.message}</div> : null}
    <section className="form-section">
      <div className="form-section-heading"><span>01</span><div><h2>Thông tin nhận diện</h2><p>Mã và tên dùng xuyên suốt chứng từ kho.</p></div></div>
      <div className="form-grid">
        <label className="field"><span>Mã thuốc <b>*</b></span><input {...register("code")} aria-invalid={Boolean(fieldError("code"))} placeholder="VD: PARA500" />{fieldError("code") ? <small>{fieldError("code")}</small> : null}</label>
        <label className="field field-wide"><span>Tên thuốc <b>*</b></span><input {...register("name")} aria-invalid={Boolean(fieldError("name"))} placeholder="Tên thương mại hoặc tên đầy đủ" />{fieldError("name") ? <small>{fieldError("name")}</small> : null}</label>
        <label className="field"><span>Hoạt chất</span><input {...register("activeIngredient")} placeholder="VD: Paracetamol" />{fieldError("activeIngredient") ? <small>{fieldError("activeIngredient")}</small> : null}</label>
        <label className="field"><span>Hàm lượng</span><input {...register("strength")} placeholder="VD: 500 mg" />{fieldError("strength") ? <small>{fieldError("strength")}</small> : null}</label>
      </div>
    </section>
    <section className="form-section">
      <div className="form-section-heading"><span>02</span><div><h2>Đặc tính sử dụng</h2><p>Thông tin hỗ trợ nhận biết và cấp phát.</p></div></div>
      <div className="form-grid">
        <label className="field"><span>Dạng bào chế</span><input {...register("dosageForm")} placeholder="Viên nén, dung dịch…" />{fieldError("dosageForm") ? <small>{fieldError("dosageForm")}</small> : null}</label>
        <label className="field"><span>Đường dùng</span><input {...register("route")} placeholder="Uống, tiêm…" />{fieldError("route") ? <small>{fieldError("route")}</small> : null}</label>
        <label className="field field-wide"><span>Hãng sản xuất</span><input {...register("manufacturer")} placeholder="Tên nhà sản xuất" />{fieldError("manufacturer") ? <small>{fieldError("manufacturer")}</small> : null}</label>
      </div>
    </section>
    <section className="form-section">
      <div className="form-section-heading"><span>03</span><div><h2>Thiết lập kho</h2><p>Đơn vị cơ sở là đơn vị lưu tồn và bị khóa sau khi đã có lô.</p></div></div>
      <div className="form-grid">
        <label className="field"><span>Đơn vị cơ sở <b>*</b></span>{medicine ? <><input type="hidden" {...register("baseUnitId")} /><div className="readonly-field">{medicine.baseUnitName} ({medicine.baseUnitCode})</div><em>Không đổi tại màn hình này</em></> : <select {...register("baseUnitId")} aria-invalid={Boolean(fieldError("baseUnitId"))}>{units.map((unit) => <option key={unit.id} value={unit.id}>{unit.name} ({unit.code})</option>)}</select>}{fieldError("baseUnitId") ? <small>{fieldError("baseUnitId")}</small> : null}</label>
        <label className="field"><span>Tồn tối thiểu</span><input type="number" min="0" step="0.000001" {...register("minimumStock")} aria-invalid={Boolean(fieldError("minimumStock"))} />{fieldError("minimumStock") ? <small>{fieldError("minimumStock")}</small> : null}</label>
        <label className="field"><span>Thuốc kiểm soát</span><select {...register("controlled")}><option value="N">Không</option><option value="Y">Có — cần phê duyệt</option></select>{fieldError("controlled") ? <small>{fieldError("controlled")}</small> : null}</label>
        <label className="field"><span>Trạng thái</span><select {...register("active")}><option value="Y">Đang hoạt động</option><option value="N">Ngừng hoạt động</option></select>{fieldError("active") ? <small>{fieldError("active")}</small> : null}</label>
      </div>
    </section>
    <div className="form-actions"><Link className="button button-secondary" href={medicine ? `/medicines/${medicine.id}` : "/medicines"}><ArrowLeft size={17} /> Hủy</Link><button className="button button-primary" disabled={pending} type="submit">{pending ? <LoaderCircle className="spin" size={17} /> : <Save size={17} />}{pending ? "Đang lưu…" : medicine ? "Lưu thay đổi" : "Tạo thuốc"}</button></div>
  </form>;
}
