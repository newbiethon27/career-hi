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
      <div className="space-y-2">
        <h2 className="text-[22px] font-bold leading-snug sm:text-2xl">{question.text}</h2>
        <p className="text-sm text-muted-foreground">정답은 없어요. 마음이 더 기우는 쪽을 골라주세요.</p>
      </div>
      <div className="grid gap-3">
        {options.map((o) => {
          const active = selected === o.key;
          return (
            <button
              key={o.key}
              type="button"
              onClick={() => onSelect(o.key)}
              aria-pressed={active}
              className={cn(
                "flex min-h-[5.5rem] w-full items-center gap-4 rounded-2xl border-2 bg-card p-5 text-left shadow-soft transition-all",
                "hover:border-primary/50 hover:bg-accent/30 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-px",
                active ? "border-primary bg-accent/40" : "border-border",
              )}
            >
              <span
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors",
                  active ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground",
                )}
              >
                {o.key}
              </span>
              <span className="text-base font-medium leading-snug sm:text-[17px]">{o.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
