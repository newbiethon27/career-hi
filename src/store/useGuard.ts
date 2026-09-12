"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { isEmployed } from "@/lib/types";
import { useCareer } from "./CareerContext";

/**
 * 라우트 가드. hydrated 전에는 판단하지 않는다 (스켈레톤 표시).
 * - "assessment": 검사 결과 필요 → 없으면 /assessment
 * - "profile":    검사 + 프로필(직군) 필요 → 없으면 /assessment 또는 /profile
 * - "current":    위 + 현재 회사 정보 필요 (부가 기능) → 없으면 /profile
 */
export function useGuard(need: "assessment" | "profile" | "current"): { ready: boolean } {
  const { assessment, profile, hydrated } = useCareer();
  const router = useRouter();

  const hasProfile = !!profile;
  const hasCurrent = !!profile && isEmployed(profile);
  const ok =
    hydrated &&
    !!assessment &&
    (need === "assessment" || hasProfile) &&
    (need !== "current" || hasCurrent);

  useEffect(() => {
    if (!hydrated) return;
    if (!assessment) router.replace("/assessment");
    else if (need !== "assessment" && !hasProfile) router.replace("/profile");
    else if (need === "current" && !hasCurrent) router.replace("/profile");
  }, [hydrated, assessment, hasProfile, hasCurrent, need, router]);

  return { ready: ok };
}
