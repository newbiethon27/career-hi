/**
 * OpenDART 스냅샷 수집 스크립트 (수동 실행, 앱 런타임과 분리).
 *
 *   npm run fetch:dart               # 전체 회사
 *   npm run fetch:dart -- --only samsung-electronics --dump   # 1개사 + 응답 원문 덤프 (파서 작성 전 필드명 확인용)
 *
 * 입력: .env.local 의 DART_API_KEY, data/companies.manual.json (id/name/corpCode)
 * 출력: data/companies.raw.json  — 값이 채워진 지표만 'dart' 출처가 되고 나머지는 데모 자리표시자가 유지된다.
 *
 * 사용 엔드포인트
 *   /api/corpCode.xml        고유번호 전체 목록 (zip). corpCode 가 비어 있는 회사를 이름으로 찾을 때만 사용.
 *   /api/empSttus.json       직원 현황: 1인 평균 급여액, 평균 근속연수, 직원 수 (정규/계약·성별로 행이 여러 개 → 합산)
 *   /api/fnlttSinglAcnt.json 단일회사 주요계정: 매출액·영업이익 당기/전기 (연결 우선, 없으면 개별)
 *
 * 필드명은 문서 기준이며 실제 응답과 다를 수 있다. --dump 로 먼저 확인한다.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { aggregateEmployees, parseAmount, type EmpRow } from "./dart-parsers.ts";

const API = "https://opendart.fss.or.kr/api";
const KEY = process.env.DART_API_KEY;
const ROOT = resolve(import.meta.dirname ?? ".", "..");
const MANUAL_PATH = resolve(ROOT, "data/companies.manual.json");
const RAW_PATH = resolve(ROOT, "data/companies.raw.json");

const args = process.argv.slice(2);
const only = args.includes("--only") ? args[args.indexOf("--only") + 1] : null;
const dump = args.includes("--dump");
const REPRT_CODE = "11011"; // 사업보고서
const CANDIDATE_YEARS = [2025, 2024, 2023]; // 최신부터 시도, status !== '000' 이면 한 해씩 낮춘다

if (!KEY) {
  console.error("DART_API_KEY 가 없습니다. .env.local 에 설정하세요 (.env.local.example 참고).");
  process.exit(1);
}

type ManualCompany = { id: string; name: string; corpCode: string | null };
type RawEntry = {
  corpCode?: string | null;
  asOf?: string | null;
  avgSalaryManwon?: number | null;
  avgTenureYears?: number | null;
  employeeCount?: number | null;
  employeeCountPrev?: number | null;
  revenue?: number | null;
  revenuePrev?: number | null;
  operatingProfit?: number | null;
  operatingProfitPrev?: number | null;
};

// ---------- HTTP ----------

async function getJson<T>(path: string, params: Record<string, string>): Promise<T> {
  const url = new URL(`${API}/${path}`);
  url.searchParams.set("crtfc_key", KEY!);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${path} HTTP ${res.status}`);
  return (await res.json()) as T;
}

type DartList<T> = { status: string; message: string; list?: T[] };

async function firstAvailableYear<T>(fetcher: (year: number) => Promise<DartList<T>>): Promise<{ year: number; list: T[] } | null> {
  for (const year of CANDIDATE_YEARS) {
    const r = await fetcher(year);
    if (r.status === "000" && r.list && r.list.length > 0) return { year, list: r.list };
  }
  return null;
}

// ---------- 직원 현황 ----------

async function fetchEmployees(corpCode: string): Promise<{ year: number; rows: EmpRow[] } | null> {
  const r = await firstAvailableYear<EmpRow>((year) =>
    getJson<DartList<EmpRow>>("empSttus.json", { corp_code: corpCode, bsns_year: String(year), reprt_code: REPRT_CODE }),
  );
  return r ? { year: r.year, rows: r.list } : null;
}

// ---------- 재무 ----------

type AcntRow = { fs_div?: string; account_nm?: string; thstrm_amount?: string; frmtrm_amount?: string };

async function fetchFinancials(corpCode: string, year: number) {
  const r = await getJson<DartList<AcntRow>>("fnlttSinglAcnt.json", { corp_code: corpCode, bsns_year: String(year), reprt_code: REPRT_CODE });
  if (r.status !== "000" || !r.list) return null;
  const pick = (names: string[]) => {
    const cfs = r.list!.filter((x) => x.fs_div === "CFS");
    const pool = cfs.length ? cfs : r.list!;
    return pool.find((x) => names.includes((x.account_nm ?? "").replace(/\s/g, "")));
  };
  const rev = pick(["매출액", "수익(매출액)", "영업수익"]);
  const op = pick(["영업이익", "영업이익(손실)"]);
  const toMillion = (s: unknown) => {
    const v = parseAmount(s);
    return v == null ? null : Math.round(v / 1_000_000); // 원 → 백만원
  };
  return {
    revenue: toMillion(rev?.thstrm_amount),
    revenuePrev: toMillion(rev?.frmtrm_amount),
    operatingProfit: toMillion(op?.thstrm_amount),
    operatingProfitPrev: toMillion(op?.frmtrm_amount),
  };
}

// ---------- 고유번호 조회 (corpCode 가 없는 회사만) ----------

async function resolveCorpCode(name: string): Promise<string | null> {
  // corpCode.xml 은 zip. Node 내장 zlib 은 zip 컨테이너를 풀지 못하므로 여기서는 미구현 —
  // corpCode 가 비어 있는 회사는 DART 사이트에서 검색해 companies.manual.json 에 직접 기입한다.
  console.warn(`  corpCode 없음: "${name}" — companies.manual.json 에 고유번호를 기입하세요. 건너뜁니다.`);
  return null;
}

// ---------- main ----------

async function main() {
  const manual = JSON.parse(readFileSync(MANUAL_PATH, "utf8")) as { companies: ManualCompany[] };
  const prev: { generatedAt: string | null; companies: Record<string, RawEntry> } = existsSync(RAW_PATH)
    ? JSON.parse(readFileSync(RAW_PATH, "utf8"))
    : { generatedAt: null, companies: {} };
  const out: Record<string, RawEntry> = { ...prev.companies };

  const targets = manual.companies.filter((c) => !only || c.id === only);
  let ok = 0;
  for (const c of targets) {
    console.log(`▶ ${c.name} (${c.id})`);
    const corpCode = c.corpCode ?? (await resolveCorpCode(c.name));
    if (!corpCode) continue;
    try {
      const emp = await fetchEmployees(corpCode);
      if (!emp) {
        console.warn("  직원 현황 없음 (status !== 000). 비상장·미제출일 수 있습니다.");
        continue;
      }
      if (dump) console.log(JSON.stringify(emp.rows, null, 2));
      const agg = aggregateEmployees(emp.rows);
      const prevEmp = await fetchEmployeesForYear(corpCode, emp.year - 1);
      const fin = await fetchFinancials(corpCode, emp.year);
      if (dump && fin) console.log(JSON.stringify(fin, null, 2));

      out[c.id] = {
        corpCode,
        asOf: String(emp.year),
        ...agg,
        employeeCountPrev: prevEmp,
        ...(fin ?? {}),
      };
      ok += 1;
      console.log(`  ✓ ${emp.year} 급여 ${agg.avgSalaryManwon ?? "-"}만원 / 근속 ${agg.avgTenureYears ?? "-"}년 / 직원 ${agg.employeeCount ?? "-"}명`);
    } catch (e) {
      console.error(`  ✗ ${(e as Error).message}`);
    }
  }

  writeFileSync(RAW_PATH, JSON.stringify({ generatedAt: new Date().toISOString(), companies: out }, null, 2) + "\n");
  console.log(`\n완료: ${ok}/${targets.length}개사 → ${RAW_PATH}`);
}

async function fetchEmployeesForYear(corpCode: string, year: number): Promise<number | null> {
  const r = await getJson<DartList<EmpRow>>("empSttus.json", { corp_code: corpCode, bsns_year: String(year), reprt_code: REPRT_CODE });
  if (r.status !== "000" || !r.list) return null;
  return aggregateEmployees(r.list).employeeCount;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
