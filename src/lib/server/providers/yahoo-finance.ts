import "server-only";

import type { DailyPrice, PriceProvider } from "@/lib/server/providers/types";

type YahooChartQuote = {
  open?: Array<number | null>;
  high?: Array<number | null>;
  low?: Array<number | null>;
  close?: Array<number | null>;
  volume?: Array<number | null>;
};

type YahooChartResult = {
  meta?: {
    symbol?: string;
  };
  timestamp?: number[];
  indicators?: {
    quote?: YahooChartQuote[];
  };
};

type YahooChartResponse = {
  chart?: {
    result?: YahooChartResult[] | null;
    error?: {
      code?: string;
      description?: string;
    } | null;
  };
};

export function createYahooFinancePriceProvider(): PriceProvider {
  const baseUrl = process.env.YAHOO_FINANCE_BASE_URL ?? "https://query1.finance.yahoo.com";

  return {
    async fetchDailyPrices(tickers, date) {
      const usTickers = tickers.map(toYahooTicker).filter((ticker): ticker is YahooTicker => ticker !== null);
      if (usTickers.length === 0) {
        return [];
      }

      const prices = await Promise.all(
        usTickers.map((ticker) =>
          fetchTickerDailyPrice({
            baseUrl,
            date,
            ticker,
          }),
        ),
      );

      return prices.filter((price): price is DailyPrice => price !== null);
    },
  };
}

type YahooTicker = {
  input: string;
  symbol: string;
};

async function fetchTickerDailyPrice({
  baseUrl,
  date,
  ticker,
}: {
  baseUrl: string;
  date: string;
  ticker: YahooTicker;
}): Promise<DailyPrice | null> {
  const { period1, period2 } = toYahooWindow(date);
  const url = new URL(`/v8/finance/chart/${encodeURIComponent(ticker.symbol)}`, baseUrl);
  url.search = new URLSearchParams({
    period1: String(period1),
    period2: String(period2),
    interval: "1d",
    events: "history",
    includeAdjustedClose: "true",
  }).toString();

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "NINE personal investment prep tool",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Yahoo Finance daily price request failed with HTTP ${response.status}.`);
  }

  const body = (await response.json()) as YahooChartResponse;
  if (body.chart?.error) {
    throw new Error(
      `Yahoo Finance daily price request failed: ${body.chart.error.code ?? "UNKNOWN"} ${
        body.chart.error.description ?? ""
      }`.trim(),
    );
  }

  const result = body.chart?.result?.[0];
  return result ? toDailyPrice(ticker.input, date, result) : null;
}

function toDailyPrice(ticker: string, targetDate: string, result: YahooChartResult): DailyPrice | null {
  const timestamps = result.timestamp ?? [];
  const quote = result.indicators?.quote?.[0];
  if (!quote || timestamps.length === 0) {
    return null;
  }

  const normalizedTargetDate = normalizeDate(targetDate);
  const index = timestamps.findIndex((timestamp) => toIsoDate(timestamp) === normalizedTargetDate);
  const rowIndex = index >= 0 ? index : timestamps.length - 1;

  const date = toIsoDate(timestamps[rowIndex]);
  const open = quote.open?.[rowIndex];
  const high = quote.high?.[rowIndex];
  const low = quote.low?.[rowIndex];
  const close = quote.close?.[rowIndex];
  const volume = quote.volume?.[rowIndex];

  if (
    !date ||
    !isFiniteNumber(open) ||
    !isFiniteNumber(high) ||
    !isFiniteNumber(low) ||
    !isFiniteNumber(close) ||
    !isFiniteNumber(volume)
  ) {
    return null;
  }

  return {
    ticker,
    date,
    open,
    high,
    low,
    close,
    volume,
    source: "yahoo-finance",
  };
}

function toYahooTicker(ticker: string): YahooTicker | null {
  const input = ticker.trim().toUpperCase();
  if (!input || isKrTicker(input)) {
    return null;
  }

  return {
    input,
    symbol: input.replace(".", "-"),
  };
}

function isKrTicker(ticker: string) {
  return /^\d{6}(\.(KS|KQ|KRX))?$/.test(ticker);
}

function toYahooWindow(date: string) {
  const normalizedDate = normalizeDate(date);
  const start = new Date(`${normalizedDate}T00:00:00.000Z`);
  if (Number.isNaN(start.getTime())) {
    throw new Error(`Invalid Yahoo Finance daily price date: ${date}`);
  }

  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 1);

  return {
    period1: Math.floor(start.getTime() / 1000),
    period2: Math.floor(end.getTime() / 1000),
  };
}

function normalizeDate(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error(`Invalid Yahoo Finance daily price date: ${date}`);
  }

  return date;
}

function toIsoDate(timestamp: number | undefined) {
  if (typeof timestamp !== "number") {
    return null;
  }

  return new Date(timestamp * 1000).toISOString().slice(0, 10);
}

function isFiniteNumber(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}
