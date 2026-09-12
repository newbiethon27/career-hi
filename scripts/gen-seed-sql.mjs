/**
 * data/companies.{manual,raw}.json → supabase/migrations/0002_companies_seed.sql
 *
 *   npm run gen:seed
 *
 * `npm run fetch:dart` 로 DART 스냅샷을 갱신한 뒤 이걸 돌리고, 출력된 SQL 을
 * Supabase SQL Editor 에 붙여넣으면 회사 지표가 갱신된다. (upsert 라 여러 번 돌려도 안전)
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT = path.join(ROOT, "supabase/migrations/0002_companies_seed.sql");

const manual = JSON.parse(fs.readFileSync(path.join(ROOT, "data/companies.manual.json"), "utf8")).companies;
const raw = JSON.parse(fs.readFileSync(path.join(ROOT, "data/companies.raw.json"), "utf8")).companies;

const q = (v) => (v === null || v === undefined ? "null" : `'${String(v).replace(/'/g, "''")}'`);
const n = (v) => (v === null || v === undefined ? "null" : String(v));
const arr = (a) => `'{${a.join(",")}}'`;

const rows = manual.map((c, i) => {
  const r = raw[c.id] ?? {};
  return (
    "  (" +
    [
      q(c.id),
      q(c.name),
      q(c.industry),
      q(r.corpCode ?? c.corpCode),
      arr(c.jobFamilies),
      n(c.worklifeIndex),
      q(c.note),
      q(r.asOf),
      n(r.avgSalaryManwon),
      n(r.avgTenureYears),
      n(r.employeeCount),
      n(r.employeeCountPrev),
      n(r.revenue),
      n(r.revenuePrev),
      n(r.operatingProfit),
      n(r.operatingProfitPrev),
      String(i),
    ].join(", ") +
    ")"
  );
});

const COLS = [
  "id",
  "name",
  "industry",
  "corp_code",
  "job_families",
  "worklife_index",
  "worklife_note",
  "dart_as_of",
  "avg_salary_manwon",
  "avg_tenure_years",
  "employee_count",
  "employee_count_prev",
  "revenue",
  "revenue_prev",
  "operating_profit",
  "operating_profit_prev",
  "sort_order",
];
const UPDATABLE = COLS.filter((c) => c !== "id");

const sql = `-- 커리어Hi — companies 시드 / 갱신
-- 자동 생성 파일: scripts/gen-seed-sql.mjs (npm run gen:seed). 손으로 고치지 마세요.
-- 원본: data/companies.manual.json + data/companies.raw.json
-- 생성 시각: ${new Date().toISOString()}
--
-- upsert 라 여러 번 실행해도 안전합니다. 0001_companies_schema.sql 을 먼저 실행하세요.

insert into public.companies (
${COLS.map((c) => `  ${c}`).join(",\n")}
) values
${rows.join(",\n")}
on conflict (id) do update set
${UPDATABLE.map((c) => `  ${c} = excluded.${c}`).join(",\n")};
`;

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, sql);
console.log(`${rows.length}개사 → ${path.relative(ROOT, OUT)}`);
