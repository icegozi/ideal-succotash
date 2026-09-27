import "server-only";

import { getMedicineRepository } from "@/modules/medicines/repositories";
import { MedicineService } from "@/modules/medicines/services/medicine.service";

export function getMedicineService() {
  return new MedicineService(getMedicineRepository());
}
