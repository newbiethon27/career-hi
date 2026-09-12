# Career AtoZ — 해커톤 MVP

> "같은 직무, 같은 연봉이어도 좋은 회사는 사람마다 다릅니다."

커리어 성향을 진단하고, 현재 회사와의 적합도(Fit Score)를 설명 가능한 점수로 계산해 더 맞는 회사를 추천하는 Career Decision Service. 설계 문서는 [`PLAN.md`](./PLAN.md), 협업 규칙은 [`CONTRIBUTING.md`](./CONTRIBUTING.md).

## 실행

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # vitest (계산 로직 + 데모 페르소나 회귀 테스트)
npm run typecheck
npm run lint
```

## 데모 흐름 (90초)

1. 랜딩 → `데모: 개발자 A` 클릭 → 대시보드 (보상·성장 추구형, 삼성SDS Fit **63**, 이직 검토 지수 **81 "검토 권장"**, SK하이닉스 84 / 삼성전자 70 / NAVER 70 추천)
2. `추천 이유 자세히 보기` → 이유 + 주의점(안정 축 하락 등) → `현재 회사와 비교`
3. 랜딩 → `데모: 개발자 B` 클릭 → 대시보드 (안정·균형 추구형, **같은 삼성SDS**인데 Fit **70**, 지수 **53 "관망"**, 추천은 SK하이닉스 1곳뿐)

> 위 숫자는 2025 사업보고서 DART 실데이터 기준이며, 데이터를 갱신하거나 상수를 바꾸면 달라진다. 결과를 하드코딩하지 않는다.

두 페르소나는 회사·직군·연봉·근속이 완전히 같고 성향만 다르다. `tests/persona.test.ts`가 이 대비를 회귀 테스트로 고정한다.

## 데이터 출처 (파일이 곧 출처다)

| 파일 | 내용 | UI 배지 |
|---|---|---|
| `data/companies.manual.json` | 회사 골격 + 워라밸 지표(공공데이터 없음, 수동) + 근거 note | `데모 추정치` |
| `data/companies.raw.json` | OpenDART 스냅샷 (2025 사업보고서, 10개사 전부 수집됨). `npm run fetch:dart` 가 생성 | `DART 2025` |
| `data/companies.demo.json` | DART 값이 없을 때 쓰는 **자리표시자** (실제 공시값 아님). 현재 비어 있음 | `데모 추정치` |

지표별 우선순위: `raw(dart)` → `demo(manual)` → 결측(유니버스 중앙값 보간, `추정` 배지).

### OpenDART 실데이터 넣기

```bash
cp .env.local.example .env.local   # DART_API_KEY 입력 (https://opendart.fss.or.kr 무료 발급)
npm run fetch:dart -- --only samsung-electronics --dump   # 1개사 응답 원문 확인 후
npm run fetch:dart                                        # 전체 수집 → data/companies.raw.json
npm test                                                  # 페르소나 대비가 유지되는지 확인
```

실제 응답에서 확인된 사항: 급여 `jan_salary_am`(원, 쉼표 문자열), 근속 `avrg_cnwk_sdytrn`(앞 공백 포함 소수), 직원 수 `sm`. 사업부문별 행과 `성별합계` 행이 함께 오므로 **합계 행만 합산**한다(`scripts/dart-parsers.ts`의 `selectRows`). 넥슨코리아·우아한형제들은 비상장 외감법인이라 직원현황이 없어 유니버스에서 제외했다.

## 튜닝 상수

데모 결과를 조정할 때는 `src/lib/constants.ts` 상단 블록만 만진다.

| 상수 | 현재값 | 효과 |
|---|---|---|
| `SMOOTHING_ALPHA` | 1.0 | 낮추면 성향 대비 ↑ → Fit 분산 ↑ |
| `MIN_FIT_MARGIN` | 5 | 추천에 필요한 최소 Fit 개선폭 |
| `FIT_GAP_SATURATION` | 20 | Move Timing 격차 항목이 만점이 되는 Fit 격차 |
| `SCORE_OUT_MIN/MAX` | 30 / 98 | 회사 축 점수 범위 |

바꾼 뒤 반드시 `npm test` — 페르소나 회귀 테스트가 데모 시나리오를 지킨다.

## 구조

```
src/lib/        계산 엔진 (순수 함수, UI 의존 없음)
  types.ts constants.ts questions.ts assessment.ts companyScore.ts
  companies.ts fit.ts recommend.ts explain.ts moveTiming.ts presets.ts storage.ts
src/store/      CareerContext (useSyncExternalStore + localStorage), useGuard, useAnalysis
src/components/ common / layout / assessment / result / company / compare / landing
src/app/        /  /assessment  /result  /profile  /dashboard  /recommend  /compare
scripts/        fetch-dart.ts (수동 실행), dart-parsers.ts
tests/          vitest 7파일 51케이스
```

백엔드 API·DB 없음. 모든 계산은 클라이언트에서 `useMemo` 로, 상태는 localStorage 에만 저장된다.
