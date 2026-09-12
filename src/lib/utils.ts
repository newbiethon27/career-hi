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
