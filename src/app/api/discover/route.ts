import { fail, ok } from "@/lib/server/api";
import { discoverThemes, stocks } from "@/lib/server/mock-data";
import { fetchDiscoverThemesFromSupabase, sendDiscoverTickersToCoreInSupabase } from "@/lib/server/supabase";
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

  let addedTickers: string[];
  let skippedTickers: string[];

  try {
    const supabaseResult = await sendDiscoverTickersToCoreInSupabase(body.tickers);
    if (supabaseResult) {
      addedTickers = supabaseResult.addedTickers;
      skippedTickers = supabaseResult.skippedTickers;
    } else {
      const normalizedTickers = [...new Set(body.tickers.map((ticker) => ticker.trim().toUpperCase()).filter(Boolean))];
      const existingTickers = new Set(stocks.map((stock) => stock.ticker.toUpperCase()));
      addedTickers = normalizedTickers.filter((ticker) => !existingTickers.has(ticker));
      skippedTickers = normalizedTickers.filter((ticker) => existingTickers.has(ticker));
    }
  } catch (error) {
    console.error(error);
    return fail("SERVER_ERROR", "Failed to send Discover tickers to Core.", 500);
  }

  const response: DiscoverSendToCoreResponse = {
    addedTickers,
    skippedTickers,
    nextScoringCycle: "2026-05-10",
  };

  return ok(response);
}
