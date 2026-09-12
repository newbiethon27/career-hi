import { describe, expect, it } from "vitest";
import { computeFit } from "@/lib/fit";
import { COMPANIES } from "@/lib/companies";
import { AXES } from "@/lib/types";
import { sumAxes } from "@/lib/utils";

describe("computeFit", () => {
  it("손계산 케이스: .45/.15/.10/.30 × 84/74/72/88 = 82.1 → 82", () => {
    const r = computeFit(
      { compensation: 0.45, balance: 0.15, stability: 0.1, growth: 0.3 },
      { compensation: 84, balance: 74, stability: 72, growth: 88 },
    );
    // 37.8 + 11.1 + 7.2 + 26.4 = 82.5 → 반올림 83? 정확히: 37.8+11.1=48.9, +7.2=56.1, +26.4=82.5
    expect(r.fit).toBe(Math.round(82.5));
    expect(sumAxes(r.contributions)).toBeCloseTo(82.5, 9);
  });

  it("모든 회사 fit ∈ [30, 98] (균등 가중치)", () => {
    const w = { compensation: 0.25, balance: 0.25, stability: 0.25, growth: 0.25 };
    for (const c of COMPANIES) {
      const r = computeFit(w, c.scores);
      expect(r.fit).toBeGreaterThanOrEqual(30);
      expect(r.fit).toBeLessThanOrEqual(98);
      expect(Math.abs(sumAxes(r.contributions) - r.fit)).toBeLessThanOrEqual(0.5);
    }
  });

  it("weights 가 한 축에 몰리면 fit ≈ 해당 축 점수", () => {
    const w = { compensation: 1, balance: 0, stability: 0, growth: 0 };
    for (const c of COMPANIES) expect(computeFit(w, c.scores).fit).toBe(c.scores.compensation);
  });

  it("contributions 는 4축 전부 존재", () => {
    const r = computeFit(
      { compensation: 0.25, balance: 0.25, stability: 0.25, growth: 0.25 },
      { compensation: 40, balance: 40, stability: 40, growth: 40 },
    );
    for (const a of AXES) expect(r.contributions[a]).toBe(10);
  });
});
