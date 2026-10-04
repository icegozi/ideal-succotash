"use client";

import { ArrowLeft, Plus, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { createReceiptAction, type InventoryActionState } from "@/modules/inventory/actions/inventory.actions";
import { Button } from "@/components/shared/Button";
import {
  DateInput,
  FormField,
  FormSection,
  Input,
  Select,
  Textarea,
} from "@/components/shared/form";
import { stockReceiptInputSchema } from "@/modules/inventory/schemas/inventory.schema";
import type {
  MedicineOption,
  StockReceiptInput,
  SupplierOption,
  WarehouseOption,
} from "@/modules/inventory/types/inventory.types";

export function StockReceiptForm({
  warehouses,
  suppliers,
  medicines,
}: {
  warehouses: WarehouseOption[];
  suppliers: SupplierOption[];
  medicines: MedicineOption[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [actionState, setActionState] = useState<InventoryActionState>({ status: "idle" });

  const todayStr = new Date().toISOString().split("T")[0];

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<StockReceiptInput>({
    resolver: zodResolver(stockReceiptInputSchema) as any,
    defaultValues: {
      receiptCode: "",
      warehouseId: warehouses[0]?.id || 1,
      supplierId: suppliers[0]?.id || 1,
      receiptDate: todayStr,
      documentNumber: "",
      note: "",
      items: [
        {
          medicineId: medicines[0]?.id || 1,
          lotNumber: "",
          manufacturingDate: "",
          expiryDate: "",
          quantity: 100,
          unitCost: 0,
          note: "",
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const watchItems = watch("items");

  const submit = (values: StockReceiptInput) => {
    setActionState({ status: "idle" });
    startTransition(async () => {
      const result = await createReceiptAction(values);
      setActionState(result);
      if (result.status === "success" && result.id) {
        router.push(`/stock-in/${result.id}`);
        router.refresh();
      }
    });
  };

  return (
    <form className="form-stack" onSubmit={handleSubmit(submit)} noValidate>
      {actionState.status === "error" ? (
        <div className="notice notice-error" role="alert">
          {actionState.message}
        </div>
      ) : null}

      <FormSection
        step="01"
        title="Thông tin phiếu nhập"
        description="Kho nhận, nhà cung cấp và chứng từ nguồn kèm theo."
      >
        <div className="form-grid">
          <FormField label="Mã phiếu nhập (để trống để tự sinh)">
            <Input {...register("receiptCode")} placeholder="VD: PN-2026-0002" />
          </FormField>

          <FormField
            label="Ngày nhập"
            required
            error={errors.receiptDate?.message}
          >
            <DateInput
              {...register("receiptDate")}
              hasError={Boolean(errors.receiptDate)}
            />
          </FormField>

          <FormField
            label="Kho nhận"
            required
            error={errors.warehouseId?.message}
          >
            <Select
              {...register("warehouseId", { valueAsNumber: true })}
              hasError={Boolean(errors.warehouseId)}
              options={warehouses.map((w) => ({
                value: w.id,
                label: `${w.name} (${w.code})`,
              }))}
            />
          </FormField>

          <FormField
            label="Nhà cung cấp"
            required
            error={errors.supplierId?.message}
          >
            <Select
              {...register("supplierId", { valueAsNumber: true })}
              hasError={Boolean(errors.supplierId)}
              options={suppliers.map((s) => ({
                value: s.id,
                label: `${s.name} (${s.code})`,
              }))}
            />
          </FormField>

          <FormField label="Số hóa đơn / Chứng từ nguồn">
            <Input {...register("documentNumber")} placeholder="VD: HD-DHG-9982" />
          </FormField>

          <FormField label="Ghi chú" wide>
            <Textarea
              {...register("note")}
              rows={2}
              placeholder="Lý do nhập hoặc thông tin bổ sung…"
            />
          </FormField>
        </div>
      </FormSection>

      <FormSection
        step="02"
        title="Danh sách thuốc nhập kho"
        description="Mỗi mặt hàng cần chỉ định số lô và hạn dùng cụ thể."
      >
        {errors.items?.root ? (
          <div className="notice notice-error" style={{ marginBottom: 12 }}>
            {errors.items.root.message}
          </div>
        ) : null}

        <div className="table-scroll">
          <table className="responsive-item-table">
            <thead>
              <tr>
                <th style={{ minWidth: 220 }}>Thuốc *</th>
                <th style={{ width: 130 }}>Số lô *</th>
                <th style={{ width: 140 }}>Ngày SX</th>
                <th style={{ width: 140 }}>Hạn dùng *</th>
                <th style={{ width: 110 }}>Số lượng *</th>
                <th style={{ width: 110 }}>Đơn giá</th>
                <th style={{ width: 140 }}>Thành tiền</th>
                <th style={{ width: 44 }}></th>
              </tr>
            </thead>
            <tbody>
              {fields.map((field, idx) => {
                const currentItem = watchItems?.[idx];
                const totalLineCost =
                  Number(currentItem?.quantity || 0) * Number(currentItem?.unitCost || 0);
                const itemError = errors.items?.[idx];

                return (
                  <tr key={field.id}>
                    <td>
                      <div className="item-row-header">
                        <span className="item-row-title">Mặt hàng #{idx + 1}</span>
                        {fields.length > 1 && (
                          <button
                            type="button"
                            className="item-delete-btn-mobile"
                            onClick={() => remove(idx)}
                            aria-label={`Xóa mặt hàng ${idx + 1}`}
                          >
                            <Trash2 size={14} /> Xóa dòng
                          </button>
                        )}
                      </div>

                      <span className="item-cell-label">Thuốc *</span>
                      <Select
                        {...register(`items.${idx}.medicineId`, { valueAsNumber: true })}
                        hasError={Boolean(itemError?.medicineId)}
                        style={{ width: "100%" }}
                        options={medicines.map((m) => ({
                          value: m.id,
                          label: `${m.name} (${m.baseUnitName})`,
                        }))}
                      />
                      {itemError?.medicineId && (
                        <small style={{ color: "var(--status-danger-text)", display: "block", marginTop: 4 }}>
                          {itemError.medicineId.message}
                        </small>
                      )}
                    </td>

                    <td>
                      <span className="item-cell-label">Số lô *</span>
                      <Input
                        {...register(`items.${idx}.lotNumber`)}
                        hasError={Boolean(itemError?.lotNumber)}
                        placeholder="Số lô"
                        style={{ width: "100%" }}
                      />
                      {itemError?.lotNumber && (
                        <small style={{ color: "var(--status-danger-text)", display: "block", marginTop: 4 }}>
                          {itemError.lotNumber.message}
                        </small>
                      )}
                    </td>

                    <td>
                      <span className="item-cell-label">Ngày sản xuất</span>
                      <DateInput
                        {...register(`items.${idx}.manufacturingDate`)}
                        hasError={Boolean(itemError?.manufacturingDate)}
                        style={{ width: "100%" }}
                      />
                      {itemError?.manufacturingDate && (
                        <small style={{ color: "var(--status-danger-text)", display: "block", marginTop: 4 }}>
                          {itemError.manufacturingDate.message}
                        </small>
                      )}
                    </td>

                    <td>
                      <span className="item-cell-label">Hạn sử dụng *</span>
                      <DateInput
                        {...register(`items.${idx}.expiryDate`)}
                        hasError={Boolean(itemError?.expiryDate)}
                        style={{ width: "100%" }}
                      />
                      {itemError?.expiryDate && (
                        <small style={{ color: "var(--status-danger-text)", display: "block", marginTop: 4 }}>
                          {itemError.expiryDate.message}
                        </small>
                      )}
                    </td>

                    <td>
                      <span className="item-cell-label">Số lượng *</span>
                      <Input
                        type="number"
                        min="1"
                        step="1"
                        {...register(`items.${idx}.quantity`, { valueAsNumber: true })}
                        hasError={Boolean(itemError?.quantity)}
                        style={{ width: "100%" }}
                      />
                      {itemError?.quantity && (
                        <small style={{ color: "var(--status-danger-text)", display: "block", marginTop: 4 }}>
                          {itemError.quantity.message}
                        </small>
                      )}
                    </td>

                    <td>
                      <span className="item-cell-label">Đơn giá (VNĐ)</span>
                      <Input
                        type="number"
                        min="0"
                        step="100"
                        {...register(`items.${idx}.unitCost`, { valueAsNumber: true })}
                        style={{ width: "100%" }}
                      />
                    </td>

                    <td>
                      <span className="item-cell-label">Thành tiền</span>
                      <div style={{ fontWeight: 700, color: "var(--brand-primary)", padding: "8px 0" }}>
                        {totalLineCost.toLocaleString("vi-VN")} đ
                      </div>
                    </td>

                    <td>
                      {fields.length > 1 ? (
                        <button
                          type="button"
                          className="icon-button item-delete-btn-desktop"
                          style={{ width: 36, height: 36 }}
                          onClick={() => remove(idx)}
                          aria-label={`Xóa mặt hàng ${idx + 1}`}
                          title="Xóa mặt hàng này"
                        >
                          <Trash2 size={16} color="var(--status-danger-text)" />
                        </button>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: 16 }}>
          <Button
            variant="secondary"
            leftIcon={<Plus size={16} />}
            onClick={() =>
              append({
                medicineId: medicines[0]?.id || 1,
                lotNumber: "",
                manufacturingDate: "",
                expiryDate: "",
                quantity: 100,
                unitCost: 0,
                note: "",
              })
            }
          >
            Thêm mặt hàng
          </Button>
        </div>
      </FormSection>

      <div className="form-actions">
        <Link className="btn btn-secondary" href="/stock-in">
          <ArrowLeft size={16} /> Hủy
        </Link>
        <Button
          type="submit"
          variant="primary"
          isLoading={pending}
          leftIcon={<Save size={16} />}
        >
          {pending ? "Đang lưu phiếu…" : "Lưu phiếu nhập (Bản nháp)"}
        </Button>
      </div>
    </form>
  );
}
