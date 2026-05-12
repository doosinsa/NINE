import "server-only";

import type { ProviderMode, ProviderName, ProviderStatus } from "@/lib/server/providers/types";

type ProviderEnvSpec = {
  provider: ProviderName;
  purpose: string;
  requiredEnv: string[];
};

const providerEnvSpecs: ProviderEnvSpec[] = [
  {
    provider: "anthropic",
    purpose: "Claude Haiku core briefs and Discover theme clustering.",
    requiredEnv: ["ANTHROPIC_API_KEY", "ANTHROPIC_MODEL", "ANTHROPIC_VERSION"],
  },
  {
    provider: "dart",
    purpose: "KR quarterly filings and earnings snapshots.",
    requiredEnv: ["DART_API_KEY"],
  },
  {
    provider: "finnhub",
    purpose: "US consensus EPS snapshots.",
    requiredEnv: ["FINNHUB_API_KEY"],
  },
  {
    provider: "kis",
    purpose: "KR daily price and volume collection.",
    requiredEnv: ["KIS_APP_KEY", "KIS_APP_SECRET", "KIS_BASE_URL"],
  },
  {
    provider: "kita",
    purpose: "KR export signal collection for Discover.",
    requiredEnv: ["KITA_API_KEY"],
  },
  {
    provider: "newsapi",
    purpose: "Global news signal collection for Discover.",
    requiredEnv: ["NEWS_API_KEY"],
  },
  {
    provider: "sec-edgar",
    purpose: "US filing and transcript source requests with SEC-compliant user agent.",
    requiredEnv: ["SEC_USER_AGENT_EMAIL"],
  },
  {
    provider: "solapi",
    purpose: "LMS notifications for alert tiers and data health checks.",
    requiredEnv: ["SOLAPI_API_KEY", "SOLAPI_API_SECRET", "SOLAPI_SENDER"],
  },
  {
    provider: "yahoo-finance",
    purpose: "US daily price, earnings calendar, and transcript fallback.",
    requiredEnv: ["YAHOO_FINANCE_BASE_URL"],
  },
];

export function getProviderMode(): ProviderMode {
  return process.env.NINE_PROVIDER_MODE === "live" ? "live" : "mock";
}

export function getProviderStatuses(mode = getProviderMode()): ProviderStatus[] {
  return providerEnvSpecs.map((spec) => {
    const missingEnv = spec.requiredEnv.filter((name) => !process.env[name]);

    return {
      provider: spec.provider,
      mode,
      configured: missingEnv.length === 0,
      missingEnv,
      purpose: spec.purpose,
    };
  });
}

export function assertProviderConfigured(provider: ProviderName) {
  const status = getProviderStatuses().find((item) => item.provider === provider);
  if (!status) {
    throw new Error(`Unknown provider: ${provider}`);
  }

  if (!status.configured) {
    throw new Error(`Provider ${provider} is missing env: ${status.missingEnv.join(", ")}`);
  }
}
