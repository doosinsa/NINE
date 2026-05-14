#!/usr/bin/env node

const defaultOptions = {
  baseUrl: process.env.NINE_BASE_URL ?? "http://127.0.0.1:3000",
  timeoutMs: 60_000,
};

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const target = new URL("/api/discover", options.baseUrl);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs);

  try {
    const response = await fetch(target, {
      method: "GET",
      signal: controller.signal,
    });
    const text = await response.text();
    const json = parseJson(text);

    if (!response.ok) {
      throw new Error(`Discover collection failed with HTTP ${response.status}: ${summarizeText(text)}`);
    }

    if (!json || json.ok !== true) {
      throw new Error(`Discover collection returned an error envelope: ${summarizeText(text)}`);
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
      case "timeout-ms":
        options.timeoutMs = parsePositiveInteger(rawKey, requiredValue(rawKey, value));
        break;
      default:
        throw new Error(`Unknown option: --${rawKey}`);
    }
  }

  return options;
}

function printSummary(origin, data) {
  const themes = Array.isArray(data?.themes) ? data.themes : [];
  const representativeTickers = [
    ...new Set(themes.flatMap((theme) => theme.representativeTickers ?? []).filter(Boolean)),
  ].sort();

  console.log(
    JSON.stringify(
      {
        target: origin,
        weekOf: data?.weekOf,
        themeCount: themes.length,
        themeNames: themes.map((theme) => theme.themeName).filter(Boolean),
        representativeTickerCount: representativeTickers.length,
        representativeTickers,
      },
      null,
      2,
    ),
  );
}

function printHelp() {
  console.log(`Usage:
  npm run collect:discover -- --base-url http://127.0.0.1:3000
  NINE_BASE_URL=http://127.0.0.1:3000 npm run collect:discover

Options:
  --base-url     Local worker app URL. Defaults to NINE_BASE_URL or http://127.0.0.1:3000.
  --timeout-ms   Request timeout in milliseconds. Defaults to 60000.

This command prints a summary only. It does not read or print provider secret values.`);
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
  console.error(error.name === "AbortError" ? "Discover collection timed out." : error.message);
  process.exit(1);
});
