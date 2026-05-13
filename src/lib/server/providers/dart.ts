import "server-only";

import type { EarningsProvider, EarningsSnapshot } from "@/lib/server/providers/types";

type DartFinancialRow = {
  rcept_no?: string;
  bsns_year?: string;
  stock_code?: string;
  reprt_code?: string;
  account_nm?: string;
  fs_div?: string;
  sj_div?: string;
  thstrm_dt?: string;
  thstrm_amount?: string;
  thstrm_add_amount?: string;
  frmtrm_amount?: string;
  frmtrm_add_amount?: string;
};

type DartFinancialResponse =
  | {
      status: "000";
      message: string;
      list?: DartFinancialRow[];
    }
  | {
      status: string;
      message: string;
      list?: never;
    };

type DartTicker = {
  input: string;
  stockCode: string;
  corpCode: string;
};

const reportQuarter: Record<string, string> = {
  "11013": "Q1",
  "11012": "Q2",
  "11014": "Q3",
  "11011": "Q4",
};

export function createDartEarningsProvider(): EarningsProvider {
  const apiKey = process.env.DART_API_KEY;
  if (!apiKey) {
    throw new Error("DART_API_KEY is required for DART earnings snapshots.");
  }

  const corpCodeMap = parseCorpCodeMap(process.env.DART_CORP_CODE_MAP);
  const baseUrl = nonEmpty(process.env.DART_BASE_URL) ?? "https://opendart.fss.or.kr";
  const businessYear = nonEmpty(process.env.DART_BUSINESS_YEAR) ?? currentKstYear();
  const reportCode = nonEmpty(process.env.DART_REPORT_CODE) ?? "11013";
  const fsDiv = nonEmpty(process.env.DART_FS_DIV) ?? "CFS";

  return {
    async fetchQuarterlyEarnings(tickers) {
      const dartTickers = tickers
        .map((ticker) => toDartTicker(ticker, corpCodeMap))
        .filter((ticker): ticker is DartTicker => ticker !== null);

      if (dartTickers.length === 0) {
        return [];
      }

      const earnings = await Promise.all(
        dartTickers.map((ticker) =>
          fetchTickerEarnings({
            apiKey,
            baseUrl,
            businessYear,
            fsDiv,
            reportCode,
            ticker,
          }),
        ),
      );

      return earnings.filter((snapshot): snapshot is EarningsSnapshot => snapshot !== null);
    },
  };
}

async function fetchTickerEarnings({
  apiKey,
  baseUrl,
  businessYear,
  fsDiv,
  reportCode,
  ticker,
}: {
  apiKey: string;
  baseUrl: string;
  businessYear: string;
  fsDiv: string;
  reportCode: string;
  ticker: DartTicker;
}): Promise<EarningsSnapshot | null> {
  const url = new URL("/api/fnlttSinglAcnt.json", baseUrl);
  url.search = new URLSearchParams({
    crtfc_key: apiKey,
    corp_code: ticker.corpCode,
    bsns_year: businessYear,
    reprt_code: reportCode,
  }).toString();

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "NINE personal investment prep tool",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`DART earnings request failed with HTTP ${response.status}.`);
  }

  const body = (await response.json()) as DartFinancialResponse;
  if (body.status === "013") {
    return null;
  }

  if (body.status !== "000") {
    throw new Error(`DART earnings request failed: ${body.status} ${body.message}`.trim());
  }

  const rows = (body.list ?? []).filter((row) => row.fs_div === fsDiv);
  return toEarningsSnapshot(ticker.input, businessYear, reportCode, rows);
}

function toEarningsSnapshot(
  ticker: string,
  businessYear: string,
  reportCode: string,
  rows: DartFinancialRow[],
): EarningsSnapshot | null {
  if (rows.length === 0) {
    return null;
  }

  const revenueRow = rows.find(isRevenueRow);
  const epsRow = rows.find(isEpsRow);
  const revenue = toNumber(revenueRow?.thstrm_amount) ?? toNumber(revenueRow?.thstrm_add_amount);
  const previousRevenue = toNumber(revenueRow?.frmtrm_amount) ?? toNumber(revenueRow?.frmtrm_add_amount);

  return {
    ticker,
    fiscalQuarter: `${businessYear}${reportQuarter[reportCode] ?? reportCode}`,
    revenue,
    revenueYoy: revenue !== null && previousRevenue !== null ? toPercentChange(revenue, previousRevenue) : null,
    eps: toNumber(epsRow?.thstrm_amount) ?? toNumber(epsRow?.thstrm_add_amount),
    epsSurprise: null,
    reportedAt: toReportedAt(revenueRow?.thstrm_dt ?? rows[0]?.thstrm_dt, businessYear, reportCode),
    dataSource: "dart",
  };
}

function parseCorpCodeMap(value: string | undefined) {
  if (!value) {
    throw new Error("DART_CORP_CODE_MAP is required for DART earnings snapshots.");
  }

  const parsed = parseJsonCorpCodeMap(value) ?? parseDelimitedCorpCodeMap(value);
  if (Object.keys(parsed).length === 0) {
    throw new Error("DART_CORP_CODE_MAP must include at least one ticker to corp_code mapping.");
  }

  return parsed;
}

function parseJsonCorpCodeMap(value: string) {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }

    return Object.fromEntries(
      Object.entries(parsed)
        .filter((entry): entry is [string, string] => typeof entry[1] === "string")
        .map(([ticker, corpCode]) => toCorpCodeEntry(ticker, corpCode))
        .filter((entry): entry is [string, string] => entry !== null),
    ) as Record<string, string>;
  } catch {
    return null;
  }
}

function parseDelimitedCorpCodeMap(value: string) {
  return Object.fromEntries(
    value
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean)
      .map((entry) => entry.split("="))
      .filter((entry): entry is [string, string] => entry.length === 2)
      .map(([ticker, corpCode]) => toCorpCodeEntry(ticker, corpCode))
      .filter((entry): entry is [string, string] => entry !== null),
  ) as Record<string, string>;
}

function toCorpCodeEntry(ticker: string, corpCodeValue: string): [string, string] | null {
  const normalizedTicker = normalizeKrTicker(ticker);
  const corpCode = corpCodeValue.trim();
  if (!normalizedTicker || !/^\d{8}$/.test(corpCode)) {
    return null;
  }

  return [normalizedTicker, corpCode];
}

function toDartTicker(ticker: string, corpCodeMap: Record<string, string>): DartTicker | null {
  const stockCode = normalizeKrTicker(ticker);
  if (!stockCode) {
    return null;
  }

  const corpCode = corpCodeMap[stockCode];
  if (!corpCode) {
    return null;
  }

  return {
    input: ticker.trim().toUpperCase(),
    stockCode,
    corpCode,
  };
}

function normalizeKrTicker(ticker: string) {
  const withoutSuffix = ticker.trim().toUpperCase().replace(/\.(KS|KQ|KRX)$/, "");
  return /^\d{6}$/.test(withoutSuffix) ? withoutSuffix : null;
}

function isRevenueRow(row: DartFinancialRow) {
  return row.sj_div === "IS" && ["매출액", "영업수익", "수익"].some((name) => row.account_nm?.includes(name));
}

function isEpsRow(row: DartFinancialRow) {
  return row.sj_div === "IS" && ["기본주당이익", "주당이익"].some((name) => row.account_nm?.includes(name));
}

function toNumber(value: string | undefined) {
  if (!value || value === "-") {
    return null;
  }

  const normalized = value.replaceAll(",", "").trim();
  const numeric = Number(normalized.replace(/^\((.*)\)$/, "-$1"));
  return Number.isFinite(numeric) ? numeric : null;
}

function toPercentChange(current: number, previous: number) {
  if (previous === 0) {
    return null;
  }

  return Math.round(((current - previous) / Math.abs(previous)) * 10_000) / 100;
}

function toReportedAt(value: string | undefined, businessYear: string, reportCode: string) {
  const matches = value?.match(/\d{4}\.\d{2}\.\d{2}/g);
  const date = matches?.at(-1);
  if (date) {
    return date.replaceAll(".", "-");
  }

  const quarterEnd: Record<string, string> = {
    "11013": "03-31",
    "11012": "06-30",
    "11014": "09-30",
    "11011": "12-31",
  };

  return `${businessYear}-${quarterEnd[reportCode] ?? "12-31"}`;
}

function currentKstYear() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
  }).format(new Date());
}

function nonEmpty(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}
