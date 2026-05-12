import "server-only";

import type { EpsProvider } from "@/lib/server/providers/types";
import type { EpsEstimate } from "@/types/contracts";

type FinnhubEpsEstimateRow = {
  period?: string;
  year?: number;
  quarter?: number;
  epsAvg?: number;
  epsHigh?: number;
  epsLow?: number;
  numberAnalysts?: number;
};

type FinnhubEpsEstimateResponse = {
  symbol?: string;
  data?: FinnhubEpsEstimateRow[];
};

export function createFinnhubEpsProvider(): EpsProvider {
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) {
    throw new Error("FINNHUB_API_KEY is required for Finnhub EPS estimates.");
  }

  const baseUrl = process.env.FINNHUB_BASE_URL ?? "https://finnhub.io/api/v1";
  const frequency = process.env.FINNHUB_EPS_FREQ ?? "quarterly";

  return {
    async fetchWeeklyEps(tickers, snapshotDate) {
      const estimates = await Promise.all(
        tickers
          .filter((ticker) => !ticker.includes("."))
          .map((ticker) => fetchTickerEps({ apiKey, baseUrl, frequency, ticker, snapshotDate })),
      );

      return estimates.flat();
    },
  };
}

async function fetchTickerEps({
  apiKey,
  baseUrl,
  frequency,
  ticker,
  snapshotDate,
}: {
  apiKey: string;
  baseUrl: string;
  frequency: string;
  ticker: string;
  snapshotDate: string;
}): Promise<EpsEstimate[]> {
  const url = new URL("/stock/eps-estimate", baseUrl);
  url.search = new URLSearchParams({
    symbol: ticker,
    freq: frequency,
  }).toString();

  const response = await fetch(url, {
    headers: {
      "X-Finnhub-Token": apiKey,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Finnhub EPS estimate request failed with HTTP ${response.status}.`);
  }

  const body = (await response.json()) as FinnhubEpsEstimateResponse;
  const symbol = body.symbol ?? ticker;

  return (body.data ?? [])
    .map((row) => toEpsEstimate(symbol, snapshotDate, row))
    .filter((estimate): estimate is EpsEstimate => estimate !== null);
}

function toEpsEstimate(symbol: string, snapshotDate: string, row: FinnhubEpsEstimateRow): EpsEstimate | null {
  if (typeof row.year !== "number" || typeof row.epsAvg !== "number") {
    return null;
  }

  return {
    ticker: symbol,
    snapshotDate,
    fyYear: row.year,
    consensus: row.epsAvg,
    analystCount: typeof row.numberAnalysts === "number" ? row.numberAnalysts : null,
    dataSource: "finnhub",
  };
}
