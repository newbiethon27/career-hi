import { CAREER_TYPE_META } from "@/lib/constants";
import type { AssessmentResult } from "@/lib/types";

export function TypeHeadline({ result }: { result: AssessmentResult }) {
  const p = CAREER_TYPE_META[result.primaryType];
  const s = CAREER_TYPE_META[result.secondaryType];
  return (
    <div className="space-y-4 text-center">
      <div className="text-6xl">{p.emoji}</div>
      <div>
        <div className="text-sm font-medium text-muted-foreground">당신의 커리어 성향</div>
        <h1 className="mt-1 text-4xl font-bold tracking-tight sm:text-5xl">{p.label}</h1>
        {result.isMixed ? (
          <div className="mt-2 inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            {p.label.replace(" 추구형", "")}·{s.label.replace(" 추구형", "")} 혼합형
          </div>
        ) : null}
      </div>
      <p className="text-lg text-muted-foreground">{p.tagline}</p>
      <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm">
        <span className="text-muted-foreground">부 성향</span>
        <span className="font-medium">
          {s.emoji} {s.label}
        </span>
      </div>
    </div>
  );
}
