import type { Question } from "./types";

/**
 * 10문항 trade-off 검사. 각 축이 정확히 5회씩 등장한다 (tests/assessment.test.ts 에서 검증).
 * 보상 1,2,3,7,8 / 균형 1,4,5,7,9 / 안정 2,4,6,9,10 / 성장 3,5,6,8,10
 */
export const QUESTIONS: Question[] = [
  {
    id: 1,
    text: "두 회사의 다른 조건은 모두 같습니다. 어느 쪽을 선택하시겠습니까?",
    optionA: { label: "연봉이 800만원 더 높은 회사", axis: "compensation" },
    optionB: { label: "유연근무·연차 사용이 자유로운 회사", axis: "balance" },
  },
  {
    id: 2,
    text: "연봉 구조를 직접 고를 수 있다면?",
    optionA: { label: "기본급은 낮지만 성과급이 크게 변동하는 구조", axis: "compensation" },
    optionB: { label: "성과급은 작지만 매년 예측 가능한 구조", axis: "stability" },
  },
  {
    id: 3,
    text: "두 회사 중 한 곳을 지금 선택해야 한다면?",
    optionA: { label: "지금 연봉이 확실히 높은 성숙한 대기업", axis: "compensation" },
    optionB: { label: "연봉은 조금 낮지만 빠르게 성장 중인 회사", axis: "growth" },
  },
  {
    id: 4,
    text: "어느 쪽 환경이 더 낫습니까?",
    optionA: { label: "정시 퇴근이 가능하지만 업계 변동이 큰 회사", axis: "balance" },
    optionB: { label: "야근이 있지만 고용이 매우 안정적인 회사", axis: "stability" },
  },
  {
    id: 5,
    text: "앞으로 2년을 보낸다면 어느 팀이 낫습니까?",
    optionA: { label: "업무 강도가 낮고 배우는 속도도 완만한 팀", axis: "balance" },
    optionB: { label: "업무 강도가 높지만 역량이 빠르게 느는 팀", axis: "growth" },
  },
  {
    id: 6,
    text: "연봉이 비슷한 두 회사입니다.",
    optionA: { label: "평균 근속연수가 11년인 성숙 기업", axis: "stability" },
    optionB: { label: "평균 근속연수가 4년인 급성장 기업", axis: "growth" },
  },
  {
    id: 7,
    text: "통근과 연봉을 맞바꿀 수 있다면?",
    optionA: { label: "편도 70분이지만 연봉이 600만원 높은 곳", axis: "compensation" },
    optionB: { label: "편도 20분이고 연봉은 현재 수준인 곳", axis: "balance" },
  },
  {
    id: 8,
    text: "입사 제안의 보상 패키지를 고른다면?",
    optionA: { label: "지금 확정 지급되는 사이닝 보너스", axis: "compensation" },
    optionB: { label: "4년에 걸쳐 받는 주식 보상 (RSU / 스톡옵션)", axis: "growth" },
  },
  {
    id: 9,
    text: "둘 중 하나만 보장된다면?",
    optionA: { label: "구조조정 걱정이 없는 고용 안정성", axis: "stability" },
    optionB: { label: "주 40시간이 지켜지는 근무 환경", axis: "balance" },
  },
  {
    id: 10,
    text: "회사의 현재 상태로 고른다면?",
    optionA: { label: "업계 1위이며 사업이 안정된 회사", axis: "stability" },
    optionB: { label: "신규 사업을 공격적으로 확장 중인 회사", axis: "growth" },
  },
];
