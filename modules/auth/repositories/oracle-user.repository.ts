import "server-only";

import { oracledb, withOracleConnection } from "@/lib/db/oracle";
import type {
  CreateSessionData,
  CreateUserData,
  UserRepository,
} from "@/modules/auth/repositories/user.repository";
import type { Session, User, UserRole } from "@/modules/auth/types/auth.types";

type UserRow = {
  id: number;
  name: string;
  email: string;
  passwordHash: string;
  role: string;
  department: string | null;
  active: "Y" | "N";
  createdAt: Date;
  updatedAt: Date;
};

type SessionRow = {
  id: string;
  userId: number;
  expiresAt: Date;
  createdAt: Date;
  ipAddress: string | null;
  userAgent: string | null;
};

function mapUserRow(row: UserRow): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.passwordHash,
    role: (row.role as UserRole) || "PHARMACIST",
    department: row.department,
    active: row.active === "Y",
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class OracleUserRepository implements UserRepository {
  async findByEmail(email: string): Promise<User | null> {
    return withOracleConnection(async (connection) => {
      const result = await connection.execute<UserRow>(
        `SELECT
          USER_ID AS "id",
          HO_TEN AS "name",
          EMAIL AS "email",
          PASSWORD_HASH AS "passwordHash",
          VAI_TRO AS "role",
          KHOA_PHONG AS "department",
          TRANG_THAI AS "active",
          CREATED_AT AS "createdAt",
          UPDATED_AT AS "updatedAt"
        FROM APP_USERS
        WHERE LOWER(EMAIL) = LOWER(:email)`,
        { email: email.trim() },
        { outFormat: oracledb.OUT_FORMAT_OBJECT },
      );

      const row = result.rows?.[0];
      return row ? mapUserRow(row) : null;
    });
  }

  async findById(id: number): Promise<User | null> {
    return withOracleConnection(async (connection) => {
      const result = await connection.execute<UserRow>(
        `SELECT
          USER_ID AS "id",
          HO_TEN AS "name",
          EMAIL AS "email",
          PASSWORD_HASH AS "passwordHash",
          VAI_TRO AS "role",
          KHOA_PHONG AS "department",
          TRANG_THAI AS "active",
          CREATED_AT AS "createdAt",
          UPDATED_AT AS "updatedAt"
        FROM APP_USERS
        WHERE USER_ID = :id`,
        { id },
        { outFormat: oracledb.OUT_FORMAT_OBJECT },
      );

      const row = result.rows?.[0];
      return row ? mapUserRow(row) : null;
    });
  }

  async create(data: CreateUserData): Promise<User> {
    return withOracleConnection(async (connection) => {
      const result = await connection.execute<{ id: number }>(
        `INSERT INTO APP_USERS (
          HO_TEN,
          EMAIL,
          PASSWORD_HASH,
          VAI_TRO,
          KHOA_PHONG,
          TRANG_THAI
        ) VALUES (
          :name,
          LOWER(:email),
          :passwordHash,
          :role,
          :department,
          'Y'
        ) RETURNING USER_ID INTO :id`,
        {
          name: data.name.trim(),
          email: data.email.trim(),
          passwordHash: data.passwordHash,
          role: data.role ?? "PHARMACIST",
          department: data.department ?? null,
          id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
        },
        { autoCommit: true },
      );

      const outId = result.outBinds?.id as number[] | undefined;
      const newId = Array.isArray(outId) ? outId[0] : (outId as unknown as number);

      const created = await this.findById(newId);
      if (!created) throw new Error("Failed to retrieve created user from Oracle.");
      return created;
    });
  }

  async createSession(data: CreateSessionData): Promise<Session> {
    return withOracleConnection(async (connection) => {
      await connection.execute(
        `INSERT INTO APP_SESSIONS (
          SESSION_ID,
          USER_ID,
          EXPIRES_AT,
          IP_ADDRESS,
          USER_AGENT
        ) VALUES (
          :id,
          :userId,
          :expiresAt,
          :ipAddress,
          :userAgent
        )`,
        {
          id: data.id,
          userId: data.userId,
          expiresAt: data.expiresAt,
          ipAddress: data.ipAddress ?? null,
          userAgent: data.userAgent ?? null,
        },
        { autoCommit: true },
      );

      return {
        id: data.id,
        userId: data.userId,
        expiresAt: data.expiresAt,
        createdAt: new Date(),
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      };
    });
  }

  async findSession(sessionId: string): Promise<{ session: Session; user: User } | null> {
    return withOracleConnection(async (connection) => {
      const result = await connection.execute<SessionRow & UserRow>(
        `SELECT
          s.SESSION_ID AS "id",
          s.USER_ID AS "userId",
          s.EXPIRES_AT AS "expiresAt",
          s.CREATED_AT AS "createdAt",
          s.IP_ADDRESS AS "ipAddress",
          s.USER_AGENT AS "userAgent",
          u.HO_TEN AS "name",
          u.EMAIL AS "email",
          u.PASSWORD_HASH AS "passwordHash",
          u.VAI_TRO AS "role",
          u.KHOA_PHONG AS "department",
          u.TRANG_THAI AS "active",
          u.CREATED_AT AS "createdAt",
          u.UPDATED_AT AS "updatedAt"
        FROM APP_SESSIONS s
        JOIN APP_USERS u ON u.USER_ID = s.USER_ID
        WHERE s.SESSION_ID = :sessionId
          AND s.EXPIRES_AT > SYSTIMESTAMP
          AND u.TRANG_THAI = 'Y'`,
        { sessionId },
        { outFormat: oracledb.OUT_FORMAT_OBJECT },
      );

      const row = result.rows?.[0];
      if (!row) return null;

      const session: Session = {
        id: row.id,
        userId: row.userId,
        expiresAt: row.expiresAt,
        createdAt: row.createdAt,
        ipAddress: row.ipAddress,
        userAgent: row.userAgent,
      };

      const user = mapUserRow(row);
      return { session, user };
    });
  }

  async deleteSession(sessionId: string): Promise<void> {
    return withOracleConnection(async (connection) => {
      await connection.execute(
        `DELETE FROM APP_SESSIONS WHERE SESSION_ID = :sessionId`,
        { sessionId },
        { autoCommit: true },
      );
    });
  }

  async deleteUserSessions(userId: number): Promise<void> {
    return withOracleConnection(async (connection) => {
      await connection.execute(
        `DELETE FROM APP_SESSIONS WHERE USER_ID = :userId`,
        { userId },
        { autoCommit: true },
      );
    });
  }
}
