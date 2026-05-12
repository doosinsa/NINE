import { fail, ok } from "@/lib/server/api";
import { stocks } from "@/lib/server/mock-data";
import { createExternalProviders, getProviderMode } from "@/lib/server/providers";
import { fetchPriceCollectionTickersFromSupabase, upsertWeeklyEpsInSupabase } from "@/lib/server/supabase";
import type { WeeklyEpsCollectionRequest, WeeklyEpsCollectionResponse } from "@/types/contracts";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Partial<WeeklyEpsCollectionRequest> | null;
  const snapshotDate = body?.snapshotDate ?? kstDateString();

  if (!isIsoDate(snapshotDate)) {
    return fail("BAD_REQUEST", "snapshotDate must use YYYY-MM-DD format.");
  }

  const requestedTickers = body?.tickers ? normalizeTickers(body.tickers) : await getDefaultTickers();
  if (requestedTickers.length === 0) {
    return fail("BAD_REQUEST", "At least one ticker is required for weekly EPS collection.");
  }

  try {
    const providers = createExternalProviders();
    const estimates = await providers.eps.fetchWeeklyEps(requestedTickers, snapshotDate);
    const persistedCount = await upsertWeeklyEpsInSupabase(estimates);

    const response: WeeklyEpsCollectionResponse = {
      snapshotDate,
      requestedTickers,
      collectedCount: estimates.length,
      persistedCount: persistedCount ?? 0,
      persisted: persistedCount !== null,
      providerMode: getProviderMode(),
      estimates,
    };

    return ok(response);
  } catch (error) {
    console.error(error);
    return fail("SERVER_ERROR", "Failed to collect weekly EPS estimates.", 500);
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
