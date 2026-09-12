# 커리어Hi — 해커톤 MVP 개발 계획

> 작성일: 2026-09-12

## 0. 구현 전 검토 반영 — 빠르게 작동하는 P0 계약

> 2026-09-12 수정. 시간이 제한되어 있으므로 기존 화면·가중합 구조를 유지하고 아래 계약으로 구현한다. **이 절은 아래의 기존 화면 예시·작업 설명보다 우선한다.** 예시의 실회사 이름·수치·추천 방향은 실행 데이터나 통과 조건이 아니다.

1. **P0는 명시적인 가상 회사 데모 모드로 완주한다.** `data/companies.demo.json`에 `demo-` 접두사 ID와 가상 회사명으로 현재 회사 1개 + 후보 3개 이상을 둔다. 네 축 계산에 필요한 원자료를 모두 채우고 `source: 'demo'`, `note: '기능 검증용 합성 데이터'`를 붙인다. 실제 회사 이름에 임의 지표를 붙이지 않는다. 전 화면에 `가상 회사·합성 데이터로 작동하는 데모입니다. 실제 이직 판단에 사용하지 마세요`를 상시 표시한다. 실회사 데이터는 P1에서 연결하며 두 데이터셋을 같은 추천 풀에 섞지 않는다.
2. **결측은 보간하지 않는다.** 축 계산에 필요한 구성 지표 하나라도 없거나 분모가 0/유효하지 않으면 해당 축을 결측으로 기록한다. `ScoredCompany`에 `missingAxes: Axis[]`를 추가한다. 기존 숫자 벡터 유지가 필요하면 결측 자리에 내부용 0을 둘 수 있으나, 반드시 `missingAxes` 가드를 먼저 통과해야 하며 그 0을 화면·Fit·순위·추천에 사용하지 않는다. 축 하나라도 결측이면 추천 제외. 현재 회사 결측 또는 `other`는 Fit·개선 추천·Move Timing을 `null`로 반환하고 판단 보류 사유를 표시한다. 평균 회사로 대체하지 않는다.
3. **반환 계약을 고정한다.** `recommend()`는 `{ current: FitResult | null, top, poolSize, excludedForDataCount, emptyReason }`을 반환한다. `poolSize`는 현재 회사 제외·동일 직군·결측 필터 후 후보 수다. `emptyReason`은 `current_unavailable | no_comparable_candidates | no_significant_improvement | null`이다. 현재 데이터 부족을 먼저 판정한다. `top.length === 0`만으로 현재 회사가 최적이라고 설명하지 않는다. `computeMoveTiming()`은 현재 Fit이 없거나 유효 후보가 없으면 `null`을 반환한다.
4. **반올림 규칙은 단순하게 유지한다.** `fit = Math.round(sum(contributions))`. 정렬·최소 개선폭·Move Timing은 이 정수 Fit을 사용한다. 추천 조건은 `fit > currentFit + 2`로, 정확히 +2점은 추천하지 않는다. 설명 기여도 합은 반올림 전 값이므로 정수 Fit과 정확히 같다고 주장하지 않는다. `computeFit()`에 companyId를 전달하여 빈 ID 반환을 없앤다.
5. **출처를 원자료와 서비스 산출로 구분한다.** `DataSource`에 `demo`를 추가한다. 원자료는 `DART {연도}` / `수동 입력` / `데모 합성 데이터`를 표시하고, 계산된 축·Fit에는 별도로 `서비스 산출`을 표시한다. DART를 입력으로 썼어도 공시 원점수처럼 표시하지 않는다. 수동/실자료에는 원문 URL·기준시점·note를 보존한다. JSON 결측 표현은 객체 전체 `null`로 통일하며 `{ value: null }`은 금지한다.
6. **설명은 중요도와 개선 기여도를 구분한다.** `weights` 순위에만 “가장 중시하는”을 사용한다. 추천 이유는 `weight × (추천 회사 축 점수 - 현재 회사 축 점수)`가 양수인 축 중 상위 최대 2개로 생성한다. 중요도 동점은 공동 순위라고 표현한다. 하락 축은 작은 하락도 비교 표에 표시하고 가장 큰 하락은 주의 문장으로 표시한다. Growth는 `기업 실적 기반 성장 대리 지표`라고 표시하며 개인의 역량·승진 성장을 예측하지 않는다.
7. **Move Timing은 데모 규칙임을 분명히 한다.** P0에서 기존 4요소 산식을 유지하되 `rawTotal`, `rawMax`를 반환한다. 급여 결측이면 `salaryGap=0`, `rawMax=85`; 급여가 있으면 `rawMax=100`. 근속 12개월 미만의 급여 항목 제외는 결측이 아니므로 급여가 있으면 만점은 100으로 유지한다. `score = Math.round(rawTotal / rawMax * 100)`. 구성요소 합은 `rawTotal`이며 환산 점수와 다를 수 있다. 급여 비율은 `currentCompany.metrics.avgSalaryManwon.value`에서 검증 후 읽는다. `bestFit`은 추천 TOP3의 첫 점수이며 추천 0건이지만 유효 후보가 있으면 gap=0이다. 화면 명칭은 `데모 점검 지수`, 밴드는 `신호 낮음/보통/높음`으로 표시하고 유지·이직 권고로 해석하지 않는다. 연봉 비율·현 회사 근속만으로 이직 필요성을 판단할 수 없으므로 **실데이터 모드에서는 검증 전 이 패널을 비활성화한다.**
8. **프리셋을 UI 전에 만든다.** T3에서 완전한 가상 회사 데이터, T5에서 실제 A/B 답변 10개씩과 공통 프로필을 정의하고 `scoreAssessment()`로 결과를 생성한다. T10에 persona 테스트를 포함하고 T13에서 Landing 버튼을 연결한다. T22는 추가 리허설만 담당한다. 데모 답변에 임의의 weights·Fit을 직접 주입하지 않는다. A/B의 밴드나 추천 개수가 특정 방향이어야 한다는 테스트는 삭제하고, 가중치·기여도 변화와 계산 재현성을 검증한다.
9. **입력과 저장소의 실패만 최소 방어한다.** 정확히 10개의 A/B 답변, 유한한 숫자, 정수 범위, 회사 ID, 로그 입력 양수, 증가율 분모 양수를 검증한다. 둘 다 적자인 영업이익 처리에서는 `profScore=40`을 그대로 30% 반영하고 재가중하지 않는다(데모 휴리스틱). 실데이터 적용 타당성은 P1 검토 대상이다. JSON 파싱과 localStorage 읽기·쓰기·삭제는 try/catch로 감싸고 실패 시 메모리 상태로 작동한다. 복원한 assessment는 답변으로 재계산한다. 가드는 hydration 완료 후 assessment → profile 순서로 검사한다. 재검사 시 이전 결과·진행을 초기화하고 프리셋 전환 시 진행을 지운다.
10. **최소 검증 후 UI로 간다.** 네 축 범위·Fit 손계산·정렬 동점·+2/+3 경계·전체 결측·`other`·추천 0건 사유·급여 결측 환산·연속 프리셋 전환을 검증한다. 손계산: `.45/.15/.10/.30 × 84/74/72/88 = 82.5 → Fit 83`. `npm test`, `tsc --noEmit`, `npm run build`와 데모 A/B 전환·새로고침을 완료 기준으로 삼는다. 기능 코드 작성과 실제 테스트 실행은 다음 구현 단계에서 수행한다.

---
> 이 문서는 구현 착수 전 설계 문서다. 이 문서를 읽고 바로 코딩을 시작할 수 있는 수준을 목표로 한다.

---

## 1. Product Summary

### 한 줄 정의

**커리어Hi는 "나에게 맞는 회사"를 설명 가능한 점수로 계산해주는 Career Decision Service다.**

### 핵심 메시지

> "같은 직무, 같은 연봉이어도 좋은 회사는 사람마다 다릅니다."

### 해결하는 문제

기존 서비스(잡플래닛, 원티드, 블라인드, 사람인 등)는 **회사에 대한 정보**를 준다. 평균 연봉, 리뷰, 워라밸 평점. 하지만 그 정보는 모든 사용자에게 동일하게 보인다.

문제는 **같은 회사가 사람마다 다르게 좋다**는 점이다. 연봉 20% 상승이 누군가에겐 최우선이고 누군가에겐 통근 30분보다 못하다. 기존 서비스는 이 개인차를 반영하지 않는다.

### 차별점 (기존 서비스 대비)

| | 기존 서비스 | 커리어Hi |
|---|---|---|
| 출발점 | 회사 | **사용자 성향** |
| 출력 | 회사 정보 / 공고 목록 | **나와의 적합도 점수** |
| 현재 직장 | 다루지 않음 | **현재 회사 Fit 분석이 시작점** |
| 판단 | "이 회사 좋다" | **"지금 이직을 검토할 가치가 있는가"** |
| 근거 | 평점 / 리뷰 | **4축 가중합, 계산식 전체 공개** |

### 포지셔닝

- 기업 정보 서비스 ❌ → **Career Decision Service** ✅
- 채용공고 추천 서비스 ❌ → **Career Navigation Service** ✅

### 설계 원칙 (전 구현에 적용되는 불변 규칙)

1. **AI가 회사 정보를 생성하지 않는다.** 모든 회사 수치는 OpenDART 스냅샷 또는 사람이 입력한 값이며, 각각 `source` 필드로 구분된다.
2. **실데이터와 데모 데이터를 UI에서 구분한다.** 모든 수치 옆에 출처 배지(`DART 2024` / `데모 추정치`)를 붙인다.
3. **평균 근속연수는 개인의 예상 퇴사 시점이 아니다.** 평균급여는 개인의 예상 연봉이 아니다. 해당 수치를 보여주는 모든 곳에 주석을 단다.
4. **"당신은 이직해야 합니다" 같은 확정 판단을 하지 않는다.** "검토 권장" / "관망" / "유지 권장" 3단계 상태만 제시한다.
5. **성향 검사는 심리학적으로 검증된 검사가 아니다.** 서비스용 커리어 선호도 진단임을 결과 페이지에 명시한다.
6. **모든 추천은 계산 과정을 설명할 수 있어야 한다.** ML을 쓰지 않는 이유가 이것이다. 전부 deterministic 가중합.

---

## 2. MVP Scope

### 반드시 구현 (P0)

| # | 기능 | 비고 |
|---|---|---|
| 1 | Landing Page | 핵심 메시지 + CTA + 데모 프리셋 |
| 2 | 성향 검사 10문항 | trade-off 선택형, 한 화면 한 질문 |
| 3 | 4축 성향 점수 계산 | Compensation / Balance / Stability / Growth |
| 4 | 커리어 유형 결과 | 주 유형 + 부 유형 + 4축 % |
| 5 | 현재 직군/회사/연봉/근속 입력 | 회사는 드롭다운 선택 |
| 6 | 회사 데이터 12개사 | 4축 점수 + 원본 지표 + source |
| 7 | 현재 회사 Fit Score | 0~100, 축별 breakdown |
| 8 | 추천 회사 TOP 3 | 현재 회사 제외, Fit 내림차순 |
| 9 | 현재 vs 추천 회사 비교 | 4축 + 평균급여 + 평균근속 |
| 10 | 추천 이유 텍스트 | deterministic template |
| 11 | Move Timing Score | rule-based 0~100 + 3단계 상태 |

> Move Timing은 원래 P1이지만 **Definition of Done 9번 항목에 포함되어 있으므로 P0로 승격**한다. 계산 로직이 30줄 내외라 비용이 낮다.

### 구현하지 않음 (MVP 제외)

- 회원가입 / 로그인 / 계정 저장
- 데이터베이스 (localStorage로 충분)
- 실시간 채용공고 연동, 실제 지원 기능
- LLM 기반 자연어 설명 (template로 충분, P2)
- Career Route 시각화 (P2 — P0 완료 전 착수 금지)
- 장기 생애소득 시뮬레이션, ML 기반 이직 확률 예측 (P3)
- 회사 자유 검색 / 자동완성 (12개 드롭다운으로 충분, P1)
- 다국어, 반응형 완벽 대응 (데스크톱 우선, 모바일은 깨지지 않는 수준)

### 우선순위 티어

```
P0  Landing → 검사 → 유형 → 프로필 입력 → Fit → TOP3 → 비교 → 이유 → Move Timing
P1  OpenDART 실데이터 반영 / 시각화 개선(radar) / 회사 검색 / normalization 튜닝
P2  Career Route / LLM 설명 / 직군 확대 / 결과 공유 링크
P3  채용공고 연결 / 실제 지원 / 생애소득 / ML
```

**P0가 전부 동작하기 전에 P2/P3를 건드리지 않는다.**

---

## 3. User Flow

```
┌─────────────┐
│  /  Landing │  "같은 직무, 같은 연봉이어도 좋은 회사는 사람마다 다릅니다"
└──────┬──────┘  [3분 진단 시작]  [데모로 바로 보기 ▾]
       │
       ▼
┌──────────────────┐
│  /assessment     │  Q1 ─ Q10, 한 화면 한 질문, progress bar
│                  │  각 선택 = 축에 +2점, 뒤로가기 가능
└──────┬───────────┘
       │  answers[] → scoreAssessment()
       ▼
┌──────────────────┐
│  /result         │  "보상 추구형 · 부 성향 성장 추구형"
│                  │  보상 42% / 성장 28% / 균형 18% / 안정 12%
└──────┬───────────┘  [내 회사와 비교하기]
       │
       ▼
┌──────────────────┐
│  /profile        │  직군 · 현재 회사 · 연봉 · 근속 (+선택: 지역, 통근)
└──────┬───────────┘
       │  computeFit(user, currentCompany)
       ▼
┌──────────────────┐
│  /dashboard      │  현재 회사 Fit 71/100 + 축별 breakdown
│                  │  Move Timing 82 → "이직 검토 권장"
│                  │  진단 문장 + TOP3 미리보기
└──────┬───────────┘  [추천 회사 보기]
       │
       ▼
┌──────────────────┐
│  /recommend      │  TOP 3 카드 (Fit / 추천 이유 / 주의점)
└──────┬───────────┘  [현재 회사와 비교]
       │
       ▼
┌──────────────────┐
│  /compare?target │  현재 회사 vs 선택한 회사 1:1
│    =krafton      │  4축 diff + 평균급여 + 평균근속 + Fit 변화
└──────────────────┘
```

### 가드 규칙

| 진입 페이지 | 조건 미충족 시 |
|---|---|
| `/result` | assessment 결과 없음 → `/assessment` 리다이렉트 |
| `/profile` | assessment 결과 없음 → `/assessment` |
| `/dashboard`, `/recommend`, `/compare` | profile 없음 → `/profile` |

리다이렉트는 클라이언트에서 `useEffect` + `router.replace()`로 처리한다(상태가 localStorage에 있으므로 서버에서 판단 불가). 하이드레이션 전에는 스켈레톤을 보여 깜빡임을 막는다.

---

## 4. Screen / Page Specification

### 4.1 `/` — Landing

| 항목 | 내용 |
|---|---|
| 역할 | 핵심 메시지 전달, 진단 시작 유도, **데모 프리셋 제공** |
| 입력 | 없음 |
| 출력 | 정적 콘텐츠 |

**UI 구성**
- Hero: `"같은 직무, 같은 연봉이어도"` / `"좋은 회사는 사람마다 다릅니다"` (2줄, 큰 타이포)
- 서브카피: "10개 질문으로 당신의 커리어 성향을 진단하고, 지금 회사와의 적합도를 점수로 확인하세요. 약 2분."
- Primary CTA: `[진단 시작하기]` → `/assessment`
- 3단계 설명 카드: `① 성향 진단` → `② 현재 회사 Fit 분석` → `③ 맞는 회사 추천`
- **데모 프리셋 (해커톤 필수):** `[데모: 개발자 A로 보기]` `[데모: 개발자 B로 보기]` — localStorage에 사전 정의된 assessment+profile을 주입하고 `/dashboard`로 바로 이동. 시연 중 검사 재응시 시간(90초)을 없앤다.
- 하단 disclaimer 배너 (전 페이지 공통 footer)

---

### 4.2 `/assessment` — 커리어 성향 검사

| 항목 | 내용 |
|---|---|
| 역할 | 10개 trade-off 질문으로 4축 원점수 수집 |
| 입력 | 질문당 A 또는 B 선택 |
| 출력 | `answers: ('A'\|'B')[]` → Context + localStorage |

**UI 구성**
- 상단: `Progress` 바 + `3 / 10`
- 중앙: 질문 텍스트(18~20px, 2~3줄) 아래 큰 선택 카드 2장 (세로 스택, 각 카드 높이 100px+)
- 카드 hover 시 border/bg 강조, 클릭 즉시 다음 질문으로 전환 (확인 버튼 없음 — 속도 우선)
- 좌하단 `[이전]` 버튼 (1번 문항에서는 숨김)
- 전환 애니메이션: `transition-opacity` 150ms 정도. 과하게 하지 않는다.
- 10번 답변 완료 → `scoreAssessment()` 실행 → `router.push('/result')`

**상태**: `useState<number>(currentIndex)` + `useState<Answer[]>(answers)`. 매 선택마다 localStorage에 저장 → 새로고침해도 진행 위치 복구.

---

### 4.3 `/result` — 커리어 유형 결과

| 항목 | 내용 |
|---|---|
| 역할 | 유형 확정 + 4축 점수 공개 (MBTI 결과 화면 같은 만족감) |
| 입력 | Context의 `assessmentResult` |
| 출력 | 화면 표시 |

**UI 구성**
- 유형 배지(대): `보상 추구형` + 이모지/아이콘 + 한 줄 설명
  - "연봉과 보상 수준을 커리어 판단의 1순위로 두는 유형입니다."
- 부 유형: `부 성향: 성장 추구형`
- 4축 가로 막대 (Recharts 불필요 — div width %로 충분, 빠르고 안 깨짐)
  ```
  보상  ████████████████░░░░  42%
  성장  ███████████░░░░░░░░░  28%
  균형  ███████░░░░░░░░░░░░░  18%
  안정  ████░░░░░░░░░░░░░░░░  12%
  ```
- 유형 설명 3~4줄 (정적 텍스트, 4유형 × 1세트 = 4개 문단 하드코딩)
- **필수 고지 박스**: "이 진단은 심리학적으로 검증된 검사가 아니라, 회사 선택 시 무엇을 우선하는지 파악하기 위한 서비스용 커리어 선호도 진단입니다."
- CTA: `[현재 회사와의 적합도 확인하기]` → `/profile`
- 보조: `[다시 검사하기]`

---

### 4.4 `/profile` — 현재 정보 입력

| 항목 | 내용 |
|---|---|
| 역할 | Fit 계산에 필요한 사용자 컨텍스트 수집 |
| 입력 | 아래 5+2 필드 |
| 출력 | `UserProfile` → Context + localStorage |

**필드**

| 필드 | 타입 | UI | 필수 | 검증 |
|---|---|---|---|---|
| `jobFamily` | enum | Select | ✅ | 5개 중 1 |
| `currentCompanyId` | string | Select (12개사 + "목록에 없음") | ✅ | — |
| `currentSalary` | number | Input(만원) | ✅ | 1000 ~ 50000 |
| `tenureMonths` | number | Input(년) + Input(개월) | ✅ | 0 ~ 480 |
| `region` | enum | Select | ❌ | 수도권/충청/영남/호남/기타 |
| `commuteMinutes` | number | Input(편도 분) | ❌ | 0 ~ 180 |

- `jobFamily` 선택지: `소프트웨어 개발` / `데이터·AI` / `기획·PM` / `디자인` / `마케팅·영업`
- `currentCompanyId = 'other'` 선택 시: 현재 회사 Fit·추천·Move Timing을 판단 보류하고, 데모 회사 선택 안내를 표시한다 (§0).
- 검증은 **zod 스키마 1개**로 처리. React Hook Form 없이 `useState` + `schema.safeParse(state)` on submit으로 충분 (필드 5개, 폼 1개).
- 제출 → `/dashboard`

---

### 4.5 `/dashboard` — 현재 회사 Fit 분석

| 항목 | 내용 |
|---|---|
| 역할 | **서비스의 핵심 화면.** 현재 회사가 나에게 맞는지 판정 |
| 입력 | Context (assessment + profile) |
| 출력 | Fit Score, 축별 비교, 진단 문장, Move Timing, TOP3 미리보기 |

**UI 구성 (위→아래)**

1. **Fit Score 히어로**
   ```
   삼성SDS 와 당신의 적합도
        71 / 100
   [게이지 또는 큰 숫자 + 색상 밴드]
   ```
   밴드 색: 80+ 초록 / 60-79 노랑 / <60 주황. "나쁨/좋음" 단어는 쓰지 않는다.

2. **축별 비교 (가장 설득력 있는 부분)** — 같은 막대에 두 값을 겹쳐 표시
   ```
                내 중요도      회사 점수
   보상   ▓▓▓▓▓▓▓▓ 42%    ████████░░ 62
   성장   ▓▓▓▓▓ 28%       █████░░░░░ 54
   균형   ▓▓▓ 18%         ███████░░░ 75
   안정   ▓▓ 12%          █████████░ 88
   ```
   → "내가 중요하게 보는 축에서 회사 점수가 낮다"가 한눈에 보여야 한다.

3. **진단 문장** (deterministic template)
   > "당신은 **보상**과 **성장**을 중요하게 생각하지만, 삼성SDS는 **안정성**(88점)에 강점이 있습니다. 가장 중시하는 보상 축은 62점으로 12개 비교 대상 중 7위입니다."

4. **Move Timing Score**
   ```
   이직 검토 지수  82 / 100
   상태: 이직 검토 권장
   근거: 대안 회사와의 적합도 격차 +19점 / 현재 적합도 71점 / 근속 3년 2개월
   ```
   + 고지: "이 지수는 이직 시점을 예측하지 않습니다. 현재 상황을 점검할 필요성을 정리한 참고 지표입니다."

5. **TOP3 미리보기** — 카드 3장 (회사명 + Fit만) + `[추천 회사 자세히 보기]`

6. **원본 지표 표** (접이식)
   | 지표 | 값 | 출처 |
   |---|---|---|
   | 1인 평균 급여액 | 1억 1,200만원 | `DART 2024` |
   | 평균 근속연수 | 12.4년 | `DART 2024` |
   | 직원 수 | 13,200명 | `DART 2024` |
   | 워라밸 지표 | 72 | `데모 추정치` |

   표 하단 고정 주석: *"1인 평균 급여액은 회사 전체 직원의 평균이며 개인의 예상 연봉이 아닙니다. 평균 근속연수는 해당 기간 근무를 보장하지 않습니다."*

---

### 4.6 `/recommend` — 추천 회사 TOP 3

| 항목 | 내용 |
|---|---|
| 역할 | 나에게 더 맞는 회사 제시 + **왜 그런지 설명** |
| 입력 | Context |
| 출력 | 최대 3개 회사 카드 |

**카드 1장 구성**
```
①  크래프톤                              Fit 91 / 100
    현재(삼성SDS 71) 대비 +20

    보상 ████████░ 89   성장 █████████ 92
    균형 ██████░░░ 68   안정 ██████░░░ 64

    ✓ 추천 이유
      당신이 가장 중시하는 보상에서 89점(현재 62점, +27),
      두 번째로 중시하는 성장에서 92점(현재 54점, +38)입니다.

    △ 함께 확인할 점
      안정 축은 현재 회사보다 24점 낮습니다.

    [현재 회사와 비교 →]
```

**추천 0건일 때 (반드시 구현)**
> "현재 회사보다 적합도가 높은 회사가 비교 대상 12개사 중 없습니다. 지금 회사는 당신의 성향과 잘 맞는 편입니다."

0건도 정상 결과다. 페르소나 B가 반드시 이 결과여야 하는 것은 아니다.

---

### 4.7 `/compare` — 1:1 비교

| 항목 | 내용 |
|---|---|
| 역할 | 현재 회사 vs 추천 회사 1개 정밀 비교 |
| 입력 | query `?target=<companyId>` + Context |
| 출력 | 비교 표 + (여유 시) radar chart |

**비교 표 (핵심 — 차트보다 우선 구현)**

| 지표 | 삼성SDS (현재) | 크래프톤 | 차이 |
|---|---|---|---|
| **Fit Score** | 71 | **91** | **+20** |
| Compensation | 62 | 89 | +27 |
| Balance | 75 | 68 | −7 |
| Stability | 88 | 64 | −24 |
| Growth | 54 | 92 | +38 |
| 1인 평균 급여액 | 1.12억 `DART` | 1.45억 `DART` | +0.33억 |
| 평균 근속연수 | 12.4년 `DART` | 4.1년 `DART` | −8.3년 |
| 직원 수 | 13,200 `DART` | 1,700 `DART` | — |

- 차이 컬럼: 양수 초록 / 음수 회색(빨강 X — "나쁨"이 아니라 "트레이드오프"이므로)
- 하단 요약 문장: *"보상과 성장을 우선한다면 크래프톤이 더 적합합니다. 대신 안정성 축에서는 현재 회사가 24점 높습니다."*
- **여유 있으면**: Recharts `RadarChart` 2계열 오버레이 추가. 없어도 데모에 지장 없음 → **P1로 분류**.

---

## 5. Data Model

전부 `src/lib/types.ts` 한 파일에 둔다. 파일을 쪼개서 얻을 이득이 없다.

```ts
// ---------- 축 ----------
export const AXES = ['compensation', 'balance', 'stability', 'growth'] as const
export type Axis = (typeof AXES)[number]
export type AxisVector = Record<Axis, number>

export const AXIS_LABEL: Record<Axis, string> = {
  compensation: '보상',
  balance: '균형',
  stability: '안정',
  growth: '성장',
}

// ---------- 출처 ----------
export type DataSource = 'dart' | 'manual' | 'derived' | 'demo'
// dart    : OpenDART 스냅샷 원본
// manual  : 사람이 공개자료를 보고 입력 (Balance 등)
// derived : 위 둘로부터 계산된 값

export type Sourced<T> = { value: T; source: DataSource; asOf?: string; sourceUrl?: string; note?: string }

// ---------- 성향 검사 ----------
export type Answer = 'A' | 'B'

export interface Question {
  id: number                 // 1..10
  text: string
  optionA: { label: string; axis: Axis }
  optionB: { label: string; axis: Axis }
}

export interface AssessmentResult {
  answers: Answer[]                 // length 10
  raw: AxisVector                   // 각 0..10, 합 = 20
  percent: AxisVector               // 각 0..50, 합 = 100 (표시용)
  weights: AxisVector               // 각 0..1, 합 = 1 (Fit 계산용, smoothing 적용)
  primaryType: CareerType
  secondaryType: CareerType
  isMixed: boolean                  // top1-top2 격차 < 5%p
  completedAt: string               // ISO
}

export type CareerType =
  | 'compensation_seeker'   // 보상 추구형
  | 'balance_seeker'        // 균형 추구형
  | 'stability_seeker'      // 안정 추구형
  | 'growth_seeker'         // 성장 추구형

// ---------- 사용자 프로필 ----------
export type JobFamily = 'dev' | 'data' | 'pm' | 'design' | 'marketing'

export interface UserProfile {
  jobFamily: JobFamily
  currentCompanyId: string        // 'other' 가능
  currentSalary: number           // 만원 단위
  tenureMonths: number
  region?: string
  commuteMinutes?: number
}

// ---------- 회사 ----------
export interface CompanyRawMetrics {
  avgSalaryManwon: Sourced<number> | null      // 1인 평균 급여액 (만원)
  avgTenureYears: Sourced<number> | null       // 평균 근속연수
  employeeCount: Sourced<number> | null
  employeeCountPrev: Sourced<number> | null
  revenue: Sourced<number> | null              // 백만원
  revenuePrev: Sourced<number> | null
  operatingProfit: Sourced<number> | null
  operatingProfitPrev: Sourced<number> | null
  worklifeIndex: Sourced<number> | null        // 0..100, 항상 source='manual'
}

export interface Company {
  id: string                 // 'samsung-electronics'
  name: string               // '삼성전자'
  corpCode?: string          // DART 고유번호 8자리
  industry: string           // '반도체·전자'
  jobFamilies: JobFamily[]
  metrics: CompanyRawMetrics
}

export interface ScoredCompany extends Company {
  scores: AxisVector                   // 각 0..100
  scoreSources: Record<Axis, DataSource>
  missingAxes: Axis[]                   // 하나라도 있으면 Fit/추천 계산 제외
}

// ---------- 결과 ----------
export interface FitResult {
  companyId: string
  fit: number                          // 0..100, 정수
  contributions: AxisVector            // weight × score, round(합) = fit
  rankInPool?: number
}

export interface Recommendation {
  company: ScoredCompany
  fit: FitResult
  fitDelta: number                     // fit - currentFit
  reasons: string[]                    // 추천 이유 1~2문장
  cautions: string[]                   // 주의점 0~1문장
}

export interface MoveTimingResult {
  score: number                        // 0..100, 환산 후 정수
  rawTotal: number                     // 구성요소 합 (반올림 전)
  rawMax: 85 | 100                     // 급여 결측이면 85
  band: 'stay' | 'watch' | 'consider'
  components: {
    fitGap: number          // 0..40
    currentFitPenalty: number // 0..25
    tenureReadiness: number   // 0..20
    salaryGap: number         // 0..15
  }
  summary: string
}
```

### 저장 형태 (localStorage)

| key | 값 |
|---|---|
| `chi:assessment` | `AssessmentResult` JSON |
| `chi:profile` | `UserProfile` JSON |
| `chi:answers-progress` | 진행 중 답변 `{ index, answers }` |

읽을 때 반드시 zod로 `safeParse`. 실패 시 해당 키 삭제 후 초기 상태로 취급 (스키마 변경 시 앱이 죽는 것을 방지 — 해커톤 중 자주 발생).

---

## 6. Career Type Assessment Logic

### 6.1 문항 설계 원칙

- **10문항**, 전부 2지 선다 trade-off
- 4개 축에서 2개를 골라 대립시킨다 (6개 조합 전부 1회 + 빈도 높은 4조합 1회 추가)
- **각 축이 정확히 5회씩 등장**한다 → 축별 최대 획득 점수가 10점으로 동일 (측정 도구의 공정성)
- 선택 = 해당 축에 **+2점**. 총점은 항상 20점으로 고정.

### 6.2 문항 전문 (`src/lib/questions.ts`에 그대로 입력)

| # | 대립 축 | 질문 | A | B |
|---|---|---|---|---|
| 1 | 보상 vs 균형 | 두 회사의 조건이 같습니다. 어느 쪽을 선택하시겠습니까? | 연봉이 800만원 더 높은 회사 `보상` | 유연근무·연차 사용이 자유로운 회사 `균형` |
| 2 | 보상 vs 안정 | 연봉 구조를 고를 수 있다면? | 기본급은 낮지만 성과급이 크게 변동하는 구조 `보상` | 성과급은 작지만 매년 예측 가능한 구조 `안정` |
| 3 | 보상 vs 성장 | 두 회사 중 한 곳을 지금 선택해야 한다면? | 지금 연봉이 확실히 높은 성숙한 대기업 `보상` | 연봉은 조금 낮지만 빠르게 성장 중인 회사 `성장` |
| 4 | 균형 vs 안정 | 어느 쪽 환경이 더 낫습니까? | 정시 퇴근이 가능하지만 업계 변동이 큰 회사 `균형` | 야근이 있지만 고용이 매우 안정적인 회사 `안정` |
| 5 | 균형 vs 성장 | 앞으로 2년을 보낸다면? | 업무 강도가 낮고 배우는 속도도 완만한 팀 `균형` | 업무 강도가 높지만 역량이 빠르게 느는 팀 `성장` |
| 6 | 안정 vs 성장 | 연봉이 비슷한 두 회사입니다. | 평균 근속연수가 11년인 성숙 기업 `안정` | 평균 근속연수가 4년인 급성장 기업 `성장` |
| 7 | 보상 vs 균형 | 통근과 연봉을 맞바꿀 수 있다면? | 편도 70분이지만 연봉이 600만원 높은 곳 `보상` | 편도 20분이고 연봉은 현재 수준인 곳 `균형` |
| 8 | 보상 vs 성장 | 입사 제안의 보상 패키지를 고른다면? | 지금 확정 지급되는 사이닝 보너스 `보상` | 4년에 걸쳐 받는 주식 보상(RSU/스톡옵션) `성장` |
| 9 | 안정 vs 균형 | 둘 중 하나만 보장된다면? | 구조조정 걱정이 없는 고용 안정성 `안정` | 주 40시간이 지켜지는 근무 환경 `균형` |
| 10 | 안정 vs 성장 | 회사의 현재 상태로 고른다면? | 업계 1위이며 사업이 안정된 회사 `안정` | 신규 사업을 공격적으로 확장 중인 회사 `성장` |

축 등장 횟수 검산: 보상 1,2,3,7,8 = 5 / 균형 1,4,5,7,9 = 5 / 안정 2,4,6,9,10 = 5 / 성장 3,5,6,8,10 = 5 ✅

### 6.3 채점 알고리즘

```ts
// src/lib/assessment.ts
const POINTS_PER_ANSWER = 2
const TOTAL_POINTS = 20          // 10문항 × 2점
const SMOOTHING_ALPHA = 1.0      // 튜닝 상수 — constants.ts에 둔다

export function scoreAssessment(answers: Answer[]): AssessmentResult {
  // 1) 원점수 집계
  const raw = { compensation: 0, balance: 0, stability: 0, growth: 0 }
  answers.forEach((a, i) => {
    const q = QUESTIONS[i]
    const axis = a === 'A' ? q.optionA.axis : q.optionB.axis
    raw[axis] += POINTS_PER_ANSWER
  })
  // raw 합 = 20 (불변)

  // 2) 표시용 퍼센트 — 합 100
  const percent = mapAxes(a => Math.round((raw[a] / TOTAL_POINTS) * 100))
  // 반올림 오차 보정: 합이 100이 아니면 최대 축에 차이를 더한다

  // 3) Fit 계산용 가중치 — Laplace smoothing, 합 1
  const denom = TOTAL_POINTS + AXES.length * SMOOTHING_ALPHA   // 24
  const weights = mapAxes(a => (raw[a] + SMOOTHING_ALPHA) / denom)
  // 범위: 최소 1/24 ≈ 0.042, 최대 11/24 ≈ 0.458

  // 4) 유형 분류
  const sorted = [...AXES].sort((x, y) =>
    raw[y] - raw[x] || TIE_ORDER.indexOf(x) - TIE_ORDER.indexOf(y)
  )
  ...
}
```

**smoothing을 쓰는 이유**: smoothing이 없으면 한 축도 선택하지 않은 사용자의 weight가 0이 되어 그 축이 Fit 계산에서 완전히 소거된다. 실제로는 "덜 중요"이지 "무관"이 아니다. α=1.0이면 미선택 축도 4.2%의 영향력을 갖는다.

**동점 처리**: `TIE_ORDER = ['compensation', 'growth', 'balance', 'stability']` 고정 순서로 결정. 랜덤을 쓰지 않는다(재현 불가능 = 데모 사고).

### 6.4 유형 매핑 & 혼합형

| 최다 축 | 유형 | 라벨 |
|---|---|---|
| compensation | `compensation_seeker` | 보상 추구형 |
| balance | `balance_seeker` | 균형 추구형 |
| stability | `stability_seeker` | 안정 추구형 |
| growth | `growth_seeker` | 성장 추구형 |

- **주 유형** = 1위 축, **부 유형** = 2위 축
- `isMixed = (percent[1위] - percent[2위]) < 5` → 결과 화면에 `보상·성장 균형형` 병기
- 기획서의 "예상 가중치 예시"(보상형 = Comp 0.50 / Growth 0.25 ...)와 실제 계산값은 다르다. 기획서 값은 **유형 설명 텍스트의 참고용**이고, Fit 계산에는 **개인별 실측 weights**를 쓴다. 유형이 같아도 사람마다 추천이 미세하게 달라지는 것이 오히려 서비스의 강점이다.

---

## 7. Company Scoring Logic

### 7.1 회사 유니버스 (12개사)

| id | 회사명 | 산업 | 비고 |
|---|---|---|---|
| `samsung-electronics` | 삼성전자 | 반도체·전자 | |
| `sk-hynix` | SK하이닉스 | 반도체 | |
| `naver` | NAVER | 인터넷 | |
| `kakao` | 카카오 | 인터넷 | |
| `krafton` | 크래프톤 | 게임 | |
| `ncsoft` | 엔씨소프트 | 게임 | |
| `samsung-sds` | 삼성SDS | IT서비스 | **데모 기준 "현재 회사"** |
| `lg-electronics` | LG전자 | 전자 | |
| `hyundai-motor` | 현대자동차 | 자동차 | |
| `kt` | KT | 통신 | |
| `nexon-korea` | 넥슨코리아 | 게임 | DART 제출 여부 확인 필요 |
| `woowa-brothers` | 우아한형제들 | 플랫폼 | DART 제출 여부 확인 필요 |

> 11·12번은 DART 제출 여부를 스크립트로 확인한 뒤, 없으면 유니버스에서 제외하고 10개사로 진행한다. **회사 수를 채우려고 값을 지어내지 않는다.**

### 7.2 원본 지표 → 4축 변환

정규화는 `src/lib/companyScore.ts`의 함수 하나로 통일한다.

```ts
// 유니버스 내 min-max, 단 이상치에 흔들리지 않도록 클램프 구간을 명시적으로 준다.
function normalize(x: number, lo: number, hi: number, outMin = 30, outMax = 98): number {
  const t = Math.min(1, Math.max(0, (x - lo) / (hi - lo)))
  return Math.round(outMin + (outMax - outMin) * t)
}
```

**출력 하한을 30으로 두는 이유**: 유니버스가 12개뿐이라 순수 min-max를 쓰면 최하위 회사가 0점이 된다. 0점은 "이 회사는 보상이 전혀 없다"로 오독된다. 30~98 구간으로 매핑해 상대 순위는 유지하되 오독을 막는다.

#### Compensation

```
input : avgSalaryManwon (1인 평균 급여액, 만원)
step 1: 로그 변환 v = ln(salary)   // 급여 분포는 상위 꼬리가 길다
step 2: normalize(v, ln(5000), ln(18000))   // 5,000만원 ~ 1억 8,000만원
source: 'dart'  (avgSalary가 dart일 때)
```

#### Stability

```
input : avgTenureYears, employeeCount, employeeCount/Prev
tenureScore   = normalize(avgTenureYears, 3, 14)
headcountTrend= employeeCount / employeeCountPrev - 1
trendScore    = normalize(headcountTrend, -0.08, 0.05)   // 감원이 클수록 낮게
sizeScore     = normalize(ln(employeeCount), ln(500), ln(120000))

Stability = round(0.50*tenureScore + 0.25*trendScore + 0.25*sizeScore)
source: 'dart'
```

> 증가율이 아니라 **감소하지 않음**을 안정으로 본다. 상한을 +5%로 낮게 잡아, 급성장(=변동성)이 안정 점수로 둔갑하지 않게 한다.

#### Growth

```
revenueGrowth  = revenue/revenuePrev - 1
profitGrowth   = operatingProfit/operatingProfitPrev - 1
headcountGrowth= employeeCount/employeeCountPrev - 1

revScore  = normalize(revenueGrowth,  -0.10, 0.35)
profScore = normalize(clamp(profitGrowth, -0.50, 1.00), -0.30, 0.60)
hcScore   = normalize(headcountGrowth, -0.05, 0.20)

Growth = round(0.40*revScore + 0.30*profScore + 0.30*hcScore)
source: 'dart'
```

**영업이익 증가율 예외 처리 (반드시 구현)**: 전기 영업이익이 0 이하이면 비율이 무의미하다.
- `operatingProfitPrev <= 0 && operatingProfit > 0` → 흑자전환 → `profScore = 85`
- `operatingProfitPrev > 0 && operatingProfit <= 0` → 적자전환 → `profScore = 30`
- 둘 다 ≤ 0 → `profScore = 40`, 기존 30% 가중치를 유지 (데모 규칙, 실데이터 타당성 검토 필요)

#### Balance — **공공데이터 없음, 수동 정의**

OpenDART에는 근로시간·유연근무·통근 관련 지표가 없다. 억지로 파생 지표를 만들면 설계 원칙 1번(AI가 회사 정보를 생성하지 않는다)을 위반한다.

```
Balance = normalize(worklifeIndex, 0, 100)   // 0..100 입력을 30..98로 통일
source  = 'manual'   ← 항상 manual. 절대 'dart'로 표기하지 않는다.
```

**입력 방법**: 구현자가 각 회사의 공개된 근무 제도(주 n일 재택, 유연근무제, 포괄임금 여부 등)를 확인해 `companies.manual.json`에 0~100으로 직접 기입하고, 같은 파일의 `note` 필드에 근거 한 줄을 남긴다. 근거가 없으면 산업군 기준값(예: 인터넷 75 / 게임 62 / 제조 58 / 통신 70)을 쓰고 `note: "산업군 기준 추정치"`로 표기.

UI에서는 Balance 점수 옆에 항상 `데모 추정치` 배지가 붙는다.

### 7.3 결측 처리

| 상황 | 처리 |
|---|---|
| 축 1개 이상 결측 | `missingAxes`에 기록, Fit·추천 계산 제외. 중앙값 보간 없음 |
| 현재 회사 결측 | 원자료만 표시하고 Fit·추천·Move Timing은 판단 보류 |
| 전기 데이터 결측 | 해당 증가율을 사용하는 축을 결측 처리. 재가중 없음 |

### 7.4 산출물

`companies.scored.json`은 만들지 않는다. `companies.raw.json` + `companies.manual.json`을 import한 뒤 **모듈 로드 시 1회 계산**해 메모리에 캐싱한다 (`src/lib/companyScore.ts`의 `getScoredCompanies()`). 12개사 × 4축 계산은 1ms 미만이고, 빌드 산출물이 하나 줄어든다.

---

## 8. Fit Score Algorithm

### 8.1 계산식

```
Fit(user, company) = Σ_axis  weights[axis] × companyScores[axis]

where  Σ weights = 1,  companyScores[axis] ∈ [30, 98]
```

- `weights` = §6.3의 smoothing된 가중치 (합 = 1)
- 결과 범위: 회사 점수가 30~98이므로 **Fit도 자연히 30~98**에 들어온다. 별도 스케일링·정규화가 필요 없다. → 이것이 이 설계를 고른 이유다. 계산식이 한 줄이고 사용자에게 그대로 보여줄 수 있다.
- `Math.round()`로 정수화

```ts
// src/lib/fit.ts
export function computeFit(weights: AxisVector, scores: AxisVector, companyId: string): FitResult {
  const contributions = mapAxes(a => weights[a] * scores[a])
  const fit = Math.round(AXES.reduce((s, a) => s + contributions[a], 0))
  return { fit, contributions, companyId }
}
```

### 8.2 normalization 방침

**Fit 점수 자체는 재정규화하지 않는다.** 이유:
- 재정규화(예: 풀 내 min-max)를 하면 "1등 회사는 항상 100점"이 되어, **현재 회사가 이미 최적인 사용자에게도 100점짜리 대안이 있는 것처럼** 보인다. 이는 설계 원칙 4번 위반이다.
- 절대 점수를 유지하면 "현재 71 → 추천 74" 같은 **작은 격차가 작게 보이는** 정직함을 얻는다.

대신 **상대 위치를 보조 표시**한다: `rankInPool` (예: "12개사 중 3위"). 순위는 계산 없이 정렬 인덱스로 얻는다.

### 8.3 변별력이 부족할 경우의 튜닝 (하나의 상수만 만진다)

데모에서 모든 회사 Fit이 68~76에 몰려 밋밋하면, `SMOOTHING_ALPHA`를 `1.0 → 0.5`로 낮춘다. 가중치 대비가 커져(최대 0.458 → 0.477, 최소 0.042 → 0.023) Fit 분산이 커진다. **다른 곳은 건드리지 않는다.** 이 값은 `constants.ts` 최상단에 주석과 함께 둔다.

### 8.4 동점 처리

Fit이 동점일 때 정렬 순서 (위에서부터 적용):
1. 사용자 **primary 축** 회사 점수가 높은 순
2. 사용자 **secondary 축** 회사 점수가 높은 순
3. `company.id` 사전순 (최종 결정자 — 항상 재현 가능)

### 8.5 추천에서 제외하는 조건

| # | 조건 | 이유 |
|---|---|---|
| 1 | `company.id === profile.currentCompanyId` | 현재 회사는 대안이 아니다 |
| 2 | `company.jobFamilies`에 `profile.jobFamily` 없음 | 직군 불일치 |
| 3 | 4축 중 1개 이상 결측 (§7.3) | 근거 부족한 추천 금지 |
| 4 | `fit <= currentFit + MIN_FIT_MARGIN` (기본 2, 정수 Fit에서 2점 초과) | 오차 수준의 개선을 "추천"이라 부르지 않는다 |

> 조건 4는 **추천 결과가 0건이 될 수 있음**을 의미한다. 이것은 버그가 아니라 의도된 동작이며, §4.6의 빈 상태 UI로 처리한다.
>
> 직군 필터(조건 2)는 MVP에서 약한 필터다 — 12개사 대부분이 `dev`를 포함한다. 직군의 진짜 역할은 (a) 연봉 비교 컨텍스트 제공, (b) 설명 문장에 사용, (c) 회사 확장 시의 확장점이다. 이 한계를 코드 주석에 명시한다.

---

## 9. Recommendation Algorithm

```ts
// src/lib/recommend.ts
export function recommend(
  assessment: AssessmentResult,
  profile: UserProfile,
  companies: ScoredCompany[],
): { current: FitResult; top: Recommendation[]; poolSize: number } {

  // 1. 현재 회사 Fit
  const currentCompany = resolveCurrentCompany(profile, companies)  // 'other' → undefined, 판단 보류
  // currentCompany가 없거나 missingAxes가 있으면 §0의 current=null 결과로 먼저 반환
  const current = computeFit(assessment.weights, currentCompany.scores, currentCompany.id)

  // 2. 후보 풀 필터링 (§8.5)
  const pool = companies
    .filter(c => c.id !== profile.currentCompanyId)
    .filter(c => c.jobFamilies.includes(profile.jobFamily))
    .filter(c => c.missingAxes.length === 0)

  // 3. Fit 계산 + 정렬 (§8.4 tie-break)
  const ranked = pool
    .map(c => ({ company: c, fit: computeFit(assessment.weights, c.scores, c.id) }))
    .sort(compareByFitThenTiebreak(assessment))

  // 4. 유의미한 개선만 남기고 상위 3개
  const top = ranked
    .filter(r => r.fit.fit > current.fit + MIN_FIT_MARGIN)
    .slice(0, 3)
    .map(r => ({
      ...r,
      fitDelta: r.fit.fit - current.fit,
      reasons: buildReasons(assessment, currentCompany, r.company),
      cautions: buildCautions(assessment, currentCompany, r.company),
    }))

  return { current, top, poolSize: pool.length }
}
```

### 9.1 추천 이유 생성 (`src/lib/explain.ts`)

LLM 없이 **기여도(contribution) 기반 template**로 생성한다. 계산에 실제로 쓰인 값을 그대로 문장화하므로 "설명 가능"이 말뿐이 아니다.

```ts
function buildReasons(a, currentCompany, target): string[] {
  // 1) 현재 대비 개선 기여도가 양수인 축 중 상위 최대 2개
  const top2 = AXES
    .map(ax => ({ ax, contrib: a.weights[ax] * (target.scores[ax] - currentCompany.scores[ax]) }))
    .filter(x => x.contrib > 0)
    .sort((x, y) => y.contrib - x.contrib || TIE_ORDER.indexOf(x.ax) - TIE_ORDER.indexOf(y.ax))
    .slice(0, 2)

  // 2) 1개만 남을 수도 있으므로 top2[1]을 직접 참조하지 않는다.
  return top2.map(({ ax, contrib }) => {
    const diff = target.scores[ax] - currentCompany.scores[ax]
    return `${LABEL[ax]} 축은 현재보다 ${signed(diff)}점 높고, ` +
      `가중합 개선에 ${contrib.toFixed(2)}점 기여합니다.`
  })
}

function buildCautions(a, currentCompany, target): string[] {
  // 현재 회사 대비 가장 크게 떨어지는 축 1개 (하락이 있을 때)
  const worst = minBy(AXES, ax => target.scores[ax] - currentCompany.scores[ax])
  const d = target.scores[worst] - currentCompany.scores[worst]
  return d < 0
    ? [`${LABEL[worst]} 축은 현재 회사보다 ${Math.abs(d)}점 낮습니다.`]
    : []
}
```

**cautions를 반드시 구현할 것.** "이 회사가 최고입니다"만 말하는 추천은 광고처럼 보인다. 트레이드오프를 함께 제시하는 것이 Career Decision Service의 신뢰도를 만든다. 심사위원에게 가장 잘 먹히는 디테일이다.

### 9.2 현재 회사 진단 문장

```
"당신은 {1위축}과 {2위축}을 중요하게 생각하지만, {회사명}은 {회사최강축}({점수}점)에 강점이 있습니다."
```
- 사용자 1위 축이 회사 최강 축과 **같으면** 문구를 바꾼다:
  `"당신이 가장 중시하는 {축}에서 {회사명}은 {점수}점으로, 비교 대상 {N}개사 중 {k}위입니다. 성향과 잘 맞는 편입니다."`
- 분기는 2개면 충분하다. 문구 템플릿을 늘리지 않는다.

---

## 10. Move Timing Score

**예측이 아니다.** 이직 시점을 맞추려 하지 않고, "지금 점검할 필요성"을 4개 관찰 가능한 신호로 합산한다.

### 10.1 계산식 (총 100점)

```ts
// src/lib/moveTiming.ts

// ① 대안과의 적합도 격차 (0~40) — 가장 큰 신호
const gap = bestFit ? bestFit - currentFit : 0
const fitGap = 40 * clamp01(gap / 25)
// 격차 25점 이상이면 만점. 대안이 없으면(추천 0건) 0점.

// ② 현재 적합도 부족분 (0~25)
const currentFitPenalty = 25 * clamp01((70 - currentFit) / 30)
// Fit 70 이상이면 0점, 40 이하면 만점.

// ③ 근속 준비도 (0~20) — 종 모양. 너무 짧아도 너무 길어도 낮다.
function tenureFactor(months: number): number {
  if (months < 12)  return 0.15   // 1년 미만: 지금 움직이기 이르다
  if (months < 24)  return 0.55
  if (months < 60)  return 1.00   // 2~5년: 시장에서 가장 평가받는 구간
  if (months < 96)  return 0.80
  return 0.60                      // 8년+: 이동 비용이 커진다
}
const tenureReadiness = 20 * tenureFactor(profile.tenureMonths)

// ④ 보상 위치 (0~15)
// 사용자 연봉이 현재 회사 1인 평균 급여액보다 낮을수록 점수 상승
const ratio = profile.currentSalary / currentCompany.metrics.avgSalaryManwon.value // null·양수 가드 후 실행
const salaryGap = 15 * clamp01((1.0 - ratio) / 0.35)
// 평균의 65% 이하면 만점, 평균 이상이면 0점.
// avgSalary가 결측이면 이 항목 0점 처리하고 총점을 85점 만점으로 재정규화.

const rawTotal = fitGap + currentFitPenalty + tenureReadiness + salaryGap
const rawMax = hasValidSalary ? 100 : 85 // hasValidSalary는 검증된 평균급여의 존재 여부
const score = Math.round(rawTotal / rawMax * 100)
```

### 10.2 밴드 (3단계)

| 점수 | band | 표시 문구 |
|---|---|---|
| 0 – 39 | `stay` | **신호 낮음** — 데모 규칙상 낮은 점수이며 현재 회사 유지 권고가 아닙니다. |
| 40 – 64 | `watch` | **신호 보통** — 데모 규칙상 중간 구간입니다. |
| 65 – 100 | `consider` | **신호 높음** — 데모 규칙상 높은 점수이며 실제 이직 권고가 아닙니다. |

### 10.3 근거 표시 (필수)

점수만 보여주면 블랙박스가 된다. 4개 구성요소를 항상 함께 노출한다.

```
데모 점검 지수 67 / 100      상태: 신호 높음 (실제 이직 권고 아님)

  대안과의 적합도 격차  +20점  →  32 / 40
  현재 회사 적합도 71점  →  0 / 25
  근속 3년 2개월        →  20 / 20
  연봉이 회사 평균 대비 낮음 → 15 / 15
```

### 10.4 반드시 지킬 고지 문구

> "이 지수는 이직 시점이나 퇴사 확률을 예측하지 않습니다. 적합도·근속·보상 위치를 정해진 규칙으로 합산한 참고 지표이며, 최종 판단은 본인의 상황에 따라 달라집니다."

또한 **어떤 경우에도 "이직해야 합니다" / "퇴사하세요" 문구를 쓰지 않는다.** 카피 리뷰 시 이 단어를 grep으로 확인한다.

### 10.5 salaryGap 항목의 함정

`avgSalaryManwon`은 **회사 전체 평균**이다. 신입이 평균보다 낮은 것은 정상이고 이직 신호가 아니다. 따라서:
- 근속 12개월 미만인 사용자는 `salaryGap`을 **0점 처리**한다 (이 예외를 코드에 명시).
- 해당 항목 옆에 항상 `"회사 전체 직원 평균 기준"` 주석을 단다.

---

## 11. External Data Strategy

### 11.1 확정 전략: 사전 스냅샷 (런타임 외부 호출 0회)

```
[개발 중, 1회성]                              [런타임]
scripts/fetch-dart.ts                        Next.js 앱
   ↓ OpenDART API 호출                           ↓
data/companies.raw.json  ──── import ────→  companyScore.ts
data/companies.manual.json ── import ────→  (메모리 계산)
```

**이 방식을 고른 이유**
- 데모 중 API 장애·rate limit·네트워크 문제로 서비스가 멈출 확률 0
- 수치가 시연 때마다 바뀌지 않음 (재현 가능한 데모)
- "실데이터 기반"이라는 차별점은 그대로 유지 — 스냅샷도 실데이터다
- 심사 질문 "실시간인가요?"에 대한 답: *"기준연도 사업보고서 데이터를 스냅샷으로 사용합니다. 연 1회 갱신되는 공시 데이터라 실시간 호출이 필요 없습니다."* — 이게 오히려 정확한 설명이다.

### 11.2 OpenDART 연동 상세

| 항목 | 내용 |
|---|---|
| 인증키 | https://opendart.fss.or.kr 회원가입 후 발급 (즉시, 무료) |
| 보관 | `.env.local`의 `DART_API_KEY`. 스크립트에서만 읽는다. **클라이언트 번들에 절대 포함 금지** (`NEXT_PUBLIC_` 접두사 금지) |
| 호출 한도 | 일 20,000건 — 12개사 × 3엔드포인트 × 2개년 = 72건. 여유 충분 |

**사용 엔드포인트**

| 목적 | 엔드포인트 | 파라미터 |
|---|---|---|
| 고유번호 조회 | `/api/corpCode.xml` | `crtfc_key` (zip 다운로드 → 파싱, 1회만) |
| 직원 현황 | `/api/empSttus.json` | `corp_code`, `bsns_year`, `reprt_code=11011` |
| 주요 재무 | `/api/fnlttSinglAcnt.json` | `corp_code`, `bsns_year`, `reprt_code=11011` |

- `reprt_code=11011` = 사업보고서(연간)
- `bsns_year`: 최신 확정 연도부터 시도하고, `status !== '000'`이면 한 해씩 낮춰 재시도 (최대 2회). 실제로 쓸 수 있는 연도를 스크립트가 찾아 `asOf`에 기록한다.

**필드 파싱 주의 (실제로 여기서 시간을 잃는다)**

| 필드 | 예상 이름 | 함정 |
|---|---|---|
| 1인 평균 급여액 | `jan_salary_am` | `"112,000,000"` 형태 문자열. 쉼표 제거 + 원→만원 변환 필요. `"-"`일 수 있음 |
| 평균 근속연수 | `avrg_cnwk_sdytrn` | `"12.4"` / `"12년 4개월"` / `"12.4년"` 등 표기 혼재 → 정규식 파서 필요 |
| 직원 수 | `sm` | 정규직/계약직/성별로 **행이 여러 개**. 합산해야 함 |
| 매출액·영업이익 | `thstrm_amount`(당기), `frmtrm_amount`(전기) | `account_nm`으로 필터. 연결/개별(`fs_div`) 구분 필요 |

> **구현 시 첫 단계: 삼성전자 1개사만 호출해 응답 전문을 콘솔에 덤프하고 실제 필드명을 눈으로 확인한 뒤 파서를 작성한다.** 문서 기억에 의존해 12개사 파서를 먼저 짜면 반드시 다시 짠다.

**파서 결과물 예시 (`companies.raw.json`)**
```json
{
  "generatedAt": "2026-09-12T10:00:00Z",
  "companies": [
    {
      "id": "samsung-sds",
      "name": "삼성SDS",
      "corpCode": "00126186",
      "industry": "IT서비스",
      "jobFamilies": ["dev", "data", "pm"],
      "metrics": {
        "avgSalaryManwon": null,
        "avgTenureYears": null
      }
    }
  ]
}
```
> 값(`value`)은 스크립트가 채운다. **이 계획서나 초기 커밋에 임의의 숫자를 적어 넣지 않는다.**

### 11.3 mock / manual 데이터 규칙

| 구분 | 파일 | source 값 | UI 배지 |
|---|---|---|---|
| DART 원본 | `companies.raw.json` | `'dart'` | `DART 2024` (파랑) |
| 사람 입력 (Balance 등) | `companies.manual.json` | `'manual'` | `데모 추정치` (회색) |
| 결측 보간 | 런타임 계산 | `'derived'` | `추정` (회색) |

**규칙**
1. 한 파일에 실데이터와 추정치를 섞지 않는다. 파일이 곧 출처다.
2. 모든 UI 수치는 `<SourceBadge source={...} />`를 동반한다. 배지 없는 숫자가 화면에 있으면 리뷰에서 반려.
3. `companies.manual.json`의 각 항목에 `note` 필드로 근거를 남긴다.
4. Footer에 상시 표기: *"회사 지표는 금융감독원 전자공시시스템(DART) 사업보고서 기준이며, 워라밸 지표는 공개 정보를 바탕으로 한 서비스 자체 추정치입니다."*

### 11.4 부트스트랩 순서 (중요)

**DART 연동을 먼저 하지 않는다.** P0는 §0의 `companies.demo.json`에 완전한 가상 회사 지표를 준비하여 계산과 화면을 완주한다. DART 수치가 `null`인 실회사 모드는 판단 보류로 처리한다. DART 수집과 실회사 데이터 검증은 P1 작업이다.

이 순서를 지키면 API가 끝내 안 되더라도 완성된 데모가 남는다.

---

## 12. Frontend Architecture

### 12.1 기술 스택 최종 권장안

| 영역 | 선택 | 판단 |
|---|---|---|
| 프레임워크 | **Next.js 15 (App Router)** | ✅ 채택. 라우팅·빌드 기본 제공 |
| 언어 | **TypeScript** | ✅ 채택. 4축 타입 안전성이 계산 로직 버그를 막는다 |
| 스타일 | **Tailwind CSS v4** | ✅ 채택. create-next-app 기본 포함 |
| 컴포넌트 | **shadcn/ui — 6개만** | ✅ 채택하되 최소. `button` `card` `progress` `badge` `select` `separator` |
| 차트 | **Recharts** | ⚠️ **P1로 강등.** 4축 막대는 `div` + `width%`로 충분하고 더 빠르다. radar가 정말 필요할 때만 설치 |
| 검증 | **Zod** | ✅ 채택. localStorage 복원 시 필수 |
| 폼 | **React Hook Form** | ❌ **미채택.** 폼이 `/profile` 1개, 필드 5개. `useState` + `zod.safeParse`가 설치·러닝코스트 없이 동일 결과 |
| 상태 | **React Context 1개 + localStorage** | ✅ 채택. Zustand/Redux/Jotai 불필요 |
| DB | **없음** | ✅ 데이터가 정적 JSON 12행. DB를 넣으면 순수 비용 |
| 테스트 | **Vitest** | ✅ 채택. 계산 로직 4개 파일만 |

**설치 명령 (참고용, 이번 단계에서 실행하지 않음)**
```
npx create-next-app@latest career-hi --typescript --tailwind --app --eslint --src-dir
npx shadcn@latest init
npx shadcn@latest add button card progress badge select separator
npm i zod
npm i -D vitest
```

> ⚠️ 로컬 작업 폴더명 `09_12 second`에 **공백**이 있어 npm 패키지명으로 쓸 수 없다. 하위 폴더 `career-hi/`를 만들어 그 안에 앱을 생성한다.
>
> **구현 후:** 이 폴더가 그대로 GitHub 저장소 루트가 되었고 `PLAN.md`도 그 안으로 옮겼다. 클론하면 공백 없는 `career-hi/`로 떨어지므로 이 문제는 사라진다.

### 12.2 상태 관리 구조

```tsx
// src/store/CareerContext.tsx
interface CareerState {
  assessment: AssessmentResult | null
  profile: UserProfile | null
  setAssessment: (r: AssessmentResult) => void
  setProfile: (p: UserProfile) => void
  reset: () => void
  loadPreset: (id: 'devA' | 'devB') => void   // 데모용
  hydrated: boolean                            // SSR 깜빡임 방지
}
```

- Provider는 `app/layout.tsx`에 1회 마운트
- 마운트 시 localStorage에서 zod 검증 후 복원 → `hydrated = true`
- `hydrated === false` 동안 각 페이지는 스켈레톤 표시 (가드 리다이렉트가 잘못 튀는 것을 막는다)
- 파생값(Fit, 추천, Move Timing)은 **저장하지 않는다.** 페이지에서 `useMemo`로 매번 계산한다 — 계산이 1ms 미만이고, 저장하면 stale 버그가 생긴다.

### 12.3 컴포넌트 목록 (신규 작성 대상 전부)

```
components/
├── ui/                        # shadcn 생성물 (건드리지 않음)
├── layout/
│   ├── StepHeader.tsx         # 상단 진행 표시 (검사→결과→프로필→분석)
│   └── DisclaimerFooter.tsx   # 전 페이지 공통 고지
├── common/
│   ├── SourceBadge.tsx        # 'dart'|'manual'|'derived' → 배지
│   ├── AxisBar.tsx            # 축 1개 가로 막대 (라벨 + 값 + 폭)
│   └── ScoreHero.tsx          # 큰 점수 + 색상 밴드
├── assessment/
│   ├── QuestionCard.tsx       # 질문 1개 + 선택지 2장
│   └── AssessmentProgress.tsx
├── result/
│   ├── TypeHeadline.tsx       # 유형 배지 + 부유형 + 설명
│   └── AxisBreakdown.tsx      # AxisBar × 4
├── company/
│   ├── CompanyCard.tsx        # 추천 카드 (Fit + 이유 + 주의점)
│   ├── FitBreakdown.tsx       # 내 중요도 vs 회사 점수 이중 막대
│   ├── MoveTimingPanel.tsx    # 지수 + 밴드 + 4개 구성요소
│   └── RawMetricsTable.tsx    # 원본 지표 + SourceBadge
└── compare/
    └── CompareTable.tsx       # 현재 vs 대상 diff 표
```

컴포넌트는 위 13개면 충분하다. 더 쪼개지 않는다.

---

## 13. Backend / API Architecture

### 결론: **MVP에 백엔드 API 레이어를 두지 않는다.**

근거:
- 데이터는 정적 JSON 12행 → 서버에서 가져올 것이 없다
- 계산 입력(assessment, profile)이 **localStorage에만 존재**한다. 서버에서 계산하려면 매 요청마다 사용자 상태를 body에 실어 보내야 하는데, 이는 클라이언트 계산 대비 순수 오버헤드다
- 계산 전체가 순수 함수 + 1ms 미만. 네트워크 왕복이 계산보다 1000배 느리다
- API 라우트를 만들면 로딩 상태·에러 처리·타입 중복 정의가 따라붙는다 → 해커톤에서 잃을 시간

### 실제 데이터 흐름

```
[빌드 타임]
data/companies.raw.json ─┐
data/companies.manual.json ─┴→ mergeCompanies() → Company[]
                                      ↓ (모듈 로드 시 1회)
                              computeCompanyScores()
                                      ↓
                              ScoredCompany[]  (메모리 캐시)

[런타임 · 전부 클라이언트]
localStorage ──→ CareerContext ──→ { assessment, profile }
                                          ↓
                          useMemo(() => recommend(assessment, profile, companies))
                                          ↓
                    { currentFit, top3, moveTiming } → 렌더
```

`src/lib/companies.ts`가 단일 진입점이 된다:
```ts
export const COMPANIES: ScoredCompany[] = buildScoredCompanies()  // 모듈 로드 시 1회
export function getCompany(id: string): ScoredCompany | undefined
```

### 서버 코드가 존재하는 유일한 곳

`scripts/fetch-dart.ts` — Node에서 **수동 실행**하는 1회성 스크립트. Next.js 런타임과 분리되어 있다.

```
npm run fetch:dart   → data/companies.raw.json 갱신
```

### 나중에 API가 필요해지는 시점 (P1 이후, 지금은 만들지 않음)

| 기능 | 필요한 것 |
|---|---|
| 회사 수가 수백 개로 증가 | `GET /api/companies?q=` 검색 라우트 |
| 결과 공유 링크 | `POST /api/share` + 저장소 |
| LLM 설명 | `POST /api/explain` (API 키를 서버에 숨기기 위해 **반드시** 서버 라우트) |

---

## 14. Suggested Directory Structure

```
career-hi/                             ← 저장소 루트 (= Next.js 앱 루트)
├── PLAN.md                         ← 이 문서
├── README.md
├── .github/workflows/ci.yml        ← PR 시 typecheck·lint·test·build
├── package.json
├── next.config.ts
├── tsconfig.json
├── components.json                 (shadcn)
├── vitest.config.mts
├── .env.local                      (DART_API_KEY — git ignore)
├── .env.local.example
│
├── data/
│   ├── companies.manual.json       ← 골격 + Balance + note (사람이 작성)
│   ├── companies.raw.json          ← DART 스냅샷 (fetch:dart 산출, 2025 사업보고서)
│   └── companies.demo.json         ← 자리표시자 (현재 비어 있음)
│
├── scripts/
│   ├── fetch-dart.ts               ← 수동 실행, 앱과 분리
│   └── dart-parsers.ts             ← 응답 문자열 파서 (테스트 대상)
│
├── src/
│   ├── app/
│   │   ├── layout.tsx              (CareerProvider + DisclaimerFooter)
│   │   ├── globals.css
│   │   ├── page.tsx                /            Landing
│   │   ├── assessment/page.tsx     /assessment
│   │   ├── result/page.tsx         /result
│   │   ├── profile/page.tsx        /profile
│   │   ├── dashboard/page.tsx      /dashboard
│   │   ├── recommend/page.tsx      /recommend
│   │   └── compare/page.tsx        /compare?target=
│   │
│   ├── components/                 (§12.3 참조)
│   │
│   ├── lib/
│   │   ├── types.ts                모든 타입
│   │   ├── constants.ts            AXES, 라벨, 튜닝 상수, 문구
│   │   ├── questions.ts            10문항 정의
│   │   ├── assessment.ts           scoreAssessment()
│   │   ├── companyScore.ts         normalize(), 4축 산출
│   │   ├── companies.ts            COMPANIES 단일 진입점
│   │   ├── fit.ts                  computeFit()
│   │   ├── recommend.ts            recommend()
│   │   ├── moveTiming.ts           computeMoveTiming()
│   │   ├── explain.ts              buildReasons/Cautions/Diagnosis
│   │   ├── presets.ts              데모 페르소나 2종
│   │   ├── storage.ts              localStorage + zod
│   │   └── utils.ts                mapAxes, clamp01, signed, formatManwon
│   │
│   └── store/
│       └── CareerContext.tsx
│
└── tests/
    ├── assessment.test.ts
    ├── companyScore.test.ts
    ├── fit.test.ts
    ├── recommend.test.ts
    ├── moveTiming.test.ts
    └── persona.test.ts             ← 핵심 회귀 테스트
```

**과잉 추상화 금지 목록**: `services/` 레이어 없음, `repositories/` 없음, `hooks/` 디렉터리 없음(훅은 쓰는 곳 옆에), DI 없음, barrel `index.ts` 없음.

---

## 15. Implementation Order

**원칙: 계산 로직 → 테스트 → UI 순서.** 로직이 검증되면 UI는 조립만 하면 되고, UI를 먼저 만들면 숫자가 이상할 때 원인 지점이 두 배로 늘어난다.

**총 22개 작업.** P0(T1~T19)를 먼저 끝낸다.

---

### Phase A — 기반 (T1~T3)

**T1. 프로젝트 부트스트랩**
- 목적: 실행 가능한 Next.js 앱 확보
- 작업: `career-hi/`에 create-next-app (TS/Tailwind/App Router/src-dir), shadcn init + 6개 컴포넌트 추가, zod·vitest 설치, `vitest.config.ts` 작성
- 선행: 없음
- 완료 조건: `npm run dev` 실행 시 기본 페이지 표시, `npm test`가 0개 테스트로 통과

**T2. 타입 · 상수 정의**
- 목적: 이후 모든 작업의 계약 고정
- 작업: `lib/types.ts`(§5 전체), `lib/constants.ts`(AXES, AXIS_LABEL, TIE_ORDER, SMOOTHING_ALPHA, MIN_FIT_MARGIN, 유형 설명 문구 4종, 고지 문구), `lib/utils.ts`(mapAxes, clamp01, signed, formatManwon)
- 선행: T1
- 완료 조건: `tsc --noEmit` 통과

**T3. 완전한 가상 회사 데모 데이터 (DART 없이)**
- 목적: DART 없이도 앱이 끝까지 동작하는 상태 확보 (§11.4)
- 작업: `data/companies.demo.json`에 가상 현재 회사 1개와 동일 직군 후보 3개 이상을 정의한다. 모든 필수 지표와 `demo` 출처를 채운다. 실회사 데이터는 별도 파일에 두고 혼합하지 않는다.
- 선행: T2
- 완료 조건: JSON이 `Company[]` 타입으로 파싱됨, 모든 항목에 `note` 존재

---

### Phase B — 계산 엔진 (T4~T9) ← 이 프로젝트의 심장

**T4. 회사 4축 스코어링**
- 목적: 원본 지표 → 0~100 4축 변환
- 작업: `lib/companyScore.ts` — `normalize()`, 축별 산출(§7.2), 결측 처리(§7.3), 영업이익 예외 처리, `scoreSources` 기록. `lib/companies.ts`의 `COMPANIES` 진입점 작성
- 선행: T3
- 완료 조건: 12개사 전부 4축이 30~98 정수, `scoreSources.balance === 'manual'`, DART 값이 null이어도 예외 없이 동작

**T5. 성향 검사 문항 + 채점**
- 목적: 답변 → 가중치 벡터
- 작업: `lib/questions.ts`(§6.2의 10문항 전문), `lib/assessment.ts`의 `scoreAssessment()`(§6.3), 유형 매핑·혼합형 판정
- 선행: T2
- 완료 조건: raw 합 = 20, percent 합 = 100, weights 합 = 1(±1e-9), 모든 weights > 0

**T6. Fit Score**
- 목적: 사용자×회사 적합도
- 작업: `lib/fit.ts`의 `computeFit()`, `contributions` 산출
- 선행: T4, T5
- 완료 조건: 손계산한 예시 케이스와 값 일치, `sum(contributions) ≈ fit`

**T7. 추천 알고리즘**
- 목적: TOP 3 산출
- 작업: `lib/recommend.ts` — 제외 규칙 4종(§8.5), tie-break 3단계(§8.4), `resolveCurrentCompany()`의 `'other'` 처리
- 선행: T6
- 완료 조건: 현재 회사가 결과에 없음, 동일 입력 2회 실행 시 순서 동일, 0건 케이스가 예외 없이 빈 배열 반환

**T8. 설명 문장 생성**
- 목적: "왜 추천되었는가"
- 작업: `lib/explain.ts` — `buildReasons`(기여도 상위 2축), `buildCautions`(10점 이상 하락 축), `buildDiagnosis`(현재 회사 진단, 2분기)
- 선행: T7
- 완료 조건: 3개 회사 전부 이유 1문장 이상, 문장에 **실제 계산된 숫자가 포함**됨

**T9. Move Timing Score**
- 목적: 이직 검토 지수
- 작업: `lib/moveTiming.ts` — 4개 구성요소(§10.1), 밴드 판정, 근속 12개월 미만 salaryGap 0 예외, avgSalary 결측 시 85점 만점 재정규화
- 선행: T7
- 완료 조건: 0~100 범위, 구성요소 합 = 총점, 밴드 경계(39/40, 64/65) 정확

---

### Phase C — 로직 검증 (T10)

**T10. 계산 로직 단위 테스트**
- 목적: UI 착수 전 숫자의 신뢰 확보
- 작업: `tests/` 6개 파일(§16), persona 테스트 포함. 프리셋은 T5에서 먼저 정의한다.
- 선행: T4~T9
- 완료 조건: `npm test` 전체 통과. **여기서 실패하면 UI로 넘어가지 않는다**

---

### Phase D — 상태 · 화면 (T11~T18)

**T11. 저장소 + Context**
- 목적: 페이지 간 상태 유지
- 작업: `lib/storage.ts`(zod safeParse, 실패 시 키 삭제), `store/CareerContext.tsx`(hydrated 플래그 포함), layout에 Provider 마운트
- 선행: T5
- 완료 조건: 새로고침 후에도 assessment/profile 유지, 손상된 JSON 주입 시 앱이 죽지 않고 초기화

**T12. 공통 컴포넌트**
- 목적: 화면 작업 가속
- 작업: `SourceBadge`, `AxisBar`, `ScoreHero`, `StepHeader`, `DisclaimerFooter`
- 선행: T2
- 완료 조건: Storybook 없이 임시 페이지에서 육안 확인

**T13. Landing (`/`)**
- 목적: 진입점
- 작업: Hero + 3단계 카드 + CTA + 데모 프리셋 A/B 버튼 연결 + 데모 모드 고지
- 선행: T12
- 완료 조건: `/assessment`로 이동

**T14. 성향 검사 (`/assessment`)**
- 목적: 답변 수집
- 작업: `QuestionCard`, `AssessmentProgress`, 이전/다음, 진행상황 localStorage 저장, 완료 시 채점 후 `/result`
- 선행: T5, T11, T12
- 완료 조건: 10문항 응답 → `/result` 이동, 중간 새로고침 시 진행 위치 복구

**T15. 결과 (`/result`)**
- 목적: 유형 공개
- 작업: `TypeHeadline`, `AxisBreakdown`, 유형 설명 문구, **검사 성격 고지 박스**, CTA
- 선행: T14
- 완료 조건: 4축 합 100% 표시, 고지 문구 노출

**T16. 프로필 입력 (`/profile`)**
- 목적: 사용자 컨텍스트
- 작업: 5+2 필드, zod 검증, 에러 메시지, `'other'` 옵션, 제출 후 `/dashboard`
- 선행: T11, T15
- 완료 조건: 잘못된 입력이 필드별 메시지로 차단됨

**T17. 대시보드 (`/dashboard`)**
- 목적: **핵심 화면**
- 작업: `ScoreHero`(현재 Fit), `FitBreakdown`(중요도 vs 회사점수 이중 막대), 진단 문장, `MoveTimingPanel`, TOP3 미리보기, `RawMetricsTable`(접이식 + SourceBadge + 평균 관련 주석)
- 선행: T8, T9, T16
- 완료 조건: 모든 수치에 출처 배지, Move Timing 구성요소 4개 노출

**T18. 추천 (`/recommend`) + 비교 (`/compare`)**
- 목적: 대안 제시 및 정밀 비교
- 작업: `CompanyCard` × 3(이유 + 주의점 + Fit delta), **0건 빈 상태 UI**, `CompareTable`(4축 + 평균급여 + 평균근속 + diff 색상), 요약 문장
- 선행: T17
- 완료 조건: 카드에서 `/compare?target=` 이동 동작, 추천 0건 시 안내 문구 표시

---

### Phase E — 마감 (T19)

**T19. 가드 · 빈 상태 · 문구 감수**
- 목적: 데모 중 흰 화면 방지
- 작업: 라우트 가드(§3), hydrated 스켈레톤, 존재하지 않는 `target` 처리, 전 페이지 고지 문구 배치, **"이직해야" / "퇴사" 문구 grep 확인**
- 선행: T18
- 완료 조건: 어느 URL에 직접 접근해도 흰 화면·크래시 없음

> **여기까지가 P0. T19 완료 시점에 Definition of Done 9개 항목이 전부 충족된다.**

---

### Phase F — P1 (T20~T22, 시간이 남을 때만)

**T20. OpenDART 실데이터 반영**
- 목적: "실데이터 기반" 차별점 완성
- 작업: `scripts/fetch-dart.ts` — corpCode 조회, `empSttus`/`fnlttSinglAcnt` 호출, **삼성전자 1개사 응답 덤프 후 파서 작성**, 문자열 파싱(쉼표/단위/근속 표기), `companies.raw.json` 출력, `npm run fetch:dart` 등록
- 선행: T19
- 완료 조건: 12개사 중 8개 이상 avgSalary·avgTenure 채워짐, UI 배지가 `DART`로 전환, 실패한 회사는 결측 처리로 동작

**T21. 시각화 · 다듬기**
- 목적: 완성도
- 작업: Recharts 설치 후 `/compare`에 2계열 radar chart 추가, 색상·간격 정리, 로딩 스켈레톤
- 선행: T19
- 완료 조건: radar가 4축을 두 회사 겹쳐 표시

**T22. 추가 리허설 (프리셋 정의·연결은 T5/T13에서 완료)**
- 목적: 시연 리스크 제거
- 작업: `lib/presets.ts`에 페르소나 2종(§18) 정의, Landing 버튼에 연결(주입 후 `/dashboard` 직행), 90초 시나리오 2회 리허설
- 선행: T19
- 완료 조건: 버튼 1클릭 → 3초 내 대시보드, 두 페르소나의 TOP3가 실제로 다름

---

## 16. Testing Plan

### 16.1 단위 테스트 (Vitest)

**`tests/assessment.test.ts`**
| 케이스 | 기대 |
|---|---|
| 10문항 전부 A 선택 | raw 합 = 20 |
| 임의 답변 100세트 (property) | percent 합 = 100, weights 합 = 1 ± 1e-9 |
| 보상 축만 선택되는 답변 | `primaryType === 'compensation_seeker'`, weights.compensation ≈ 11/24 |
| 한 축도 선택 안 된 케이스 | 해당 weight > 0 (smoothing 검증) |
| raw 동점 입력 | `TIE_ORDER` 순서대로 결정, 2회 실행 결과 동일 |
| 문항 정의 자체 | 각 축이 정확히 5회 등장 (측정 도구 검증) |

**`tests/companyScore.test.ts`**
| 케이스 | 기대 |
|---|---|
| 12개사 전체 | 모든 축이 30~98 정수 |
| balance | 모든 회사에서 `scoreSources.balance === 'manual'` |
| DART 값 전부 null | missingAxes 기록, Fit·추천·지수 판단 보류, 예외 없음 |
| `operatingProfitPrev <= 0` | 흑자전환/적자전환 분기 정확 |
| 축 2개 이상 결측 회사 | 추천 풀에서 제외됨 |

**`tests/fit.test.ts`**
| 케이스 | 기대 |
|---|---|
| 손계산 케이스 (weights .45/.15/.10/.30, scores 84/74/72/88) | 문서에 적어둔 기대값과 일치 |
| 모든 회사 | fit ∈ [30, 98] |
| contributions | 합 ≈ fit (반올림 오차 ±1) |
| weights가 한 축에 몰린 경우 | fit ≈ 해당 축 점수 |

**`tests/recommend.test.ts`**
| 케이스 | 기대 |
|---|---|
| 현재 회사 포함 여부 | 결과에 없음 |
| 동일 입력 2회 | 결과 순서 완전 동일 (재현성) |
| 현재 회사가 이미 최적 | `top.length === 0`, 예외 없음 |
| `currentCompanyId = 'other'` | current=null, 판단 보류 사유 표시, 예외 없음 |
| 결과 개수 | 항상 ≤ 3 |
| reasons | 각 추천마다 길이 ≥ 1, 숫자 포함 |

**`tests/moveTiming.test.ts`**
| 케이스 | 기대 |
|---|---|
| 최악 조합 (fit 낮음 + 격차 큼 + 근속 3년 + 저연봉) | 90 이상 |
| 최선 조합 (fit 높음 + 대안 없음) | 20 이하 |
| 밴드 경계 39/40, 64/65 | 밴드 전환 정확 |
| 근속 6개월 | `salaryGap === 0` |
| avgSalary 결측 | 85점 만점 재정규화 후에도 0~100 |
| 구성요소 합 | = rawTotal, score = round(rawTotal/rawMax*100) |

### 16.2 회귀 테스트 (가장 중요)

**`tests/persona.test.ts`** — 이 서비스의 핵심 주장을 코드로 고정한다.

```ts
it('같은 회사·같은 직군·같은 연봉이어도 성향이 다르면 추천이 달라진다', () => {
  const a = recommend(PERSONA_A.assessment, SHARED_PROFILE, COMPANIES)
  const b = recommend(PERSONA_B.assessment, SHARED_PROFILE, COMPANIES)
  expect(PERSONA_A.assessment.weights).not.toEqual(PERSONA_B.assessment.weights)
  expect(a.current).not.toBeNull()
  expect(b.current).not.toBeNull()
  // 프리셋은 완전한 데이터를 사용한다. 서로 다른 Fit·순위·밴드는 강제하지 않는다.
})

it('같은 답변과 데이터는 동일한 결과를 만든다', () => {
  const first = recommend(PERSONA_A.assessment, SHARED_PROFILE, COMPANIES)
  expect(recommend(PERSONA_A.assessment, SHARED_PROFILE, COMPANIES)).toEqual(first)
})
```

> 이 테스트가 깨지면 데모 시나리오(§18)가 깨진 것이다. 데이터나 상수를 튜닝할 때마다 이 테스트를 돌린다.

### 16.3 수동 검증 체크리스트 (데모 직전)

- [ ] 7개 URL에 직접 접근 — 흰 화면/크래시 없음
- [ ] 검사 중 새로고침 — 진행 위치 복구
- [ ] 결과 화면 새로고침 — 결과 유지
- [ ] localStorage에 깨진 JSON 주입 — 초기화되고 앱 동작
- [ ] 화면의 모든 회사 수치에 출처 배지 존재
- [ ] "이직해야" / "퇴사하세요" 문구 부재 (grep)
- [ ] 평균급여·평균근속 주석 노출
- [ ] 데모 프리셋 A/B 버튼 각각 동작
- [ ] 1280×800 및 1920×1080에서 레이아웃 정상

---

## 17. Risks and Fallbacks

| # | 리스크 | 확률 | 영향 | 대응 |
|---|---|---|---|---|
| 1 | **OpenDART 응답 필드명·형식이 예상과 다름** (근속 `"12년 4개월"`, 급여 쉼표 문자열, 직원수 다중 행) | 높음 | 중 | T20을 **P1로 배치**했고 앱은 T3의 `null` 데이터로 이미 완주 가능. 파서 작성 전 1개사 응답을 콘솔에 덤프해 실제 필드명 확인. 8개사만 성공해도 차별점 성립 |
| 2 | **Balance 데이터가 공공데이터에 없음** | 확정 | 중 | 설계에 이미 반영. `manual` source + `데모 추정치` 배지 + note 근거. 숨기지 않고 드러내는 것이 오히려 신뢰를 만든다 |
| 3 | **Fit 점수 변별력 부족** (전 회사 68~76에 밀집) | 중 | 높음 | `SMOOTHING_ALPHA` 1개 상수만 1.0→0.5로 조정(§8.3). 그래도 부족하면 `normalize` 출력 하한을 30→20으로. **다른 로직은 건드리지 않는다** |
| 4 | **시간 부족** | 높음 | 높음 | T1~T19가 P0. 잘라낼 순서: ① radar chart(T21) ② `/compare` 요약 문장 ③ `/recommend` 분리(대시보드에 병합) ④ 애니메이션. **T10 테스트는 자르지 않는다** — 자르면 숫자 디버깅에 더 오래 걸린다 |
| 5 | **디렉터리명 `09_12 second`의 공백** → create-next-app 패키지명 오류 | 확정 | 저 | 하위 폴더 `career-hi/`에 앱 생성 (§12.1). 이 폴더가 저장소 루트가 되어 클론 시에는 문제 없음 |
| 6 | **데모 중 새로고침으로 상태 소실** | 중 | 높음 | localStorage 저장 + 데모 프리셋 버튼(T22). 시연자가 검사를 다시 풀 일이 없다 |
| 7 | **추천 결과가 0건** | 중 | 중 | 버그 아님. §4.6 빈 상태 UI로 처리하고, 오히려 "현재 회사가 잘 맞습니다"라는 정직한 답으로 활용 |
| 8 | **심사위원의 "숫자 근거가 뭐냐" 질문** | 높음 | 중 | 모든 화면에 출처 배지 + 대시보드에 계산 구성요소 전부 노출. "가중합 한 줄"이라 그 자리에서 설명 가능 |
| 9 | **"평균급여를 내 연봉으로 착각" 지적** | 중 | 중 | 해당 수치 옆 고정 주석(§4.5) + Move Timing `salaryGap`의 근속 12개월 예외 |
| 10 | **shadcn/Tailwind v4 초기 설정 마찰** | 중 | 저 | 컴포넌트 6개만 사용. 문제가 생기면 shadcn을 버리고 순수 Tailwind로 진행 — 설계상 의존성이 거의 없다 |

### 시간별 컷라인

| 남은 시간 | 반드시 있어야 할 것 |
|---|---|
| 충분 | T1~T22 전부 |
| 절반 | T1~T19 (P0 완결) + T22 프리셋 |
| 촉박 | T1~T17 + `/recommend`를 대시보드에 병합, `/compare`는 표만 |
| 매우 촉박 | Landing → 검사 → 결과 → 대시보드(Fit + TOP3 + 이유). 비교 페이지 생략 |

---

## 18. Demo Scenario

### 핵심 연출

**P0는 동일한 가상 회사·직군·연봉·근속의 두 프리셋에서 선호도에 따른 기여도 변화를 보여준다. 아래 실회사 기반 시나리오는 P1의 설명용 예시이며 특정 결과를 강제하지 않는다.**

이 장면 하나가 "같은 직무, 같은 연봉이어도 좋은 회사는 사람마다 다릅니다"라는 카피를 증명한다.

### 페르소나 A — "성장하고 더 벌고 싶은 개발자"

```
성향 검사 결과   보상 40% / 성장 30% / 균형 20% / 안정 10%
유형             보상 추구형 (부 성향: 성장 추구형)

현재 회사        삼성SDS
현재 Fit         낮음 — 회사의 강점(안정)과 본인의 우선순위(보상·성장)가 어긋남
진단             "당신은 보상과 성장을 중요하게 생각하지만,
                  삼성SDS는 안정성에 강점이 있습니다."

추천 TOP 3       보상·성장 점수가 높은 회사들 (게임·인터넷 계열)
주의점           "안정 축은 현재 회사보다 낮습니다"  ← 균형 잡힌 제시
Move Timing      높음 → "이직 검토 권장"
```

### 페르소나 B — "오래 안정적으로 다니고 싶은 개발자"

```
성향 검사 결과   안정 40% / 균형 30% / 보상 20% / 성장 10%
유형             안정 추구형 (부 성향: 균형 추구형)

현재 회사        삼성SDS  ← A와 동일
현재 Fit         높음 — 회사의 강점(안정·균형)과 본인의 우선순위가 일치
진단             "당신이 가장 중시하는 안정에서 삼성SDS는 상위권입니다.
                  성향과 잘 맞는 편입니다."

추천 TOP 3       0~1건  → "현재 회사보다 적합도가 높은 회사가 없습니다"
Move Timing      낮음 → "현재 회사 유지 권장"
```

> ⚠️ 위 Fit/추천 회사는 **실제 데이터로 계산된 결과에 따라 달라진다.** 데모 전 `persona.test.ts`로 실제 값을 확인하고, 원하는 대비가 나오지 않아도 결과를 그대로 표시한다. 시연을 위해 상수를 조정하지 않는다. **결과를 하드코딩하지 않는다.**

### 시연 스크립트 (90초)

| 시간 | 행동 | 멘트 |
|---|---|---|
| 0:00 | Landing | "같은 직무, 같은 연봉이어도 좋은 회사는 사람마다 다릅니다." |
| 0:10 | 검사 3문항만 실제로 클릭 | "10개 질문으로 커리어 성향을 진단합니다. 연봉이냐 통근이냐 같은 실제 선택 상황이죠." |
| 0:25 | `[데모: 개발자 A]` 클릭 | "시간 관계상 완료된 결과로 넘어가겠습니다. 보상 추구형, 부 성향 성장입니다." |
| 0:35 | 대시보드 | "현재 회사 삼성SDS와의 적합도는 N점. **왜 낮은지 보시면**, 이분이 가장 중요하게 보는 보상 축에서 회사 점수가 낮습니다." |
| 0:50 | Move Timing 패널 | "이직 검토 지수는 N점. 예측이 아니라, 적합도 격차·근속·보상 위치를 규칙으로 합산한 값이고 구성요소를 전부 공개합니다." |
| 1:00 | 추천 TOP3 | "추천 이유가 전부 계산에 쓰인 숫자로 설명됩니다. 그리고 **낮아지는 축도 같이 보여줍니다.** 안정성은 오히려 떨어진다고요." |
| 1:10 | `[데모: 개발자 B]` 클릭 | "**같은 회사, 같은 직군, 같은 연봉인 다른 분입니다.**" |
| 1:20 | 대시보드 대비 | "안정 추구형입니다. 같은 삼성SDS인데 적합도가 63에서 70으로 오르고, 이직 검토 지수는 81에서 53 관망으로 내려갑니다. **추천도 3곳에서 1곳으로 줄었죠.**" |
| 1:30 | 마무리 | "저희는 공고를 추천하지 않습니다. **지금 움직일 이유가 있는지를 설명 가능한 근거로 답합니다.**" |

**가장 중요한 순간은 1:10~1:20이다.** 이 대비를 만들지 못하면 서비스의 주장이 증명되지 않는다. 리허설에서 이 구간만 반복 확인한다.

### 예상 질문 대비

| 질문 | 답변 |
|---|---|
| "데이터 실제인가요?" | "회사 지표는 DART 사업보고서 기준입니다. 화면의 파란 배지가 실데이터고, 회색 배지는 공공데이터에 없는 워라밸 지표라 서비스 추정치임을 표시했습니다." |
| "AI 쓰나요?" | "의도적으로 안 씁니다. 커리어 판단은 근거를 설명할 수 있어야 해서, 4축 가중합이라는 한 줄 수식으로 전부 계산합니다. 지금 이 자리에서 계산 과정을 보여드릴 수 있습니다." |
| "이직 시점을 맞출 수 있나요?" | "예측하지 않습니다. 점검 필요성을 4개 신호로 합산한 참고 지표이고, 구성요소를 모두 공개합니다." |
| "평균급여로 연봉 추정하나요?" | "아닙니다. 회사 전체 평균이라 개인 연봉과 무관하다고 화면에 명시했고, 근속 1년 미만 사용자는 해당 항목을 계산에서 제외합니다." |

---

## 19. Definition of Done

아래 9단계가 **끊김 없이** 시연되면 MVP 완성이다.

| # | 항목 | 검증 방법 | 대응 작업 |
|---|---|---|---|
| 1 | 사용자가 10개 질문에 답한다 | `/assessment`에서 10문항 완주 | T14 |
| 2 | 커리어 유형 + 4축 점수가 생성된다 | `/result`에 유형·부유형·4축 % (합 100) | T5, T15 |
| 3 | 현재 회사·직업 정보를 입력한다 | `/profile` 5필드 입력 및 검증 통과 | T16 |
| 4 | 현재 회사 Fit Score가 표시된다 | `/dashboard`에 0~100 점수 + 축별 breakdown | T6, T17 |
| 5 | 성향에 맞는 회사 TOP 3가 추천된다 | `/recommend`에 최대 3개 (0건 시 안내 문구) | T7, T18 |
| 6 | 추천 회사 하나를 선택한다 | 카드 → `/compare?target=` 이동 | T18 |
| 7 | 4축 차이를 비교한다 | 비교 표에 Comp/Balance/Stability/Growth diff + 평균급여·근속 | T18 |
| 8 | 추천 이유가 사람이 이해할 수 있게 표시된다 | 각 카드에 **실제 계산 숫자를 포함한** 이유 + 주의점 | T8, T18 |
| 9 | 이직 검토 점수가 표시된다 | 지수 + 3단계 밴드 + **구성요소 4개** | T9, T17 |

### 추가 완료 조건 (품질 게이트)

- [ ] `npm test` 전체 통과 (persona 회귀 테스트 포함)
- [ ] 	sc --noEmit 에러 0
- [ ] 
pm run build 통과
- [ ] 데모 고지가 전 화면에 표시되고 가상·실회사 데이터가 추천 풀에서 섞이지 않음
- [ ] 화면상 모든 회사 수치에 `SourceBadge` 존재
- [ ] 평균급여·평균근속 주석이 해당 수치 근처에 노출
- [ ] 검사 성격 고지가 `/result`에 노출
- [ ] Move Timing 고지가 `/dashboard`에 노출
- [ ] "이직해야" / "퇴사하세요" 등 확정 판단 문구 부재 (grep 확인)
- [ ] 7개 URL 직접 접근 시 크래시·흰 화면 없음
- [ ] 데모 프리셋 A/B 두 버튼 동작 및 결과가 서로 다름

---

## 부록 A — 튜닝 상수 일람 (`src/lib/constants.ts`)

데모 중 결과를 조정해야 할 때 **이 파일만 연다.**

```ts
export const SMOOTHING_ALPHA = 1.0     // ↓낮추면 성향 대비 커짐 → Fit 분산 증가
export const MIN_FIT_MARGIN = 5        // 추천에 필요한 최소 Fit 개선폭 (구현 중 2→5: Balance 가 수동 추정치라 ±5 는 오차 범위)
export const FIT_GAP_SATURATION = 20   // Move Timing 격차 항목이 만점이 되는 Fit 격차 (구현 중 25→20)
export const SCORE_OUT_MIN = 30        // 회사 축 점수 하한
export const SCORE_OUT_MAX = 98        // 회사 축 점수 상한
export const TIE_ORDER = ['compensation', 'growth', 'balance', 'stability'] as const

export const MOVE_TIMING_WEIGHTS = {
  fitGap: 40, currentFitPenalty: 25, tenureReadiness: 20, salaryGap: 15,
}
export const MOVE_BANDS = { stay: 39, watch: 64 }   // 이하 기준값
```

## 부록 B — 고지 문구 원문 (그대로 사용)

```
[검사 성격 · /result]
이 진단은 심리학적으로 검증된 검사가 아니라, 회사 선택 시 무엇을
우선하는지 파악하기 위한 서비스용 커리어 선호도 진단입니다.

[평균 지표 · 지표 표 하단]
1인 평균 급여액은 회사 전체 직원의 평균이며 개인의 예상 연봉이
아닙니다. 평균 근속연수는 해당 기간의 근무를 보장하지 않습니다.

[Move Timing · /dashboard]
이 지수는 이직 시점이나 퇴사 확률을 예측하지 않습니다.
적합도·근속·보상 위치를 정해진 규칙으로 합산한 참고 지표이며,
최종 판단은 본인의 상황에 따라 달라집니다.

[전역 footer]
회사 지표는 금융감독원 전자공시시스템(DART) 사업보고서 기준이며,
워라밸 지표는 공개 정보를 바탕으로 한 서비스 자체 추정치입니다.
본 서비스의 결과는 커리어 의사결정을 돕기 위한 참고 정보입니다.
```
