"use client";

import { cn } from "@/lib/utils";
import type { Answer, Question } from "@/lib/types";

interface Props {
  question: Question;
  selected?: Answer;
  onSelect: (a: Answer) => void;
}

/** 질문 1개 + 선택 카드 2장. 클릭 즉시 다음으로 (확인 버튼 없음 — 속도 우선). */
export function QuestionCard({ question, selected, onSelect }: Props) {
  const options: Array<{ key: Answer; label: string }> = [
    { key: "A", label: question.optionA.label },
    { key: "B", label: question.optionB.label },
  ];
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold leading-snug sm:text-2xl">{question.text}</h2>
      <div className="grid gap-3">
        {options.map((o) => (
          <button
            key={o.key}
            type="button"
            onClick={() => onSelect(o.key)}
            className={cn(
              "flex min-h-24 w-full items-center gap-4 rounded-2xl border-2 bg-card p-5 text-left transition-all",
              "hover:border-primary/60 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-px",
              selected === o.key ? "border-primary bg-primary/5" : "border-border",
            )}
          >
            <span
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                selected === o.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
              )}
            >
              {o.key}
            </span>
            <span className="text-base font-medium sm:text-lg">{o.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
