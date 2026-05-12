import "server-only";

import { getProviderMode, getProviderStatuses } from "@/lib/server/providers/config";
import { createMockProviders } from "@/lib/server/providers/mock";
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
  const statuses = getProviderStatuses(mode);

  if (mode === "live") {
    const missingProviders = statuses.filter((status) => !status.configured);
    if (missingProviders.length > 0) {
      throw new Error(
        `Live provider mode is not ready. Missing env for: ${missingProviders
          .map((status) => status.provider)
          .join(", ")}`,
      );
    }

    // Live adapters should be wired here after provider accounts and keys exist.
    throw new Error("Live external provider adapters are not implemented yet.");
  }

  return createMockProviders();
}
