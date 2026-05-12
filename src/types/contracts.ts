export type Country = "KR" | "US";
export type StockSource = "core_universe" | "discover" | "search";
export type Decision = "buy" | "watch" | "pass";
export type QuarterlyAction = "hold" | "reduce_50" | "sell_all";
export type AlertTier = "tier_1" | "tier_2" | "tier_3";

export type ApiErrorCode =
  | "BAD_REQUEST"
  | "NOT_FOUND"
  | "DAILY_CAP_REACHED"
  | "UNAUTHORIZED"
  | "SERVER_ERROR";

export type ApiError = {
  ok: false;
  error: {
    code: ApiErrorCode;
    message: string;
  };
};

export type ApiSuccess<T> = {
  ok: true;
  data: T;
};

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export type LoginRequest = {
  password: string;
};

export type LoginResponse = {
  authenticated: true;
};

export type ScoreTier = "nine" | "seven_eight" | "four_six" | "zero_three";

export type Stock = {
  ticker: string;
  name: string;
  country: Country;
  sector: string | null;
  marketCap: number | null;
  isHolding: boolean;
  source: StockSource;
  createdAt: string;
};

export type LlmBrief = {
  ticker: string;
  generatedAt: string;
  structuralDemand: string;
  supplyConstraint: string;
  epsRevisionDriver: string;
  bearCase: string;
  narrativeWarningFlag: boolean;
  narrativeWarningReason: string | null;
};

export type ManualScore = {
  ticker: string;
  scoreQuant: number;
  scoreDemand: number;
  scoreSupply: number;
  totalScore: number;
  tier: ScoreTier;
  decision: Decision | null;
  thesisSummary: string | null;
  thesisKill1: string | null;
  thesisKill2: string | null;
  thesisKill3: string | null;
  positionSizeKrw: number | null;
  boughtAtPrice: number | null;
  boughtAtDate: string | null;
  reviewedAt: string;
};

export type Candidate = {
  stock: Stock;
  score: ManualScore;
  latestBrief: LlmBrief | null;
  isNewSevenPlus: boolean;
  scoreChange: number | null;
  updatedAt: string;
};

export type CandidatesResponse = {
  generatedAt: string;
  nextRefreshAt: string;
  total: number;
  candidates: Candidate[];
};

export type StockDetailResponse = {
  stock: Stock;
  score: ManualScore;
  latestBrief: LlmBrief | null;
  recentEps: EpsEstimate[];
  thesisWatermark: "이 점수는 prep이지 신탁이 아님";
};

export type EpsEstimate = {
  ticker: string;
  snapshotDate: string;
  fyYear: number;
  consensus: number;
  analystCount: number | null;
  dataSource: "naver" | "hankyung" | "finnhub" | "fnguide";
};

export type WeeklyEpsCollectionRequest = {
  tickers?: string[];
  snapshotDate?: string;
};

export type WeeklyEpsCollectionResponse = {
  snapshotDate: string;
  requestedTickers: string[];
  collectedCount: number;
  persistedCount: number;
  persisted: boolean;
  providerMode: "mock" | "live";
  estimates: EpsEstimate[];
};

export type EarningsSnapshot = {
  ticker: string;
  fiscalQuarter: string;
  revenue: number | null;
  revenueYoy: number | null;
  eps: number | null;
  epsSurprise: number | null;
  reportedAt: string;
  dataSource: "dart" | "yahoo-finance";
};

export type QuarterlyEarningsCollectionRequest = {
  tickers?: string[];
};

export type QuarterlyEarningsCollectionResponse = {
  requestedTickers: string[];
  collectedCount: number;
  persistedCount: number;
  persisted: boolean;
  providerMode: "mock" | "live";
  earnings: EarningsSnapshot[];
};

export type CoreBriefCollectionRequest = {
  tickers?: string[];
};

export type CoreBriefCollectionResponse = {
  requestedTickers: string[];
  generatedCount: number;
  persistedCount: number;
  persisted: boolean;
  providerMode: "mock" | "live";
  briefs: LlmBrief[];
};

export type NotificationDispatchRequest = {
  tier: AlertTier;
  to: string;
  body: string;
  ticker?: string;
};

export type NotificationDispatchResponse = {
  tier: AlertTier;
  ticker: string | null;
  sent: boolean;
  providerMessageId: string | null;
  persisted: boolean;
  eventId: number | null;
  providerMode: "mock" | "live";
};

export type DailyPriceSnapshot = {
  ticker: string;
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  dataSource: "kis" | "yahoo-finance";
};

export type DailyPriceCollectionRequest = {
  tickers?: string[];
  date?: string;
};

export type DailyPriceCollectionResponse = {
  date: string;
  requestedTickers: string[];
  collectedCount: number;
  persistedCount: number;
  persisted: boolean;
  providerMode: "mock" | "live";
  prices: DailyPriceSnapshot[];
};

export type ManualScoreRequest = {
  ticker: string;
  scoreDemand: number;
  scoreSupply: number;
  decision?: Decision;
  thesisSummary?: string;
  thesisKill1?: string;
  thesisKill2?: string;
  thesisKill3?: string;
  positionSizeKrw?: number;
  boughtAtPrice?: number;
  boughtAtDate?: string;
};

export type ManualScoreResponse = {
  score: ManualScore;
  warning: string | null;
};

export type Holding = {
  stock: Stock;
  score: ManualScore;
  thesisKillStatus: "clear" | "warning" | "triggered";
  triggeredKillConditions: number;
  systemAction: QuarterlyAction;
};

export type HoldingsResponse = {
  averageNineScore: number;
  riskCount: number;
  holdings: Holding[];
};

export type QuarterlyReview = {
  id: number;
  ticker: string;
  reviewDate: string;
  thesisStillValid: boolean;
  killConditionsTriggered: number;
  notes: string | null;
  action: QuarterlyAction;
};

export type QuarterlyReviewItem = {
  holding: Holding;
  latestReview: QuarterlyReview | null;
};

export type QuarterlyReviewsResponse = {
  quarter: string;
  progress: {
    completed: number;
    total: number;
  };
  items: QuarterlyReviewItem[];
  reviews: QuarterlyReview[];
};

export type QuarterlyReviewRequest = {
  ticker: string;
  thesisStillValid: boolean;
  killConditionsTriggered: number;
  notes?: string;
  action: QuarterlyAction;
};

export type SearchResponse = {
  query: string;
  dailyCap: {
    used: number;
    limit: 10;
    remaining: number;
  };
  result: StockDetailResponse | null;
  requiresOutsideUniverseAnalysis: boolean;
};

export type DiscoverTheme = {
  id: number;
  weekOf: string;
  themeName: string;
  newsFrequencyChange: number;
  exportSignalChange: number | null;
  capexSignal: string | null;
  representativeTickers: string[];
  createdAt: string;
};

export type DiscoverResponse = {
  weekOf: string;
  themes: DiscoverTheme[];
};

export type DiscoverSendToCoreRequest = {
  tickers: string[];
  sourceThemeId: number;
};

export type DiscoverSendToCoreResponse = {
  addedTickers: string[];
  skippedTickers: string[];
  nextScoringCycle: string;
};
