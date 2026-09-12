"use client";

import { useMemo } from "react";
import { COMPANIES } from "@/lib/companies";
import { buildDiagnosis } from "@/lib/explain";
import { computeMoveTiming } from "@/lib/moveTiming";
import { recommend, type RecommendResult } from "@/lib/recommend";
import type { AssessmentResult, MoveTimingResult, UserProfile } from "@/lib/types";
import { useCareer } from "./CareerContext";

export interface Analysis {
  assessment: AssessmentResult;
  profile: UserProfile;
  rec: RecommendResult;
  moveTiming: MoveTimingResult;
  diagnosis: string;
}

/** 파생값은 저장하지 않고 매번 계산한다 (1ms 미만, stale 버그 방지). */
export function useAnalysis(): Analysis | null {
  const { assessment, profile } = useCareer();
  return useMemo(() => {
    if (!assessment || !profile) return null;
    const rec = recommend(assessment, profile, COMPANIES);
    const moveTiming = computeMoveTiming({
      currentFit: rec.current.fit.fit,
      bestFit: rec.top[0]?.fit.fit ?? null,
      tenureMonths: profile.tenureMonths,
      currentSalary: profile.currentSalary,
      companyAvgSalary: rec.current.company.metrics.avgSalaryManwon?.value ?? null,
    });
    const diagnosis = buildDiagnosis(assessment, rec.current.company, rec.primaryAxisRank, rec.poolSize + 1);
    return { assessment, profile, rec, moveTiming, diagnosis };
  }, [assessment, profile]);
}
