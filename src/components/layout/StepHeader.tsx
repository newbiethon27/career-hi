"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/** 기본 플로우. /dashboard(현재 회사 Fit)는 재직자 부가 기능이라 여기 넣지 않는다. */
const STEPS = [
  { href: "/assessment", label: "성향 진단" },
  { href: "/result", label: "유형 결과" },
  { href: "/profile", label: "직군 선택" },
  { href: "/recommend", label: "회사 추천" },
  { href: "/compare", label: "비교" },
];

const OPTIONAL_STEP = { href: "/dashboard", label: "현재 회사 Fit · 부가 기능" };

export function StepHeader() {
  const pathname = usePathname();
  const activeIdx = STEPS.findIndex((s) => pathname.startsWith(s.href));
  const onOptional = pathname.startsWith(OPTIONAL_STEP.href);

  return (
    <header className="border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="text-base font-semibold tracking-tight">
          커리어<span className="text-primary">Hi</span>
        </Link>
        <nav className="hidden items-center gap-1 text-xs sm:flex">
          {STEPS.map((s, i) => (
            <span key={s.href} className="flex items-center gap-1">
              <span
                className={cn(
                  "rounded-full px-2 py-0.5",
                  i === activeIdx
                    ? "bg-primary text-primary-foreground"
                    : i < activeIdx
                      ? "text-foreground"
                      : "text-muted-foreground",
                )}
              >
                {s.label}
              </span>
              {i < STEPS.length - 1 ? <span className="text-muted-foreground/50">›</span> : null}
            </span>
          ))}
          {onOptional ? (
            <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-primary-foreground">{OPTIONAL_STEP.label}</span>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
