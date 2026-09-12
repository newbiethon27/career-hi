# 협업 가이드

해커톤 기간 동안 서로 충돌 없이 빠르게 작업하기 위한 최소 규칙입니다.

## 시작하기

```bash
git clone https://github.com/newbiethon27/career-hi.git
cd career-hi
npm install
npm run dev          # http://localhost:3000
```

`.env` 설정 없이도 바로 돌아갑니다 — Supabase 에 닿지 않으면 저장소의 JSON 으로 폴백하고 푸터에 그 사실을 표시합니다. 다만 **최신 회사 지표를 보려면** 팀에서 공유한 Supabase 값을 넣으세요:

```bash
cp .env.local.example .env.local   # NEXT_PUBLIC_SUPABASE_URL / ANON_KEY 입력
```

DART 키는 **필요 없습니다.** DART 스냅샷(`data/companies.raw.json`)이 이미 커밋되어 있고 런타임에 외부 API를 호출하지 않습니다. 회사 지표를 다시 수집할 때만 `.env.local.example`을 참고해 키를 넣으세요.

## 브랜치 전략

```
main        데모 가능한 안정 상태. dev → main PR 로만 갱신한다.
 └ dev      기본 브랜치. 모든 작업이 여기로 모인다.
    └ feat/…  fix/…  docs/…     개인 작업 브랜치
```

- **기본 브랜치는 `dev`** 입니다. 클론하면 `dev`로 떨어지고 PR도 `dev`가 기본 타깃입니다.
- `main`에 직접 푸시하지 마세요. 데모 직전에 `dev → main` PR 하나만 올립니다.
- 브랜치 이름: `feat/assessment-ui`, `fix/fit-rounding`, `docs/plan-update`

```bash
git switch dev && git pull
git switch -c feat/내작업
# ... 작업 ...
npm test && npm run typecheck && npm run lint
git push -u origin feat/내작업     # 그리고 GitHub 에서 dev 로 PR
```

## 커밋 전 체크

```bash
npm test          # vitest — 계산 로직 + 데모 페르소나 회귀 테스트
npm run typecheck # next typegen + tsc --noEmit
npm run lint      # eslint
```

PR을 올리면 GitHub Actions가 위 세 가지 + `next build`를 자동으로 돌립니다.

## 파일별 담당 구역 (충돌 최소화)

| 구역 | 파일 | 주의 |
|---|---|---|
| 계산 엔진 | `src/lib/*.ts` | 바꾸면 **반드시 `npm test`**. 특히 `persona.test.ts`가 데모 시나리오를 지킵니다 |
| 화면 | `src/app/*/page.tsx`, `src/components/**` | 페이지 단위로 나눠 잡으면 거의 안 겹칩니다 |
| 데이터 | Supabase `companies` 테이블 | **회사 지표는 이제 코드가 아니라 DB 에 있습니다.** 대시보드에서 고치면 배포 없이 반영돼요 — 디자인 PR 과 충돌하지 않습니다 |
| 데이터(폴백) | `data/*.json` | Supabase 가 죽었을 때의 폴백 겸 테스트 픽스처. `companies.raw.json`은 **손으로 고치지 마세요** (`npm run fetch:dart` 산출물) |
| 문서 | `PLAN.md`, `README.md` | |

## 반드시 지킬 것

이 서비스의 신뢰도가 걸린 규칙입니다. PR 리뷰에서 확인합니다.

1. **회사 수치를 지어내지 않는다.** 모든 값은 DART 스냅샷이거나 사람이 근거를 남긴 수동 입력입니다.
2. **화면의 모든 회사 수치에는 `<SourceBadge />`가 붙는다.** 배지 없는 숫자는 리뷰에서 반려합니다.
3. **평균급여 ≠ 내 예상 연봉, 평균근속 ≠ 내 퇴사 시점.** 해당 수치 근처에 항상 주석을 답니다.
4. **"이직해야 합니다" 같은 확정 판단 문구를 쓰지 않는다.** 밴드는 `유지 권장 / 관망 / 검토 권장` 3단계뿐입니다.
5. **추천 결과는 항상 계산 근거를 함께 보여준다.** 설명 없는 추천은 넣지 않습니다.

## 점수가 이상해 보일 때

먼저 `src/lib/constants.ts` 상단의 튜닝 상수 블록을 보세요. 로직을 고치기 전에 상수부터 의심하고, 바꿨으면 `npm test`로 데모 대비가 유지되는지 확인하세요. 자세한 내용은 `PLAN.md` §8.3.
