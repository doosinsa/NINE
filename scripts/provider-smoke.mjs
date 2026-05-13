#!/usr/bin/env node

const suites = new Map([
  ["status", { method: "GET", path: "/api/providers/status" }],
  ["discover", { method: "GET", path: "/api/discover" }],
  [
    "prices",
    {
      method: "POST",
      path: "/api/prices/collect",
      body: (options) => ({ tickers: options.tickers, date: options.date }),
    },
  ],
  [
    "eps",
    {
      method: "POST",
      path: "/api/eps/collect",
      body: (options) => ({ tickers: options.epsTickers, snapshotDate: options.date }),
    },
  ],
  [
    "earnings",
    {
      method: "POST",
      path: "/api/earnings/collect",
      body: (options) => ({ tickers: options.tickers }),
    },
  ],
  [
    "briefs",
    {
      method: "POST",
      path: "/api/briefs/collect",
      body: (options) => ({ tickers: options.briefTickers }),
    },
  ],
  [
    "notifications",
    {
      method: "POST",
      path: "/api/notifications/send",
      body: (options) => ({
        tier: "tier_3",
        to: options.to,
        body: "NINE provider smoke",
        ticker: "PLTR",
      }),
    },
  ],
]);

const allSuites = ["status", "prices", "eps", "earnings", "briefs", "discover"];
const defaultOptions = {
  baseUrl: "http://127.0.0.1:3000",
  suite: "status",
  date: kstDateString(),
  tickers: ["005930.KS", "PLTR"],
  epsTickers: ["PLTR", "NVDA"],
  briefTickers: ["PLTR"],
  to: "",
};

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const suiteNames = expandSuites(options.suite);
  const target = new URL(options.baseUrl);
  const isLocalTarget = ["localhost", "127.0.0.1", "::1"].includes(target.hostname);

  if (!isLocalTarget && process.env.NINE_SMOKE_ALLOW_LIVE !== "true") {
    throw new Error("Refusing non-local smoke target. Set NINE_SMOKE_ALLOW_LIVE=true for an explicit live target.");
  }

  if (suiteNames.includes("notifications")) {
    if (process.env.NINE_SMOKE_ALLOW_NOTIFICATIONS !== "true") {
      throw new Error("Refusing notification smoke. Set NINE_SMOKE_ALLOW_NOTIFICATIONS=true and use --to.");
    }
    if (!options.to) {
      throw new Error("Notification smoke requires --to with your own phone number.");
    }
  }

  console.log(`Provider smoke target: ${target.origin}`);
  console.log(`Suites: ${suiteNames.join(", ")}`);

  for (const suiteName of suiteNames) {
    await runSuite(target, suiteName, options);
  }
}

function parseArgs(args) {
  const options = { ...defaultOptions };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }

    if (!arg.startsWith("--")) {
      throw new Error(`Unexpected argument: ${arg}`);
    }

    const [rawKey, inlineValue] = arg.slice(2).split("=", 2);
    const value = inlineValue ?? args[index + 1];

    if (!inlineValue) index += 1;

    switch (rawKey) {
      case "base-url":
        options.baseUrl = requiredValue(rawKey, value);
        break;
      case "suite":
        options.suite = requiredValue(rawKey, value);
        break;
      case "date":
        options.date = requiredValue(rawKey, value);
        break;
      case "tickers":
        options.tickers = parseList(requiredValue(rawKey, value));
        break;
      case "eps-tickers":
        options.epsTickers = parseList(requiredValue(rawKey, value));
        break;
      case "brief-tickers":
        options.briefTickers = parseList(requiredValue(rawKey, value));
        break;
      case "to":
        options.to = requiredValue(rawKey, value);
        break;
      default:
        throw new Error(`Unknown option: --${rawKey}`);
    }
  }

  if (!isIsoDate(options.date)) {
    throw new Error("--date must use YYYY-MM-DD format.");
  }

  return options;
}

function expandSuites(value) {
  if (value === "all") return allSuites;

  const names = value.split(",").map((item) => item.trim()).filter(Boolean);
  const unknown = names.filter((name) => !suites.has(name));

  if (unknown.length > 0) {
    throw new Error(`Unknown suite: ${unknown.join(", ")}`);
  }

  return names;
}

async function runSuite(target, suiteName, options) {
  const suite = suites.get(suiteName);
  const url = new URL(suite.path, target.origin);
  const request = {
    method: suite.method,
    headers: suite.method === "POST" ? { "Content-Type": "application/json" } : undefined,
    body: suite.body ? JSON.stringify(suite.body(options)) : undefined,
  };

  console.log(`\n> ${suite.method} ${suite.path}`);

  const response = await fetch(url, request);
  const text = await response.text();
  const json = parseJson(text);

  if (!response.ok) {
    throw new Error(`${suiteName} failed with HTTP ${response.status}: ${summarizeText(text)}`);
  }

  if (!json || json.ok !== true) {
    throw new Error(`${suiteName} returned an error envelope: ${summarizeText(text)}`);
  }

  printSummary(suiteName, json.data);
}

function printSummary(suiteName, data) {
  const summary = {
    providerMode: data?.providerMode,
  };

  if (suiteName === "status") {
    summary.configured = Array.isArray(data?.statuses) ? data.statuses.filter((status) => status.configured).length : 0;
    summary.missingEnv = Array.isArray(data?.statuses)
      ? data.statuses.reduce((count, status) => count + status.missingEnv.length, 0)
      : 0;
  }

  if (suiteName === "prices") {
    summary.requested = data?.requestedTickers?.length ?? 0;
    summary.collected = data?.collectedCount ?? 0;
    summary.persisted = data?.persisted;
  }

  if (suiteName === "eps") {
    summary.requested = data?.requestedTickers?.length ?? 0;
    summary.collected = data?.collectedCount ?? 0;
    summary.persisted = data?.persisted;
  }

  if (suiteName === "earnings") {
    summary.requested = data?.requestedTickers?.length ?? 0;
    summary.collected = data?.collectedCount ?? 0;
    summary.persisted = data?.persisted;
  }

  if (suiteName === "briefs") {
    summary.requested = data?.requestedTickers?.length ?? 0;
    summary.generated = data?.generatedCount ?? 0;
    summary.persisted = data?.persisted;
  }

  if (suiteName === "discover") {
    summary.themes = Array.isArray(data?.themes) ? data.themes.length : 0;
  }

  if (suiteName === "notifications") {
    summary.sent = data?.sent;
    summary.persisted = data?.persisted;
    summary.providerMessageIdPresent = Boolean(data?.providerMessageId);
  }

  console.log(JSON.stringify(summary, null, 2));
}

function printHelp() {
  console.log(`Usage:
  npm run provider:smoke -- --base-url http://127.0.0.1:3000 --suite status
  NINE_SMOKE_ALLOW_LIVE=true npm run provider:smoke -- --base-url https://nine-red-three.vercel.app --suite prices --date 2026-05-13

Options:
  --base-url        Target app URL. Defaults to http://127.0.0.1:3000.
  --suite           status, prices, eps, earnings, briefs, discover, notifications, or all. Defaults to status.
  --date            YYYY-MM-DD for prices and EPS. Defaults to current KST date.
  --tickers         Comma list for prices and earnings. Defaults to 005930.KS,PLTR.
  --eps-tickers     Comma list for EPS. Defaults to PLTR,NVDA.
  --brief-tickers   Comma list for Core briefs. Defaults to PLTR.
  --to              Recipient for notification smoke. Requires NINE_SMOKE_ALLOW_NOTIFICATIONS=true.

Safety:
  Non-local base URLs require NINE_SMOKE_ALLOW_LIVE=true.
  Notification smoke also requires NINE_SMOKE_ALLOW_NOTIFICATIONS=true.
  The script prints response summaries only and never reads or prints provider secret env values.`);
}

function requiredValue(key, value) {
  if (!value || value.startsWith("--")) {
    throw new Error(`--${key} requires a value.`);
  }

  return value;
}

function parseList(value) {
  const items = value.split(",").map((item) => item.trim().toUpperCase()).filter(Boolean);

  if (items.length === 0) {
    throw new Error("Ticker lists must contain at least one ticker.");
  }

  return items;
}

function parseJson(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function summarizeText(value) {
  return value.replace(/\s+/g, " ").slice(0, 240);
}

function isIsoDate(date) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(new Date(`${date}T00:00:00.000Z`).getTime());
}

function kstDateString() {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
