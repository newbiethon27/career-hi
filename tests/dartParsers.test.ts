import { describe, expect, it } from "vitest";
import { aggregateEmployees, parseAmount, parseTenureYears } from "../scripts/dart-parsers";

describe("parseAmount", () => {
  it("쉼표 문자열", () => expect(parseAmount("112,000,000")).toBe(112000000));
  it("'-' 와 빈 문자열은 null", () => {
    expect(parseAmount("-")).toBeNull();
    expect(parseAmount("")).toBeNull();
    expect(parseAmount(undefined)).toBeNull();
  });
  it("숫자 그대로", () => expect(parseAmount(1234)).toBe(1234));
});

describe("parseTenureYears", () => {
  it("'12.4'", () => expect(parseTenureYears("12.4")).toBe(12.4));
  it("'12년 4개월'", () => expect(parseTenureYears("12년 4개월")).toBe(12.3));
  it("'12.4년'", () => expect(parseTenureYears("12.4년")).toBe(12.4));
  it("'3년 11월'", () => expect(parseTenureYears("3년 11월")).toBe(3.9));
  it("'-' 는 null", () => expect(parseTenureYears("-")).toBeNull());
});

describe("aggregateEmployees", () => {
  it("행 합산 + 직원 수 가중평균 + 원→만원", () => {
    const r = aggregateEmployees([
      { sm: "1,000", jan_salary_am: "100,000,000", avrg_cnwk_sdytrn: "10년" },
      { sm: "3,000", jan_salary_am: "120,000,000", avrg_cnwk_sdytrn: "12년 6개월" },
      { sm: "-", jan_salary_am: "-", avrg_cnwk_sdytrn: "-" },
    ]);
    expect(r.employeeCount).toBe(4000);
    expect(r.avgSalaryManwon).toBe(11500); // (100*1000 + 120*3000)/4000 = 115,000,000 원
    expect(r.avgTenureYears).toBe(11.9); // (10*1000 + 12.5*3000)/4000 = 11.875
  });
  it("성별합계 행이 있으면 사업부문 행은 무시한다 (2배 합산 방지)", () => {
    const r = aggregateEmployees([
      { fo_bbm: "DX", sexdstn: "남", sm: "38,119", jan_salary_am: "-", avrg_cnwk_sdytrn: "      17.4" },
      { fo_bbm: "DS", sexdstn: "남", sm: "56,154", jan_salary_am: "-", avrg_cnwk_sdytrn: "      11.7" },
      { fo_bbm: "성별합계", sexdstn: "남", sm: "94,273", jan_salary_am: "167,000,000", avrg_cnwk_sdytrn: "      14.0" },
      { fo_bbm: "성별합계", sexdstn: "여", sm: "34,608", jan_salary_am: "130,000,000", avrg_cnwk_sdytrn: "      13.0" },
    ]);
    expect(r.employeeCount).toBe(128881);
    expect(r.avgSalaryManwon).toBe(15706);
    expect(r.avgTenureYears).toBe(13.7);
  });
  it("전부 결측이면 null", () => {
    const r = aggregateEmployees([{ sm: "-" }]);
    expect(r.employeeCount).toBeNull();
    expect(r.avgSalaryManwon).toBeNull();
  });
});
