import "server-only";

import { briefs, discoverThemes, epsEstimates } from "@/lib/server/mock-data";
import type {
  CoreBriefInput,
  DailyPrice,
  DiscoverSignal,
  EarningsSnapshot,
  ExternalProviders,
  NotificationMessage,
} from "@/lib/server/providers/types";
import type { DiscoverTheme, LlmBrief } from "@/types/contracts";

function mockPrice(ticker: string, date: string): DailyPrice {
  const seed = ticker.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const close = 100 + (seed % 150);

  return {
    ticker,
    date,
    open: close - 1,
    high: close + 2,
    low: close - 3,
    close,
    volume: 1_000_000 + seed * 100,
    source: ticker.includes(".") ? "kis" : "yahoo-finance",
  };
}

function mockBrief(input: CoreBriefInput): Omit<LlmBrief, "generatedAt"> {
  const existingBrief = briefs.find((brief) => brief.ticker.toUpperCase() === input.ticker.toUpperCase());
  if (existingBrief) {
    const { generatedAt: _generatedAt, ...brief } = existingBrief;
    return brief;
  }

  return {
    ticker: input.ticker,
    structuralDemand: "Mock structural demand placeholder. Replace with Claude Haiku once live provider keys are configured.",
    supplyConstraint: "Mock supply constraint placeholder. Keep this route isolated from direct provider calls.",
    epsRevisionDriver: "Mock EPS driver placeholder based on future consensus snapshots.",
    bearCase: "Mock bear case placeholder. Bear case remains required for every brief.",
    narrativeWarningFlag: true,
    narrativeWarningReason: "Mock provider output. Do not treat as an investment recommendation.",
  };
}

function mockDiscoverSignals(weekOf: string): DiscoverSignal[] {
  return discoverThemes.map((theme) => ({
    weekOf,
    themeName: theme.themeName,
    newsFrequencyChange: theme.newsFrequencyChange,
    exportSignalChange: theme.exportSignalChange,
    capexSignal: theme.capexSignal,
    representativeTickers: theme.representativeTickers,
    sources: ["newsapi", "kita"],
  }));
}

function toDiscoverTheme(signal: DiscoverSignal, index: number): DiscoverTheme {
  return {
    id: index + 1,
    weekOf: signal.weekOf,
    themeName: signal.themeName,
    newsFrequencyChange: signal.newsFrequencyChange,
    exportSignalChange: signal.exportSignalChange,
    capexSignal: signal.capexSignal,
    representativeTickers: signal.representativeTickers,
    createdAt: new Date(`${signal.weekOf}T00:00:00.000Z`).toISOString(),
  };
}

async function mockSend(_message: NotificationMessage) {
  return {
    sent: false,
    providerMessageId: null,
  };
}

export function createMockProviders(): ExternalProviders {
  return {
    price: {
      async fetchDailyPrices(tickers, date) {
        return tickers.map((ticker) => mockPrice(ticker, date));
      },
    },
    eps: {
      async fetchWeeklyEps(tickers, snapshotDate) {
        const normalizedTickers = new Set(tickers.map((ticker) => ticker.toUpperCase()));
        return epsEstimates
          .filter((estimate) => normalizedTickers.has(estimate.ticker.toUpperCase()))
          .map((estimate) => ({
            ...estimate,
            snapshotDate,
          }));
      },
    },
    earnings: {
      async fetchQuarterlyEarnings(tickers) {
        return tickers.map(
          (ticker): EarningsSnapshot => ({
            ticker,
            fiscalQuarter: "2026Q1",
            revenue: null,
            revenueYoy: null,
            eps: null,
            epsSurprise: null,
            reportedAt: "2026-05-01",
            source: ticker.includes(".") ? "dart" : "yahoo-finance",
          }),
        );
      },
    },
    llm: {
      async generateCoreBrief(input) {
        return mockBrief(input);
      },
      async extractDiscoverThemes(signals) {
        return signals.map(toDiscoverTheme);
      },
    },
    discoverSignals: {
      async fetchDiscoverSignals(weekOf) {
        return mockDiscoverSignals(weekOf);
      },
    },
    notifications: {
      send: mockSend,
    },
  };
}
