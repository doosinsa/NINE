"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { FetchError, fetcher } from "@/lib/client/api";
import type { QuarterlyAction, QuarterlyReviewsResponse } from "@/types/contracts";

export default function QuarterlyReviewsPage() {
  const [data, setData] = useState<QuarterlyReviewsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    async function loadReviews() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetcher<QuarterlyReviewsResponse>("/api/quarterly-reviews");
        if (isActive) setData(response);
      } catch (loadError) {
        if (!isActive) return;
        if (loadError instanceof FetchError) {
          setError(loadError.message);
        } else {
          setError("분기 리뷰를 불러오지 못했습니다.");
        }
      } finally {
        if (isActive) setIsLoading(false);
      }
    }

    loadReviews();

    return () => {
      isActive = false;
    };
  }, []);

  const completed = data?.progress.completed ?? 0;
  const total = data?.progress.total ?? 0;
  const progressPercent = total === 0 ? 0 : (completed / total) * 100;

  return (
    <div className="p-5 pb-24">
      <header className="mb-8">
        <h1 className="text-2xl font-bold mb-2">{data?.quarter ?? "분기"} 리뷰</h1>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 bg-border-color rounded-full overflow-hidden">
            <div className="h-full bg-nine-primary" style={{ width: `${progressPercent}%` }} />
          </div>
          <span className="text-sm font-medium text-nine-secondary">{completed}/{total} 완료</span>
        </div>
      </header>

      <div className="space-y-6">
        {isLoading && <p className="text-nine-secondary text-sm">분기 리뷰를 불러오는 중</p>}
        {error && <p className="text-danger text-sm font-medium">{error}</p>}
        {!isLoading && !error && data?.reviews.length === 0 && (
          <p className="text-nine-secondary text-sm">저장된 분기 리뷰가 없습니다.</p>
        )}
        {data?.reviews.map((review) => {
          const systemRecommendation = systemRecommendationLabel(review.killConditionsTriggered);
          const isDanger = review.killConditionsTriggered >= 2;

          return (
            <div key={`${review.ticker}-${review.id}`} className="bg-surface border border-border-color rounded-2xl p-5">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-lg font-bold text-fg-base mb-1">{review.ticker}</h2>
                  <div className="text-[13px] text-nine-secondary">검토일 {formatReviewDate(review.reviewDate)}</div>
                </div>
              </div>

              <div className="bg-bg-base p-4 rounded-xl border border-border-color mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Triggered Kill Conditions</span>
                  <span className={cn("font-bold text-lg", isDanger ? "text-danger" : "text-score-7")}>
                    {review.killConditionsTriggered}/3
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">시스템 권고</span>
                  <span className={cn("font-semibold text-sm", isDanger ? "text-danger" : "text-fg-base")}>
                    {systemRecommendation}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium mb-2">나의 결정</p>
                <div className="flex gap-2">
                  {reviewActions.map((action) => (
                    <button
                      key={action.value}
                      className={cn(
                        "flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors border",
                        review.action === action.value
                          ? "bg-nine-primary text-white border-nine-primary"
                          : "bg-bg-base border-border-color text-nine-secondary"
                      )}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
                {review.notes && <p className="text-sm text-nine-secondary mt-3">{review.notes}</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const reviewActions: Array<{ label: string; value: QuarterlyAction }> = [
  { label: "Hold", value: "hold" },
  { label: "Reduce 50", value: "reduce_50" },
  { label: "Sell All", value: "sell_all" },
];

function systemRecommendationLabel(killConditionsTriggered: number) {
  if (killConditionsTriggered === 0) return "Hold";
  if (killConditionsTriggered === 1) return "모니터";
  if (killConditionsTriggered === 2) return "50% 매도";
  return "전량 매도";
}

function formatReviewDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
  }).format(new Date(value));
}
