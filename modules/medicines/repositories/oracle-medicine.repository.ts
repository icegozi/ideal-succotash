import "server-only";

import type { Connection } from "oracledb";

import { oracledb, withOracleConnection } from "@/lib/db/oracle";
import type { MedicineRepository } from "@/modules/medicines/repositories/medicine.repository";
import type {
  Medicine,
  MedicineInput,
  MedicineListQuery,
  MedicinePage,
  UnitOption,
} from "@/modules/medicines/types/medicine.types";

type MedicineRow = {
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
  controlled: "Y" | "N";
  active: "Y" | "N";
};

type CountRow = { total: number };
type UnitRow = { id: number; code: string; name: string };

const selectMedicine = `
  SELECT
    t.THUOC_ID AS "id",
    t.MA_THUOC AS "code",
    t.TEN_THUOC AS "name",
    t.HOAT_CHAT AS "activeIngredient",
    t.HAM_LUONG AS "strength",
    t.DANG_BAO_CHE AS "dosageForm",
    t.DUONG_DUNG AS "route",
    t.HANG_SAN_XUAT AS "manufacturer",
    t.DVT_CO_SO_ID AS "baseUnitId",
    d.MA_DVT AS "baseUnitCode",
    d.TEN_DVT AS "baseUnitName",
    t.TON_TOI_THIEU AS "minimumStock",
    t.CAN_KIEM_SOAT AS "controlled",
    t.TRANG_THAI AS "active"
  FROM THUOC t
  JOIN DON_VI_TINH d ON d.DVT_ID = t.DVT_CO_SO_ID`;

const sortColumns: Record<Required<MedicineListQuery>["sort"], string> = {
  code: "t.MA_THUOC",
  name: "t.TEN_THUOC",
  minimumStock: "t.TON_TOI_THIEU",
};

function whereClause(query: Required<MedicineListQuery>) {
  const clauses: string[] = [];
  const binds: Record<string, string | number> = {};

  if (query.query) {
    clauses.push(`(
      UPPER(t.MA_THUOC) LIKE :search
      OR UPPER(t.TEN_THUOC) LIKE :search
      OR UPPER(NVL(t.HOAT_CHAT, '')) LIKE :search
    )`);
    binds.search = `%${query.query.toUpperCase()}%`;
  }
  if (query.active !== "ALL") {
    clauses.push("t.TRANG_THAI = :active");
    binds.active = query.active;
  }
  if (query.controlled !== "ALL") {
    clauses.push("t.CAN_KIEM_SOAT = :controlled");
    binds.controlled = query.controlled;
  }

  return {
    sql: clauses.length ? ` WHERE ${clauses.join(" AND ")}` : "",
    binds,
  };
}

async function findByIdWithConnection(
  connection: Connection,
  id: number,
): Promise<Medicine | null> {
  const result = await connection.execute<MedicineRow>(
    `${selectMedicine} WHERE t.THUOC_ID = :id`,
    { id },
    { outFormat: oracledb.OUT_FORMAT_OBJECT },
  );
  return result.rows?.[0] ?? null;
}

export class OracleMedicineRepository implements MedicineRepository {
  async list(query: Required<MedicineListQuery>): Promise<MedicinePage> {
    return withOracleConnection(async (connection) => {
      const where = whereClause(query);
      const countResult = await connection.execute<CountRow>(
        `SELECT COUNT(*) AS "total" FROM THUOC t${where.sql}`,
        where.binds,
        { outFormat: oracledb.OUT_FORMAT_OBJECT },
      );
      const total = countResult.rows?.[0]?.total ?? 0;
      const totalPages = Math.max(1, Math.ceil(total / query.pageSize));
      const page = Math.min(query.page, totalPages);
      const offset = (page - 1) * query.pageSize;
      const direction = query.direction === "desc" ? "DESC" : "ASC";
      const rows = await connection.execute<MedicineRow>(
        `${selectMedicine}${where.sql}
         ORDER BY ${sortColumns[query.sort]} ${direction}, t.THUOC_ID ASC
         OFFSET :offset ROWS FETCH NEXT :pageSize ROWS ONLY`,
        { ...where.binds, offset, pageSize: query.pageSize },
        { outFormat: oracledb.OUT_FORMAT_OBJECT },
      );

      return {
        items: rows.rows ?? [],
        page,
        pageSize: query.pageSize,
        total,
        totalPages,
      };
    });
  }

  async findById(id: number): Promise<Medicine | null> {
    return withOracleConnection((connection) => findByIdWithConnection(connection, id));
  }

  async listActiveUnits(): Promise<UnitOption[]> {
    return withOracleConnection(async (connection) => {
      const result = await connection.execute<UnitRow>(
        `SELECT DVT_ID AS "id", MA_DVT AS "code", TEN_DVT AS "name"
         FROM DON_VI_TINH
         WHERE TRANG_THAI = 'Y'
         ORDER BY TEN_DVT, DVT_ID`,
        {},
        { outFormat: oracledb.OUT_FORMAT_OBJECT },
      );
      return result.rows ?? [];
    });
  }

  async create(input: MedicineInput): Promise<Medicine> {
    return withOracleConnection(async (connection) => {
      const result = await connection.execute(
        `INSERT INTO THUOC (
          MA_THUOC, TEN_THUOC, HOAT_CHAT, HAM_LUONG, DANG_BAO_CHE,
          DUONG_DUNG, HANG_SAN_XUAT, DVT_CO_SO_ID, TON_TOI_THIEU,
          CAN_KIEM_SOAT, TRANG_THAI
        ) VALUES (
          :code, :name, :activeIngredient, :strength, :dosageForm,
          :route, :manufacturer, :baseUnitId, :minimumStock,
          :controlled, :active
        ) RETURNING THUOC_ID INTO :id`,
        {
          ...input,
          id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
        },
        { autoCommit: false },
      );
      const id = (result.outBinds as { id: number[] }).id[0];
      await connection.execute(
        `INSERT INTO QUY_DOI_DVT_THUOC (
          THUOC_ID, DVT_ID, DVT_CO_SO_ID, HE_SO_CO_SO, CHO_PHEP_NHAP, CHO_PHEP_XUAT
        ) VALUES (:id, :baseUnitId, :baseUnitId, 1, 'Y', 'Y')`,
        { id, baseUnitId: input.baseUnitId },
      );
      await connection.commit();
      const medicine = await findByIdWithConnection(connection, id);
      if (!medicine) throw new Error("Inserted medicine was not found.");
      return medicine;
    });
  }

  async update(id: number, input: MedicineInput): Promise<Medicine | null> {
    return withOracleConnection(async (connection) => {
      const result = await connection.execute(
        `UPDATE THUOC SET
          MA_THUOC = :code,
          TEN_THUOC = :name,
          HOAT_CHAT = :activeIngredient,
          HAM_LUONG = :strength,
          DANG_BAO_CHE = :dosageForm,
          DUONG_DUNG = :route,
          HANG_SAN_XUAT = :manufacturer,
          DVT_CO_SO_ID = :baseUnitId,
          TON_TOI_THIEU = :minimumStock,
          CAN_KIEM_SOAT = :controlled,
          TRANG_THAI = :active
         WHERE THUOC_ID = :id`,
        { ...input, id },
        { autoCommit: true },
      );
      if (!result.rowsAffected) return null;
      return findByIdWithConnection(connection, id);
    });
  }
}
