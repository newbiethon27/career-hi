"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useCareer } from "./CareerContext";

/**
 * 라우트 가드. hydrated 전에는 판단하지 않는다 (스켈레톤 표시).
 * - "assessment": 검사 결과 필요 → 없으면 /assessment
 * - "profile":    검사 + 프로필 필요 → 없으면 /assessment 또는 /profile
 */
export function useGuard(need: "assessment" | "profile"): { ready: boolean } {
  const { assessment, profile, hydrated } = useCareer();
  const router = useRouter();

  const ok = hydrated && !!assessment && (need === "assessment" || !!profile);

  useEffect(() => {
    if (!hydrated) return;
    if (!assessment) router.replace("/assessment");
    else if (need === "profile" && !profile) router.replace("/profile");
  }, [hydrated, assessment, profile, need, router]);

  return { ready: ok };
}
