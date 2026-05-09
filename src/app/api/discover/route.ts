import { fail, ok } from "@/lib/server/api";
import { discoverThemes, stocks } from "@/lib/server/mock-data";
import { fetchDiscoverThemesFromSupabase, getSupabaseAdmin } from "@/lib/server/supabase";
import type { DiscoverResponse, DiscoverSendToCoreRequest, DiscoverSendToCoreResponse } from "@/types/contracts";

export async function GET() {
  const themes = (await fetchDiscoverThemesFromSupabase()) ?? discoverThemes;
  const response: DiscoverResponse = {
    weekOf: themes[0]?.weekOf ?? "2026-05-04",
    themes,
  };

  return ok(response);
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Partial<DiscoverSendToCoreRequest> | null;

  if (!body?.sourceThemeId || !Array.isArray(body.tickers) || body.tickers.length === 0) {
    return fail("BAD_REQUEST", "sourceThemeId and tickers are required.");
  }

  const existingTickers = new Set(stocks.map((stock) => stock.ticker.toUpperCase()));
  const addedTickers = body.tickers.filter((ticker) => !existingTickers.has(ticker.toUpperCase()));
  const skippedTickers = body.tickers.filter((ticker) => existingTickers.has(ticker.toUpperCase()));
  const supabase = getSupabaseAdmin();

  if (supabase && addedTickers.length > 0) {
    await supabase.from("stocks").upsert(
      addedTickers.map((ticker) => ({
        ticker,
        name: ticker,
        country: ticker.includes(".") ? "KR" : "US",
        source: "discover",
      })),
      { onConflict: "ticker" },
    );
  }

  const response: DiscoverSendToCoreResponse = {
    addedTickers,
    skippedTickers,
    nextScoringCycle: "2026-05-10",
  };

  return ok(response);
}
