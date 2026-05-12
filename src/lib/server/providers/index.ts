import "server-only";

import { assertProviderConfigured, getProviderMode } from "@/lib/server/providers/config";
import { createAnthropicLlmProvider } from "@/lib/server/providers/anthropic";
import { createCompositeEarningsProvider } from "@/lib/server/providers/composite-earnings";
import { createCompositePriceProvider } from "@/lib/server/providers/composite-price";
import { createDartEarningsProvider } from "@/lib/server/providers/dart";
import { createFinnhubEpsProvider } from "@/lib/server/providers/finnhub";
import { createKisPriceProvider } from "@/lib/server/providers/kis";
import { createMockProviders } from "@/lib/server/providers/mock";
import { createNewsApiDiscoverSignalProvider } from "@/lib/server/providers/newsapi";
import { createSolapiNotificationProvider } from "@/lib/server/providers/solapi";
import {
  createYahooFinanceEarningsProvider,
  createYahooFinancePriceProvider,
} from "@/lib/server/providers/yahoo-finance";
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

  if (process.env.NINE_EARNINGS_PROVIDER === "dart") {
    assertProviderConfigured("dart");
    providers.earnings = createDartEarningsProvider();
  }

  if (process.env.NINE_EARNINGS_PROVIDER === "yahoo-finance") {
    assertProviderConfigured("yahoo-finance");
    providers.earnings = createYahooFinanceEarningsProvider();
  }

  if (process.env.NINE_EARNINGS_PROVIDER === "composite") {
    assertProviderConfigured("dart");
    assertProviderConfigured("yahoo-finance");
    providers.earnings = createCompositeEarningsProvider({
      dart: createDartEarningsProvider(),
      yahooFinance: createYahooFinanceEarningsProvider(),
    });
  }

  if (process.env.NINE_NOTIFICATION_PROVIDER === "solapi") {
    assertProviderConfigured("solapi");
    providers.notifications = createSolapiNotificationProvider();
  }

  const priceProvider = process.env.NINE_PRICE_PROVIDER;

  if (priceProvider === "kis") {
    assertProviderConfigured("kis");
    providers.price = createKisPriceProvider();
  }

  if (priceProvider === "yahoo-finance") {
    assertProviderConfigured("yahoo-finance");
    providers.price = createYahooFinancePriceProvider();
  }

  if (priceProvider === "composite") {
    assertProviderConfigured("kis");
    assertProviderConfigured("yahoo-finance");
    providers.price = createCompositePriceProvider({
      kis: createKisPriceProvider(),
      yahooFinance: createYahooFinancePriceProvider(),
    });
  }

  return providers;
}
