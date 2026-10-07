"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import { createMedicineAction, type MedicineActionState, updateMedicineAction } from "@/modules/medicines/actions/medicine.actions";
import { Button } from "@/components/shared/Button";
import { FormField, FormSection, Input, Select } from "@/components/shared/form";
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
    <FormSection step="01" title="Thông tin nhận diện" description="Mã và tên dùng xuyên suốt chứng từ kho.">
      <div className="form-grid">
        <FormField label="Mã thuốc" required error={fieldError("code")}>
          <Input {...register("code")} placeholder="VD: PARA500" hasError={Boolean(fieldError("code"))} />
        </FormField>
        <FormField label="Tên thuốc" required wide error={fieldError("name")}>
          <Input {...register("name")} placeholder="Tên thương mại hoặc tên đầy đủ" hasError={Boolean(fieldError("name"))} />
        </FormField>
        <FormField label="Hoạt chất" error={fieldError("activeIngredient")}>
          <Input {...register("activeIngredient")} placeholder="VD: Paracetamol" hasError={Boolean(fieldError("activeIngredient"))} />
        </FormField>
        <FormField label="Hàm lượng" error={fieldError("strength")}>
          <Input {...register("strength")} placeholder="VD: 500 mg" hasError={Boolean(fieldError("strength"))} />
        </FormField>
      </div>
    </FormSection>
    <FormSection step="02" title="Đặc tính sử dụng" description="Thông tin hỗ trợ nhận biết và cấp phát.">
      <div className="form-grid">
        <FormField label="Dạng bào chế" error={fieldError("dosageForm")}>
          <Input {...register("dosageForm")} placeholder="Viên nén, dung dịch…" hasError={Boolean(fieldError("dosageForm"))} />
        </FormField>
        <FormField label="Đường dùng" error={fieldError("route")}>
          <Input {...register("route")} placeholder="Uống, tiêm…" hasError={Boolean(fieldError("route"))} />
        </FormField>
        <FormField label="Hãng sản xuất" wide error={fieldError("manufacturer")}>
          <Input {...register("manufacturer")} placeholder="Tên nhà sản xuất" hasError={Boolean(fieldError("manufacturer"))} />
        </FormField>
      </div>
    </FormSection>
    <FormSection step="03" title="Thiết lập kho" description="Đơn vị cơ sở là đơn vị lưu tồn và bị khóa sau khi đã có lô.">
      <div className="form-grid">
        <FormField
          label="Đơn vị cơ sở"
          required
          error={fieldError("baseUnitId")}
          hint={medicine ? "Không đổi tại màn hình này" : undefined}
        >
          {medicine ? (
            <>
              <input type="hidden" {...register("baseUnitId")} />
              <Input isReadonlyView readonlyContent={`${medicine.baseUnitName} (${medicine.baseUnitCode})`} />
            </>
          ) : (
            <Select
              {...register("baseUnitId")}
              hasError={Boolean(fieldError("baseUnitId"))}
              options={units.map((unit) => ({
                value: unit.id,
                label: `${unit.name} (${unit.code})`,
              }))}
            />
          )}
        </FormField>
        <FormField label="Tồn tối thiểu" error={fieldError("minimumStock")}>
          <Input
            type="number"
            min="0"
            step="0.000001"
            {...register("minimumStock")}
            hasError={Boolean(fieldError("minimumStock"))}
          />
        </FormField>
        <FormField label="Thuốc kiểm soát" error={fieldError("controlled")}>
          <Select
            {...register("controlled")}
            hasError={Boolean(fieldError("controlled"))}
            options={[
              { value: "N", label: "Không" },
              { value: "Y", label: "Có — cần phê duyệt" },
            ]}
          />
        </FormField>
        <FormField label="Trạng thái" error={fieldError("active")}>
          <Select
            {...register("active")}
            hasError={Boolean(fieldError("active"))}
            options={[
              { value: "Y", label: "Đang hoạt động" },
              { value: "N", label: "Ngừng hoạt động" },
            ]}
          />
        </FormField>
      </div>
    </FormSection>
    <div className="form-actions">
      <Link className="btn btn-secondary" href={medicine ? `/medicines/${medicine.id}` : "/medicines"}>
        <ArrowLeft size={16} /> Hủy
      </Link>
      <Button
        type="submit"
        variant="primary"
        isLoading={pending}
        leftIcon={<Save size={16} />}
      >
        {pending ? "Đang lưu…" : medicine ? "Lưu thay đổi" : "Tạo thuốc"}
      </Button>
    </div>
  </form>;
}
