import { DISCLAIMER } from "@/lib/constants";

export function DisclaimerFooter() {
  return (
    <footer className="mt-auto border-t">
      <div className="mx-auto max-w-4xl px-4 py-6 text-xs leading-relaxed text-muted-foreground">
        <p>{DISCLAIMER.footer}</p>
        <p className="mt-1">Career AtoZ · 해커톤 MVP · 회원가입·채용공고·지원 기능은 제공하지 않습니다.</p>
      </div>
    </footer>
  );
}
