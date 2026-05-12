import "server-only";

import { assertProviderConfigured, getProviderMode } from "@/lib/server/providers/config";
import { createMockProviders } from "@/lib/server/providers/mock";
import { createNewsApiDiscoverSignalProvider } from "@/lib/server/providers/newsapi";
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

  return providers;
}
