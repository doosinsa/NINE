import type {
  Candidate,
  DiscoverTheme,
  EpsEstimate,
  Holding,
  LlmBrief,
  ManualScore,
  QuarterlyReview,
  Stock,
} from "@/types/contracts";

const now = "2026-05-09T12:00:00.000Z";

export const stocks: Stock[] = [
  {
    ticker: "005930.KS",
    name: "Samsung Electronics",
    country: "KR",
    sector: "Semiconductors",
    marketCap: 420000000000000,
    isHolding: true,
    source: "core_universe",
    createdAt: now,
  },
  {
    ticker: "PLTR",
    name: "Palantir Technologies",
    country: "US",
    sector: "Software",
    marketCap: 190000000000,
    isHolding: false,
    source: "core_universe",
    createdAt: now,
  },
  {
    ticker: "272210.KQ",
    name: "Hanwha Systems",
    country: "KR",
    sector: "Aerospace & Defense",
    marketCap: 3800000000000,
    isHolding: false,
    source: "discover",
    createdAt: now,
  },
];

export const scores: ManualScore[] = [
  {
    ticker: "005930.KS",
    scoreQuant: 2,
    scoreDemand: 3,
    scoreSupply: 2,
    totalScore: 7,
    tier: "seven_eight",
    decision: "buy",
    thesisSummary: "Memory cycle recovery with disciplined supply.",
    thesisKill1: "DRAM contract price falls for two consecutive quarters.",
    thesisKill2: "HBM share gains stall against top competitors.",
    thesisKill3: "Capex discipline breaks without demand confirmation.",
    positionSizeKrw: 10000000,
    boughtAtPrice: 78000,
    boughtAtDate: "2026-04-01",
    reviewedAt: now,
  },
  {
    ticker: "PLTR",
    scoreQuant: 3,
    scoreDemand: 3,
    scoreSupply: 3,
    totalScore: 9,
    tier: "nine",
    decision: "watch",
    thesisSummary: null,
    thesisKill1: null,
    thesisKill2: null,
    thesisKill3: null,
    positionSizeKrw: null,
    boughtAtPrice: null,
    boughtAtDate: null,
    reviewedAt: now,
  },
  {
    ticker: "272210.KQ",
    scoreQuant: 2,
    scoreDemand: 2,
    scoreSupply: 2,
    totalScore: 6,
    tier: "four_six",
    decision: "watch",
    thesisSummary: null,
    thesisKill1: null,
    thesisKill2: null,
    thesisKill3: null,
    positionSizeKrw: null,
    boughtAtPrice: null,
    boughtAtDate: null,
    reviewedAt: now,
  },
];

export const briefs: LlmBrief[] = [
  {
    ticker: "005930.KS",
    generatedAt: now,
    structuralDemand: "AI server memory demand supports high-end DRAM mix.",
    supplyConstraint: "Industry supply remains disciplined after prior downcycle.",
    epsRevisionDriver: "Consensus is moving with HBM mix and memory price recovery.",
    bearCase: "Commodity memory pricing can reverse faster than narrative changes.",
    narrativeWarningFlag: false,
    narrativeWarningReason: null,
  },
  {
    ticker: "PLTR",
    generatedAt: now,
    structuralDemand: "Enterprise AI deployment demand remains broad.",
    supplyConstraint: "Deployment capacity and implementation quality are the bottlenecks.",
    epsRevisionDriver: "Operating leverage and government/commercial expansion support revisions.",
    bearCase: "Valuation leaves little room for slower enterprise conversion.",
    narrativeWarningFlag: true,
    narrativeWarningReason: "Narrative strength is high; require EPS confirmation before buy.",
  },
];

export const epsEstimates: EpsEstimate[] = [
  {
    ticker: "005930.KS",
    snapshotDate: "2026-05-03",
    fyYear: 2026,
    consensus: 5300,
    analystCount: 22,
    dataSource: "hankyung",
  },
  {
    ticker: "PLTR",
    snapshotDate: "2026-05-03",
    fyYear: 2026,
    consensus: 0.68,
    analystCount: 18,
    dataSource: "finnhub",
  },
];

export const quarterlyReviews: QuarterlyReview[] = [
  {
    id: 1,
    ticker: "005930.KS",
    reviewDate: "2026-04-07",
    thesisStillValid: true,
    killConditionsTriggered: 0,
    notes: "No thesis kill triggered.",
    action: "hold",
  },
];

export const discoverThemes: DiscoverTheme[] = [
  {
    id: 1,
    weekOf: "2026-05-04",
    themeName: "AI memory supply chain",
    newsFrequencyChange: 0.72,
    exportSignalChange: 0.18,
    capexSignal: "Supplier capex commentary increased in recent earnings calls.",
    representativeTickers: ["005930.KS", "000660.KS", "MU"],
    createdAt: now,
  },
  {
    id: 2,
    weekOf: "2026-05-04",
    themeName: "Defense electronics",
    newsFrequencyChange: 0.58,
    exportSignalChange: 0.11,
    capexSignal: "Government budget commentary supports multi-year demand.",
    representativeTickers: ["272210.KQ", "012450.KS", "LMT"],
    createdAt: now,
  },
];

export function getStock(ticker: string) {
  return stocks.find((stock) => stock.ticker.toUpperCase() === ticker.toUpperCase()) ?? null;
}

export function getScore(ticker: string) {
  return scores.find((score) => score.ticker.toUpperCase() === ticker.toUpperCase()) ?? null;
}

export function getBrief(ticker: string) {
  return briefs.find((brief) => brief.ticker.toUpperCase() === ticker.toUpperCase()) ?? null;
}

export function getStockDetail(ticker: string) {
  const stock = getStock(ticker);
  const score = getScore(ticker);
  if (!stock || !score) return null;

  return {
    stock,
    score,
    latestBrief: getBrief(ticker),
    recentEps: epsEstimates.filter((estimate) => estimate.ticker.toUpperCase() === ticker.toUpperCase()),
    thesisWatermark: "이 점수는 prep이지 신탁이 아님" as const,
  };
}

export function getCandidates(): Candidate[] {
  return stocks
    .map((stock) => {
      const score = getScore(stock.ticker);
      if (!score) return null;
      return {
        stock,
        score,
        latestBrief: getBrief(stock.ticker),
        isNewSevenPlus: score.totalScore >= 7 && stock.ticker === "PLTR",
        scoreChange: stock.ticker === "005930.KS" ? 1 : null,
        updatedAt: now,
      };
    })
    .filter((candidate): candidate is Candidate => candidate !== null);
}

export function getHoldings(): Holding[] {
  return stocks
    .filter((stock) => stock.isHolding)
    .map((stock): Holding | null => {
      const score = getScore(stock.ticker);
      if (!score) return null;
      return {
        stock,
        score,
        thesisKillStatus: "clear" as const,
        triggeredKillConditions: 0,
        systemAction: "hold" as const,
      };
    })
    .filter((holding): holding is Holding => holding !== null);
}
