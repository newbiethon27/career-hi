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

create table if not exists public.companies (
  id                    text primary key,
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
