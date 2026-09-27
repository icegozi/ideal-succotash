import type {
  Medicine,
  MedicineInput,
  MedicineListQuery,
  MedicinePage,
  UnitOption,
} from "@/modules/medicines/types/medicine.types";

export interface MedicineRepository {
  list(query: Required<MedicineListQuery>): Promise<MedicinePage>;
  findById(id: number): Promise<Medicine | null>;
  listActiveUnits(): Promise<UnitOption[]>;
  create(input: MedicineInput): Promise<Medicine>;
  update(id: number, input: MedicineInput): Promise<Medicine | null>;
}
