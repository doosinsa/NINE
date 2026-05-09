import { fail, isIntegerScore, ok, scoreTier } from "@/lib/server/api";
import { getScore } from "@/lib/server/mock-data";
import { getSupabaseAdmin, toManualScore } from "@/lib/server/supabase";
import type { ManualScoreRequest, ManualScoreResponse } from "@/types/contracts";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Partial<ManualScoreRequest> | null;

  if (!body?.ticker || !isIntegerScore(body.scoreDemand) || !isIntegerScore(body.scoreSupply)) {
    return fail("BAD_REQUEST", "ticker, scoreDemand, and scoreSupply are required. Scores must be integers from 0 to 3.");
  }

  const existing = getScore(body.ticker);
  if (!existing) {
    return fail("NOT_FOUND", "Stock score was not found in the NINE universe.", 404);
  }

  const totalScore = existing.scoreQuant + body.scoreDemand + body.scoreSupply;
  const isBuy = body.decision === "buy";
  const hasThesisKill = Boolean(body.thesisKill1 && body.thesisKill2 && body.thesisKill3);

  if (isBuy && !hasThesisKill) {
    return fail("BAD_REQUEST", "출구 조건 없이 매수 못 함. 3개 조건 먼저 적어.");
  }

  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data, error } = await supabase
      .from("manual_scores")
      .upsert(
        {
          ticker: body.ticker,
          score_quant: existing.scoreQuant,
          score_demand: body.scoreDemand,
          score_supply: body.scoreSupply,
          decision: body.decision ?? existing.decision,
          thesis_summary: body.thesisSummary ?? existing.thesisSummary,
          thesis_kill_1: body.thesisKill1 ?? existing.thesisKill1,
          thesis_kill_2: body.thesisKill2 ?? existing.thesisKill2,
          thesis_kill_3: body.thesisKill3 ?? existing.thesisKill3,
          position_size_krw: body.positionSizeKrw ?? existing.positionSizeKrw,
          bought_at_price: body.boughtAtPrice ?? existing.boughtAtPrice,
          bought_at_date: body.boughtAtDate ?? existing.boughtAtDate,
          reviewed_at: new Date().toISOString(),
        },
        { onConflict: "ticker" },
      )
      .select("*")
      .single();

    if (error) return fail("SERVER_ERROR", "Failed to save manual score.", 500);

    const savedScore = toManualScore(data);
    return ok({
      score: savedScore,
      warning: isBuy && savedScore.totalScore < 7 ? "7점 미만 매수는 시스템 권고와 다른 결정이야. 그래도 진행할래?" : null,
    } satisfies ManualScoreResponse);
  }

  const response: ManualScoreResponse = {
    score: {
      ...existing,
      scoreDemand: body.scoreDemand,
      scoreSupply: body.scoreSupply,
      totalScore,
      tier: scoreTier(totalScore),
      decision: body.decision ?? existing.decision,
      thesisSummary: body.thesisSummary ?? existing.thesisSummary,
      thesisKill1: body.thesisKill1 ?? existing.thesisKill1,
      thesisKill2: body.thesisKill2 ?? existing.thesisKill2,
      thesisKill3: body.thesisKill3 ?? existing.thesisKill3,
      positionSizeKrw: body.positionSizeKrw ?? existing.positionSizeKrw,
      boughtAtPrice: body.boughtAtPrice ?? existing.boughtAtPrice,
      boughtAtDate: body.boughtAtDate ?? existing.boughtAtDate,
      reviewedAt: new Date().toISOString(),
    },
    warning: isBuy && totalScore < 7 ? "7점 미만 매수는 시스템 권고와 다른 결정이야. 그래도 진행할래?" : null,
  };

  return ok(response);
}
