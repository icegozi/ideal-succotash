"use server";

import { revalidatePath } from "next/cache";

import { permissions, requirePermission } from "@/lib/auth/permissions";
import { toPublicError } from "@/lib/errors/app-error";
import { medicineInputSchema } from "@/modules/medicines/schemas/medicine.schema";
import { getMedicineService } from "@/modules/medicines/services";

export type MedicineActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  id?: number;
  fieldErrors?: Record<string, string[]>;
};

function validationFailure(
  error: ReturnType<typeof medicineInputSchema.safeParse>,
): MedicineActionState | null {
  if (error.success) return null;
  return {
    status: "error",
    message: "Vui lòng kiểm tra lại các trường được đánh dấu.",
    fieldErrors: error.error.flatten().fieldErrors,
  };
}

export async function createMedicineAction(input: unknown): Promise<MedicineActionState> {
  try {
    await requirePermission(permissions.medicineCreate);
    const parsed = medicineInputSchema.safeParse(input);
    const failure = validationFailure(parsed);
    if (failure || !parsed.success) return failure!;
    const medicine = await getMedicineService().create(parsed.data);
    revalidatePath("/medicines");
    return { status: "success", message: "Đã tạo thuốc.", id: medicine.id };
  } catch (error) {
    return { status: "error", ...toPublicError(error) };
  }
}

export async function updateMedicineAction(
  id: number,
  input: unknown,
): Promise<MedicineActionState> {
  try {
    await requirePermission(permissions.medicineUpdate);
    const parsed = medicineInputSchema.safeParse(input);
    const failure = validationFailure(parsed);
    if (failure || !parsed.success) return failure!;
    const medicine = await getMedicineService().update(id, parsed.data);
    revalidatePath("/medicines");
    revalidatePath(`/medicines/${id}`);
    return { status: "success", message: "Đã cập nhật thuốc.", id: medicine.id };
  } catch (error) {
    return { status: "error", ...toPublicError(error) };
  }
}
