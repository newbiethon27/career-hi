"use client";

import { useCompanies } from "@/store/CompaniesContext";

/**
 * 회사 지표를 어디서 읽었는지 알린다.
 * 폴백으로 돌아간 것을 조용히 숨기면, 대시보드에서 값을 고쳤는데 화면이 안 바뀌는 이유를
 * 아무도 모르게 된다. 데모 중에도 눈에 띄되 거슬리지 않는 수준으로만 표시한다.
 */
export function DataSourceNote() {
  const { origin, companies, fallbackReason } = useCompanies();

  if (origin === "supabase") {
    return (
      <p className="mt-1">
        회사 지표 {companies.length}개사를 Supabase 에서 읽었습니다. 대시보드에서 값을 고치면 배포 없이 반영됩니다.
      </p>
    );
  }

  return (
    <p className="mt-1 text-amber-700 dark:text-amber-500">
      ⚠ Supabase 에 연결하지 못해 저장소에 포함된 JSON({companies.length}개사)으로 표시하고 있습니다.
      {fallbackReason ? ` (${fallbackReason})` : null}
    </p>
  );
}
