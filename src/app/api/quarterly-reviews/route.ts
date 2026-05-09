import { fail, ok } from "@/lib/server/api";
import { getHoldings, quarterlyReviews } from "@/lib/server/mock-data";
import { fetchHoldingsFromSupabase, fetchQuarterlyReviewsFromSupabase, getSupabaseAdmin, toQuarterlyReview } from "@/lib/server/supabase";
import type { QuarterlyReviewRequest, QuarterlyReviewsResponse } from "@/types/contracts";

export async function GET() {
  const holdings = (await fetchHoldingsFromSupabase()) ?? getHoldings();
  const reviews = (await fetchQuarterlyReviewsFromSupabase()) ?? quarterlyReviews;
  const response: QuarterlyReviewsResponse = {
    quarter: "2026 Q2",
    progress: {
      completed: reviews.length,
      total: holdings.length,
    },
    reviews,
  };

  return ok(response);
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Partial<QuarterlyReviewRequest> | null;

  if (!body?.ticker || typeof body.thesisStillValid !== "boolean" || typeof body.killConditionsTriggered !== "number" || !body.action) {
    return fail("BAD_REQUEST", "ticker, thesisStillValid, killConditionsTriggered, and action are required.");
  }

  if (body.killConditionsTriggered < 0 || body.killConditionsTriggered > 3) {
    return fail("BAD_REQUEST", "killConditionsTriggered must be between 0 and 3.");
  }

  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data, error } = await supabase
      .from("quarterly_reviews")
      .insert({
        ticker: body.ticker,
        thesis_still_valid: body.thesisStillValid,
        kill_conditions_triggered: body.killConditionsTriggered,
        notes: body.notes ?? null,
        action: body.action,
      })
      .select("*")
      .single();

    if (error) return fail("SERVER_ERROR", "Failed to save quarterly review.", 500);
    return ok(toQuarterlyReview(data));
  }

  return ok({
    id: quarterlyReviews.length + 1,
    ticker: body.ticker,
    reviewDate: new Date().toISOString().slice(0, 10),
    thesisStillValid: body.thesisStillValid,
    killConditionsTriggered: body.killConditionsTriggered,
    notes: body.notes ?? null,
    action: body.action,
  });
}
