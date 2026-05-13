import "server-only";

import type { EarningsProvider } from "@/lib/server/providers/types";

export function createCompositeEarningsProvider({
  dart,
  yahooFinance,
}: {
  dart: EarningsProvider;
  yahooFinance: EarningsProvider;
}): EarningsProvider {
  return {
    async fetchQuarterlyEarnings(tickers) {
      const [krResult, usResult] = await Promise.allSettled([
        dart.fetchQuarterlyEarnings(tickers),
        yahooFinance.fetchQuarterlyEarnings(tickers),
      ]);

      const krEarnings = krResult.status === "fulfilled" ? krResult.value : [];
      const usEarnings = usResult.status === "fulfilled" ? usResult.value : [];

      if (krResult.status === "rejected") {
        console.error("DART earnings provider failed in composite mode.", krResult.reason);
      }

      if (usResult.status === "rejected") {
        console.error("Yahoo Finance earnings provider failed in composite mode.", usResult.reason);
      }

      if (krResult.status === "rejected" && usResult.status === "rejected") {
        throw new Error("All composite earnings providers failed.");
      }

      return [...krEarnings, ...usEarnings];
    },
  };
}
