import { fail, ok } from "@/lib/server/api";
import { epsEstimates, stocks } from "@/lib/server/mock-data";
import { createExternalProviders, getProviderMode } from "@/lib/server/providers";
import type { CoreBriefInput } from "@/lib/server/providers";
import {
  fetchCoreBriefInputsFromSupabase,
  fetchPriceCollectionTickersFromSupabase,
  insertCoreBriefsInSupabase,
} from "@/lib/server/supabase";
import type { CoreBriefCollectionRequest, CoreBriefCollectionResponse, LlmBrief } from "@/types/contracts";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Partial<CoreBriefCollectionRequest> | null;
  const requestedTickers = body?.tickers ? normalizeTickers(body.tickers) : await getDefaultTickers();

  if (requestedTickers.length === 0) {
    return fail("BAD_REQUEST", "At least one ticker is required for core brief collection.");
  }

  try {
    const providers = createExternalProviders();
    const inputs = (await fetchCoreBriefInputsFromSupabase(requestedTickers)) ?? (await getMockInputs(requestedTickers));
    const generatedAt = new Date().toISOString();
    const briefs = await Promise.all(
      inputs.map(async (input): Promise<LlmBrief> => {
        const brief = await providers.llm.generateCoreBrief(input);
        return {
          ...brief,
          generatedAt,
        };
      }),
    );
    const persistedCount = await insertCoreBriefsInSupabase(briefs);

    const response: CoreBriefCollectionResponse = {
      requestedTickers,
      generatedCount: briefs.length,
      persistedCount: persistedCount ?? 0,
      persisted: persistedCount !== null,
      providerMode: getProviderMode(),
      briefs,
    };

    return ok(response);
  } catch (error) {
    console.error(error);
    return fail("SERVER_ERROR", "Failed to collect core LLM briefs.", 500);
  }
}

async function getDefaultTickers() {
  return (await fetchPriceCollectionTickersFromSupabase()) ?? stocks.map((stock) => stock.ticker);
}

async function getMockInputs(tickers: string[]): Promise<CoreBriefInput[]> {
  const providers = createExternalProviders();
  const earnings = await providers.earnings.fetchQuarterlyEarnings(tickers);

  return tickers
    .map((ticker): CoreBriefInput | null => {
      const stock = stocks.find((item) => item.ticker.toUpperCase() === ticker.toUpperCase());
      if (!stock) return null;

      return {
        ticker: stock.ticker,
        companyName: stock.name,
        country: stock.country,
        recentEps: epsEstimates.filter((estimate) => estimate.ticker.toUpperCase() === stock.ticker.toUpperCase()),
        earnings: earnings.filter((snapshot) => snapshot.ticker.toUpperCase() === stock.ticker.toUpperCase()),
      };
    })
    .filter((input): input is CoreBriefInput => input !== null);
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
