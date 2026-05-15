#!/usr/bin/env node

import { spawn } from "node:child_process";

const defaultOptions = {
  baseUrl: process.env.NINE_BASE_URL ?? "http://127.0.0.1:3000",
  to: process.env.NINE_NOTIFICATION_TO ?? "",
  tier: "tier_3",
  ticker: "PLTR",
  notifyFailure: process.env.NINE_COLLECT_FAILURE_NOTIFY === "true",
  notifyAllowed: process.env.NINE_COLLECT_ALLOW_NOTIFICATIONS === "true",
};

async function main() {
  const { options, command } = parseArgs(process.argv.slice(2));

  if (command.length === 0) {
    throw new Error("A collector command is required after --.");
  }

  const result = await runCommand(command);

  if (result.exitCode === 0) {
    process.exit(0);
  }

  if (!options.notifyFailure) {
    process.exit(result.exitCode);
  }

  if (!options.notifyAllowed) {
    console.error("Failure notification skipped: set NINE_COLLECT_ALLOW_NOTIFICATIONS=true to enable dispatch.");
    process.exit(result.exitCode);
  }

  if (!options.to) {
    console.error("Failure notification skipped: set --to or NINE_NOTIFICATION_TO to target your own phone number.");
    process.exit(result.exitCode);
  }

  try {
    const summary = buildFailureSummary(command, result);
    const notificationResult = await dispatchFailureNotification(options, summary);
    printNotificationSummary(notificationResult);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
  }

  process.exit(result.exitCode);
}

function parseArgs(args) {
  const options = { ...defaultOptions };
  const command = [];
  let collectingCommand = false;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }

    if (collectingCommand) {
      command.push(arg);
      continue;
    }

    if (arg === "--") {
      collectingCommand = true;
      continue;
    }

    if (!arg.startsWith("--")) {
      throw new Error(`Unexpected argument: ${arg}`);
    }

    const [rawKey, inlineValue] = arg.slice(2).split("=", 2);

    switch (rawKey) {
      case "notify-failure":
        options.notifyFailure = inlineValue ? inlineValue !== "false" : true;
        break;
      case "base-url":
      case "to":
      case "tier":
      case "ticker": {
        const value = inlineValue ?? args[index + 1];

        if (!inlineValue) index += 1;

        switch (rawKey) {
          case "base-url":
            options.baseUrl = requiredValue(rawKey, value);
            break;
          case "to":
            options.to = requiredValue(rawKey, value);
            break;
          case "tier":
            options.tier = requiredValue(rawKey, value);
            break;
          case "ticker":
            options.ticker = requiredValue(rawKey, value).toUpperCase();
            break;
        }
        break;
      }
      default:
        throw new Error(`Unknown option: --${rawKey}`);
    }
  }

  return { options, command };
}

function runCommand(command) {
  return new Promise((resolve) => {
    const child = spawn(command[0], command.slice(1), {
      stdio: ["ignore", "pipe", "pipe"],
      shell: false,
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
      process.stdout.write(chunk);
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
      process.stderr.write(chunk);
    });

    child.on("close", (exitCode, signal) => {
      resolve({
        exitCode: typeof exitCode === "number" ? exitCode : 1,
        signal,
        stdout,
        stderr,
      });
    });
  });
}

function buildFailureSummary(command, result) {
  const commandLabel = command.join(" ");
  const failureLine = pickFailureLine(result.stderr) ?? pickFailureLine(result.stdout) ?? "Collector failed.";

  return [
    "NINE collector failure",
    `Command: ${commandLabel}`,
    `Exit code: ${result.exitCode}`,
    `Reason: ${failureLine}`,
  ].join("\n");
}

async function dispatchFailureNotification(options, body) {
  const target = new URL("/api/notifications/send", options.baseUrl);
  const response = await fetch(target, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tier: options.tier,
      to: options.to,
      body,
      ticker: options.ticker,
    }),
  });
  const text = await response.text();
  const json = parseJson(text);

  if (!response.ok) {
    throw new Error(`Failure notification failed with HTTP ${response.status}: ${summarizeText(text)}`);
  }

  if (!json || json.ok !== true) {
    throw new Error(`Failure notification returned an error envelope: ${summarizeText(text)}`);
  }

  return json.data;
}

function printNotificationSummary(data) {
  console.log(
    JSON.stringify(
      {
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
  NINE_COLLECT_FAILURE_NOTIFY=true NINE_COLLECT_ALLOW_NOTIFICATIONS=true npm run collect:with-failure-notify -- --to 01000000000 -- npm run collect:prices -- --base-url http://127.0.0.1:3000 --tickers 005930.KS,PLTR

Options:
  --base-url     Local worker app URL used for failure notification dispatch. Defaults to NINE_BASE_URL or http://127.0.0.1:3000.
  --to           Recipient phone number for failure notifications. Required when failure notifications are enabled.
  --tier         tier_1, tier_2, or tier_3. Defaults to tier_3.
  --ticker       Optional ticker to persist with the event. Defaults to PLTR.
  --notify-failure   Force failure notifications on, even if the env var is not set.

Behavior:
  Place the collector command after --.
  The wrapped collector output streams through unchanged.
  Failure notifications are only attempted when NINE_COLLECT_FAILURE_NOTIFY=true or --notify-failure is set, and NINE_COLLECT_ALLOW_NOTIFICATIONS=true is also set.
  Notifications are sent through /api/notifications/send, so mock mode remains safe unless live Solapi selectors are explicitly enabled.`);
}

function requiredValue(key, value) {
  if (!value || value.startsWith("--")) {
    throw new Error(`--${key} requires a value.`);
  }

  return value;
}

function pickFailureLine(value) {
  if (!value) return null;

  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .find((line) => !line.startsWith(">")) ?? null;
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
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
