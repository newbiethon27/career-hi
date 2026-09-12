"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { CompaniesOrigin } from "@/lib/companies.server";
import type { ScoredCompany } from "@/lib/types";

interface CompaniesState {
  companies: ScoredCompany[];
  origin: CompaniesOrigin;
  fallbackReason: string | null;
}

const CompaniesContext = createContext<CompaniesState | null>(null);

/**
 * 회사 데이터는 서버(RootLayout)에서 한 번 읽어 여기로 내려준다.
 * 클라이언트는 동기적으로 쓰기만 하므로 로딩 상태·스켈레톤이 필요 없고,
 * 계산 로직(src/lib/*)은 companies 를 인자로 받는 순수 함수 그대로 유지된다.
 */
export function CompaniesProvider({ value, children }: { value: CompaniesState; children: ReactNode }) {
  return <CompaniesContext.Provider value={value}>{children}</CompaniesContext.Provider>;
}

export function useCompanies(): CompaniesState {
  const ctx = useContext(CompaniesContext);
  if (!ctx) throw new Error("useCompanies must be used within CompaniesProvider");
  return ctx;
}

/** 목록에서 id 로 찾기 — 예전 getCompany(id) 를 대체한다 */
export function useCompany(id: string | null | undefined): ScoredCompany | undefined {
  const { companies } = useCompanies();
  return id ? companies.find((c) => c.id === id) : undefined;
}
