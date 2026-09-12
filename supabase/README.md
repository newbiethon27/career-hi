# Supabase 설정

회사 지표를 코드에서 분리해 **배포 없이** 고치기 위한 설정입니다. 디자인 작업과 데이터 작업이 같은 파일에서 충돌하지 않는 것이 핵심 목적입니다.

## 테이블 구조에 대해 먼저

팀 공용 Supabase 프로젝트에는 **이미 `companies` 테이블이 있었습니다** (다른 서비스가 UUID `id` 로 외래키를 걸어 씁니다). 그래서 그 테이블을 갈아엎지 않고 **컬럼만 추가**해 같이 씁니다.

| 컬럼 | 누가 쓰나 |
|---|---|
| `id` (uuid) | 기존 서비스의 외래키. **건드리지 않습니다** |
| `slug` (text, unique) | **커리어Hi 앱의 회사 ID** — `samsung-electronics` 처럼. 앱은 이 값이 있는 행만 읽습니다 |
| 나머지 지표 컬럼 | 커리어Hi 가 추가한 컬럼 |

`slug` 가 비어 있는 행은 다른 서비스의 데이터이므로 커리어Hi 화면에 나오지 않습니다.

## 처음 한 번만 (프로젝트 소유자)

1. Supabase 대시보드 → **SQL Editor** → New query
2. **`supabase/setup.sql` 전체**를 붙여넣고 **Run** (스키마 + 10개사 시드가 한 파일에 합쳐져 있습니다)
3. 결과 그리드에 `slug` 가 채워진 10행이 보이면 성공

`setup.sql` 은 몇 번을 다시 실행해도 안전합니다 — 기존 행은 `slug` / 이름 / 법인번호로 찾아서 **갱신**하고, 없으면 추가합니다. 서로 다른 행이 하나의 회사에 매칭되면 아무것도 바꾸지 않고 전체를 롤백합니다.

`service_role` 키는 어디에도 넣지 않습니다. 앱은 읽기만 하고, 쓰기는 대시보드에서 합니다.

## 팀원 (각자 1회)

`.env.local` 에 팀에서 공유한 값을 넣으세요. 형식은 `.env.local.example` 을 참고하되 **그 파일을 복사하지 말고** 기존 `.env.local` 에 두 줄을 추가/교체하세요 (DART 키가 이미 들어 있을 수 있습니다).

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

대시보드 → Settings → API 의 **Project URL** / **anon public** 입니다. 저장 후 **dev 서버를 재시작**해야 읽힙니다 (환경변수는 시작 시 한 번만 읽습니다).

> anon 키는 브라우저에 노출되도록 설계된 공개 키라 `NEXT_PUBLIC_` 접두사가 맞습니다. RLS 로 읽기만 허용되어 있어 이 키로는 데이터를 고칠 수 없습니다.

비워둬도 앱은 정상 동작합니다 — 저장소의 JSON 으로 폴백하고 **푸터에 그 사실을 표시**합니다. 푸터에 "Supabase 에서 읽었습니다" 가 보이면 연결된 것입니다.

**Vercel 에도** 같은 두 변수를 Project Settings → Environment Variables 에 넣어야 배포본이 Supabase 를 읽습니다.

## 회사 지표 고치기

**대시보드 → Table Editor → companies** 에서 직접 고치세요. 코드 수정도 배포도 필요 없고, 최대 60초(ISR) 뒤 화면에 반영됩니다.

| 고칠 일 | 컬럼 |
|---|---|
| 워라밸 점수 | `worklife_index` (0~100) — **근거를 `worklife_note` 에 꼭 남기세요** |
| 직군 태그 | `job_families` — `{dev,data,pm,design,marketing}` 형식 |
| 노출 순서 | `sort_order` |
| DART 지표 | `avg_salary_manwon` 등 — 아래 "DART 갱신" 참고 |

### 회사 추가

`slug`, `name`, `industry`, `job_families` 는 필수입니다. `slug` 는 소문자·하이픈만 (`woowa-brothers`). `id` 는 자동 생성되니 비워두세요.

DART 지표를 모르면 **비워두세요** — 앱이 유니버스 중앙값으로 보간하고 `추정` 배지를 붙입니다. **값을 지어내지 마세요.** 4개 축 중 2개 이상이 비면 추천 후보에서 자동 제외됩니다.

### DART 갱신

```bash
npm run fetch:dart   # data/companies.raw.json 갱신 (DART_API_KEY 필요)
npm run gen:seed     # → migrations/0002_companies_seed.sql + setup.sql 재생성
```

생성된 `setup.sql` 을 SQL Editor 에 붙여넣으면 됩니다.

## 출처 표기 규칙

이 서비스의 신뢰도가 걸린 부분입니다. 컬럼이 곧 출처입니다.

| 컬럼 | 출처 | UI 배지 |
|---|---|---|
| `worklife_index` | 공공데이터 없음 → 사람이 입력 | `데모 추정치` |
| `avg_salary_manwon` 등 + `dart_as_of` | OpenDART 사업보고서 | `DART 2025` |
| null | 결측 → 중앙값 보간 | `추정` |

**워라밸 점수를 DART 컬럼에 넣지 마세요.** 추정치가 실데이터로 표기됩니다.

## 파일

| 파일 | 역할 |
|---|---|
| `setup.sql` | **이걸 실행하세요.** 아래 두 파일의 합본 (자동 생성) |
| `migrations/0001_companies_schema.sql` | 테이블·컬럼 추가·RLS. 손으로 관리 |
| `migrations/0002_companies_seed.sql` | 10개사 시드. `npm run gen:seed` 가 생성 — 손으로 고치지 마세요 |
