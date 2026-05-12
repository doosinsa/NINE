import "server-only";

import { assertProviderConfigured, getProviderMode } from "@/lib/server/providers/config";
import { createAnthropicLlmProvider } from "@/lib/server/providers/anthropic";
import { createFinnhubEpsProvider } from "@/lib/server/providers/finnhub";
import { createKisPriceProvider } from "@/lib/server/providers/kis";
import { createMockProviders } from "@/lib/server/providers/mock";
import { createNewsApiDiscoverSignalProvider } from "@/lib/server/providers/newsapi";
import { createYahooFinancePriceProvider } from "@/lib/server/providers/yahoo-finance";
import type { ExternalProviders } from "@/lib/server/providers/types";

export { getProviderMode, getProviderStatuses } from "@/lib/server/providers/config";
export type {
  CoreBriefInput,
  DailyPrice,
  DiscoverSignal,
  DiscoverSignalProvider,
  EarningsProvider,
  EarningsSnapshot,
  EpsProvider,
  ExternalProviders,
  LlmProvider,
  NotificationMessage,
  NotificationProvider,
  PriceProvider,
  ProviderMode,
  ProviderName,
  ProviderStatus,
} from "@/lib/server/providers/types";

export function createExternalProviders(): ExternalProviders {
  const mode = getProviderMode();
  const providers = createMockProviders();

  if (mode === "mock") {
    return providers;
  }

  if (process.env.NINE_DISCOVER_SIGNAL_PROVIDER === "newsapi") {
    assertProviderConfigured("newsapi");
    providers.discoverSignals = createNewsApiDiscoverSignalProvider();
  }

  if (process.env.NINE_LLM_PROVIDER === "anthropic") {
    assertProviderConfigured("anthropic");
    providers.llm = createAnthropicLlmProvider();
  }

  if (process.env.NINE_EPS_PROVIDER === "finnhub") {
    assertProviderConfigured("finnhub");
    providers.eps = createFinnhubEpsProvider();
  }

  if (process.env.NINE_PRICE_PROVIDER === "kis") {
    assertProviderConfigured("kis");
    providers.price = createKisPriceProvider();
  }

  if (process.env.NINE_PRICE_PROVIDER === "yahoo-finance") {
    assertProviderConfigured("yahoo-finance");
    providers.price = createYahooFinancePriceProvider();
  }

  return providers;
}
