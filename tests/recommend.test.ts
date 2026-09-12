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
    expect(r.current?.isSynthetic).toBe(true);
    expect(r.current?.fit.fit).toBeGreaterThan(0);
  });

  it("직군 필터: marketing 은 풀이 dev 보다 작거나 같다", () => {
    const dev = recommend(compGrowth, profile, COMPANIES);
    const mkt = recommend(compGrowth, { ...profile, jobFamily: "marketing" }, COMPANIES);
    expect(mkt.poolSize).toBeLessThanOrEqual(dev.poolSize);
  });
});

/** 기본 플로우 = 구직자. 현재 회사 없이도 추천이 나와야 한다. */
describe("recommend — 구직자 모드 (현재 회사 없음)", () => {
  const seeker: UserProfile = { jobFamily: "dev" };

  it("current 는 null, baseline 은 업계 평균이다", () => {
    const r = recommend(compGrowth, seeker, COMPANIES);
    expect(r.current).toBeNull();
    expect(r.baseline.label).toBe("업계 평균");
    expect(r.primaryAxisRank).toBeNull();
  });

  it("개선폭 필터 없이 Fit 상위 3곳을 추천한다", () => {
    const r = recommend(compGrowth, seeker, COMPANIES);
    expect(r.top.length).toBe(Math.min(3, r.poolSize));
    expect(r.top.map((t) => t.company.id)).toEqual(r.ranked.slice(0, 3).map((t) => t.company.id));
  });

  it("fitDelta 는 업계 평균 대비 차이다", () => {
    const r = recommend(compGrowth, seeker, COMPANIES);
    for (const t of r.top) expect(t.fitDelta).toBe(t.fit.fit - r.baseline.fit.fit);
  });

  it("현재 회사를 빼지 않으므로 풀이 재직자보다 크거나 같다", () => {
    const seekerPool = recommend(compGrowth, seeker, COMPANIES).poolSize;
    const employedPool = recommend(compGrowth, profile, COMPANIES).poolSize;
    expect(seekerPool).toBeGreaterThan(employedPool);
  });

  it("성향이 다르면 추천도 달라진다", () => {
    const stability = scoreAssessment(["B", "B", "A", "B", "A", "A", "A", "B", "B", "A"] as Answer[]);
    const a = recommend(compGrowth, seeker, COMPANIES);
    const b = recommend(stability, seeker, COMPANIES);
    expect(a.top.map((t) => t.company.id)).not.toEqual(b.top.map((t) => t.company.id));
  });

  it("이유 문장은 업계 평균을 기준으로 쓴다", () => {
    const r = recommend(compGrowth, seeker, COMPANIES);
    expect(r.top[0].reasons[0]).toContain("업계 평균");
  });
});
