import "server-only";

import type { PriceProvider } from "@/lib/server/providers/types";

export function createCompositePriceProvider({
  kis,
  yahooFinance,
}: {
  kis: PriceProvider;
  yahooFinance: PriceProvider;
}): PriceProvider {
  return {
    async fetchDailyPrices(tickers, date) {
      const [krPrices, usPrices] = await Promise.all([
        kis.fetchDailyPrices(tickers, date),
        yahooFinance.fetchDailyPrices(tickers, date),
      ]);

      return [...krPrices, ...usPrices];
    },
  };
}
