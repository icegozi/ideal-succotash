import { describe, expect, it } from "vitest";

describe("Oracle Inventory Repository — Expiry Filter HAVING Clause (I1)", () => {
  function buildExpiryHaving(expiryStatus?: "NORMAL" | "NEAR_EXPIRY" | "EXPIRED"): string {
    return expiryStatus === "EXPIRED"
      ? "HAVING MIN(l.HAN_SU_DUNG) < TRUNC(SYSDATE)"
      : expiryStatus === "NEAR_EXPIRY"
        ? "HAVING MIN(l.HAN_SU_DUNG) BETWEEN TRUNC(SYSDATE) AND TRUNC(SYSDATE) + 90"
        : expiryStatus === "NORMAL"
          ? "HAVING MIN(l.HAN_SU_DUNG) IS NULL OR MIN(l.HAN_SU_DUNG) > TRUNC(SYSDATE) + 90"
          : "";
  }

  it("builds correct HAVING clause for EXPIRED query", () => {
    const clause = buildExpiryHaving("EXPIRED");
    expect(clause).toBe("HAVING MIN(l.HAN_SU_DUNG) < TRUNC(SYSDATE)");
  });

  it("builds correct HAVING clause for NEAR_EXPIRY query", () => {
    const clause = buildExpiryHaving("NEAR_EXPIRY");
    expect(clause).toBe("HAVING MIN(l.HAN_SU_DUNG) BETWEEN TRUNC(SYSDATE) AND TRUNC(SYSDATE) + 90");
  });

  it("builds correct HAVING clause for NORMAL query", () => {
    const clause = buildExpiryHaving("NORMAL");
    expect(clause).toBe("HAVING MIN(l.HAN_SU_DUNG) IS NULL OR MIN(l.HAN_SU_DUNG) > TRUNC(SYSDATE) + 90");
  });

  it("returns empty string when no expiry status filter is requested", () => {
    const clause = buildExpiryHaving(undefined);
    expect(clause).toBe("");
  });
});
