#!/usr/bin/env node

import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const profiles = {
  mock: {
    port: 3000,
    env: {
      NINE_PROVIDER_MODE: "mock",
      NINE_PRICE_PROVIDER: "mock",
      NINE_EPS_PROVIDER: "mock",
      NINE_EARNINGS_PROVIDER: "mock",
      NINE_DISCOVER_SIGNAL_PROVIDER: "mock",
      NINE_LLM_PROVIDER: "mock",
      NINE_NOTIFICATION_PROVIDER: "mock",
    },
  },
  eps: {
    port: 3001,
    env: {
      NINE_PROVIDER_MODE: "live",
      NINE_EPS_PROVIDER: "alpha-vantage",
    },
  },
  earnings: {
    port: 3002,
    env: {
      DART_BUSINESS_YEAR: "2025",
      NINE_PROVIDER_MODE: "live",
      NINE_EARNINGS_PROVIDER: "composite-alpha-vantage",
    },
  },
  prices: {
    port: 3003,
    env: {
      NINE_PROVIDER_MODE: "live",
      NINE_PRICE_PROVIDER: "composite",
    },
  },
  briefs: {
    port: 3004,
    env: {
      NINE_PROVIDER_MODE: "live",
      NINE_LLM_PROVIDER: "anthropic",
    },
  },
  discover: {
    port: 3005,
    env: {
      NINE_PROVIDER_MODE: "live",
      NINE_DISCOVER_SIGNAL_PROVIDER: "newsapi",
      NINE_LLM_PROVIDER: "anthropic",
    },
  },
};

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const profile = profiles[options.profile];

  if (!profile) {
    throw new Error(`Unknown worker profile: ${options.profile}`);
  }

  const env = {
    ...process.env,
    ...readEnvFile(resolve(repoRoot, ".env")),
    ...profile.env,
    PORT: String(options.port ?? profile.port),
    HOSTNAME: options.hostname,
  };
  env.PATH = withBinaryDirectory(env.PATH, options.npmPath);

  if (options.mode === "start" && !existsSync(resolve(repoRoot, ".next"))) {
    throw new Error("Missing .next build output. Run `npm run build` before starting production workers.");
  }

  mkdirSync(resolve(repoRoot, "logs"), { recursive: true });

  const npmScript = options.mode === "dev" ? "dev" : "start";
  const args = ["run", npmScript, "--", "--hostname", options.hostname, "--port", String(options.port ?? profile.port)];

  console.log(
    JSON.stringify(
      {
        profile: options.profile,
        mode: options.mode,
        hostname: options.hostname,
        port: options.port ?? profile.port,
        providerMode: env.NINE_PROVIDER_MODE,
        selectors: visibleSelectors(env),
      },
      null,
      2,
    ),
  );

  const child = spawn(options.npmPath, args, {
    cwd: repoRoot,
    env,
    stdio: "inherit",
  });

  child.on("exit", (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }

    process.exit(typeof code === "number" ? code : 1);
  });
}

function parseArgs(args) {
  const options = {
    hostname: "127.0.0.1",
    mode: "start",
    npmPath: process.env.NINE_NPM_PATH ?? "npm",
    port: null,
    profile: "mock",
  };

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
      case "hostname":
        options.hostname = requiredValue(rawKey, value);
        break;
      case "mode":
        options.mode = parseMode(requiredValue(rawKey, value));
        break;
      case "npm-path":
        options.npmPath = requiredValue(rawKey, value);
        break;
      case "port":
        options.port = parsePort(requiredValue(rawKey, value));
        break;
      case "profile":
        options.profile = requiredValue(rawKey, value);
        break;
      default:
        throw new Error(`Unknown option: --${rawKey}`);
    }
  }

  return options;
}

function readEnvFile(path) {
  if (!existsSync(path)) return {};

  const parsed = {};
  const content = readFileSync(path, "utf8");

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) continue;

    const separator = trimmed.indexOf("=");

    if (separator <= 0) continue;

    const key = trimmed.slice(0, separator).trim();
    const rawValue = trimmed.slice(separator + 1).trim();

    parsed[key] = unquote(rawValue);
  }

  return parsed;
}

function unquote(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

function visibleSelectors(env) {
  return {
    NINE_PRICE_PROVIDER: env.NINE_PRICE_PROVIDER,
    NINE_EPS_PROVIDER: env.NINE_EPS_PROVIDER,
    NINE_EARNINGS_PROVIDER: env.NINE_EARNINGS_PROVIDER,
    NINE_DISCOVER_SIGNAL_PROVIDER: env.NINE_DISCOVER_SIGNAL_PROVIDER,
    NINE_LLM_PROVIDER: env.NINE_LLM_PROVIDER,
    NINE_NOTIFICATION_PROVIDER: env.NINE_NOTIFICATION_PROVIDER,
  };
}

function withBinaryDirectory(currentPath, executablePath) {
  if (!executablePath.includes("/")) {
    return currentPath;
  }

  const binaryDirectory = dirname(executablePath);

  if (!currentPath) return binaryDirectory;

  return `${binaryDirectory}:${currentPath}`;
}

function parseMode(value) {
  if (value === "dev" || value === "start") return value;

  throw new Error("--mode must be `dev` or `start`.");
}

function parsePort(value) {
  const port = Number.parseInt(value, 10);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("--port must be a valid TCP port.");
  }

  return port;
}

function requiredValue(key, value) {
  if (!value || value.startsWith("--")) {
    throw new Error(`--${key} requires a value.`);
  }

  return value;
}

function printHelp() {
  console.log(`Usage:
  node scripts/start-worker.mjs --profile mock --mode start
  node scripts/start-worker.mjs --profile eps --mode dev --port 3001

Options:
  --profile   mock, eps, earnings, prices, briefs, or discover. Defaults to mock.
  --mode      start or dev. Defaults to start.
  --hostname  Bind hostname. Defaults to 127.0.0.1.
  --port      Override the profile port.
  --npm-path  npm executable path. Defaults to NINE_NPM_PATH or npm.

The script loads .env, applies only non-secret profile selectors, and then runs the Next worker.
It prints selector names, not provider secret values.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
