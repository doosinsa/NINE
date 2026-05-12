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
      const [krEarnings, usEarnings] = await Promise.all([
        dart.fetchQuarterlyEarnings(tickers),
        yahooFinance.fetchQuarterlyEarnings(tickers),
      ]);

      return [...krEarnings, ...usEarnings];
    },
  };
}
