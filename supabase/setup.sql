-- SQL Editor에 이 파일 전체를 붙여넣고 Run. 기존 companies UUID와 외래키는 유지합니다.
-- 커리어Hi — 회사 데이터 테이블
--
-- 목적: 회사 지표를 코드에서 분리해 배포 없이 고칠 수 있게 한다.
-- 디자인 작업과 데이터 작업이 같은 파일에서 충돌하지 않는 것이 핵심 이득이다.
--
-- 출처(source)는 컬럼으로 구분한다. UI 는 이 구분을 배지로 그대로 노출한다:
--   worklife_index / worklife_note → 공공데이터가 없어 사람이 입력한 값  → 배지 '데모 추정치'
--   dart_as_of 및 나머지 지표 컬럼  → OpenDART 사업보고서 스냅샷          → 배지 'DART <연도>'
--   값이 null → 결측. 앱이 유니버스 중앙값으로 보간하고                  → 배지 '추정'
--
-- 실행: Supabase 대시보드 → SQL Editor 에 붙여넣고 Run. 그다음 0002 시드를 실행.

begin;

create table if not exists public.companies (
  id                    uuid primary key default gen_random_uuid(),
  slug                  text unique,
  name                  text not null,
  industry              text not null,
  corp_code             text,
  job_families          text[] not null default '{}',

  -- 수동 입력 (source = 'manual')
  worklife_index        smallint check (worklife_index between 0 and 100),
  worklife_note         text,

  -- OpenDART 스냅샷 (source = 'dart')
  dart_as_of            text,
  avg_salary_manwon     integer,
  avg_tenure_years      numeric(4,1),
  employee_count        integer,
  employee_count_prev   integer,
  revenue               bigint,   -- 백만원
  revenue_prev          bigint,
  operating_profit      bigint,
  operating_profit_prev bigint,

  sort_order            smallint not null default 0,
  updated_at            timestamptz not null default now()
);

-- 기존 테이블에는 CREATE TABLE IF NOT EXISTS가 새 컬럼을 추가하지 않는다.
-- 이전 스키마로 생성된 테이블도 사용할 수 있도록 누락 컬럼만 추가한다.
-- 기존 행·컬럼 값·컬럼 타입은 변경하지 않는다.
-- 기존 UUID와 이를 참조하는 외래키는 유지한다. 앱 식별자는 slug로 분리한다.
alter table public.companies
  add column if not exists slug text,
  add column if not exists dart_corp_code text,
  add column if not exists name text,
  add column if not exists industry text,
  add column if not exists corp_code text,
  add column if not exists job_families text[] not null default '{}',
  add column if not exists worklife_index smallint check (worklife_index between 0 and 100),
  add column if not exists worklife_note text,
  add column if not exists dart_as_of text,
  add column if not exists avg_salary_manwon integer,
  add column if not exists avg_tenure_years numeric(4,1),
  add column if not exists employee_count integer,
  add column if not exists employee_count_prev integer,
  add column if not exists revenue bigint,
  add column if not exists revenue_prev bigint,
  add column if not exists operating_profit bigint,
  add column if not exists operating_profit_prev bigint,
  add column if not exists sort_order smallint not null default 0,
  add column if not exists updated_at timestamptz not null default now();

create unique index if not exists companies_app_slug_unique on public.companies (slug);
comment on column public.companies.slug is '앱용 문자열 ID (예: samsung-electronics). DB id와 외래키는 변경하지 않는다.';

comment on table  public.companies                   is '커리어Hi 비교 대상 회사. 지표를 고쳐도 앱 배포가 필요 없다.';
comment on column public.companies.worklife_index    is '워라밸 0~100. 공공데이터가 없어 사람이 입력한 추정치 — 근거는 worklife_note 에 남긴다.';
comment on column public.companies.avg_salary_manwon is '1인 평균 급여액(만원). 회사 전체 직원 평균이며 개인의 예상 연봉이 아니다.';
comment on column public.companies.avg_tenure_years  is '평균 근속연수. 개인의 예상 재직 기간이 아니다.';
comment on column public.companies.job_families      is 'dev / data / pm / design / marketing 중 해당하는 직군.';

-- updated_at 자동 갱신 (대시보드에서 값을 고치면 언제 고쳤는지 남는다)
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists companies_touch_updated_at on public.companies;
create trigger companies_touch_updated_at
  before update on public.companies
  for each row execute function public.touch_updated_at();

-- 읽기는 누구나(앱이 anon key 로 읽는다), 쓰기는 대시보드/service_role 로만.
alter table public.companies enable row level security;

drop policy if exists "companies are publicly readable" on public.companies;
create policy "companies are publicly readable"
  on public.companies for select
  to anon, authenticated
  using (true);

commit;

-- 커리어Hi — companies 시드 / 갱신
-- 자동 생성 파일: scripts/gen-seed-sql.mjs (npm run gen:seed). 손으로 고치지 마세요.
-- 원본: data/companies.manual.json + data/companies.raw.json
-- 생성 시각: 2026-09-12T10:45:07.420Z
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
  ('samsung-electronics', '삼성전자', '반도체·전자', '00126380', '{dev,data,pm,design,marketing}'::text[], 58, '제조·반도체 산업군 기준 추정치', '2025', 15706, 13.7, 128881, 129480, 333605938, 300870903, 43601051, 32725961, 0),
  ('sk-hynix', 'SK하이닉스', '반도체', '00164779', '{dev,data,pm}'::text[], 58, '제조·반도체 산업군 기준 추정치', '2025', 18500, 13.4, 34549, 32390, 97146675, 66192960, 47206319, 23467319, 1),
  ('naver', 'NAVER', '인터넷', '00266961', '{dev,data,pm,design,marketing}'::text[], 75, '인터넷 산업군 기준 추정치', '2025', 14552, 7.7, 5047, 4583, 12035007, 10737719, 2208138, 1979263, 2),
  ('kakao', '카카오', '인터넷', '00258801', '{dev,data,pm,design,marketing}'::text[], 75, '인터넷 산업군 기준 추정치', '2025', 10872, 6.3, 3922, 4028, 8099148, 7864033, 732037, 495278, 3),
  ('krafton', '크래프톤', '게임', '00760971', '{dev,data,pm,design,marketing}'::text[], 62, '게임 산업군 기준 추정치', '2025', 12893, 3.2, 2118, 1903, 3326554, 2709774, 1054381, 1182488, 4),
  ('ncsoft', '엔씨소프트', '게임', '00261443', '{dev,data,pm,design,marketing}'::text[], 62, '게임 산업군 기준 추정치', '2025', 11687, 7.5, 3262, 3832, 1506925, 1578123, 16078, -109215, 5),
  ('samsung-sds', '삼성SDS', 'IT서비스', '00126186', '{dev,data,pm,design}'::text[], 66, 'IT서비스 산업군 기준 추정치', '2025', 13829, 17.2, 11219, 11387, 13929868, 13828232, 957103, 911097, 6),
  ('lg-electronics', 'LG전자', '전자', '00401731', '{dev,data,pm,design,marketing}'::text[], 60, '제조·전자 산업군 기준 추정치', '2025', 11759, 13.8, 34144, 35727, 89200882, 87728182, 2478392, 3419675, 7),
  ('hyundai-motor', '현대자동차', '자동차', '00164742', '{dev,data,pm,design,marketing}'::text[], 56, '제조·자동차 산업군 기준 추정치', '2025', 13086, 15.8, 72598, 75137, 186254472, 175231153, 11467851, 14239592, 8),
  ('kt', 'KT', '통신', '00190321', '{dev,data,pm,marketing}'::text[], 70, '통신 산업군 기준 추정치', '2025', 11860, 19.3, 14701, 16927, 28244161, 26431204, 2469133, 809471, 9)
    ) as seed (slug, name, industry, corp_code, job_families, worklife_index, worklife_note, dart_as_of, avg_salary_manwon, avg_tenure_years, employee_count, employee_count_prev, revenue, revenue_prev, operating_profit, operating_profit_prev, sort_order)
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
        slug = r.slug,
        name = r.name,
        industry = r.industry,
        corp_code = r.corp_code,
        job_families = r.job_families,
        worklife_index = r.worklife_index,
        worklife_note = r.worklife_note,
        dart_as_of = r.dart_as_of,
        avg_salary_manwon = r.avg_salary_manwon,
        avg_tenure_years = r.avg_tenure_years,
        employee_count = r.employee_count,
        employee_count_prev = r.employee_count_prev,
        revenue = r.revenue,
        revenue_prev = r.revenue_prev,
        operating_profit = r.operating_profit,
        operating_profit_prev = r.operating_profit_prev,
        sort_order = r.sort_order,
        dart_corp_code = coalesce(r.corp_code, dart_corp_code)
      where id = matched_id;
    else
      insert into public.companies (slug, name, industry, corp_code, job_families, worklife_index, worklife_note, dart_as_of, avg_salary_manwon, avg_tenure_years, employee_count, employee_count_prev, revenue, revenue_prev, operating_profit, operating_profit_prev, sort_order, dart_corp_code)
      values (r.slug, r.name, r.industry, r.corp_code, r.job_families, r.worklife_index, r.worklife_note, r.dart_as_of, r.avg_salary_manwon, r.avg_tenure_years, r.employee_count, r.employee_count_prev, r.revenue, r.revenue_prev, r.operating_profit, r.operating_profit_prev, r.sort_order, r.corp_code);
    end if;
  end loop;
end $$;

select id, slug, name from public.companies where slug is not null order by sort_order;
