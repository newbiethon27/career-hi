"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

interface Props {
  /** 스크린리더용 버튼 이름 */
  label: string;
  title?: string;
  children: React.ReactNode;
  className?: string;
  /** 버튼 기준 정렬. 화면 밖으로 나가면 자동으로 안쪽으로 당긴다. */
  align?: "left" | "right";
}

const PANEL_WIDTH = 288; // 18rem
const GAP = 6;
const EDGE = 10;

interface Pos {
  top: number;
  left: number;
  below: boolean;
}

/**
 * 작은 "?" 버튼 + 설명 패널. 왜 이 숫자가 나왔는지를 그 자리에서 답한다.
 * 패널은 portal 로 body 에 띄운다 — 표의 overflow 컨테이너에 잘리지 않게 하기 위해서다.
 * 바깥 클릭·Esc 로 닫히고, 스크롤하면 위치를 따라간다.
 */
export function InfoPopover({ label, title, children, className, align = "right" }: Props) {
  const [pos, setPos] = useState<Pos | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const open = pos !== null;

  const place = useCallback(() => {
    const r = btnRef.current?.getBoundingClientRect();
    if (!r) return;
    const width = Math.min(PANEL_WIDTH, window.innerWidth - EDGE * 2);
    const raw = align === "right" ? r.right - width : r.left;
    const left = Math.max(EDGE, Math.min(raw, window.innerWidth - width - EDGE));
    // 아래 공간이 부족하면 버튼 위로 띄운다 (패널 높이를 몰라도 되도록 translateY 로 뒤집는다)
    const below = r.bottom < window.innerHeight * 0.6;
    setPos({ top: below ? r.bottom + GAP : r.top - GAP, left, below });
  }, [align]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      const t = e.target as Node;
      if (!btnRef.current?.contains(t) && !panelRef.current?.contains(t)) setPos(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPos(null);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [open, place]);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        aria-label={label}
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          if (open) setPos(null);
          else place();
        }}
        className={cn(
          "inline-flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-full border align-middle text-[10px] font-semibold leading-none transition-colors",
          open
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border text-muted-foreground hover:border-foreground hover:text-foreground",
          className,
        )}
      >
        ?
      </button>

      {pos
        ? createPortal(
            <div
              ref={panelRef}
              role="dialog"
              aria-label={label}
              onClick={(e) => e.stopPropagation()}
              style={{
                top: pos.top,
                left: pos.left,
                width: Math.min(PANEL_WIDTH, window.innerWidth - EDGE * 2),
                transform: pos.below ? undefined : "translateY(-100%)",
              }}
              className="fixed z-50 rounded-xl border bg-popover p-3 text-left shadow-lg"
            >
              {title ? <div className="mb-1 text-xs font-semibold">{title}</div> : null}
              <div className="text-xs leading-relaxed text-muted-foreground">{children}</div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
