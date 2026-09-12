# Supabase 설정

회사 지표를 코드에서 분리해 **배포 없이** 고치기 위한 설정입니다. 디자인 작업과 데이터 작업이 같은 파일에서 충돌하지 않는 것이 핵심 목적입니다.

## 처음 한 번만 (프로젝트 소유자)

1. Supabase 대시보드 → **SQL Editor** → New query
2. `migrations/0001_companies_schema.sql` 전체를 붙여넣고 **Run**
3. `migrations/0002_companies_seed.sql` 전체를 붙여넣고 **Run** (10개사 입력)
4. **Table Editor → companies** 에서 10행이 보이면 성공

`service_role` 키는 어디에도 넣지 않습니다. 앱은 읽기만 하고, 쓰기는 대시보드에서 합니다.

## 팀원 (각자 1회)

```bash
cp .env.local.example .env.local
```

`NEXT_PUBLIC_SUPABASE_URL` 과 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 에 팀에서 공유한 값을 넣으세요. 대시보드 → Settings → API 의 **Project URL** / **anon public** 입니다.

> anon 키는 브라우저에 노출되도록 설계된 공개 키라 `NEXT_PUBLIC_` 접두사가 맞습니다. RLS 로 읽기만 허용되어 있어 이 키로는 데이터를 고칠 수 없습니다.

비워둬도 앱은 정상 동작합니다 — 저장소의 JSON 으로 폴백하고 푸터에 그 사실을 표시합니다.

## 회사 지표 고치기

**대시보드 → Table Editor → companies** 에서 직접 고치세요. 코드 수정도 배포도 필요 없고, 최대 60초(ISR) 뒤 화면에 반영됩니다.

| 고칠 일 | 컬럼 |
|---|---|
| 워라밸 점수 | `worklife_index` (0~100) — **근거를 `worklife_note` 에 꼭 남기세요** |
| 직군 태그 | `job_families` — `{dev,data,pm,design,marketing}` 형식 |
| 노출 순서 | `sort_order` |
| DART 지표 | `avg_salary_manwon` 등 — 아래 "DART 갱신" 참고 |

### 회사 추가

`id`, `name`, `industry`, `job_families` 는 필수입니다. DART 지표를 모르면 **비워두세요** — 앱이 유니버스 중앙값으로 보간하고 `추정` 배지를 붙입니다. **값을 지어내지 마세요.** 4개 축 중 2개 이상이 비면 추천 후보에서 자동 제외됩니다.

### DART 갱신

```bash
npm run fetch:dart   # data/companies.raw.json 갱신 (DART_API_KEY 필요)
npm run gen:seed     # → migrations/0002_companies_seed.sql 재생성
```

생성된 SQL 을 SQL Editor 에 붙여넣으면 됩니다. upsert 라 여러 번 돌려도 안전합니다.

## 출처 표기 규칙

이 서비스의 신뢰도가 걸린 부분입니다. 컬럼이 곧 출처입니다.

| 컬럼 | 출처 | UI 배지 |
|---|---|---|
| `worklife_index` | 공공데이터 없음 → 사람이 입력 | `데모 추정치` |
| `avg_salary_manwon` 등 + `dart_as_of` | OpenDART 사업보고서 | `DART 2025` |
| null | 결측 → 중앙값 보간 | `추정` |

**워라밸 점수를 DART 컬럼에 넣지 마세요.** 추정치가 실데이터로 표기됩니다.
