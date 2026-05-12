import "server-only";

import type { DiscoverSignal, DiscoverSignalProvider } from "@/lib/server/providers/types";

type NewsApiArticle = {
  source: {
    id: string | null;
    name: string;
  };
  title: string | null;
  description: string | null;
  url: string;
  publishedAt: string;
};

type NewsApiEverythingResponse =
  | {
      status: "ok";
      totalResults: number;
      articles: NewsApiArticle[];
    }
  | {
      status: "error";
      code: string;
      message: string;
    };

const defaultQueries = [
  "AI semiconductor",
  "defense electronics",
  "energy infrastructure",
  "robotics automation",
  "biotech platform",
];

export function createNewsApiDiscoverSignalProvider(): DiscoverSignalProvider {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) {
    throw new Error("NEWS_API_KEY is required for NewsAPI Discover signals.");
  }

  const baseUrl = process.env.NEWS_API_BASE_URL ?? "https://newsapi.org";
  const language = process.env.NEWS_API_LANGUAGE ?? "en";
  const queries = parseQueries(process.env.NEWS_API_DISCOVER_QUERIES);

  return {
    async fetchDiscoverSignals(weekOf) {
      const { from, to } = weekWindow(weekOf);
      const signals = await Promise.all(
        queries.map((query) => fetchQuerySignal({ apiKey, baseUrl, language, query, weekOf, from, to })),
      );

      return signals;
    },
  };
}

function parseQueries(value: string | undefined) {
  const queries = value
    ?.split(",")
    .map((query) => query.trim())
    .filter(Boolean);

  return queries && queries.length > 0 ? queries : defaultQueries;
}

async function fetchQuerySignal({
  apiKey,
  baseUrl,
  language,
  query,
  weekOf,
  from,
  to,
}: {
  apiKey: string;
  baseUrl: string;
  language: string;
  query: string;
  weekOf: string;
  from: string;
  to: string;
}): Promise<DiscoverSignal> {
  const url = new URL("/v2/everything", baseUrl);
  url.search = new URLSearchParams({
    q: query,
    from,
    to,
    language,
    sortBy: "publishedAt",
    pageSize: "20",
  }).toString();

  const response = await fetch(url, {
    headers: {
      "X-Api-Key": apiKey,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`NewsAPI request failed with HTTP ${response.status}.`);
  }

  const body = (await response.json()) as NewsApiEverythingResponse;
  if (body.status === "error") {
    throw new Error(`NewsAPI request failed: ${body.code} ${body.message}`);
  }

  return {
    weekOf,
    themeName: query,
    newsFrequencyChange: toSignalStrength(body.totalResults),
    exportSignalChange: null,
    capexSignal: summarizeSources(body.articles),
    representativeTickers: [],
    sources: ["newsapi"],
  };
}

function weekWindow(weekOf: string) {
  const fromDate = new Date(`${weekOf}T00:00:00.000Z`);
  if (Number.isNaN(fromDate.getTime())) {
    throw new Error(`Invalid weekOf date: ${weekOf}`);
  }

  const toDate = new Date(fromDate);
  toDate.setUTCDate(fromDate.getUTCDate() + 6);

  return {
    from: fromDate.toISOString().slice(0, 10),
    to: toDate.toISOString().slice(0, 10),
  };
}

function toSignalStrength(totalResults: number) {
  if (totalResults <= 0) return 0;
  return Math.min(2, Math.round((totalResults / 50) * 100) / 100);
}

function summarizeSources(articles: NewsApiArticle[]) {
  const sources = [
    ...new Set(
      articles
        .map((article) => article.source.name)
        .filter(Boolean)
        .slice(0, 3),
    ),
  ];

  return sources.length > 0 ? `NewsAPI sources: ${sources.join(", ")}` : null;
}
