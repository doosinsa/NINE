import { fail, ok } from "@/lib/server/api";
import { stocks } from "@/lib/server/mock-data";
import { createExternalProviders, getProviderMode } from "@/lib/server/providers";
import {
  fetchPriceCollectionTickersFromSupabase,
  upsertQuarterlyEarningsInSupabase,
} from "@/lib/server/supabase";
import type { QuarterlyEarningsCollectionRequest, QuarterlyEarningsCollectionResponse } from "@/types/contracts";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Partial<QuarterlyEarningsCollectionRequest> | null;
  const requestedTickers = body?.tickers ? normalizeTickers(body.tickers) : await getDefaultTickers();

  if (requestedTickers.length === 0) {
    return fail("BAD_REQUEST", "At least one ticker is required for quarterly earnings collection.");
  }

  try {
    const providers = createExternalProviders();
    const earnings = await providers.earnings.fetchQuarterlyEarnings(requestedTickers);
    const persistedCount = await upsertQuarterlyEarningsInSupabase(earnings);

    const response: QuarterlyEarningsCollectionResponse = {
      requestedTickers,
      collectedCount: earnings.length,
      persistedCount: persistedCount ?? 0,
      persisted: persistedCount !== null,
      providerMode: getProviderMode(),
      earnings,
    };

    return ok(response);
  } catch (error) {
    console.error(error);
    return fail("SERVER_ERROR", "Failed to collect quarterly earnings snapshots.", 500);
  }
}

async function getDefaultTickers() {
  return (await fetchPriceCollectionTickersFromSupabase()) ?? stocks.map((stock) => stock.ticker);
}

function normalizeTickers(tickers: unknown[]) {
  return [
    ...new Set(
      tickers
        .filter((ticker): ticker is string => typeof ticker === "string")
        .map((ticker) => ticker.trim().toUpperCase())
        .filter(Boolean),
    ),
  ];
}
