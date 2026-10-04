export const INVENTORY_CONFIG = {
  nearExpiryDays: Number(process.env.NEAR_EXPIRY_DAYS || 90),
  defaultPageSize: 10,
  defaultWarehouseId: 1,
} as const;

export function getExpiryStatus(
  expiryDateStr: string,
  todayStr?: string,
): { status: "NORMAL" | "NEAR_EXPIRY" | "EXPIRED"; daysUntilExpiry: number } {
  const today = todayStr ? new Date(todayStr) : new Date();
  today.setHours(0, 0, 0, 0);

  const expiry = new Date(expiryDateStr);
  expiry.setHours(0, 0, 0, 0);

  const diffTime = expiry.getTime() - today.getTime();
  const daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (daysUntilExpiry < 0) {
    return { status: "EXPIRED", daysUntilExpiry };
  }
  if (daysUntilExpiry <= INVENTORY_CONFIG.nearExpiryDays) {
    return { status: "NEAR_EXPIRY", daysUntilExpiry };
  }
  return { status: "NORMAL", daysUntilExpiry };
}
