import { describe, expect, it } from "vitest";
import { scoreAssessment } from "@/lib/assessment";
import { QUESTIONS } from "@/lib/questions";
import { AXES, type Answer, type Axis } from "@/lib/types";
import { SMOOTHING_ALPHA, TOTAL_POINTS } from "@/lib/constants";
import { sumAxes } from "@/lib/utils";

const allA: Answer[] = Array(10).fill("A");

function randomAnswers(seed: number): Answer[] {
  // 단순 LCG — 재현 가능한 의사난수
  let s = seed;
  return Array.from({ length: 10 }, () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s % 2 ? "A" : "B";
  });
}

describe("문항 정의 자체 (측정 도구 검증)", () => {
  it("각 축이 정확히 5회 등장한다", () => {
    const count: Record<Axis, number> = { compensation: 0, balance: 0, stability: 0, growth: 0 };
    for (const q of QUESTIONS) {
      count[q.optionA.axis] += 1;
      count[q.optionB.axis] += 1;
      expect(q.optionA.axis).not.toBe(q.optionB.axis);
    }
    for (const a of AXES) expect(count[a]).toBe(5);
  });

  it("10문항, id 1..10", () => {
    expect(QUESTIONS.map((q) => q.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });
});

describe("scoreAssessment", () => {
  it("raw 합 = 20", () => {
    expect(sumAxes(scoreAssessment(allA).raw)).toBe(TOTAL_POINTS);
  });

  it("percent 합 = 100, weights 합 = 1 (임의 답변 100세트)", () => {
    for (let i = 0; i < 100; i++) {
      const r = scoreAssessment(randomAnswers(i));
      expect(sumAxes(r.percent)).toBe(100);
      expect(sumAxes(r.weights)).toBeCloseTo(1, 9);
      for (const a of AXES) expect(r.weights[a]).toBeGreaterThan(0);
    }
  });

  it("보상 축만 선택되는 답변 → 보상 추구형, weight ≈ 11/24", () => {
    // 보상이 등장하는 문항 1,2,3,7,8 에서 보상 선택. 나머지는 A.
    const answers: Answer[] = ["A", "A", "A", "A", "A", "A", "A", "A", "A", "A"];
    const r = scoreAssessment(answers);
    expect(r.raw.compensation).toBe(10);
    expect(r.primaryType).toBe("compensation_seeker");
    expect(r.weights.compensation).toBeCloseTo((10 + SMOOTHING_ALPHA) / (20 + 4 * SMOOTHING_ALPHA), 9);
  });

  it("한 축도 선택 안 된 케이스도 weight > 0 (smoothing)", () => {
    const r = scoreAssessment(allA); // 성장 축은 문항 3,5,6,8,10 에서 전부 B → 여기선 0
    expect(r.raw.growth).toBe(0);
    expect(r.weights.growth).toBeGreaterThan(0);
  });

  it("동점 시 TIE_ORDER 순서로 결정, 2회 실행 결과 동일", () => {
    // 각 축 정확히 5점: 보상(1,2), 균형(4,5)... 다음 조합은 모든 축 raw=5가 아니라 짝수만 가능.
    // 대신 보상=성장=6, 균형=안정=4 인 케이스: 1A 2A 3A(C=6) 5B 6B 8B(G=6) 4A 7B(B=4) 9A 10A(S=4)
    const answers: Answer[] = ["A", "A", "A", "A", "B", "B", "B", "B", "A", "A"];
    const r1 = scoreAssessment(answers);
    const r2 = scoreAssessment(answers);
    expect(r1.raw).toEqual({ compensation: 6, growth: 6, balance: 4, stability: 4 });
    expect(r1.primaryAxis).toBe("compensation"); // TIE_ORDER: compensation > growth
    expect(r1.secondaryAxis).toBe("growth");
    expect(r1.isMixed).toBe(true);
    expect(r1.percent).toEqual(r2.percent);
  });

  it("답변 개수가 10이 아니면 throw", () => {
    expect(() => scoreAssessment(["A", "B"])).toThrow();
  });
});
