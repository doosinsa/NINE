import { fail, ok } from "@/lib/server/api";
import { getStockDetail } from "@/lib/server/mock-data";
import {
  fetchDailySearchUsedFromSupabase,
  fetchStockDetailFromSupabase,
  upsertDailySearchLogInSupabase,
} from "@/lib/server/supabase";
import type { SearchResponse } from "@/types/contracts";

const dailyLimit = 10;
const mockUsed = 7;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q")?.trim() ?? "";

  if (!query) {
    return fail("BAD_REQUEST", "Search query is required.");
  }

  const used = await getDailySearchUsed();
  const result = (await fetchStockDetailFromSupabase(query)) ?? getStockDetail(query);
  const response: SearchResponse = {
    query,
    dailyCap: {
      used,
      limit: dailyLimit,
      remaining: Math.max(0, dailyLimit - used),
    },
    result,
    requiresOutsideUniverseAnalysis: result === null,
  };

  return ok(response);
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { ticker?: string } | null;
  const ticker = body?.ticker?.trim().toUpperCase();

  if (!ticker) {
    return fail("BAD_REQUEST", "ticker is required.");
  }

  const today = kstDateString();
  const used = await getDailySearchUsed(today);
  if (used >= dailyLimit) {
    return fail("DAILY_CAP_REACHED", "오늘 ad-hoc 검색 한도 도달. 내일 다시.", 429);
  }

  const logged = await upsertDailySearchLogInSupabase(ticker, today);
  if (logged === false) {
    return fail("SERVER_ERROR", "Failed to record daily search usage.", 500);
  }

  const usedAfter =
    logged === null ? Math.min(dailyLimit, used + 1) : (await fetchDailySearchUsedFromSupabase(today)) ?? used + 1;
  const result = (await fetchStockDetailFromSupabase(ticker)) ?? getStockDetail(ticker);
  return ok({
    query: ticker,
    dailyCap: {
      used: usedAfter,
      limit: dailyLimit,
      remaining: Math.max(0, dailyLimit - usedAfter),
    },
    result,
    requiresOutsideUniverseAnalysis: result === null,
  } satisfies SearchResponse);
}

async function getDailySearchUsed(date = kstDateString()) {
  return (await fetchDailySearchUsedFromSupabase(date)) ?? mockUsed;
}

function kstDateString() {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}
