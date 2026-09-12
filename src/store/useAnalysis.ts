"use client";

import { useMemo } from "react";
import { buildDiagnosis } from "@/lib/explain";
import { computeMoveTiming } from "@/lib/moveTiming";
import { recommend, type CurrentFit, type RecommendResult } from "@/lib/recommend";
import { isEmployed, type AssessmentResult, type EmployedProfile, type MoveTimingResult, type UserProfile } from "@/lib/types";
import { useCareer } from "./CareerContext";
import { useCompanies } from "./CompaniesContext";

/** 재직자 부가 기능(현재 회사 Fit 분석)에서만 계산되는 값 묶음 */
export interface CurrentAnalysis extends CurrentFit {
  profile: EmployedProfile;
  moveTiming: MoveTimingResult;
  diagnosis: string;
}

export interface Analysis {
  assessment: AssessmentResult;
  profile: UserProfile;
  rec: RecommendResult;
  /** 현재 회사 정보를 입력한 경우에만 존재한다 */
  current: CurrentAnalysis | null;
}

/** 파생값은 저장하지 않고 매번 계산한다 (1ms 미만, stale 버그 방지). */
export function useAnalysis(): Analysis | null {
  const { assessment, profile } = useCareer();
  const { companies } = useCompanies();
  return useMemo(() => {
    if (!assessment || !profile) return null;
    const rec = recommend(assessment, profile, companies);

    if (!rec.current || !isEmployed(profile)) {
      return { assessment, profile, rec, current: null };
    }
    const moveTiming = computeMoveTiming({
      currentFit: rec.current.fit.fit,
      bestFit: rec.top[0]?.fit.fit ?? null,
      tenureMonths: profile.tenureMonths,
      currentSalary: profile.currentSalary,
      companyAvgSalary: rec.current.company.metrics.avgSalaryManwon?.value ?? null,
    });
    const diagnosis = buildDiagnosis(assessment, rec.current.company, rec.primaryAxisRank ?? 1, rec.poolSize + 1);
    return { assessment, profile, rec, current: { ...rec.current, profile, moveTiming, diagnosis } };
  }, [assessment, profile, companies]);
}
