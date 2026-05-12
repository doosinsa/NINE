import "server-only";

import type { CoreBriefInput, DiscoverSignal, LlmProvider } from "@/lib/server/providers/types";
import type { DiscoverTheme, LlmBrief } from "@/types/contracts";

type AnthropicTextBlock = {
  type: "text";
  text: string;
};

type AnthropicMessageResponse = {
  content: AnthropicTextBlock[];
};

type CoreBriefJson = {
  structural_demand: string;
  supply_constraint: string;
  eps_revision_driver: string;
  bear_case: string;
  narrative_warning_flag: boolean;
  narrative_warning_reason: string | null;
};

type DiscoverThemeJson = {
  theme_name: string;
  news_frequency_change: number;
  export_signal_change: number | null;
  capex_signal: string | null;
  representative_tickers: string[];
};

export function createAnthropicLlmProvider(): LlmProvider {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is required for Anthropic LLM calls.");
  }

  const baseUrl = process.env.ANTHROPIC_BASE_URL ?? "https://api.anthropic.com";
  const model = process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5-20251001";
  const version = process.env.ANTHROPIC_VERSION ?? "2023-06-01";
  const maxTokens = Number(process.env.ANTHROPIC_MAX_TOKENS ?? "1200");

  return {
    async generateCoreBrief(input) {
      const parsed = await createMessage<CoreBriefJson>({
        apiKey,
        baseUrl,
        version,
        model,
        maxTokens,
        prompt: coreBriefPrompt(input),
      });

      return {
        ticker: input.ticker,
        structuralDemand: parsed.structural_demand,
        supplyConstraint: parsed.supply_constraint,
        epsRevisionDriver: parsed.eps_revision_driver,
        bearCase: parsed.bear_case,
        narrativeWarningFlag: parsed.narrative_warning_flag,
        narrativeWarningReason: parsed.narrative_warning_reason,
      } satisfies Omit<LlmBrief, "generatedAt">;
    },
    async extractDiscoverThemes(signals) {
      const parsed = await createMessage<DiscoverThemeJson[]>({
        apiKey,
        baseUrl,
        version,
        model,
        maxTokens,
        prompt: discoverThemesPrompt(signals),
      });

      const weekOf = signals[0]?.weekOf ?? new Date().toISOString().slice(0, 10);
      return parsed.slice(0, 5).map(
        (theme, index): DiscoverTheme => ({
          id: index + 1,
          weekOf,
          themeName: theme.theme_name,
          newsFrequencyChange: theme.news_frequency_change,
          exportSignalChange: theme.export_signal_change,
          capexSignal: theme.capex_signal,
          representativeTickers: theme.representative_tickers,
          createdAt: new Date(`${weekOf}T00:00:00.000Z`).toISOString(),
        }),
      );
    },
  };
}

async function createMessage<T>({
  apiKey,
  baseUrl,
  version,
  model,
  maxTokens,
  prompt,
}: {
  apiKey: string;
  baseUrl: string;
  version: string;
  model: string;
  maxTokens: number;
  prompt: string;
}): Promise<T> {
  const response = await fetch(new URL("/v1/messages", baseUrl), {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": version,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      temperature: 0,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Anthropic request failed with HTTP ${response.status}.`);
  }

  const body = (await response.json()) as AnthropicMessageResponse;
  const text = body.content.find((block) => block.type === "text")?.text;
  if (!text) {
    throw new Error("Anthropic response did not include text content.");
  }

  return parseJson<T>(text);
}

function parseJson<T>(text: string): T {
  const trimmed = text.trim();
  const withoutFence = trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  return JSON.parse(withoutFence) as T;
}

function coreBriefPrompt(input: CoreBriefInput) {
  return `You are NINE, a personal investment prep tool. Return only valid JSON with these snake_case keys:
{
  "structural_demand": string,
  "supply_constraint": string,
  "eps_revision_driver": string,
  "bear_case": string,
  "narrative_warning_flag": boolean,
  "narrative_warning_reason": string | null
}

Rules:
- This is prep, not a recommendation.
- Never say "AI가 추천", "성공 가능성 높음", or "강추".
- Always include a concrete bear case.
- Do not include price targets, trading timing, or technical chart commentary.

Input:
${JSON.stringify(input)}`;
}

function discoverThemesPrompt(signals: DiscoverSignal[]) {
  return `Cluster the following Discover signals into up to 5 emerging themes for NINE. Return only valid JSON array items with these snake_case keys:
[
  {
    "theme_name": string,
    "news_frequency_change": number,
    "export_signal_change": number | null,
    "capex_signal": string | null,
    "representative_tickers": string[]
  }
]

Rules:
- Curate representative KR/US tickers only when signal evidence supports them.
- This is theme discovery for later scoring, not a recommendation.
- Never say "AI가 추천", "성공 가능성 높음", or "강추".

Signals:
${JSON.stringify(signals)}`;
}
