export { cn } from "cn";

import { AXES, type Axis, type AxisVector } from "./types";

export function mapAxes(fn: (axis: Axis) => number): AxisVector {
  return {
    compensation: fn("compensation"),
    balance: fn("balance"),
    stability: fn("stability"),
    growth: fn("growth"),
  };
}

export function sumAxes(v: AxisVector): number {
  return AXES.reduce((s, a) => s + v[a], 0);
}

export function clamp01(x: number): number {
  return Math.min(1, Math.max(0, x));
}

export function clamp(x: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, x));
}

export function signed(n: number): string {
  return n > 0 ? `+${n}` : `${n}`;
}

/** 만원 단위 숫자를 "1억 2,000만원" 형태로 */
export function formatManwon(manwon: number): string {
  const eok = Math.floor(manwon / 10000);
  const rest = Math.round(manwon % 10000);
  if (eok > 0 && rest > 0) return `${eok}억 ${rest.toLocaleString("ko-KR")}만원`;
  if (eok > 0) return `${eok}억원`;
  return `${rest.toLocaleString("ko-KR")}만원`;
}

export function formatTenure(months: number): string {
  const y = Math.floor(months / 12);
  const m = months % 12;
  if (y === 0) return `${m}개월`;
  if (m === 0) return `${y}년`;
  return `${y}년 ${m}개월`;
}

export function median(nums: number[]): number | null {
  if (nums.length === 0) return null;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

/** 마지막 글자에 받침이 있는지. 한글·숫자만 판단하고 그 외는 null. */
export function hasFinalConsonant(word: string): boolean | null {
  const ch = word.trim().slice(-1);
  if (!ch) return null;
  const code = ch.charCodeAt(0);
  if (code >= 0xac00 && code <= 0xd7a3) return (code - 0xac00) % 28 !== 0;
  // 숫자는 읽는 소리 기준: 0(영)·1(일)·3(삼)·6(육)·7(칠)·8(팔) 에 받침이 있다
  if (ch >= "0" && ch <= "9") return "013678".includes(ch);
  return null;
}

/** 받침에 맞는 조사를 붙인다. 판단할 수 없으면 모음형을 쓴다. 예: josa("지표", "은", "는") → "지표는" */
export function josa(word: string, withJong: string, withoutJong: string): string {
  return `${word}${hasFinalConsonant(word) ? withJong : withoutJong}`;
}
