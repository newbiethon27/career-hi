import { describe, expect, it } from "vitest";
import { COMPANIES } from "@/lib/companies";
import { computeMoveTiming } from "@/lib/moveTiming";
import { buildPresetAssessment, PRESETS, SHARED_PROFILE } from "@/lib/presets";
import { recommend } from "@/lib/recommend";

/**
 * 서비스의 핵심 주장을 코드로 고정한다.
 * 이 테스트가 깨지면 데모 시나리오(PLAN.md §18)가 깨진 것이다. 데이터·상수를 튜닝할 때마다 돌린다.
 */
describe("데모 페르소나", () => {
  const A = buildPresetAssessment("devA");
  const B = buildPresetAssessment("devB");
  const rA = recommend(A, SHARED_PROFILE, COMPANIES);
  const rB = recommend(B, SHARED_PROFILE, COMPANIES);
  // 데모 페르소나는 재직자 시나리오다 — 현재 회사 Fit(부가 기능)이 반드시 계산된다
  if (!rA.current || !rB.current) throw new Error("데모 페르소나는 현재 회사 정보를 가져야 한다");
  const curA = rA.current;
  const curB = rB.current;

  it("페르소나 A = 보상 추구형(부 성장), B = 안정 추구형(부 균형)", () => {
    expect(A.primaryType).toBe("compensation_seeker");
    expect(A.secondaryType).toBe("growth_seeker");
    expect(A.percent).toEqual({ compensation: 40, growth: 30, balance: 20, stability: 10 });
    expect(B.primaryType).toBe("stability_seeker");
    expect(B.secondaryType).toBe("balance_seeker");
    expect(B.percent).toEqual({ stability: 40, balance: 30, compensation: 20, growth: 10 });
  });

  it("같은 회사·직군·연봉이어도 성향이 다르면 추천이 달라진다", () => {
    expect(PRESETS.devA.profile).toEqual(PRESETS.devB.profile);
    expect(rA.top.map((t) => t.company.id)).not.toEqual(rB.top.map((t) => t.company.id));
    expect(curA.fit.fit).not.toBe(curB.fit.fit);
  });

  it("A 는 현재 회사 Fit 이 B 보다 낮고, 추천이 존재한다", () => {
    expect(curA.fit.fit).toBeLessThan(curB.fit.fit);
    expect(rA.top.length).toBeGreaterThan(0);
  });

  it("B 는 추천이 A 보다 적다 (현재 회사가 잘 맞는다)", () => {
    expect(rB.top.length).toBeLessThan(rA.top.length);
  });

  it("A 는 이직 검토 밴드, B 는 검토 밴드가 아니며 지수가 A 보다 낮다", () => {
    const mtA = computeMoveTiming({
      currentFit: curA.fit.fit,
      bestFit: rA.top[0]?.fit.fit ?? null,
      tenureMonths: SHARED_PROFILE.tenureMonths,
      currentSalary: SHARED_PROFILE.currentSalary,
      companyAvgSalary: curA.company.metrics.avgSalaryManwon?.value ?? null,
    });
    const mtB = computeMoveTiming({
      currentFit: curB.fit.fit,
      bestFit: rB.top[0]?.fit.fit ?? null,
      tenureMonths: SHARED_PROFILE.tenureMonths,
      currentSalary: SHARED_PROFILE.currentSalary,
      companyAvgSalary: curB.company.metrics.avgSalaryManwon?.value ?? null,
    });
    // 데모 리허설용 출력 — 실제 값 확인
    console.log("[persona A]", curA.fit.fit, rA.top.map((t) => `${t.company.name}:${t.fit.fit}`), "MT", mtA.score, mtA.band);
    console.log("[persona B]", curB.fit.fit, rB.top.map((t) => `${t.company.name}:${t.fit.fit}`), "MT", mtB.score, mtB.band);
    console.log("[scores]", COMPANIES.map((c) => `${c.name} C${c.scores.compensation} B${c.scores.balance} S${c.scores.stability} G${c.scores.growth}`).join(" | "));
    expect(mtA.band).toBe("consider");
    expect(mtB.band).not.toBe("consider");
    expect(mtB.score).toBeLessThan(mtA.score);
  });
});
