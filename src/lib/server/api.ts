import { NextResponse } from "next/server";
import type { ApiErrorCode, ApiResponse } from "@/types/contracts";

export function ok<T>(data: T, init?: ResponseInit): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ ok: true, data }, init);
}

export function fail(code: ApiErrorCode, message: string, status = 400): NextResponse<ApiResponse<never>> {
  return NextResponse.json({ ok: false, error: { code, message } }, { status });
}

export function isIntegerScore(value: unknown): value is number {
  return Number.isInteger(value) && typeof value === "number" && value >= 0 && value <= 3;
}

export function scoreTier(totalScore: number) {
  if (totalScore === 9) return "nine";
  if (totalScore >= 7) return "seven_eight";
  if (totalScore >= 4) return "four_six";
  return "zero_three";
}
