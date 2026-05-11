"use client";

import { ScoreBadge } from "@/components/ui/ScoreBadge";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FetchError, fetcher } from "@/lib/client/api";
import type { Holding, HoldingsResponse } from "@/types/contracts";

export default function HoldingsPage() {
  const router = useRouter();
  const [data, setData] = useState<HoldingsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    async function loadHoldings() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetcher<HoldingsResponse>("/api/holdings");
        if (isActive) setData(response);
      } catch (loadError) {
        if (!isActive) return;
        if (loadError instanceof FetchError) {
          setError(loadError.message);
        } else {
          setError("보유 종목을 불러오지 못했습니다.");
        }
      } finally {
        if (isActive) setIsLoading(false);
      }
    }

    loadHoldings();

    return () => {
      isActive = false;
    };
  }, []);

  return (
    <div className="p-5">
      <header className="mb-6">
        <h1 className="text-2xl font-bold mb-1">보유 종목</h1>
        <div className="flex items-center gap-2 text-nine-secondary text-sm mt-2">
          <span>평균 NINE 점수:</span>
          <ScoreBadge score={data?.averageNineScore ?? 0} className="text-lg" />
          {data && data.riskCount > 0 && (
            <span className="ml-2 text-danger font-medium">위험 {data.riskCount}개</span>
          )}
        </div>
      </header>

      {/* 안 봐 자산 보호 UI 원칙: 가격 변동, 차트 등 절대 노출 금지 */}
      <div className="space-y-4 mt-6">
        {isLoading && <p className="text-nine-secondary text-sm">보유 종목을 불러오는 중</p>}
        {error && <p className="text-danger text-sm font-medium">{error}</p>}
        {!isLoading && !error && data?.holdings.length === 0 && (
          <p className="text-nine-secondary text-sm">보유 종목이 없습니다.</p>
        )}
        {data?.holdings.map((holding) => (
          <div
            key={holding.stock.ticker}
            onClick={() => router.push(`/stocks/${encodeURIComponent(holding.stock.ticker)}`)}
            className="bg-surface border border-border-color rounded-[16px] p-5 active:scale-[0.98] transition-transform cursor-pointer"
          >
            <div className="flex justify-between items-start gap-3 mb-4">
              <div className="min-w-0 flex-1 pr-1">
                <h2 className="text-[18px] font-semibold text-fg-base mb-1 break-words leading-snug">
                  {holding.stock.name}
                </h2>
                <div className="break-all text-[13px] text-nine-secondary">{holding.stock.ticker}</div>
              </div>
              <ScoreBadge score={holding.score.totalScore} className="shrink-0 text-[28px]" />
            </div>
            
            {/* Thesis Kill 상태 표시 영역 */}
            <div className={`text-sm font-medium p-3 rounded-lg ${statusClassName(holding)}`}>
              {statusText(holding)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function statusClassName(holding: Holding) {
  if (holding.thesisKillStatus === "triggered") return "bg-danger/10 text-danger";
  if (holding.score.totalScore < 7 || holding.thesisKillStatus === "warning") {
    return "bg-amber-500/10 text-amber-600 dark:text-amber-400";
  }
  return "bg-score-7/10 text-score-7";
}

function statusText(holding: Holding) {
  if (holding.triggeredKillConditions > 0) {
    return `Kill 조건 ${holding.triggeredKillConditions}개 발생`;
  }
  if (holding.score.totalScore < 7) {
    return `점수 점검 필요 (${holding.score.totalScore}/9)`;
  }
  return "Thesis Kill 양호";
}
