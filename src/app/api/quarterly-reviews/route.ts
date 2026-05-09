import { fail, ok } from "@/lib/server/api";
import { getHoldings, quarterlyReviews } from "@/lib/server/mock-data";
import type { QuarterlyReviewRequest, QuarterlyReviewsResponse } from "@/types/contracts";

export async function GET() {
  const total = getHoldings().length;
  const response: QuarterlyReviewsResponse = {
    quarter: "2026 Q2",
    progress: {
      completed: quarterlyReviews.length,
      total,
    },
    reviews: quarterlyReviews,
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
