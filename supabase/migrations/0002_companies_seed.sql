-- 커리어Hi — companies 시드 / 갱신
-- 자동 생성 파일: scripts/gen-seed-sql.mjs (npm run gen:seed). 손으로 고치지 마세요.
-- 원본: data/companies.manual.json + data/companies.raw.json
-- 생성 시각: 2026-09-12T10:22:59.228Z
--
-- upsert 라 여러 번 실행해도 안전합니다. 0001_companies_schema.sql 을 먼저 실행하세요.

insert into public.companies (
  id,
  name,
  industry,
  corp_code,
  job_families,
  worklife_index,
  worklife_note,
  dart_as_of,
  avg_salary_manwon,
  avg_tenure_years,
  employee_count,
  employee_count_prev,
  revenue,
  revenue_prev,
  operating_profit,
  operating_profit_prev,
  sort_order
) values
  ('samsung-electronics', '삼성전자', '반도체·전자', '00126380', '{dev,data,pm,design,marketing}', 58, '제조·반도체 산업군 기준 추정치', '2025', 15706, 13.7, 128881, 129480, 333605938, 300870903, 43601051, 32725961, 0),
  ('sk-hynix', 'SK하이닉스', '반도체', '00164779', '{dev,data,pm}', 58, '제조·반도체 산업군 기준 추정치', '2025', 18500, 13.4, 34549, 32390, 97146675, 66192960, 47206319, 23467319, 1),
  ('naver', 'NAVER', '인터넷', '00266961', '{dev,data,pm,design,marketing}', 75, '인터넷 산업군 기준 추정치', '2025', 14552, 7.7, 5047, 4583, 12035007, 10737719, 2208138, 1979263, 2),
  ('kakao', '카카오', '인터넷', '00258801', '{dev,data,pm,design,marketing}', 75, '인터넷 산업군 기준 추정치', '2025', 10872, 6.3, 3922, 4028, 8099148, 7864033, 732037, 495278, 3),
  ('krafton', '크래프톤', '게임', '00760971', '{dev,data,pm,design,marketing}', 62, '게임 산업군 기준 추정치', '2025', 12893, 3.2, 2118, 1903, 3326554, 2709774, 1054381, 1182488, 4),
  ('ncsoft', '엔씨소프트', '게임', '00261443', '{dev,data,pm,design,marketing}', 62, '게임 산업군 기준 추정치', '2025', 11687, 7.5, 3262, 3832, 1506925, 1578123, 16078, -109215, 5),
  ('samsung-sds', '삼성SDS', 'IT서비스', '00126186', '{dev,data,pm,design}', 66, 'IT서비스 산업군 기준 추정치', '2025', 13829, 17.2, 11219, 11387, 13929868, 13828232, 957103, 911097, 6),
  ('lg-electronics', 'LG전자', '전자', '00401731', '{dev,data,pm,design,marketing}', 60, '제조·전자 산업군 기준 추정치', '2025', 11759, 13.8, 34144, 35727, 89200882, 87728182, 2478392, 3419675, 7),
  ('hyundai-motor', '현대자동차', '자동차', '00164742', '{dev,data,pm,design,marketing}', 56, '제조·자동차 산업군 기준 추정치', '2025', 13086, 15.8, 72598, 75137, 186254472, 175231153, 11467851, 14239592, 8),
  ('kt', 'KT', '통신', '00190321', '{dev,data,pm,marketing}', 70, '통신 산업군 기준 추정치', '2025', 11860, 19.3, 14701, 16927, 28244161, 26431204, 2469133, 809471, 9)
on conflict (id) do update set
  name = excluded.name,
  industry = excluded.industry,
  corp_code = excluded.corp_code,
  job_families = excluded.job_families,
  worklife_index = excluded.worklife_index,
  worklife_note = excluded.worklife_note,
  dart_as_of = excluded.dart_as_of,
  avg_salary_manwon = excluded.avg_salary_manwon,
  avg_tenure_years = excluded.avg_tenure_years,
  employee_count = excluded.employee_count,
  employee_count_prev = excluded.employee_count_prev,
  revenue = excluded.revenue,
  revenue_prev = excluded.revenue_prev,
  operating_profit = excluded.operating_profit,
  operating_profit_prev = excluded.operating_profit_prev,
  sort_order = excluded.sort_order;
