import { fail, ok } from "@/lib/server/api";
import { stocks } from "@/lib/server/mock-data";
import { createExternalProviders, getProviderMode } from "@/lib/server/providers";
import {
  fetchPriceCollectionTickersFromSupabase,
  toDailyPriceSnapshot,
  upsertDailyPricesInSupabase,
} from "@/lib/server/supabase";
import type { DailyPriceCollectionRequest, DailyPriceCollectionResponse } from "@/types/contracts";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Partial<DailyPriceCollectionRequest> | null;
  const date = body?.date ?? kstDateString();

  if (!isIsoDate(date)) {
    return fail("BAD_REQUEST", "date must use YYYY-MM-DD format.");
  }

  const requestedTickers = body?.tickers ? normalizeTickers(body.tickers) : await getDefaultTickers();
  if (requestedTickers.length === 0) {
    return fail("BAD_REQUEST", "At least one ticker is required for daily price collection.");
  }

  try {
    const providers = createExternalProviders();
    const prices = await providers.price.fetchDailyPrices(requestedTickers, date);
    const persistedCount = await upsertDailyPricesInSupabase(prices);

    const response: DailyPriceCollectionResponse = {
      date,
      requestedTickers,
      collectedCount: prices.length,
      persistedCount: persistedCount ?? 0,
      persisted: persistedCount !== null,
      providerMode: getProviderMode(),
      prices: prices.map(toDailyPriceSnapshot),
    };

    return ok(response);
  } catch (error) {
    console.error(error);
    return fail("SERVER_ERROR", "Failed to collect daily prices.", 500);
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

function isIsoDate(date: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(new Date(`${date}T00:00:00.000Z`).getTime());
}

function kstDateString() {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}
