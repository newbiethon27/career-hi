"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { QuestionCard } from "@/components/assessment/QuestionCard";
import { PageSkeleton } from "@/components/common/PageSkeleton";
import { Button } from "@/components/ui/button";
import { scoreAssessment } from "@/lib/assessment";
import { DISCLAIMER, QUESTION_COUNT } from "@/lib/constants";
import { QUESTIONS } from "@/lib/questions";
import { storage } from "@/lib/storage";
import type { Answer } from "@/lib/types";
import { useCareer } from "@/store/CareerContext";

export default function AssessmentPage() {
  const { hydrated } = useCareer();
  // hydrate 이후에만 마운트 → 내부에서 localStorage 진행 상황을 lazy init 으로 안전하게 복구
  if (!hydrated) return <PageSkeleton />;
  return <AssessmentFlow />;
}

function AssessmentFlow() {
  const router = useRouter();
  const { setAssessment } = useCareer();
  const [state, setState] = useState<{ index: number; answers: Answer[] }>(() => {
    const p = storage.loadProgress();
    return p && p.index < QUESTION_COUNT ? { index: p.index, answers: p.answers } : { index: 0, answers: [] };
  });
  const { index, answers } = state;

  const select = (a: Answer) => {
    const next = [...answers.slice(0, index), a];
    if (index + 1 >= QUESTION_COUNT) {
      setAssessment(scoreAssessment(next));
      router.push("/result");
      return;
    }
    const nextState = { index: index + 1, answers: next };
    setState(nextState);
    storage.saveProgress(nextState);
  };

  const back = () => {
    if (index === 0) return;
    const nextState = { index: index - 1, answers };
    setState(nextState);
    storage.saveProgress(nextState);
  };

  const q = QUESTIONS[index];
  const pct = Math.round((index / QUESTION_COUNT) * 100);

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:py-16">
      <div className="mb-8 space-y-2">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>커리어 성향 진단</span>
          <span className="tabular-nums">
            {index + 1} / {QUESTION_COUNT}
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div key={q.id} className="animate-in fade-in duration-200">
        <QuestionCard question={q} selected={answers[index]} onSelect={select} />
      </div>

      <div className="mt-8 flex items-center justify-between">
        <Button variant="ghost" onClick={back} className={index === 0 ? "invisible" : ""}>
          ← 이전
        </Button>
        <span className="text-xs text-muted-foreground">선택하면 바로 다음 질문으로 넘어갑니다</span>
      </div>

      <p className="mt-10 text-xs leading-relaxed text-muted-foreground">{DISCLAIMER.assessment}</p>
    </div>
  );
}
