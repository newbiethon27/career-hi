import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** 환경변수가 없으면 null. 호출부는 이 경우 저장소의 JSON 으로 폴백한다. */
export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey, { auth: { persistSession: false } }) : null;

export const isSupabaseConfigured = supabase !== null;

/** companies 테이블 한 행. 컬럼명은 supabase/migrations/0001_companies_schema.sql 과 1:1. */
export interface CompanyRow {
  id: string;
  name: string;
  industry: string;
  corp_code: string | null;
  job_families: string[];
  worklife_index: number | null;
  worklife_note: string | null;
  dart_as_of: string | null;
  avg_salary_manwon: number | null;
  avg_tenure_years: number | string | null; // numeric 은 문자열로 올 수 있다
  employee_count: number | null;
  employee_count_prev: number | null;
  revenue: number | string | null; // bigint 도 마찬가지
  revenue_prev: number | string | null;
  operating_profit: number | string | null;
  operating_profit_prev: number | string | null;
  sort_order: number;
}
