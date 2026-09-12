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
const arr = (a) => `'{${a.join(",")}}'::text[]`;

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
  "slug",
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
const UPDATABLE = COLS;

const sql = `-- 커리어Hi — companies 시드 / 갱신
-- 자동 생성 파일: scripts/gen-seed-sql.mjs (npm run gen:seed). 손으로 고치지 마세요.
-- 원본: data/companies.manual.json + data/companies.raw.json
-- 생성 시각: ${new Date().toISOString()}
--
-- 0001_companies_schema.sql을 먼저 실행하세요. 기존 UUID/외래키는 유지합니다.
-- slug/이름/법인번호로 기존 행을 찾습니다. 서로 다른 행이 매칭되면 전체를 롤백합니다.

do $$
declare
  r record;
  matched_id public.companies.id%type;
  matches integer;
begin
  lock table public.companies in share row exclusive mode;
  -- 데이터를 같은 DO 블록에 포함한다. 임시 테이블과 세션 유지에 의존하지 않는다.
  for r in
    select * from (values
${rows.join(",\n")}
    ) as seed (${COLS.join(", ")})
  loop
    select count(*) into matches from public.companies c
    where c.slug = r.slug or c.name = r.name
       or (r.corp_code is not null and (c.dart_corp_code = r.corp_code or c.corp_code = r.corp_code));

    if matches > 1 then
      raise exception 'Multiple existing companies match %. No rows were committed. Check name/corp_code/slug.', r.slug;
    end if;

    if matches = 1 then
      select c.id into matched_id from public.companies c
      where c.slug = r.slug or c.name = r.name
         or (r.corp_code is not null and (c.dart_corp_code = r.corp_code or c.corp_code = r.corp_code));

      if exists (select 1 from public.companies c where c.id = matched_id
        and ((c.slug is not null and c.slug <> r.slug)
          or (c.dart_corp_code is not null and c.dart_corp_code <> r.corp_code)
          or (c.corp_code is not null and c.corp_code <> r.corp_code))) then
        raise exception 'Existing company identity conflicts with %. No rows were committed.', r.slug;
      end if;

      update public.companies set
${UPDATABLE.map((c) => `        ${c} = r.${c}`).join(",\n")},
        dart_corp_code = coalesce(r.corp_code, dart_corp_code)
      where id = matched_id;
    else
      insert into public.companies (${COLS.join(", ")}, dart_corp_code)
      values (${COLS.map((c) => `r.${c}`).join(", ")}, r.corp_code);
    end if;
  end loop;
end $$;
`;

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, sql);
// SQL Editor용 합본. 새 파일 하나의 전체 내용을 실행하면 된다.
const schema = fs.readFileSync(path.join(ROOT, "supabase/migrations/0001_companies_schema.sql"), "utf8");
fs.writeFileSync(path.join(ROOT, "supabase/setup.sql"),
  "-- SQL Editor에 이 파일 전체를 붙여넣고 Run. 기존 companies UUID와 외래키는 유지합니다.\n" +
  schema + "\n" + sql + "\nselect id, slug, name from public.companies where slug is not null order by sort_order;\n");
console.log(`${rows.length}개사 → ${path.relative(ROOT, OUT)}`);
