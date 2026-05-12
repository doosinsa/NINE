import "server-only";

import { createExternalProviders } from "@/lib/server/providers";
import type { DiscoverTheme } from "@/types/contracts";

export async function fetchDiscoverThemesFromProviders(weekOf: string): Promise<DiscoverTheme[] | null> {
  try {
    const providers = createExternalProviders();
    const signals = await providers.discoverSignals.fetchDiscoverSignals(weekOf);
    return providers.llm.extractDiscoverThemes(signals);
  } catch (error) {
    console.error(error);
    return null;
  }
}
