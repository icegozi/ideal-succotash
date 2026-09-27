import "server-only";

import oracledb, { type Connection, type Pool, type PoolAttributes } from "oracledb";

import { AppError } from "@/lib/errors/app-error";

declare global {
  var __medstockOraclePool: Promise<Pool> | undefined;
}

function poolConfig(): PoolAttributes {
  const user = process.env.ORACLE_USER;
  const password = process.env.ORACLE_PASSWORD;
  const connectString = process.env.ORACLE_CONNECT_STRING;

  if (!user || !password || !connectString) {
    throw new AppError(
      "DATABASE_ERROR",
      "Thiếu cấu hình kết nối Oracle. Kiểm tra ORACLE_USER, ORACLE_PASSWORD và ORACLE_CONNECT_STRING.",
    );
  }

  return {
    user,
    password,
    connectString,
    poolMin: 0,
    poolMax: Number(process.env.ORACLE_POOL_MAX || 8),
    poolIncrement: 1,
    poolTimeout: 60,
    queueTimeout: 10_000,
  };
}

async function getPool(): Promise<Pool> {
  globalThis.__medstockOraclePool ??= oracledb.createPool(poolConfig());
  return globalThis.__medstockOraclePool;
}

export async function withOracleConnection<T>(
  operation: (connection: Connection) => Promise<T>,
): Promise<T> {
  let connection: Connection | undefined;

  try {
    connection = await (await getPool()).getConnection();
    return await operation(connection);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    const oracleError = error as { errorNum?: number; message?: string };
    if (oracleError.errorNum === 1) {
      throw new AppError("CONFLICT", "Dữ liệu bị trùng với một bản ghi hiện có.", error);
    }
    if (oracleError.errorNum === 20041 || oracleError.errorNum === 20186) {
      throw new AppError(
        "CONFLICT",
        oracleError.message?.replace(/^ORA-\d+:\s*/, "") || "Thay đổi bị từ chối bởi quy tắc dữ liệu.",
        error,
      );
    }

    console.error("Oracle operation failed", error);
    throw new AppError(
      "DATABASE_ERROR",
      "Không thể truy cập cơ sở dữ liệu thuốc.",
      error,
    );
  } finally {
    await connection?.close();
  }
}

export function isOracleConfigured(): boolean {
  return Boolean(
    process.env.ORACLE_USER &&
      process.env.ORACLE_PASSWORD &&
      process.env.ORACLE_CONNECT_STRING,
  );
}

export { oracledb };
