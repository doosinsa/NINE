import { fail, ok } from "@/lib/server/api";
import { getHoldings, quarterlyReviews } from "@/lib/server/mock-data";
import { fetchHoldingsFromSupabase, fetchQuarterlyReviewsFromSupabase, getSupabaseAdmin, toQuarterlyReview } from "@/lib/server/supabase";
import type { QuarterlyAction, QuarterlyReview, QuarterlyReviewRequest, QuarterlyReviewsResponse } from "@/types/contracts";

export async function GET() {
  const holdings = (await fetchHoldingsFromSupabase()) ?? getHoldings();
  const reviews = (await fetchQuarterlyReviewsFromSupabase()) ?? quarterlyReviews;
  const latestReviewsByTicker = getLatestReviewsByTicker(reviews);
  const items = holdings.map((holding) => ({
    holding,
    latestReview: latestReviewsByTicker.get(holding.stock.ticker) ?? null,
  }));

  const response: QuarterlyReviewsResponse = {
    quarter: "2026 Q2",
    progress: {
      completed: items.filter((item) => item.latestReview !== null).length,
      total: holdings.length,
    },
    items,
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

  if (!isQuarterlyAction(body.action)) {
    return fail("BAD_REQUEST", "action must be hold, reduce_50, or sell_all.");
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

function getLatestReviewsByTicker(reviews: QuarterlyReview[]) {
  const latest = new Map<string, QuarterlyReview>();

  for (const review of reviews) {
    const previous = latest.get(review.ticker);
    if (!previous || new Date(review.reviewDate).getTime() > new Date(previous.reviewDate).getTime()) {
      latest.set(review.ticker, review);
    }
  }

  return latest;
}

function isQuarterlyAction(value: unknown): value is QuarterlyAction {
  return value === "hold" || value === "reduce_50" || value === "sell_all";
}
