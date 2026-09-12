import { describe, expect, it } from "vitest";
import { buildScoredCompanies, normalize, scoreGrowth } from "@/lib/companyScore";
import { COMPANIES } from "@/lib/companies";
import { AXES, type Company, type CompanyRawMetrics } from "@/lib/types";
import { SCORE_OUT_MAX, SCORE_OUT_MIN } from "@/lib/constants";

const emptyMetrics: CompanyRawMetrics = {
  avgSalaryManwon: null,
  avgTenureYears: null,
  employeeCount: null,
  employeeCountPrev: null,
  revenue: null,
  revenuePrev: null,
  operatingProfit: null,
  operatingProfitPrev: null,
  worklifeIndex: null,
};

function company(id: string, metrics: Partial<CompanyRawMetrics>): Company {
  return { id, name: id, industry: "x", jobFamilies: ["dev"], metrics: { ...emptyMetrics, ...metrics } };
}

describe("normalize", () => {
  it("클램프 + 30~98 매핑", () => {
    expect(normalize(-100, 0, 10)).toBe(SCORE_OUT_MIN);
    expect(normalize(100, 0, 10)).toBe(SCORE_OUT_MAX);
    expect(normalize(5, 0, 10)).toBe(64);
  });
});

describe("COMPANIES (실제 데이터 파일)", () => {
  it("12개사, 모든 축이 0~100 정수", () => {
    expect(COMPANIES.length).toBeGreaterThanOrEqual(10);
    for (const c of COMPANIES) {
      for (const a of AXES) {
        expect(Number.isInteger(c.scores[a])).toBe(true);
        expect(c.scores[a]).toBeGreaterThanOrEqual(0);
        expect(c.scores[a]).toBeLessThanOrEqual(100);
      }
    }
  });

  it("balance 는 항상 manual (절대 dart 로 표기하지 않는다)", () => {
    for (const c of COMPANIES) expect(c.scoreSources.balance).not.toBe("dart");
  });

  it("id 는 유일하다", () => {
    expect(new Set(COMPANIES.map((c) => c.id)).size).toBe(COMPANIES.length);
  });
});

describe("결측 처리", () => {
  it("전부 null 이어도 예외 없이 동작, 결측 축은 derived", () => {
    const out = buildScoredCompanies([company("a", {}), company("b", {})]);
    for (const c of out) {
      expect(c.missingAxes.length).toBe(4);
      for (const a of AXES) expect(c.scoreSources[a]).toBe("derived");
    }
  });

  it("축 1개 결측 → 유니버스 중앙값으로 보간", () => {
    const withBal = (id: string, wl: number) =>
      company(id, { worklifeIndex: { value: wl, source: "manual" } });
    const out = buildScoredCompanies([withBal("a", 40), withBal("b", 80), company("c", {})]);
    const c = out.find((x) => x.id === "c")!;
    expect(c.scores.balance).toBe(60);
    expect(c.scoreSources.balance).toBe("derived");
    expect(c.missingAxes).toContain("balance");
  });
});

describe("scoreGrowth 영업이익 예외", () => {
  const base = (op: number, opPrev: number): CompanyRawMetrics => ({
    ...emptyMetrics,
    operatingProfit: { value: op, source: "dart" },
    operatingProfitPrev: { value: opPrev, source: "dart" },
  });
  it("흑자전환 → 85", () => expect(scoreGrowth(base(100, -50)).score).toBe(85));
  it("적자전환 → 30", () => expect(scoreGrowth(base(-100, 50)).score).toBe(30));
  it("지속 적자 → 40", () => expect(scoreGrowth(base(-100, -50)).score).toBe(40));
  it("전기 데이터 없으면 null", () => {
    expect(scoreGrowth({ ...emptyMetrics, operatingProfit: { value: 10, source: "dart" } }).score).toBeNull();
  });
});
