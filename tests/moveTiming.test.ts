import { describe, expect, it } from "vitest";
import { bandOf, computeMoveTiming, tenureFactor } from "@/lib/moveTiming";

describe("computeMoveTiming", () => {
  it("최악 조합 → 90 이상, consider", () => {
    const r = computeMoveTiming({
      currentFit: 40,
      bestFit: 70,
      tenureMonths: 36,
      currentSalary: 4000,
      companyAvgSalary: 10000,
    });
    expect(r.score).toBeGreaterThanOrEqual(90);
    expect(r.band).toBe("consider");
  });

  it("최선 조합 (fit 높음 + 대안 없음 + 근속 짧음) → 20 이하, stay", () => {
    const r = computeMoveTiming({
      currentFit: 90,
      bestFit: null,
      tenureMonths: 6,
      currentSalary: 9000,
      companyAvgSalary: 8000,
    });
    expect(r.score).toBeLessThanOrEqual(20);
    expect(r.band).toBe("stay");
  });

  it("밴드 경계 39/40, 64/65", () => {
    expect(bandOf(39)).toBe("stay");
    expect(bandOf(40)).toBe("watch");
    expect(bandOf(64)).toBe("watch");
    expect(bandOf(65)).toBe("consider");
  });

  it("근속 6개월 → salaryGap = 0", () => {
    const r = computeMoveTiming({ currentFit: 50, bestFit: 70, tenureMonths: 6, currentSalary: 3000, companyAvgSalary: 10000 });
    expect(r.components.salaryGap).toBe(0);
    expect(r.notes.some((n) => n.includes("1년 미만"))).toBe(true);
  });

  it("avgSalary 결측 → 85점 만점 재정규화, 0~100 유지", () => {
    const r = computeMoveTiming({ currentFit: 40, bestFit: 70, tenureMonths: 36, currentSalary: 5000, companyAvgSalary: null });
    expect(r.maxScore).toBe(85);
    expect(r.score).toBeGreaterThanOrEqual(0);
    expect(r.score).toBeLessThanOrEqual(100);
    expect(r.score).toBe(100); // 40+25+20 = 85/85
  });

  it("구성요소 합 = 총점 (100점 만점일 때, 반올림 ±2)", () => {
    const r = computeMoveTiming({ currentFit: 60, bestFit: 75, tenureMonths: 30, currentSalary: 6000, companyAvgSalary: 9000 });
    const sum = r.components.fitGap + r.components.currentFitPenalty + r.components.tenureReadiness + r.components.salaryGap;
    expect(Math.abs(sum - r.score)).toBeLessThanOrEqual(2);
  });

  it("tenureFactor 종 모양", () => {
    expect(tenureFactor(6)).toBeLessThan(tenureFactor(18));
    expect(tenureFactor(18)).toBeLessThan(tenureFactor(36));
    expect(tenureFactor(36)).toBeGreaterThan(tenureFactor(80));
    expect(tenureFactor(80)).toBeGreaterThan(tenureFactor(120));
  });
});
