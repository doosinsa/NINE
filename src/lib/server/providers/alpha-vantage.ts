import "server-only";

import type { EarningsProvider, EpsProvider } from "@/lib/server/providers/types";
import type { EarningsSnapshot, EpsEstimate } from "@/types/contracts";

type AlphaVantageMessageResponse = {
  Information?: string;
  Note?: string;
  "Error Message"?: string;
};

type AlphaVantageEarningsEstimateRow = {
  fiscalDateEnding?: string;
  reportDate?: string;
  epsEstimateAverage?: string;
  epsEstimateAvg?: string;
  estimatedEPS?: string;
  numberAnalysts?: string;
  numberOfAnalysts?: string;
};

type AlphaVantageEarningsEstimatesResponse = AlphaVantageMessageResponse & {
  symbol?: string;
  quarterlyEarningsEstimates?: AlphaVantageEarningsEstimateRow[];
};

type AlphaVantageQuarterlyEarningsRow = {
  fiscalDateEnding?: string;
  reportedDate?: string;
  reportedEPS?: string;
  estimatedEPS?: string;
  surprise?: string;
  surprisePercentage?: string;
};

type AlphaVantageEarningsResponse = AlphaVantageMessageResponse & {
  symbol?: string;
  quarterlyEarnings?: AlphaVantageQuarterlyEarningsRow[];
};

type AlphaVantageTicker = {
  input: string;
  symbol: string;
};

export function createAlphaVantageEpsProvider(): EpsProvider {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
  if (!apiKey) {
    throw new Error("ALPHA_VANTAGE_API_KEY is required for Alpha Vantage EPS estimates.");
  }

  const baseUrl = process.env.ALPHA_VANTAGE_BASE_URL ?? "https://www.alphavantage.co";

  return {
    async fetchWeeklyEps(tickers, snapshotDate) {
      const usTickers = tickers.map(toAlphaVantageTicker).filter((ticker): ticker is AlphaVantageTicker => ticker !== null);
      const estimates: EpsEstimate[] = [];

      for (let index = 0; index < usTickers.length; index += 1) {
        const ticker = usTickers[index];
        estimates.push(...(await fetchTickerEpsEstimates({ apiKey, baseUrl, snapshotDate, ticker })));

        if (index < usTickers.length - 1) {
          await sleep(1100);
        }
      }

      return estimates;
    },
  };
}

export function createAlphaVantageEarningsProvider(): EarningsProvider {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
  if (!apiKey) {
    throw new Error("ALPHA_VANTAGE_API_KEY is required for Alpha Vantage earnings.");
  }

  const baseUrl = process.env.ALPHA_VANTAGE_BASE_URL ?? "https://www.alphavantage.co";

  return {
    async fetchQuarterlyEarnings(tickers) {
      const usTickers = tickers.map(toAlphaVantageTicker).filter((ticker): ticker is AlphaVantageTicker => ticker !== null);
      const earnings: EarningsSnapshot[] = [];

      for (let index = 0; index < usTickers.length; index += 1) {
        const ticker = usTickers[index];
        const snapshot = await fetchTickerQuarterlyEarnings({ apiKey, baseUrl, ticker });
        if (snapshot) {
          earnings.push(snapshot);
        }

        if (index < usTickers.length - 1) {
          await sleep(1100);
        }
      }

      return earnings;
    },
  };
}

async function fetchTickerEpsEstimates({
  apiKey,
  baseUrl,
  snapshotDate,
  ticker,
}: {
  apiKey: string;
  baseUrl: string;
  snapshotDate: string;
  ticker: AlphaVantageTicker;
}): Promise<EpsEstimate[]> {
  const body = await fetchAlphaVantage<AlphaVantageEarningsEstimatesResponse>({
    apiKey,
    baseUrl,
    functionName: "EARNINGS_ESTIMATES",
    symbol: ticker.symbol,
  });

  return (body.quarterlyEarningsEstimates ?? [])
    .map((row) => toEpsEstimate(ticker.input, snapshotDate, row))
    .filter((estimate): estimate is EpsEstimate => estimate !== null);
}

async function fetchTickerQuarterlyEarnings({
  apiKey,
  baseUrl,
  ticker,
}: {
  apiKey: string;
  baseUrl: string;
  ticker: AlphaVantageTicker;
}): Promise<EarningsSnapshot | null> {
  const body = await fetchAlphaVantage<AlphaVantageEarningsResponse>({
    apiKey,
    baseUrl,
    functionName: "EARNINGS",
    symbol: ticker.symbol,
  });
  const latest = latestQuarterlyEarnings(body.quarterlyEarnings ?? []);

  return latest ? toEarningsSnapshot(ticker.input, latest) : null;
}

async function fetchAlphaVantage<T extends AlphaVantageMessageResponse>({
  apiKey,
  baseUrl,
  functionName,
  symbol,
}: {
  apiKey: string;
  baseUrl: string;
  functionName: string;
  symbol: string;
}): Promise<T> {
  const url = new URL("/query", baseUrl);
  url.search = new URLSearchParams({
    function: functionName,
    symbol,
    apikey: apiKey,
  }).toString();

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "NINE personal investment prep tool",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Alpha Vantage ${functionName} request failed with HTTP ${response.status}.`);
  }

  const body = (await response.json()) as T;
  const providerMessage = body["Error Message"] ?? body.Information ?? body.Note;
  if (providerMessage) {
    throw new Error(`Alpha Vantage ${functionName} request failed: ${providerMessage}`);
  }

  return body;
}

function toEpsEstimate(ticker: string, snapshotDate: string, row: AlphaVantageEarningsEstimateRow): EpsEstimate | null {
  const fiscalDate = row.fiscalDateEnding ?? row.reportDate;
  const consensus = toNumber(row.epsEstimateAverage ?? row.epsEstimateAvg ?? row.estimatedEPS);
  const fyYear = fiscalDate ? Number(fiscalDate.slice(0, 4)) : NaN;

  if (!Number.isInteger(fyYear) || consensus === null) {
    return null;
  }

  return {
    ticker,
    snapshotDate,
    fyYear,
    consensus,
    analystCount: toInteger(row.numberAnalysts ?? row.numberOfAnalysts),
    dataSource: "alpha-vantage",
  };
}

function latestQuarterlyEarnings(rows: AlphaVantageQuarterlyEarningsRow[]) {
  return [...rows]
    .filter((row) => isIsoDate(row.reportedDate) || isIsoDate(row.fiscalDateEnding))
    .sort((left, right) => rowDate(right).localeCompare(rowDate(left)))[0];
}

function toEarningsSnapshot(ticker: string, row: AlphaVantageQuarterlyEarningsRow): EarningsSnapshot | null {
  const reportedAt = isIsoDate(row.reportedDate) ? row.reportedDate : row.fiscalDateEnding;
  const fiscalDate = isIsoDate(row.fiscalDateEnding) ? row.fiscalDateEnding : reportedAt;

  if (!reportedAt || !fiscalDate) {
    return null;
  }

  return {
    ticker,
    fiscalQuarter: toFiscalQuarter(fiscalDate),
    revenue: null,
    revenueYoy: null,
    eps: toNumber(row.reportedEPS),
    epsSurprise: toNumber(row.surprisePercentage) ?? toNumber(row.surprise),
    reportedAt,
    dataSource: "alpha-vantage",
  };
}

function toAlphaVantageTicker(ticker: string): AlphaVantageTicker | null {
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

function rowDate(row: AlphaVantageQuarterlyEarningsRow) {
  return row.reportedDate ?? row.fiscalDateEnding ?? "";
}

function isIsoDate(value: string | undefined): value is string {
  return /^\d{4}-\d{2}-\d{2}$/.test(value ?? "");
}

function toFiscalQuarter(date: string) {
  const year = date.slice(0, 4);
  const month = Number(date.slice(5, 7));
  const quarter = Number.isFinite(month) && month >= 1 ? Math.ceil(month / 3) : 4;

  return `${year}Q${quarter}`;
}

function toNumber(value: string | number | undefined) {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? number : null;
}

function toInteger(value: string | number | undefined) {
  const number = toNumber(value);
  return number === null ? null : Math.trunc(number);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
