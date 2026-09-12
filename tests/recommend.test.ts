import { describe, expect, it } from "vitest";
import { scoreAssessment } from "@/lib/assessment";
import { COMPANIES } from "@/lib/companies";
import { recommend } from "@/lib/recommend";
import type { Answer, UserProfile } from "@/lib/types";
import { MIN_FIT_MARGIN } from "@/lib/constants";

const profile: UserProfile = {
  jobFamily: "dev",
  currentCompanyId: "samsung-sds",
  currentSalary: 7000,
  tenureMonths: 38,
};
const compGrowth = scoreAssessment(["A", "A", "A", "A", "B", "B", "A", "B", "B", "A"] as Answer[]);

describe("recommend", () => {
  it("현재 회사는 결과에 없다", () => {
    const r = recommend(compGrowth, profile, COMPANIES);
    expect(r.top.map((t) => t.company.id)).not.toContain("samsung-sds");
    expect(r.ranked.map((t) => t.company.id)).not.toContain("samsung-sds");
  });

  it("동일 입력 2회 → 순서 완전 동일 (재현성)", () => {
    const a = recommend(compGrowth, profile, COMPANIES);
    const b = recommend(compGrowth, profile, COMPANIES);
    expect(a.ranked.map((t) => t.company.id)).toEqual(b.ranked.map((t) => t.company.id));
  });

  it("결과 개수는 항상 ≤ 3, fitDelta > MIN_FIT_MARGIN", () => {
    const r = recommend(compGrowth, profile, COMPANIES);
    expect(r.top.length).toBeLessThanOrEqual(3);
    for (const t of r.top) expect(t.fitDelta).toBeGreaterThan(MIN_FIT_MARGIN);
  });

  it("reasons 는 길이 ≥ 1 이고 실제 숫자를 포함한다", () => {
    const r = recommend(compGrowth, profile, COMPANIES);
    expect(r.top.length).toBeGreaterThan(0);
    for (const t of r.top) {
      expect(t.reasons.length).toBeGreaterThanOrEqual(1);
      expect(t.reasons[0]).toMatch(/\d+점/);
    }
  });

  it("현재 회사가 이미 최적이면 top 은 빈 배열, 예외 없음", () => {
    // 풀의 최고 Fit 회사를 현재 회사로 넣는다
    const best = recommend(compGrowth, { ...profile, currentCompanyId: "__none__" }, COMPANIES).ranked[0];
    const r = recommend(compGrowth, { ...profile, currentCompanyId: best.company.id }, COMPANIES);
    expect(r.top).toEqual([]);
  });

  it("currentCompanyId = 'other' → 합성 회사로 동작", () => {
    const r = recommend(compGrowth, { ...profile, currentCompanyId: "other" }, COMPANIES);
    expect(r.current.isSynthetic).toBe(true);
    expect(r.current.fit.fit).toBeGreaterThan(0);
  });

  it("직군 필터: marketing 은 풀이 dev 보다 작거나 같다", () => {
    const dev = recommend(compGrowth, profile, COMPANIES);
    const mkt = recommend(compGrowth, { ...profile, jobFamily: "marketing" }, COMPANIES);
    expect(mkt.poolSize).toBeLessThanOrEqual(dev.poolSize);
  });
});
