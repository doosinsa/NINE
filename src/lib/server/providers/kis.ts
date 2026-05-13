import "server-only";

import type { DailyPrice, PriceProvider } from "@/lib/server/providers/types";

type KisTokenResponse = {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
};

type KisDailyPriceRow = {
  stck_bsop_date?: string;
  stck_oprc?: string;
  stck_hgpr?: string;
  stck_lwpr?: string;
  stck_clpr?: string;
  acml_vol?: string;
};

type KisDailyPriceResponse = {
  rt_cd?: string;
  msg_cd?: string;
  msg1?: string;
  output2?: KisDailyPriceRow[];
};

let cachedToken: { accessToken: string; expiresAt: number } | null = null;

export function createKisPriceProvider(): PriceProvider {
  const appKey = process.env.KIS_APP_KEY;
  const appSecret = process.env.KIS_APP_SECRET;
  if (!appKey || !appSecret) {
    throw new Error("KIS_APP_KEY and KIS_APP_SECRET are required for KIS daily prices.");
  }

  const baseUrl = process.env.KIS_BASE_URL ?? "https://openapi.koreainvestment.com:9443";
  const marketDivCode = process.env.KIS_MARKET_DIV_CODE ?? "J";
  const trId = process.env.KIS_DAILY_PRICE_TR_ID ?? "FHKST03010100";

  return {
    async fetchDailyPrices(tickers, date) {
      const normalizedDate = toKisDate(date);
      const krTickers = tickers
        .map((ticker) => ({ input: ticker, requestTicker: toKisTicker(ticker) }))
        .filter((ticker): ticker is { input: string; requestTicker: string } => ticker.requestTicker !== null);
      if (krTickers.length === 0) {
        return [];
      }

      const accessToken = await getAccessToken({ appKey, appSecret, baseUrl });

      const prices = await Promise.all(
        krTickers.map((ticker) =>
          fetchTickerDailyPrice({
            accessToken,
            appKey,
            appSecret,
            baseUrl,
            date: normalizedDate,
            inputTicker: ticker.input,
            marketDivCode,
            ticker: ticker.requestTicker,
            trId,
          }),
        ),
      );

      return prices.filter((price): price is DailyPrice => price !== null);
    },
  };
}

async function getAccessToken({
  appKey,
  appSecret,
  baseUrl,
}: {
  appKey: string;
  appSecret: string;
  baseUrl: string;
}) {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + 60_000) {
    return cachedToken.accessToken;
  }

  const url = new URL("/oauth2/tokenP", baseUrl);
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({
      grant_type: "client_credentials",
      appkey: appKey,
      appsecret: appSecret,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`KIS token request failed with HTTP ${response.status}.`);
  }

  const body = (await response.json()) as KisTokenResponse;
  if (!body.access_token) {
    throw new Error("KIS token response did not include access_token.");
  }

  cachedToken = {
    accessToken: body.access_token,
    expiresAt: now + Math.max(0, (body.expires_in ?? 0) - 60) * 1000,
  };

  return body.access_token;
}

async function fetchTickerDailyPrice({
  accessToken,
  appKey,
  appSecret,
  baseUrl,
  date,
  inputTicker,
  marketDivCode,
  ticker,
  trId,
}: {
  accessToken: string;
  appKey: string;
  appSecret: string;
  baseUrl: string;
  date: string;
  inputTicker: string;
  marketDivCode: string;
  ticker: string;
  trId: string;
}): Promise<DailyPrice | null> {
  const url = new URL("/uapi/domestic-stock/v1/quotations/inquire-daily-itemchartprice", baseUrl);
  url.search = new URLSearchParams({
    FID_COND_MRKT_DIV_CODE: marketDivCode,
    FID_INPUT_ISCD: ticker,
    FID_INPUT_DATE_1: date,
    FID_INPUT_DATE_2: date,
    FID_PERIOD_DIV_CODE: "D",
    FID_ORG_ADJ_PRC: "1",
  }).toString();

  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      authorization: `Bearer ${accessToken}`,
      appkey: appKey,
      appsecret: appSecret,
      tr_id: trId,
      custtype: "P",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`KIS daily price request failed with HTTP ${response.status}.`);
  }

  const body = (await response.json()) as KisDailyPriceResponse;
  if (body.rt_cd && body.rt_cd !== "0") {
    throw new Error(`KIS daily price request failed: ${body.msg_cd ?? "UNKNOWN"} ${body.msg1 ?? ""}`.trim());
  }

  const row = body.output2?.find((item) => item.stck_bsop_date === date) ?? body.output2?.[0];
  return row ? toDailyPrice(inputTicker, row) : null;
}

function toDailyPrice(ticker: string, row: KisDailyPriceRow): DailyPrice | null {
  const date = toIsoDate(row.stck_bsop_date);
  const open = toNumber(row.stck_oprc);
  const high = toNumber(row.stck_hgpr);
  const low = toNumber(row.stck_lwpr);
  const close = toNumber(row.stck_clpr);
  const volume = toNumber(row.acml_vol);

  if (!date || open === null || high === null || low === null || close === null || volume === null) {
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
    source: "kis",
  };
}

function toKisTicker(ticker: string) {
  const trimmed = ticker.trim().toUpperCase();
  const withoutSuffix = trimmed.replace(/\.(KS|KQ|KRX)$/, "");

  return /^\d{6}$/.test(withoutSuffix) ? withoutSuffix : null;
}

function toKisDate(date: string) {
  const normalized = date.replaceAll("-", "");
  if (!/^\d{8}$/.test(normalized)) {
    throw new Error(`Invalid KIS daily price date: ${date}`);
  }

  return normalized;
}

function toIsoDate(value: string | undefined) {
  if (!value || !/^\d{8}$/.test(value)) {
    return null;
  }

  return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
}

function toNumber(value: string | undefined) {
  if (!value) {
    return null;
  }

  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}
