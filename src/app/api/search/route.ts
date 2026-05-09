import { fail, ok } from "@/lib/server/api";
import { getStockDetail } from "@/lib/server/mock-data";
import { fetchStockDetailFromSupabase, getSupabaseAdmin } from "@/lib/server/supabase";
import type { SearchResponse } from "@/types/contracts";

const dailyLimit = 10;
const mockUsed = 7;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q")?.trim() ?? "";

  if (!query) {
    return fail("BAD_REQUEST", "Search query is required.");
  }

  const result = (await fetchStockDetailFromSupabase(query)) ?? getStockDetail(query);
  const response: SearchResponse = {
    query,
    dailyCap: {
      used: mockUsed,
      limit: dailyLimit,
      remaining: dailyLimit - mockUsed,
    },
    result,
    requiresOutsideUniverseAnalysis: result === null,
  };

  return ok(response);
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { ticker?: string } | null;

  if (!body?.ticker) {
    return fail("BAD_REQUEST", "ticker is required.");
  }

  if (mockUsed >= dailyLimit) {
    return fail("DAILY_CAP_REACHED", "오늘 ad-hoc 검색 한도 도달. 내일 다시.", 429);
  }

  const supabase = getSupabaseAdmin();
  if (supabase) {
    await supabase.from("daily_search_log").upsert({
      date: new Date().toISOString().slice(0, 10),
      ticker: body.ticker,
      is_universe_outside: true,
    });
  }

  const result = (await fetchStockDetailFromSupabase(body.ticker)) ?? getStockDetail(body.ticker);
  return ok({
    query: body.ticker,
    dailyCap: {
      used: mockUsed + 1,
      limit: dailyLimit,
      remaining: dailyLimit - mockUsed - 1,
    },
    result,
    requiresOutsideUniverseAnalysis: result === null,
  } satisfies SearchResponse);
}
