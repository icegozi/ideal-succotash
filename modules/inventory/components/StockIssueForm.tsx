"use client";

import { ArrowLeft, LoaderCircle, Plus, RefreshCw, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  createIssueAction,
  previewFefoAction,
  type InventoryActionState,
} from "@/modules/inventory/actions/inventory.actions";
import { Button } from "@/components/shared/Button";
import {
  DateInput,
  FormField,
  FormSection,
  Input,
  Select,
  Textarea,
} from "@/components/shared/form";
import { FefoAllocationCard } from "@/components/shared/clinical";
import { stockIssueInputSchema } from "@/modules/inventory/schemas/inventory.schema";
import type {
  DepartmentOption,
  FefoProposalResult,
  MedicineOption,
  StockIssueInput,
  WarehouseOption,
} from "@/modules/inventory/types/inventory.types";

export function StockIssueForm({
  warehouses,
  departments,
  medicines,
}: {
  warehouses: WarehouseOption[];
  departments: DepartmentOption[];
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
    getValues,
    setValue,
    formState: { errors },
  } = useForm<StockIssueInput>({
    resolver: zodResolver(stockIssueInputSchema) as any,
    defaultValues: {
      issueCode: "",
      warehouseId: warehouses[0]?.id || 1,
      departmentId: departments[0]?.id || 1,
      receiver: "",
      issueDate: todayStr,
      issueType: "DEPARTMENT_ISSUE",
      note: "",
      items: [
        {
          medicineId: medicines[0]?.id || 1,
          requestedQuantity: 50,
          note: "",
          allocations: [],
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const selectedWarehouseId = watch("warehouseId");
  const watchItems = watch("items");

  // Proposals cache by medicineId
  const [fefoProposals, setFefoProposals] = useState<Record<number, FefoProposalResult | null>>({});
  const [loadingProposals, setLoadingProposals] = useState<Record<number, boolean>>({});

  // Auto-fetch FEFO proposal when medicineId or requestedQuantity changes
  const fetchProposal = async (idx: number, medicineId: number, qty: number) => {
    if (!medicineId || qty <= 0) return;
    setLoadingProposals((prev) => ({ ...prev, [idx]: true }));
    const res = await previewFefoAction(selectedWarehouseId, medicineId, qty);
    setLoadingProposals((prev) => ({ ...prev, [idx]: false }));
    if (res.success && res.data) {
      setFefoProposals((prev) => ({ ...prev, [idx]: res.data! }));
      setValue(
        `items.${idx}.allocations`,
        res.data.allocations.map((a) => ({
          batchId: a.batchId,
          allocatedQuantity: a.allocatedQuantity,
          isFefoOverride: false,
          overrideReason: null,
        })),
      );
    } else {
      setFefoProposals((prev) => ({ ...prev, [idx]: null }));
    }
  };

  useEffect(() => {
    watchItems.forEach((item, idx) => {
      if (item.medicineId && item.requestedQuantity > 0) {
        fetchProposal(idx, item.medicineId, item.requestedQuantity);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWarehouseId]);

  const handleToggleOverride = (idx: number, batchId: number, isOverride: boolean) => {
    const currentAllocations = getValues(`items.${idx}.allocations`) || [];
    const updated = currentAllocations.map((alloc) =>
      alloc.batchId === batchId
        ? {
            ...alloc,
            isFefoOverride: isOverride,
            overrideReason: isOverride ? alloc.overrideReason || "" : null,
          }
        : alloc,
    );
    setValue(`items.${idx}.allocations`, updated);
    setFefoProposals((prev) => {
      const existing = prev[idx];
      if (!existing) return prev;
      return {
        ...prev,
        [idx]: {
          ...existing,
          allocations: existing.allocations.map((a) =>
            a.batchId === batchId
              ? {
                  ...a,
                  isFefoOverride: isOverride,
                  overrideReason: isOverride ? a.overrideReason || "" : undefined,
                }
              : a,
          ),
        },
      };
    });
  };

  const handleOverrideReasonChange = (idx: number, batchId: number, reason: string) => {
    const currentAllocations = getValues(`items.${idx}.allocations`) || [];
    const updated = currentAllocations.map((alloc) =>
      alloc.batchId === batchId
        ? { ...alloc, isFefoOverride: true, overrideReason: reason }
        : alloc,
    );
    setValue(`items.${idx}.allocations`, updated);
    setFefoProposals((prev) => {
      const existing = prev[idx];
      if (!existing) return prev;
      return {
        ...prev,
        [idx]: {
          ...existing,
          allocations: existing.allocations.map((a) =>
            a.batchId === batchId
              ? { ...a, isFefoOverride: true, overrideReason: reason }
              : a,
          ),
        },
      };
    });
  };

  const submit = (values: StockIssueInput) => {
    setActionState({ status: "idle" });
    startTransition(async () => {
      const result = await createIssueAction(values);
      setActionState(result);
      if (result.status === "success" && result.id) {
        router.push(`/stock-out/${result.id}`);
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
        title="Thông tin phiếu xuất kho"
        description="Kho xuất, đối tượng nhận và loại hình xuất kho."
      >
        <div className="form-grid">
          <FormField label="Mã phiếu xuất (để trống để tự sinh)">
            <Input {...register("issueCode")} placeholder="VD: PX-2026-0002" />
          </FormField>

          <FormField
            label="Ngày xuất"
            required
            error={errors.issueDate?.message}
          >
            <DateInput
              {...register("issueDate")}
              hasError={Boolean(errors.issueDate)}
            />
          </FormField>

          <FormField
            label="Kho xuất"
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
            label="Loại hình xuất"
            required
            error={errors.issueType?.message}
          >
            <Select
              {...register("issueType")}
              hasError={Boolean(errors.issueType)}
              options={[
                { value: "DEPARTMENT_ISSUE", label: "Xuất khoa phòng nội viện" },
                { value: "PATIENT_ISSUE", label: "Xuất cấp phát bệnh nhân" },
                { value: "TRANSFER", label: "Xuất chuyển kho" },
                { value: "DISPOSAL", label: "Xuất hủy dược phẩm" },
                { value: "OTHER", label: "Xuất khác" },
              ]}
            />
          </FormField>

          <FormField label="Khoa / Phòng nhận">
            <Select
              {...register("departmentId", { valueAsNumber: true })}
              emptyOptionLabel="-- Chọn khoa phòng (nếu có) --"
              options={departments.map((d) => ({
                value: d.id,
                label: `${d.name} (${d.code})`,
              }))}
            />
          </FormField>

          <FormField
            label="Người nhận / Đơn vị nhận"
            required
            error={errors.receiver?.message}
          >
            <Input
              {...register("receiver")}
              hasError={Boolean(errors.receiver)}
              placeholder="VD: Điều dưỡng trưởng Nguyễn Văn A"
            />
          </FormField>

          <FormField label="Ghi chú" wide>
            <Textarea
              {...register("note")}
              rows={2}
              placeholder="Lý do xuất hoặc ghi chú bổ sung…"
            />
          </FormField>
        </div>
      </FormSection>

      <FormSection
        step="02"
        title="Danh sách thuốc & Đề xuất FEFO"
        description="Hệ thống tự động đề xuất phân bổ lô thuốc theo hạn dùng gần nhất (FEFO)."
      >
        {errors.items?.root ? (
          <div className="notice notice-error" style={{ marginBottom: 12 }}>
            {errors.items.root.message}
          </div>
        ) : null}

        <div className="page-stack">
          {fields.map((field, idx) => {
            const currentItem = watchItems?.[idx];
            const selectedMed = medicines.find((m) => m.id === Number(currentItem?.medicineId));
            const proposal = fefoProposals[idx];
            const isLoading = loadingProposals[idx];
            const itemError = errors.items?.[idx];

            return (
              <div
                key={field.id}
                className="panel"
                style={{
                  padding: 18,
                  background: "white",
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: "var(--radius-xs)",
                        background: "var(--brand-primary-soft)",
                        color: "var(--brand-primary)",
                        display: "grid",
                        placeItems: "center",
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      #{idx + 1}
                    </span>
                    <strong style={{ fontSize: 14, color: "var(--text-primary)" }}>
                      {selectedMed ? selectedMed.name : `Mặt hàng #${idx + 1}`}
                    </strong>
                  </div>

                  {fields.length > 1 ? (
                    <button
                      type="button"
                      className="icon-button"
                      style={{ width: 34, height: 34 }}
                      onClick={() => remove(idx)}
                      aria-label={`Xóa mặt hàng ${idx + 1}`}
                      title="Xóa mặt hàng này"
                    >
                      <Trash2 size={15} color="var(--status-danger-text)" />
                    </button>
                  ) : null}
                </div>

                <div className="form-grid">
                  <FormField
                    label="Thuốc cần xuất"
                    required
                    error={itemError?.medicineId?.message}
                  >
                    <Select
                      {...register(`items.${idx}.medicineId`, { valueAsNumber: true })}
                      hasError={Boolean(itemError?.medicineId)}
                      options={medicines.map((m) => ({
                        value: m.id,
                        label: `${m.name} (${m.code}) — ĐVT: ${m.baseUnitName}`,
                      }))}
                      onChange={(e) => {
                        const mid = Number(e.target.value);
                        setValue(`items.${idx}.medicineId`, mid);
                        fetchProposal(idx, mid, Number(watch(`items.${idx}.requestedQuantity`)) || 1);
                      }}
                    />
                  </FormField>

                  <FormField
                    label="Số lượng yêu cầu"
                    required
                    error={itemError?.requestedQuantity?.message}
                  >
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <Input
                        type="number"
                        min="1"
                        step="1"
                        {...register(`items.${idx}.requestedQuantity`, { valueAsNumber: true })}
                        hasError={Boolean(itemError?.requestedQuantity)}
                        onChange={(e) => {
                          const qty = Number(e.target.value);
                          setValue(`items.${idx}.requestedQuantity`, qty);
                          fetchProposal(idx, Number(watch(`items.${idx}.medicineId`)), qty);
                        }}
                      />
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ padding: "0 12px", minHeight: 38, flexShrink: 0 }}
                        onClick={() =>
                          fetchProposal(
                            idx,
                            Number(watch(`items.${idx}.medicineId`)),
                            Number(watch(`items.${idx}.requestedQuantity`)),
                          )
                        }
                        title="Tính lại phân bổ FEFO"
                        aria-label="Tính lại phân bổ FEFO"
                      >
                        <RefreshCw size={15} className={isLoading ? "spin" : ""} />
                      </button>
                    </div>
                  </FormField>
                </div>

                {/* FEFO Allocation Card */}
                <div className="mt-3">
                  {isLoading ? (
                    <div className="p-4 text-center text-xs text-slate-500 bg-slate-50/50 rounded-[var(--radius-lg)] border border-[var(--border-default)]">
                      <LoaderCircle size={20} className="spin mx-auto mb-2 text-teal-600" />
                      Đang tính toán phân bổ lô tối ưu theo hạn sử dụng…
                    </div>
                  ) : proposal ? (
                    <FefoAllocationCard
                      medicineName={selectedMed ? selectedMed.name : `Mặt hàng #${idx + 1}`}
                      medicineCode={selectedMed ? selectedMed.code : ""}
                      unitName={selectedMed ? selectedMed.baseUnitName : "đơn vị"}
                      proposal={proposal}
                      onToggleOverride={(batchId, isOverride) =>
                        handleToggleOverride(idx, batchId, isOverride)
                      }
                      onOverrideReasonChange={(batchId, reason) =>
                        handleOverrideReasonChange(idx, batchId, reason)
                      }
                    />
                  ) : (
                    <div className="p-3.5 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-[var(--radius-lg)] text-center">
                      Nhập số lượng yêu cầu để hệ thống tính toán và hiển thị thẻ phân bổ FEFO tự động.
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 16 }}>
          <Button
            variant="secondary"
            leftIcon={<Plus size={16} />}
            onClick={() => {
              const newIdx = fields.length;
              append({
                medicineId: medicines[0]?.id || 1,
                requestedQuantity: 50,
                note: "",
                allocations: [],
              });
              fetchProposal(newIdx, medicines[0]?.id || 1, 50);
            }}
          >
            Thêm thuốc xuất
          </Button>
        </div>
      </FormSection>

      <div className="form-actions">
        <Link className="btn btn-secondary" href="/stock-out">
          <ArrowLeft size={16} /> Hủy
        </Link>
        <Button
          type="submit"
          variant="primary"
          isLoading={pending}
          leftIcon={<Save size={16} />}
        >
          {pending ? "Đang lưu phiếu…" : "Lưu phiếu xuất (Bản nháp)"}
        </Button>
      </div>
    </form>
  );
}
