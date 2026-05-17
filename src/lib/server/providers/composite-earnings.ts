import "server-only";

import type { EarningsProvider } from "@/lib/server/providers/types";

export function createCompositeEarningsProvider({
  dart,
  us,
  usProviderName = "US earnings",
}: {
  dart: EarningsProvider;
  us: EarningsProvider;
  usProviderName?: string;
}): EarningsProvider {
  return {
    async fetchQuarterlyEarnings(tickers) {
      const [krResult, usResult] = await Promise.allSettled([
        dart.fetchQuarterlyEarnings(tickers),
        us.fetchQuarterlyEarnings(tickers),
      ]);

      const krEarnings = krResult.status === "fulfilled" ? krResult.value : [];
      const usEarnings = usResult.status === "fulfilled" ? usResult.value : [];

      if (krResult.status === "rejected") {
        console.error("DART earnings provider failed in composite mode.", krResult.reason);
      }

      if (usResult.status === "rejected") {
        console.error(`${usProviderName} provider failed in composite mode.`, usResult.reason);
      }

      if (krResult.status === "rejected" && usResult.status === "rejected") {
        throw new Error("All composite earnings providers failed.");
      }

      return [...krEarnings, ...usEarnings];
    },
  };
}
