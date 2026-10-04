import "server-only";

import type { Connection } from "oracledb";
import { oracledb, withOracleConnection } from "@/lib/db/oracle";
import { AppError } from "@/lib/errors/app-error";
import type { InventoryRepository } from "@/modules/inventory/repositories/inventory.repository";
import type {
  BatchTraceability,
  DepartmentOption,
  FefoCandidateBatch,
  InventoryBalance,
  InventoryDashboardMetrics,
  InventoryListQuery,
  InventoryPage,
  MedicineOption,
  StockIssue,
  StockIssueInput,
  StockIssueListQuery,
  StockIssuePage,
  StockMovement,
  StockReceipt,
  StockReceiptInput,
  StockReceiptListQuery,
  StockReceiptPage,
  SupplierOption,
  WarehouseOption,
} from "@/modules/inventory/types/inventory.types";

export class OracleInventoryRepository implements InventoryRepository {
  async listWarehouses(): Promise<WarehouseOption[]> {
    return withOracleConnection(async (conn) => {
      const res = await conn.execute<{ id: number; code: string; name: string; active: "Y" | "N" }>(
        `SELECT KHO_ID AS "id", MA_KHO AS "code", TEN_KHO AS "name", TRANG_THAI AS "active"
         FROM KHO WHERE TRANG_THAI = 'Y' ORDER BY TEN_KHO`,
        {},
        { outFormat: oracledb.OUT_FORMAT_OBJECT },
      );
      return res.rows ?? [];
    });
  }

  async listSuppliers(): Promise<SupplierOption[]> {
    return withOracleConnection(async (conn) => {
      const res = await conn.execute<{ id: number; code: string; name: string; active: "Y" | "N" }>(
        `SELECT NCC_ID AS "id", MA_NCC AS "code", TEN_NCC AS "name", TRANG_THAI AS "active"
         FROM NHA_CUNG_CAP WHERE TRANG_THAI = 'Y' ORDER BY TEN_NCC`,
        {},
        { outFormat: oracledb.OUT_FORMAT_OBJECT },
      );
      return res.rows ?? [];
    });
  }

  async listDepartments(): Promise<DepartmentOption[]> {
    return withOracleConnection(async (conn) => {
      const res = await conn.execute<{ id: number; code: string; name: string; active: "Y" | "N" }>(
        `SELECT KHOA_PHONG_ID AS "id", MA_KHOA_PHONG AS "code", TEN_KHOA_PHONG AS "name", TRANG_THAI AS "active"
         FROM KHOA_PHONG WHERE TRANG_THAI = 'Y' ORDER BY TEN_KHOA_PHONG`,
        {},
        { outFormat: oracledb.OUT_FORMAT_OBJECT },
      );
      return res.rows ?? [];
    });
  }

  async listMedicines(): Promise<MedicineOption[]> {
    return withOracleConnection(async (conn) => {
      const res = await conn.execute<{
        id: number;
        code: string;
        name: string;
        activeIngredient: string | null;
        strength: string | null;
        baseUnitId: number;
        baseUnitName: string;
        controlled: "Y" | "N";
        minimumStock: number;
        active: "Y" | "N";
      }>(
        `SELECT t.THUOC_ID AS "id", t.MA_THUOC AS "code", t.TEN_THUOC AS "name",
                t.HOAT_CHAT AS "activeIngredient", t.HAM_LUONG AS "strength",
                t.DVT_CO_SO_ID AS "baseUnitId", d.TEN_DVT AS "baseUnitName",
                t.CAN_KIEM_SOAT AS "controlled", t.TON_TOI_THIEU AS "minimumStock",
                t.TRANG_THAI AS "active"
         FROM THUOC t
         JOIN DON_VI_TINH d ON d.DVT_ID = t.DVT_CO_SO_ID
         WHERE t.TRANG_THAI = 'Y'
         ORDER BY t.TEN_THUOC`,
        {},
        { outFormat: oracledb.OUT_FORMAT_OBJECT },
      );
      return res.rows ?? [];
    });
  }

  async getDashboardMetrics(): Promise<InventoryDashboardMetrics> {
    return withOracleConnection(async (conn) => {
      const res = await conn.execute<{
        totalMedicines: number;
        totalBatches: number;
        nearExpiry: number;
        expired: number;
        lowStock: number;
      }>(
        `SELECT
          (SELECT COUNT(DISTINCT l.THUOC_ID)
           FROM TON_KHO_LO t
           JOIN LO_THUOC l ON l.LO_ID = t.LO_ID
           WHERE t.SO_LUONG_TON > 0) AS "totalMedicines",
          (SELECT COUNT(*) FROM TON_KHO_LO WHERE SO_LUONG_TON > 0) AS "totalBatches",
          (SELECT COUNT(*) FROM TON_KHO_LO t
           JOIN LO_THUOC l ON l.LO_ID = t.LO_ID
           WHERE t.SO_LUONG_TON > 0 AND l.HAN_SU_DUNG >= TRUNC(SYSDATE) AND l.HAN_SU_DUNG <= TRUNC(SYSDATE) + 90) AS "nearExpiry",
          (SELECT COUNT(*) FROM TON_KHO_LO t
           JOIN LO_THUOC l ON l.LO_ID = t.LO_ID
           WHERE t.SO_LUONG_TON > 0 AND l.HAN_SU_DUNG < TRUNC(SYSDATE)) AS "expired",
          (SELECT COUNT(*) FROM VW_CANH_BAO_TON_TOI_THIEU) AS "lowStock"
         FROM DUAL`,
        {},
        { outFormat: oracledb.OUT_FORMAT_OBJECT },
      );
      const row = res.rows?.[0];
      return {
        totalMedicineCount: row?.totalMedicines ?? 0,
        totalBatchCount: row?.totalBatches ?? 0,
        nearExpiryBatchCount: row?.nearExpiry ?? 0,
        expiredBatchCount: row?.expired ?? 0,
        lowStockMedicineCount: row?.lowStock ?? 0,
      };
    });
  }

  async listInventory(query: Required<InventoryListQuery>): Promise<InventoryPage> {
    return withOracleConnection(async (conn) => {
      const clauses: string[] = ["t.TRANG_THAI = 'Y'"];
      const binds: Record<string, string | number> = {};

      if (query.warehouseId !== "ALL") {
        clauses.push("tk.KHO_ID = :warehouseId");
        binds.warehouseId = query.warehouseId;
      }
      if (query.query) {
        clauses.push(`(
          UPPER(t.MA_THUOC) LIKE :search
          OR UPPER(t.TEN_THUOC) LIKE :search
          OR UPPER(NVL(t.HOAT_CHAT, '')) LIKE :search
        )`);
        binds.search = `%${query.query.toUpperCase()}%`;
      }

      const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";

      const countSql = `
        SELECT COUNT(DISTINCT t.THUOC_ID || '-' || NVL(tk.KHO_ID, 0)) AS "total"
        FROM THUOC t
        LEFT JOIN LO_THUOC l ON l.THUOC_ID = t.THUOC_ID
        LEFT JOIN TON_KHO_LO tk ON tk.LO_ID = l.LO_ID
        ${where}`;

      const countRes = await conn.execute<{ total: number }>(countSql, binds, {
        outFormat: oracledb.OUT_FORMAT_OBJECT,
      });
      const total = countRes.rows?.[0]?.total ?? 0;
      const totalPages = Math.max(1, Math.ceil(total / query.pageSize));
      const page = Math.min(query.page, totalPages);
      const offset = (page - 1) * query.pageSize;

      const dataSql = `
        SELECT
          t.THUOC_ID AS "medicineId",
          t.MA_THUOC AS "medicineCode",
          t.TEN_THUOC AS "medicineName",
          t.HOAT_CHAT AS "activeIngredient",
          t.HAM_LUONG AS "strength",
          d.TEN_DVT AS "unitName",
          NVL(k.KHO_ID, 1) AS "warehouseId",
          NVL(k.TEN_KHO, 'Kho Chẵn') AS "warehouseName",
          NVL(SUM(tk.SO_LUONG_TON), 0) AS "onHandQuantity",
          NVL(SUM(CASE WHEN l.HAN_SU_DUNG >= TRUNC(SYSDATE) THEN tk.SO_LUONG_TON ELSE 0 END), 0) AS "availableQuantity",
          COUNT(DISTINCT tk.LO_ID) AS "batchCount",
          MIN(TO_CHAR(l.HAN_SU_DUNG, 'YYYY-MM-DD')) AS "nearestExpiryDate",
          t.TON_TOI_THIEU AS "minimumStock"
        FROM THUOC t
        JOIN DON_VI_TINH d ON d.DVT_ID = t.DVT_CO_SO_ID
        LEFT JOIN LO_THUOC l ON l.THUOC_ID = t.THUOC_ID
        LEFT JOIN TON_KHO_LO tk ON tk.LO_ID = l.LO_ID
        LEFT JOIN KHO k ON k.KHO_ID = tk.KHO_ID
        ${where}
        GROUP BY t.THUOC_ID, t.MA_THUOC, t.TEN_THUOC, t.HOAT_CHAT, t.HAM_LUONG, d.TEN_DVT, k.KHO_ID, k.TEN_KHO, t.TON_TOI_THIEU
        ORDER BY t.MA_THUOC ASC
        OFFSET :offset ROWS FETCH NEXT :pageSize ROWS ONLY`;

      const dataRes = await conn.execute<{
        medicineId: number;
        medicineCode: string;
        medicineName: string;
        activeIngredient: string | null;
        strength: string | null;
        unitName: string;
        warehouseId: number;
        warehouseName: string;
        onHandQuantity: number;
        availableQuantity: number;
        batchCount: number;
        nearestExpiryDate: string | null;
        minimumStock: number;
      }>(dataSql, { ...binds, offset, pageSize: query.pageSize }, {
        outFormat: oracledb.OUT_FORMAT_OBJECT,
      });

      const todayStr = new Date().toISOString().split("T")[0];
      const items = (dataRes.rows ?? []).map((row) => {
        let expiryStatus: "NORMAL" | "NEAR_EXPIRY" | "EXPIRED" = "NORMAL";
        if (row.nearestExpiryDate) {
          const exp = row.nearestExpiryDate;
          if (exp < todayStr) expiryStatus = "EXPIRED";
          else {
            const diffDays = Math.ceil(
              (new Date(exp).getTime() - new Date(todayStr).getTime()) /
                (1000 * 60 * 60 * 24),
            );
            if (diffDays <= 90) expiryStatus = "NEAR_EXPIRY";
          }
        }

        return {
          ...row,
          expiryStatus,
          isLowStock: row.availableQuantity < row.minimumStock,
        };
      });

      return {
        items,
        page,
        pageSize: query.pageSize,
        total,
        totalPages,
      };
    });
  }

  async getMedicineBatches(
    medicineId: number,
    warehouseId?: number,
  ): Promise<InventoryBalance[]> {
    return withOracleConnection(async (conn) => {
      const warehouseClause = warehouseId ? "AND tk.KHO_ID = :warehouseId" : "";
      const binds: Record<string, number> = { medicineId };
      if (warehouseId) binds.warehouseId = warehouseId;

      const sql = `
        SELECT
          tk.TON_KHO_LO_ID AS "id",
          tk.KHO_ID AS "warehouseId",
          k.MA_KHO AS "warehouseCode",
          k.TEN_KHO AS "warehouseName",
          t.THUOC_ID AS "medicineId",
          t.MA_THUOC AS "medicineCode",
          t.TEN_THUOC AS "medicineName",
          t.HAM_LUONG AS "medicineStrength",
          t.HOAT_CHAT AS "medicineActiveIngredient",
          d.TEN_DVT AS "unitName",
          l.LO_ID AS "batchId",
          l.SO_LO AS "lotNumber",
          TO_CHAR(l.NGAY_SAN_XUAT, 'YYYY-MM-DD') AS "manufacturingDate",
          TO_CHAR(l.HAN_SU_DUNG, 'YYYY-MM-DD') AS "expiryDate",
          CASE WHEN l.HAN_SU_DUNG < TRUNC(SYSDATE) THEN 'EXPIRED' ELSE 'AVAILABLE' END AS "batchStatus",
          tk.SO_LUONG_TON AS "onHandQuantity",
          0 AS "reservedQuantity",
          CASE WHEN l.HAN_SU_DUNG >= TRUNC(SYSDATE) THEN tk.SO_LUONG_TON ELSE 0 END AS "availableQuantity"
        FROM TON_KHO_LO tk
        JOIN KHO k ON k.KHO_ID = tk.KHO_ID
        JOIN LO_THUOC l ON l.LO_ID = tk.LO_ID
        JOIN THUOC t ON t.THUOC_ID = l.THUOC_ID
        JOIN DON_VI_TINH d ON d.DVT_ID = t.DVT_CO_SO_ID
        WHERE l.THUOC_ID = :medicineId
        ${warehouseClause}
        ORDER BY l.HAN_SU_DUNG ASC, l.LO_ID ASC`;

      const res = await conn.execute<any>(sql, binds, {
        outFormat: oracledb.OUT_FORMAT_OBJECT,
      });

      const todayStr = new Date().toISOString().split("T")[0];
      return (res.rows ?? []).map((row: any) => {
        const diffDays = Math.ceil(
          (new Date(row.expiryDate).getTime() - new Date(todayStr).getTime()) /
            (1000 * 60 * 60 * 24),
        );
        let expiryStatus: "NORMAL" | "NEAR_EXPIRY" | "EXPIRED" = "NORMAL";
        if (diffDays < 0 || row.batchStatus === "EXPIRED") expiryStatus = "EXPIRED";
        else if (diffDays <= 90) expiryStatus = "NEAR_EXPIRY";

        return {
          ...row,
          expiryStatus,
          daysUntilExpiry: diffDays,
        };
      });
    });
  }

  async getCandidateBatchesForFefo(
    warehouseId: number,
    medicineId: number,
  ): Promise<FefoCandidateBatch[]> {
    return withOracleConnection(async (conn) => {
      const sql = `
        SELECT
          f.LO_ID AS "batchId",
          f.SO_LO AS "lotNumber",
          TO_CHAR(f.HAN_SU_DUNG, 'YYYY-MM-DD') AS "expiryDate",
          TO_CHAR(f.NGAY_NHAP_DAU, 'YYYY-MM-DD') AS "receivedAt",
          f.SO_LUONG_KHA_DUNG AS "availableQuantity",
          'AVAILABLE' AS "status"
        FROM VW_TON_KHO_FEFO f
        WHERE f.KHO_ID = :warehouseId AND f.THUOC_ID = :medicineId
        ORDER BY f.THU_TU_FEFO ASC`;

      const res = await conn.execute<FefoCandidateBatch>(sql, { warehouseId, medicineId }, {
        outFormat: oracledb.OUT_FORMAT_OBJECT,
      });
      return res.rows ?? [];
    });
  }

  async getBatchTraceability(batchId: number): Promise<BatchTraceability | null> {
    return withOracleConnection(async (conn) => {
      const batchSql = `
        SELECT
          l.LO_ID AS "id",
          l.THUOC_ID AS "medicineId",
          t.MA_THUOC AS "medicineCode",
          t.TEN_THUOC AS "medicineName",
          l.SO_LO AS "lotNumber",
          TO_CHAR(l.NGAY_SAN_XUAT, 'YYYY-MM-DD') AS "manufacturingDate",
          TO_CHAR(l.HAN_SU_DUNG, 'YYYY-MM-DD') AS "expiryDate",
          CASE WHEN l.HAN_SU_DUNG < TRUNC(SYSDATE) THEN 'EXPIRED' ELSE 'AVAILABLE' END AS "status",
          TO_CHAR(NVL(l.NGAY_SAN_XUAT, SYSDATE), 'YYYY-MM-DD') AS "receivedAt",
          TO_CHAR(SYSDATE, 'YYYY-MM-DD') AS "createdAt"
        FROM LO_THUOC l
        JOIN THUOC t ON t.THUOC_ID = l.THUOC_ID
        WHERE l.LO_ID = :batchId`;

      const batchRes = await conn.execute<any>(batchSql, { batchId }, {
        outFormat: oracledb.OUT_FORMAT_OBJECT,
      });
      const batch = batchRes.rows?.[0];
      if (!batch) return null;

      // Current balances
      const balRes = await conn.execute<any>(
        `SELECT tk.KHO_ID AS "warehouseId", k.TEN_KHO AS "warehouseName",
                tk.SO_LUONG_TON AS "onHandQuantity",
                CASE WHEN l.HAN_SU_DUNG >= TRUNC(SYSDATE) THEN tk.SO_LUONG_TON ELSE 0 END AS "availableQuantity"
         FROM TON_KHO_LO tk
         JOIN KHO k ON k.KHO_ID = tk.KHO_ID
         JOIN LO_THUOC l ON l.LO_ID = tk.LO_ID
         WHERE tk.LO_ID = :batchId`,
        { batchId },
        { outFormat: oracledb.OUT_FORMAT_OBJECT },
      );

      // Movements
      const movRes = await conn.execute<StockMovement>(
        `SELECT g.GIAO_DICH_KHO_ID AS "id",
                g.KHO_ID AS "warehouseId",
                k.TEN_KHO AS "warehouseName",
                l.THUOC_ID AS "medicineId",
                t.MA_THUOC AS "medicineCode",
                t.TEN_THUOC AS "medicineName",
                g.LO_ID AS "batchId",
                l.SO_LO AS "lotNumber",
                g.LOAI_GIAO_DICH AS "movementType",
                ABS(g.SO_LUONG_THAY_DOI) AS "quantity",
                (g.SO_DU_SAU - g.SO_LUONG_THAY_DOI) AS "quantityBefore",
                g.SO_DU_SAU AS "quantityAfter",
                CASE
                  WHEN g.PHIEU_NHAP_ID IS NOT NULL THEN 'STOCK_IN'
                  WHEN g.PHIEU_XUAT_ID IS NOT NULL THEN 'STOCK_OUT'
                  WHEN g.PHIEU_KHO_NC_ID IS NOT NULL THEN 'EXTENDED_DOC'
                  ELSE 'MANUAL'
                END AS "referenceType",
                NVL(g.PHIEU_NHAP_ID, NVL(g.PHIEU_XUAT_ID, g.PHIEU_KHO_NC_ID)) AS "referenceId",
                TO_CHAR(NVL(g.PHIEU_NHAP_ID, NVL(g.PHIEU_XUAT_ID, g.PHIEU_KHO_NC_ID))) AS "referenceCode",
                g.NGUOI_THUC_HIEN AS "performedBy",
                TO_CHAR(g.NGAY_GIAO_DICH, 'YYYY-MM-DD HH24:MI:SS') AS "createdAt"
         FROM GIAO_DICH_KHO g
         JOIN KHO k ON k.KHO_ID = g.KHO_ID
         JOIN LO_THUOC l ON l.LO_ID = g.LO_ID
         JOIN THUOC t ON t.THUOC_ID = l.THUOC_ID
         WHERE g.LO_ID = :batchId
         ORDER BY g.NGAY_GIAO_DICH DESC`,
        { batchId },
        { outFormat: oracledb.OUT_FORMAT_OBJECT },
      );

      return {
        batch,
        currentBalances: balRes.rows ?? [],
        receiptHistory: [],
        issueHistory: [],
        movements: movRes.rows ?? [],
      };
    });
  }

  // Stock Receipts & Issues via Oracle SQL
  async listReceipts(query: Required<StockReceiptListQuery>): Promise<StockReceiptPage> {
    return withOracleConnection(async (conn) => {
      const clauses: string[] = [];
      const binds: Record<string, any> = {};

      if (query.warehouseId !== "ALL") {
        clauses.push("p.KHO_ID = :warehouseId");
        binds.warehouseId = query.warehouseId;
      }
      if (query.status !== "ALL") {
        clauses.push("p.TRANG_THAI = :status");
        binds.status = query.status;
      }
      if (query.query) {
        clauses.push(`(
          UPPER(p.SO_PHIEU) LIKE :search
          OR UPPER(n.TEN_NCC) LIKE :search
          OR UPPER(NVL(p.GHI_CHU, '')) LIKE :search
        )`);
        binds.search = `%${query.query.toUpperCase()}%`;
      }

      const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";

      const countSql = `SELECT COUNT(*) AS "total" FROM PHIEU_NHAP p JOIN NHA_CUNG_CAP n ON n.NCC_ID = p.NCC_ID ${where}`;
      const countRes = await conn.execute<{ total: number }>(countSql, binds, {
        outFormat: oracledb.OUT_FORMAT_OBJECT,
      });
      const total = countRes.rows?.[0]?.total ?? 0;
      const totalPages = Math.max(1, Math.ceil(total / query.pageSize));
      const page = Math.min(query.page, totalPages);
      const offset = (page - 1) * query.pageSize;

      const sql = `
        SELECT
          p.PHIEU_NHAP_ID AS "id",
          p.SO_PHIEU AS "receiptCode",
          p.KHO_ID AS "warehouseId",
          k.MA_KHO AS "warehouseCode",
          k.TEN_KHO AS "warehouseName",
          p.NCC_ID AS "supplierId",
          n.TEN_NCC AS "supplierName",
          TO_CHAR(p.NGAY_NHAP, 'YYYY-MM-DD') AS "receiptDate",
          p.SO_PHIEU AS "documentNumber",
          p.TRANG_THAI AS "status",
          p.GHI_CHU AS "note",
          (SELECT COUNT(*) FROM CT_PHIEU_NHAP WHERE PHIEU_NHAP_ID = p.PHIEU_NHAP_ID) AS "totalItems",
          (SELECT NVL(SUM(SO_LUONG_NHAP), 0) FROM CT_PHIEU_NHAP WHERE PHIEU_NHAP_ID = p.PHIEU_NHAP_ID) AS "totalQuantity",
          p.NGUOI_NHAP AS "createdBy",
          p.NGUOI_NHAP AS "confirmedBy",
          TO_CHAR(p.NGAY_NHAP, 'YYYY-MM-DD HH24:MI:SS') AS "confirmedAt",
          TO_CHAR(p.NGAY_NHAP, 'YYYY-MM-DD HH24:MI:SS') AS "createdAt"
        FROM PHIEU_NHAP p
        JOIN KHO k ON k.KHO_ID = p.KHO_ID
        JOIN NHA_CUNG_CAP n ON n.NCC_ID = p.NCC_ID
        ${where}
        ORDER BY p.PHIEU_NHAP_ID DESC
        OFFSET :offset ROWS FETCH NEXT :pageSize ROWS ONLY`;

      const dataRes = await conn.execute<StockReceipt>(sql, { ...binds, offset, pageSize: query.pageSize }, {
        outFormat: oracledb.OUT_FORMAT_OBJECT,
      });

      return {
        items: dataRes.rows ?? [],
        page,
        pageSize: query.pageSize,
        total,
        totalPages,
      };
    });
  }

  async getReceiptById(id: number): Promise<StockReceipt | null> {
    return withOracleConnection(async (conn) => {
      const sql = `
        SELECT
          p.PHIEU_NHAP_ID AS "id",
          p.SO_PHIEU AS "receiptCode",
          p.KHO_ID AS "warehouseId",
          k.MA_KHO AS "warehouseCode",
          k.TEN_KHO AS "warehouseName",
          p.NCC_ID AS "supplierId",
          n.TEN_NCC AS "supplierName",
          TO_CHAR(p.NGAY_NHAP, 'YYYY-MM-DD') AS "receiptDate",
          p.SO_PHIEU AS "documentNumber",
          p.TRANG_THAI AS "status",
          p.GHI_CHU AS "note",
          p.NGUOI_NHAP AS "createdBy",
          p.NGUOI_NHAP AS "confirmedBy",
          TO_CHAR(p.NGAY_NHAP, 'YYYY-MM-DD HH24:MI:SS') AS "confirmedAt",
          TO_CHAR(p.NGAY_NHAP, 'YYYY-MM-DD HH24:MI:SS') AS "createdAt"
        FROM PHIEU_NHAP p
        JOIN KHO k ON k.KHO_ID = p.KHO_ID
        JOIN NHA_CUNG_CAP n ON n.NCC_ID = p.NCC_ID
        WHERE p.PHIEU_NHAP_ID = :id`;

      const res = await conn.execute<StockReceipt>(sql, { id }, {
        outFormat: oracledb.OUT_FORMAT_OBJECT,
      });
      const receipt = res.rows?.[0];
      if (!receipt) return null;

      const itemsSql = `
        SELECT
          c.CT_PHIEU_NHAP_ID AS "id",
          c.PHIEU_NHAP_ID AS "receiptId",
          l.THUOC_ID AS "medicineId",
          t.MA_THUOC AS "medicineCode",
          t.TEN_THUOC AS "medicineName",
          d.TEN_DVT AS "unitName",
          c.LO_ID AS "batchId",
          l.SO_LO AS "lotNumber",
          TO_CHAR(l.NGAY_SAN_XUAT, 'YYYY-MM-DD') AS "manufacturingDate",
          TO_CHAR(l.HAN_SU_DUNG, 'YYYY-MM-DD') AS "expiryDate",
          c.SO_LUONG_NHAP AS "quantity",
          c.DON_GIA AS "unitCost",
          c.THANH_TIEN AS "totalCost",
          '' AS "note"
        FROM CT_PHIEU_NHAP c
        JOIN LO_THUOC l ON l.LO_ID = c.LO_ID
        JOIN THUOC t ON t.THUOC_ID = l.THUOC_ID
        JOIN DON_VI_TINH d ON d.DVT_ID = c.DVT_ID
        WHERE c.PHIEU_NHAP_ID = :id`;

      const itemsRes = await conn.execute<any>(itemsSql, { id }, {
        outFormat: oracledb.OUT_FORMAT_OBJECT,
      });
      receipt.items = itemsRes.rows ?? [];
      receipt.totalItems = receipt.items.length;
      receipt.totalQuantity = receipt.items.reduce((s, it) => s + it.quantity, 0);

      return receipt;
    });
  }

  async createReceipt(input: StockReceiptInput, creatorName: string): Promise<StockReceipt> {
    return withOracleConnection(async (conn) => {
      const result = await conn.execute(
        `INSERT INTO PHIEU_NHAP (KHO_ID, NCC_ID, NGAY_NHAP, GHI_CHU, NGUOI_NHAP, TRANG_THAI)
         VALUES (:warehouseId, :supplierId, TO_DATE(:receiptDate, 'YYYY-MM-DD'), :note, :creatorName, 'DRAFT')
         RETURNING PHIEU_NHAP_ID INTO :id`,
        {
          warehouseId: input.warehouseId,
          supplierId: input.supplierId,
          receiptDate: input.receiptDate,
          note: input.note || null,
          creatorName,
          id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
        },
        { autoCommit: false },
      );

      const id = (result.outBinds as { id: number[] }).id[0];
      await conn.commit();
      const receipt = await this.getReceiptById(id);
      if (!receipt) throw new AppError("INTERNAL_ERROR", "Không thể tạo phiếu nhập.");
      return receipt;
    });
  }

  async confirmReceipt(id: number, actorName: string): Promise<StockReceipt> {
    return withOracleConnection(async (conn) => {
      await conn.execute(
        `UPDATE PHIEU_NHAP SET TRANG_THAI = 'POSTED', NGUOI_NHAP = :actorName WHERE PHIEU_NHAP_ID = :id`,
        { id, actorName },
        { autoCommit: false },
      );
      await conn.commit();
      const receipt = await this.getReceiptById(id);
      if (!receipt) throw new AppError("INTERNAL_ERROR", "Lỗi sau khi xác nhận phiếu nhập.");
      return receipt;
    });
  }

  async cancelReceipt(id: number, actorName: string): Promise<StockReceipt> {
    return withOracleConnection(async (conn) => {
      await conn.execute(
        `UPDATE PHIEU_NHAP SET TRANG_THAI = 'CANCELLED', NGUOI_NHAP = :actorName WHERE PHIEU_NHAP_ID = :id`,
        { id, actorName },
        { autoCommit: false },
      );
      await conn.commit();
      const receipt = await this.getReceiptById(id);
      if (!receipt) throw new AppError("INTERNAL_ERROR", "Lỗi sau khi hủy phiếu nhập.");
      return receipt;
    });
  }

  async listIssues(query: Required<StockIssueListQuery>): Promise<StockIssuePage> {
    return withOracleConnection(async (conn) => {
      const clauses: string[] = [];
      const binds: Record<string, any> = {};

      if (query.warehouseId !== "ALL") {
        clauses.push("p.KHO_ID = :warehouseId");
        binds.warehouseId = query.warehouseId;
      }
      if (query.status !== "ALL") {
        clauses.push("p.TRANG_THAI = :status");
        binds.status = query.status;
      }
      if (query.query) {
        clauses.push(`(
          UPPER(p.SO_PHIEU) LIKE :search
          OR UPPER(p.NGUOI_XUAT) LIKE :search
        )`);
        binds.search = `%${query.query.toUpperCase()}%`;
      }

      const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";

      const countSql = `SELECT COUNT(*) AS "total" FROM PHIEU_XUAT p ${where}`;
      const countRes = await conn.execute<{ total: number }>(countSql, binds, {
        outFormat: oracledb.OUT_FORMAT_OBJECT,
      });
      const total = countRes.rows?.[0]?.total ?? 0;
      const totalPages = Math.max(1, Math.ceil(total / query.pageSize));
      const page = Math.min(query.page, totalPages);
      const offset = (page - 1) * query.pageSize;

      const sql = `
        SELECT
          p.PHIEU_XUAT_ID AS "id",
          p.SO_PHIEU AS "issueCode",
          p.KHO_ID AS "warehouseId",
          k.MA_KHO AS "warehouseCode",
          k.TEN_KHO AS "warehouseName",
          TO_CHAR(p.NGAY_XUAT, 'YYYY-MM-DD') AS "issueDate",
          'DEPARTMENT_ISSUE' AS "issueType",
          p.NGUOI_XUAT AS "receiver",
          p.KHOA_PHONG_ID AS "departmentId",
          kp.TEN_KHOA_PHONG AS "departmentName",
          p.TRANG_THAI AS "status",
          p.GHI_CHU AS "note",
          (SELECT COUNT(*) FROM CT_PHIEU_XUAT WHERE PHIEU_XUAT_ID = p.PHIEU_XUAT_ID) AS "totalItems",
          (SELECT NVL(SUM(SO_LUONG_XUAT), 0) FROM CT_PHIEU_XUAT WHERE PHIEU_XUAT_ID = p.PHIEU_XUAT_ID) AS "totalQuantity",
          p.NGUOI_XUAT AS "createdBy",
          p.NGUOI_XUAT AS "confirmedBy",
          TO_CHAR(p.NGAY_XUAT, 'YYYY-MM-DD HH24:MI:SS') AS "confirmedAt",
          TO_CHAR(p.NGAY_XUAT, 'YYYY-MM-DD HH24:MI:SS') AS "createdAt"
        FROM PHIEU_XUAT p
        JOIN KHO k ON k.KHO_ID = p.KHO_ID
        LEFT JOIN KHOA_PHONG kp ON kp.KHOA_PHONG_ID = p.KHOA_PHONG_ID
        ${where}
        ORDER BY p.PHIEU_XUAT_ID DESC
        OFFSET :offset ROWS FETCH NEXT :pageSize ROWS ONLY`;

      const dataRes = await conn.execute<StockIssue>(sql, { ...binds, offset, pageSize: query.pageSize }, {
        outFormat: oracledb.OUT_FORMAT_OBJECT,
      });

      return {
        items: dataRes.rows ?? [],
        page,
        pageSize: query.pageSize,
        total,
        totalPages,
      };
    });
  }

  async getIssueById(id: number): Promise<StockIssue | null> {
    return withOracleConnection(async (conn) => {
      const sql = `
        SELECT
          p.PHIEU_XUAT_ID AS "id",
          p.SO_PHIEU AS "issueCode",
          p.KHO_ID AS "warehouseId",
          k.MA_KHO AS "warehouseCode",
          k.TEN_KHO AS "warehouseName",
          TO_CHAR(p.NGAY_XUAT, 'YYYY-MM-DD') AS "issueDate",
          'DEPARTMENT_ISSUE' AS "issueType",
          p.NGUOI_XUAT AS "receiver",
          p.KHOA_PHONG_ID AS "departmentId",
          kp.TEN_KHOA_PHONG AS "departmentName",
          p.TRANG_THAI AS "status",
          p.GHI_CHU AS "note",
          p.NGUOI_XUAT AS "createdBy",
          p.NGUOI_XUAT AS "confirmedBy",
          TO_CHAR(p.NGAY_XUAT, 'YYYY-MM-DD HH24:MI:SS') AS "confirmedAt",
          TO_CHAR(p.NGAY_XUAT, 'YYYY-MM-DD HH24:MI:SS') AS "createdAt"
        FROM PHIEU_XUAT p
        JOIN KHO k ON k.KHO_ID = p.KHO_ID
        LEFT JOIN KHOA_PHONG kp ON kp.KHOA_PHONG_ID = p.KHOA_PHONG_ID
        WHERE p.PHIEU_XUAT_ID = :id`;

      const res = await conn.execute<StockIssue>(sql, { id }, {
        outFormat: oracledb.OUT_FORMAT_OBJECT,
      });
      const issue = res.rows?.[0];
      if (!issue) return null;

      const itemsSql = `
        SELECT
          c.CT_PHIEU_XUAT_ID AS "id",
          c.PHIEU_XUAT_ID AS "issueId",
          l.THUOC_ID AS "medicineId",
          t.MA_THUOC AS "medicineCode",
          t.TEN_THUOC AS "medicineName",
          d.TEN_DVT AS "unitName",
          c.SO_LUONG_XUAT AS "requestedQuantity",
          l.SO_LO AS "note"
        FROM CT_PHIEU_XUAT c
        JOIN LO_THUOC l ON l.LO_ID = c.LO_ID
        JOIN THUOC t ON t.THUOC_ID = l.THUOC_ID
        JOIN DON_VI_TINH d ON d.DVT_ID = c.DVT_ID
        WHERE c.PHIEU_XUAT_ID = :id`;

      const itemsRes = await conn.execute<any>(itemsSql, { id }, {
        outFormat: oracledb.OUT_FORMAT_OBJECT,
      });
      issue.items = itemsRes.rows ?? [];
      issue.totalItems = issue.items.length;
      issue.totalQuantity = issue.items.reduce((s, it) => s + it.requestedQuantity, 0);

      return issue;
    });
  }

  async createIssue(input: StockIssueInput, creatorName: string): Promise<StockIssue> {
    return withOracleConnection(async (conn) => {
      const result = await conn.execute(
        `INSERT INTO PHIEU_XUAT (KHO_ID, KHOA_PHONG_ID, NGUOI_XUAT, NGAY_XUAT, GHI_CHU, TRANG_THAI)
         VALUES (:warehouseId, :departmentId, :creatorName, TO_DATE(:issueDate, 'YYYY-MM-DD'), :note, 'DRAFT')
         RETURNING PHIEU_XUAT_ID INTO :id`,
        {
          warehouseId: input.warehouseId,
          departmentId: input.departmentId || null,
          creatorName: input.receiver || creatorName,
          issueDate: input.issueDate,
          note: input.note || null,
          id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
        },
        { autoCommit: false },
      );

      const id = (result.outBinds as { id: number[] }).id[0];
      await conn.commit();
      const issue = await this.getIssueById(id);
      if (!issue) throw new AppError("INTERNAL_ERROR", "Không thể tạo phiếu xuất.");
      return issue;
    });
  }

  async confirmIssue(id: number, actorName: string): Promise<StockIssue> {
    return withOracleConnection(async (conn) => {
      await conn.execute(
        `UPDATE PHIEU_XUAT SET TRANG_THAI = 'POSTED', NGUOI_XUAT = :actorName WHERE PHIEU_XUAT_ID = :id`,
        { id, actorName },
        { autoCommit: false },
      );
      await conn.commit();
      const issue = await this.getIssueById(id);
      if (!issue) throw new AppError("INTERNAL_ERROR", "Lỗi sau khi xác nhận phiếu xuất.");
      return issue;
    });
  }

  async cancelIssue(id: number, actorName: string): Promise<StockIssue> {
    return withOracleConnection(async (conn) => {
      await conn.execute(
        `UPDATE PHIEU_XUAT SET TRANG_THAI = 'CANCELLED', NGUOI_XUAT = :actorName WHERE PHIEU_XUAT_ID = :id`,
        { id, actorName },
        { autoCommit: false },
      );
      await conn.commit();
      const issue = await this.getIssueById(id);
      if (!issue) throw new AppError("INTERNAL_ERROR", "Lỗi sau khi hủy phiếu xuất.");
      return issue;
    });
  }

  async listMovements(filter?: {
    warehouseId?: number;
    medicineId?: number;
    batchId?: number;
    limit?: number;
  }): Promise<StockMovement[]> {
    return withOracleConnection(async (conn) => {
      const clauses: string[] = [];
      const binds: Record<string, any> = {};

      if (filter?.warehouseId) {
        clauses.push("g.KHO_ID = :warehouseId");
        binds.warehouseId = filter.warehouseId;
      }
      if (filter?.medicineId) {
        clauses.push("l.THUOC_ID = :medicineId");
        binds.medicineId = filter.medicineId;
      }
      if (filter?.batchId) {
        clauses.push("g.LO_ID = :batchId");
        binds.batchId = filter.batchId;
      }

      const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
      const limit = filter?.limit || 50;

      const sql = `
        SELECT
          g.GIAO_DICH_KHO_ID AS "id",
          g.KHO_ID AS "warehouseId",
          k.TEN_KHO AS "warehouseName",
          l.THUOC_ID AS "medicineId",
          t.MA_THUOC AS "medicineCode",
          t.TEN_THUOC AS "medicineName",
          g.LO_ID AS "batchId",
          l.SO_LO AS "lotNumber",
          g.LOAI_GIAO_DICH AS "movementType",
          ABS(g.SO_LUONG_THAY_DOI) AS "quantity",
          (g.SO_DU_SAU - g.SO_LUONG_THAY_DOI) AS "quantityBefore",
          g.SO_DU_SAU AS "quantityAfter",
          CASE
            WHEN g.PHIEU_NHAP_ID IS NOT NULL THEN 'STOCK_IN'
            WHEN g.PHIEU_XUAT_ID IS NOT NULL THEN 'STOCK_OUT'
            WHEN g.PHIEU_KHO_NC_ID IS NOT NULL THEN 'EXTENDED_DOC'
            ELSE 'MANUAL'
          END AS "referenceType",
          NVL(g.PHIEU_NHAP_ID, NVL(g.PHIEU_XUAT_ID, g.PHIEU_KHO_NC_ID)) AS "referenceId",
          TO_CHAR(NVL(g.PHIEU_NHAP_ID, NVL(g.PHIEU_XUAT_ID, g.PHIEU_KHO_NC_ID))) AS "referenceCode",
          g.NGUOI_THUC_HIEN AS "performedBy",
          TO_CHAR(g.NGAY_GIAO_DICH, 'YYYY-MM-DD HH24:MI:SS') AS "createdAt"
        FROM GIAO_DICH_KHO g
        JOIN KHO k ON k.KHO_ID = g.KHO_ID
        JOIN LO_THUOC l ON l.LO_ID = g.LO_ID
        JOIN THUOC t ON t.THUOC_ID = l.THUOC_ID
        ${where}
        ORDER BY g.NGAY_GIAO_DICH DESC
        FETCH NEXT :limit ROWS ONLY`;

      const res = await conn.execute<StockMovement>(sql, { ...binds, limit }, {
        outFormat: oracledb.OUT_FORMAT_OBJECT,
      });
      return res.rows ?? [];
    });
  }
}
