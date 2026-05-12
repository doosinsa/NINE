import "server-only";

import type { DiscoverTheme, EarningsSnapshot, EpsEstimate, LlmBrief } from "@/types/contracts";

export type { EarningsSnapshot } from "@/types/contracts";

export type ProviderMode = "mock" | "live";

export type ProviderName =
  | "anthropic"
  | "dart"
  | "finnhub"
  | "kis"
  | "kita"
  | "newsapi"
  | "sec-edgar"
  | "solapi"
  | "yahoo-finance";

export type ProviderStatus = {
  provider: ProviderName;
  mode: ProviderMode;
  configured: boolean;
  missingEnv: string[];
  purpose: string;
};

export type DailyPrice = {
  ticker: string;
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  source: "kis" | "yahoo-finance";
};

export type CoreBriefInput = {
  ticker: string;
  companyName: string;
  country: "KR" | "US";
  recentEps: EpsEstimate[];
  earnings: EarningsSnapshot[];
};

export type DiscoverSignal = {
  weekOf: string;
  themeName: string;
  newsFrequencyChange: number;
  exportSignalChange: number | null;
  capexSignal: string | null;
  representativeTickers: string[];
  sources: ProviderName[];
};

export type NotificationMessage = {
  tier: "tier_1" | "tier_2" | "tier_3";
  to: string;
  body: string;
};

export type PriceProvider = {
  fetchDailyPrices(tickers: string[], date: string): Promise<DailyPrice[]>;
};

export type EpsProvider = {
  fetchWeeklyEps(tickers: string[], snapshotDate: string): Promise<EpsEstimate[]>;
};

export type EarningsProvider = {
  fetchQuarterlyEarnings(tickers: string[]): Promise<EarningsSnapshot[]>;
};

export type LlmProvider = {
  generateCoreBrief(input: CoreBriefInput): Promise<Omit<LlmBrief, "generatedAt">>;
  extractDiscoverThemes(signals: DiscoverSignal[]): Promise<DiscoverTheme[]>;
};

export type DiscoverSignalProvider = {
  fetchDiscoverSignals(weekOf: string): Promise<DiscoverSignal[]>;
};

export type NotificationProvider = {
  send(message: NotificationMessage): Promise<{ sent: boolean; providerMessageId: string | null }>;
};

export type ExternalProviders = {
  price: PriceProvider;
  eps: EpsProvider;
  earnings: EarningsProvider;
  llm: LlmProvider;
  discoverSignals: DiscoverSignalProvider;
  notifications: NotificationProvider;
};
