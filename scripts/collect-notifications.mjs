#!/usr/bin/env node

const defaultOptions = {
  baseUrl: process.env.NINE_BASE_URL ?? "http://127.0.0.1:3000",
  tier: "tier_3",
  ticker: "PLTR",
  to: process.env.NINE_NOTIFICATION_TO ?? "",
  body: "NINE notification collector smoke",
  timeoutMs: 60_000,
};

const alertTiers = new Set(["tier_1", "tier_2", "tier_3"]);

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (process.env.NINE_COLLECT_ALLOW_NOTIFICATIONS !== "true") {
    throw new Error("Refusing notification dispatch. Set NINE_COLLECT_ALLOW_NOTIFICATIONS=true and use --to.");
  }

  if (!options.to) {
    throw new Error("Notification dispatch requires --to with your own phone number.");
  }

  const target = new URL("/api/notifications/send", options.baseUrl);
  const body = {
    tier: options.tier,
    to: options.to,
    body: options.body,
    ...(options.ticker ? { ticker: options.ticker } : {}),
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs);

  try {
    const response = await fetch(target, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const text = await response.text();
    const json = parseJson(text);

    if (!response.ok) {
      throw new Error(`Notification dispatch failed with HTTP ${response.status}: ${summarizeText(text)}`);
    }

    if (!json || json.ok !== true) {
      throw new Error(`Notification dispatch returned an error envelope: ${summarizeText(text)}`);
    }

    printSummary(target.origin, json.data);
  } finally {
    clearTimeout(timeout);
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
      case "tier":
        options.tier = requiredValue(rawKey, value);
        break;
      case "to":
        options.to = requiredValue(rawKey, value);
        break;
      case "body":
        options.body = requiredValue(rawKey, value);
        break;
      case "ticker":
        options.ticker = requiredValue(rawKey, value).toUpperCase();
        break;
      case "timeout-ms":
        options.timeoutMs = parsePositiveInteger(rawKey, requiredValue(rawKey, value));
        break;
      default:
        throw new Error(`Unknown option: --${rawKey}`);
    }
  }

  if (!alertTiers.has(options.tier)) {
    throw new Error("--tier must be tier_1, tier_2, or tier_3.");
  }

  if (!options.body.trim()) {
    throw new Error("--body must not be empty.");
  }

  return options;
}

function printSummary(origin, data) {
  console.log(
    JSON.stringify(
      {
        target: origin,
        providerMode: data?.providerMode,
        tier: data?.tier,
        ticker: data?.ticker,
        sent: Boolean(data?.sent),
        persisted: Boolean(data?.persisted),
        eventIdPresent: Boolean(data?.eventId),
        providerMessageIdPresent: Boolean(data?.providerMessageId),
      },
      null,
      2,
    ),
  );
}

function printHelp() {
  console.log(`Usage:
  NINE_COLLECT_ALLOW_NOTIFICATIONS=true npm run collect:notifications -- --base-url http://127.0.0.1:3000 --to 01000000000
  NINE_COLLECT_ALLOW_NOTIFICATIONS=true NINE_NOTIFICATION_TO=01000000000 npm run collect:notifications

Options:
  --base-url     Local worker app URL. Defaults to NINE_BASE_URL or http://127.0.0.1:3000.
  --tier         tier_1, tier_2, or tier_3. Defaults to tier_3.
  --to           Recipient phone number. Required unless NINE_NOTIFICATION_TO is set.
  --body         Notification body. Defaults to a smoke-test message.
  --ticker       Optional ticker to persist with the event. Defaults to PLTR.
  --timeout-ms   Request timeout in milliseconds. Defaults to 60000.

Safety:
  This command always requires NINE_COLLECT_ALLOW_NOTIFICATIONS=true because the target worker may be configured for live Solapi sends.
  It prints a summary only. It does not read or print provider secret values, recipient values, event ids, or provider message ids.`);
}

function requiredValue(key, value) {
  if (!value || value.startsWith("--")) {
    throw new Error(`--${key} requires a value.`);
  }

  return value;
}

function parsePositiveInteger(key, value) {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`--${key} must be a positive integer.`);
  }

  return parsed;
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

main().catch((error) => {
  console.error(error.name === "AbortError" ? "Notification dispatch timed out." : error.message);
  process.exit(1);
});
