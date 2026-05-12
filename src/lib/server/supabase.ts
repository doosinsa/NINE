import { createClient } from "@supabase/supabase-js";
import type {
  Candidate,
  DailyPriceSnapshot,
  DiscoverTheme,
  EpsEstimate,
  Holding,
  LlmBrief,
  ManualScore,
  QuarterlyAction,
  QuarterlyReview,
  ScoreTier,
  Stock,
  StockDetailResponse,
} from "@/types/contracts";
import type { DailyPrice } from "@/lib/server/providers/types";

type DbStock = {
  ticker: string;
  name: string;
  country: "KR" | "US";
  sector: string | null;
  market_cap: number | null;
  is_holding: boolean;
  source: "core_universe" | "discover" | "search";
  created_at: string;
};

type DbManualScore = {
  ticker: string;
  score_quant: number;
  score_demand: number;
  score_supply: number;
  total_score: number;
  decision: "buy" | "watch" | "pass" | null;
  thesis_summary: string | null;
  thesis_kill_1: string | null;
  thesis_kill_2: string | null;
  thesis_kill_3: string | null;
  position_size_krw: number | null;
  bought_at_price: number | null;
  bought_at_date: string | null;
  reviewed_at: string;
};

type DbLlmBrief = {
  ticker: string;
  generated_at: string;
  structural_demand: string;
  supply_constraint: string;
  eps_revision_driver: string;
  bear_case: string;
  narrative_warning_flag: boolean;
  narrative_warning_reason: string | null;
};

type DbEpsEstimate = {
  ticker: string;
  snapshot_date: string;
  fy_year: number;
  consensus: number;
  analyst_count: number | null;
  data_source: "naver" | "hankyung" | "finnhub" | "fnguide";
};

type DbQuarterlyReview = {
  id: number;
  ticker: string;
  review_date: string;
  thesis_still_valid: boolean;
  kill_conditions_triggered: number;
  notes: string | null;
  action: QuarterlyAction;
};

type DbDiscoverTheme = {
  id: number;
  week_of: string;
  theme_name: string;
  news_frequency_change: number;
  export_signal_change: number | null;
  capex_signal: string | null;
  representative_tickers: string[];
  created_at: string;
};

type DbPriceTicker = {
  ticker: string;
};

export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) return null;

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export function toScoreTier(totalScore: number): ScoreTier {
  if (totalScore === 9) return "nine";
  if (totalScore >= 7) return "seven_eight";
  if (totalScore >= 4) return "four_six";
  return "zero_three";
}

export function toStock(row: DbStock): Stock {
  return {
    ticker: row.ticker,
    name: row.name,
    country: row.country,
    sector: row.sector,
    marketCap: row.market_cap,
    isHolding: row.is_holding,
    source: row.source,
    createdAt: row.created_at,
  };
}

export function toManualScore(row: DbManualScore): ManualScore {
  return {
    ticker: row.ticker,
    scoreQuant: row.score_quant,
    scoreDemand: row.score_demand,
    scoreSupply: row.score_supply,
    totalScore: row.total_score,
    tier: toScoreTier(row.total_score),
    decision: row.decision,
    thesisSummary: row.thesis_summary,
    thesisKill1: row.thesis_kill_1,
    thesisKill2: row.thesis_kill_2,
    thesisKill3: row.thesis_kill_3,
    positionSizeKrw: row.position_size_krw,
    boughtAtPrice: row.bought_at_price,
    boughtAtDate: row.bought_at_date,
    reviewedAt: row.reviewed_at,
  };
}

export function toLlmBrief(row: DbLlmBrief): LlmBrief {
  return {
    ticker: row.ticker,
    generatedAt: row.generated_at,
    structuralDemand: row.structural_demand,
    supplyConstraint: row.supply_constraint,
    epsRevisionDriver: row.eps_revision_driver,
    bearCase: row.bear_case,
    narrativeWarningFlag: row.narrative_warning_flag,
    narrativeWarningReason: row.narrative_warning_reason,
  };
}

export function toEpsEstimate(row: DbEpsEstimate): EpsEstimate {
  return {
    ticker: row.ticker,
    snapshotDate: row.snapshot_date,
    fyYear: row.fy_year,
    consensus: row.consensus,
    analystCount: row.analyst_count,
    dataSource: row.data_source,
  };
}

export function toQuarterlyReview(row: DbQuarterlyReview): QuarterlyReview {
  return {
    id: row.id,
    ticker: row.ticker,
    reviewDate: row.review_date,
    thesisStillValid: row.thesis_still_valid,
    killConditionsTriggered: row.kill_conditions_triggered,
    notes: row.notes,
    action: row.action,
  };
}

export function toDiscoverTheme(row: DbDiscoverTheme): DiscoverTheme {
  return {
    id: row.id,
    weekOf: row.week_of,
    themeName: row.theme_name,
    newsFrequencyChange: row.news_frequency_change,
    exportSignalChange: row.export_signal_change,
    capexSignal: row.capex_signal,
    representativeTickers: row.representative_tickers,
    createdAt: row.created_at,
  };
}

export async function fetchStockDetailFromSupabase(ticker: string): Promise<StockDetailResponse | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const normalizedTicker = ticker.toUpperCase();
  const [{ data: stock }, { data: score }, { data: brief }, { data: recentEps }] = await Promise.all([
    supabase.from("stocks").select("*").ilike("ticker", normalizedTicker).maybeSingle<DbStock>(),
    supabase.from("manual_scores").select("*").ilike("ticker", normalizedTicker).maybeSingle<DbManualScore>(),
    supabase
      .from("llm_briefs")
      .select("*")
      .ilike("ticker", normalizedTicker)
      .order("generated_at", { ascending: false })
      .limit(1)
      .maybeSingle<DbLlmBrief>(),
    supabase
      .from("eps_estimates")
      .select("*")
      .ilike("ticker", normalizedTicker)
      .order("snapshot_date", { ascending: false })
      .limit(8)
      .returns<DbEpsEstimate[]>(),
  ]);

  if (!stock || !score) return null;

  return {
    stock: toStock(stock),
    score: toManualScore(score),
    latestBrief: brief ? toLlmBrief(brief) : null,
    recentEps: (recentEps ?? []).map(toEpsEstimate),
    thesisWatermark: "이 점수는 prep이지 신탁이 아님",
  };
}

export async function fetchCandidatesFromSupabase(): Promise<Candidate[] | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("manual_scores")
    .select("*, stocks(*)")
    .order("total_score", { ascending: false });

  if (error || !data) return null;

  const candidates = await Promise.all(
    data.map(async (row): Promise<Candidate | null> => {
      const stockRow = row.stocks as DbStock | null;
      if (!stockRow) return null;

      const { data: brief } = await supabase
        .from("llm_briefs")
        .select("*")
        .eq("ticker", row.ticker)
        .order("generated_at", { ascending: false })
        .limit(1)
        .maybeSingle<DbLlmBrief>();

      const score = toManualScore(row as DbManualScore);
      return {
        stock: toStock(stockRow),
        score,
        latestBrief: brief ? toLlmBrief(brief) : null,
        isNewSevenPlus: score.totalScore >= 7 && stockRow.source !== "core_universe",
        scoreChange: null,
        updatedAt: score.reviewedAt,
      } satisfies Candidate;
    }),
  );

  return candidates.filter((candidate): candidate is Candidate => candidate !== null);
}

export async function fetchHoldingsFromSupabase(): Promise<Holding[] | null> {
  const candidates = await fetchCandidatesFromSupabase();
  if (!candidates) return null;

  return candidates
    .filter((candidate) => candidate.stock.isHolding)
    .map((candidate) => {
      const triggeredKillConditions = 0;
      return {
        stock: candidate.stock,
        score: candidate.score,
        thesisKillStatus: triggeredKillConditions > 0 ? "triggered" : "clear",
        triggeredKillConditions,
        systemAction: "hold",
      };
    });
}

export async function fetchDiscoverThemesFromSupabase(): Promise<DiscoverTheme[] | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("discover_themes")
    .select("*")
    .order("week_of", { ascending: false })
    .order("news_frequency_change", { ascending: false })
    .returns<DbDiscoverTheme[]>();

  if (error || !data) return null;
  return data.map(toDiscoverTheme);
}

export async function fetchPriceCollectionTickersFromSupabase(): Promise<string[] | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("stocks")
    .select("ticker")
    .order("ticker", { ascending: true })
    .returns<DbPriceTicker[]>();

  if (error || !data) return null;
  return data.map((row) => row.ticker);
}

export async function upsertDailyPricesInSupabase(prices: DailyPrice[]): Promise<number | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;
  if (prices.length === 0) return 0;

  const { error } = await supabase.from("prices").upsert(
    prices.map((price) => ({
      ticker: price.ticker,
      price_date: price.date,
      open: price.open,
      high: price.high,
      low: price.low,
      close: price.close,
      volume: price.volume,
      data_source: price.source,
    })),
    { onConflict: "ticker,price_date" },
  );

  if (error) {
    throw new Error("Failed to persist daily prices.");
  }

  return prices.length;
}

export function toDailyPriceSnapshot(price: DailyPrice): DailyPriceSnapshot {
  return {
    ticker: price.ticker,
    date: price.date,
    open: price.open,
    high: price.high,
    low: price.low,
    close: price.close,
    volume: price.volume,
    dataSource: price.source,
  };
}

export async function sendDiscoverTickersToCoreInSupabase(tickers: string[]) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const normalizedTickers = [...new Set(tickers.map((ticker) => ticker.trim().toUpperCase()).filter(Boolean))];
  if (normalizedTickers.length === 0) {
    return { addedTickers: [], skippedTickers: [] };
  }

  const { data: existingRows, error: existingError } = await supabase
    .from("stocks")
    .select("ticker")
    .in("ticker", normalizedTickers)
    .returns<Array<Pick<DbStock, "ticker">>>();

  if (existingError || !existingRows) {
    throw new Error("Failed to check existing Discover tickers.");
  }

  const existingTickers = new Set(existingRows.map((row) => row.ticker.toUpperCase()));
  const addedTickers = normalizedTickers.filter((ticker) => !existingTickers.has(ticker));
  const skippedTickers = normalizedTickers.filter((ticker) => existingTickers.has(ticker));

  if (addedTickers.length === 0) {
    return { addedTickers, skippedTickers };
  }

  const { error: stockError } = await supabase.from("stocks").upsert(
    addedTickers.map((ticker) => ({
      ticker,
      name: ticker,
      country: ticker.includes(".") ? "KR" : "US",
      source: "discover",
    })),
    { onConflict: "ticker" },
  );

  if (stockError) {
    throw new Error("Failed to add Discover tickers to stocks.");
  }

  const { error: scoreError } = await supabase.from("manual_scores").upsert(
    addedTickers.map((ticker) => ({
      ticker,
      score_quant: 0,
      score_demand: 0,
      score_supply: 0,
      decision: "watch",
    })),
    { onConflict: "ticker" },
  );

  if (scoreError) {
    throw new Error("Failed to create Discover scoring intake rows.");
  }

  return { addedTickers, skippedTickers };
}

export async function fetchQuarterlyReviewsFromSupabase(): Promise<QuarterlyReview[] | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("quarterly_reviews")
    .select("*")
    .order("review_date", { ascending: false })
    .returns<DbQuarterlyReview[]>();

  if (error || !data) return null;
  return data.map(toQuarterlyReview);
}

export async function fetchDailySearchUsedFromSupabase(date: string): Promise<number | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const { count, error } = await supabase
    .from("daily_search_log")
    .select("ticker", { count: "exact", head: true })
    .eq("date", date);

  if (error || count === null) return null;
  return count;
}

export async function upsertDailySearchLogInSupabase(ticker: string, date: string): Promise<boolean | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const { error } = await supabase.from("daily_search_log").upsert({
    date,
    ticker,
    is_universe_outside: true,
  });

  return !error;
}
