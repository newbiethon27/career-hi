import { describe, expect, it } from "vitest";
import { josa } from "@/lib/utils";

describe("josa — 받침에 맞는 조사", () => {
  it("받침 있는 한글 → 앞 형태", () => {
    expect(josa("1인 평균 급여액", "은", "는")).toBe("1인 평균 급여액은");
    expect(josa("영업이익", "은", "는")).toBe("영업이익은");
    expect(josa("96점", "은", "는")).toBe("96점은");
  });

  it("받침 없는 한글 → 뒤 형태", () => {
    expect(josa("워라밸 지표", "은", "는")).toBe("워라밸 지표는");
    expect(josa("평균 근속연수", "은", "는")).toBe("평균 근속연수는");
    expect(josa("점수", "은", "는")).toBe("점수는");
  });

  it("숫자는 읽는 소리 기준", () => {
    expect(josa("3", "은", "는")).toBe("3은");
    expect(josa("5", "은", "는")).toBe("5는");
  });
});
