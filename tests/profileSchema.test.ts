import { describe, expect, it } from "vitest";
import { profileSchema } from "@/lib/storage";

describe("profileSchema", () => {
  it("직군만 있어도 유효하다 (구직자 기본 플로우)", () => {
    expect(profileSchema.safeParse({ jobFamily: "dev" }).success).toBe(true);
  });

  it("현재 회사 3개 값이 모두 있으면 유효하다 (재직자 부가 기능)", () => {
    const r = profileSchema.safeParse({
      jobFamily: "dev",
      currentCompanyId: "samsung-sds",
      currentSalary: 7000,
      tenureMonths: 38,
    });
    expect(r.success).toBe(true);
  });

  it("현재 회사 값이 일부만 있으면 거부한다", () => {
    const r = profileSchema.safeParse({ jobFamily: "dev", currentCompanyId: "samsung-sds" });
    expect(r.success).toBe(false);
  });
});
