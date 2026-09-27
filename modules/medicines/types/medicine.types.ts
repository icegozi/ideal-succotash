export type YesNo = "Y" | "N";

export type Medicine = {
  id: number;
  code: string;
  name: string;
  activeIngredient: string | null;
  strength: string | null;
  dosageForm: string | null;
  route: string | null;
  manufacturer: string | null;
  baseUnitId: number;
  baseUnitCode: string;
  baseUnitName: string;
  minimumStock: number;
  controlled: YesNo;
  active: YesNo;
};

export type UnitOption = {
  id: number;
  code: string;
  name: string;
};

export type MedicineInput = {
  code: string;
  name: string;
  activeIngredient: string | null;
  strength: string | null;
  dosageForm: string | null;
  route: string | null;
  manufacturer: string | null;
  baseUnitId: number;
  minimumStock: number;
  controlled: YesNo;
  active: YesNo;
};

export type MedicineListQuery = {
  query?: string;
  active?: "ALL" | YesNo;
  controlled?: "ALL" | YesNo;
  sort?: "code" | "name" | "minimumStock";
  direction?: "asc" | "desc";
  page?: number;
  pageSize?: number;
};

export type MedicinePage = {
  items: Medicine[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};
