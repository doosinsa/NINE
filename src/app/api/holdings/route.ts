import { ok } from "@/lib/server/api";
import { getHoldings } from "@/lib/server/mock-data";
import type { HoldingsResponse } from "@/types/contracts";

export async function GET() {
  const holdings = getHoldings();
  const averageNineScore =
    holdings.length === 0
      ? 0
      : Number((holdings.reduce((sum, holding) => sum + holding.score.totalScore, 0) / holdings.length).toFixed(1));

  const response: HoldingsResponse = {
    averageNineScore,
    riskCount: holdings.filter((holding) => holding.triggeredKillConditions > 0 || holding.score.totalScore < 7).length,
    holdings,
  };

  return ok(response);
}
