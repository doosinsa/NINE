"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { FetchError, fetcher, postFetcher } from "@/lib/client/api";
import type {
  QuarterlyAction,
  QuarterlyReview,
  QuarterlyReviewItem,
  QuarterlyReviewRequest,
  QuarterlyReviewsResponse,
} from "@/types/contracts";

type ReviewDraft = {
  killConditionsTriggered: number;
  action: QuarterlyAction;
  notes: string;
};

type DraftsByTicker = Record<string, ReviewDraft>;

export default function QuarterlyReviewsPage() {
  const [data, setData] = useState<QuarterlyReviewsResponse | null>(null);
  const [drafts, setDrafts] = useState<DraftsByTicker>({});
  const [savingTicker, setSavingTicker] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    async function loadReviews() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetcher<QuarterlyReviewsResponse>("/api/quarterly-reviews");
        if (!isActive) return;
        setData(response);
        setDrafts(buildDrafts(response.items));
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

  const updateDraft = (ticker: string, patch: Partial<ReviewDraft>) => {
    setDrafts((current) => ({
      ...current,
      [ticker]: {
        ...(current[ticker] ?? defaultDraft()),
        ...patch,
      },
    }));
  };

  const saveReview = async (item: QuarterlyReviewItem) => {
    const ticker = item.holding.stock.ticker;
    const draft = drafts[ticker] ?? defaultDraft();

    setSavingTicker(ticker);
    setError(null);
    setMessage(null);

    try {
      const saved = await postFetcher<QuarterlyReviewRequest, QuarterlyReview>("/api/quarterly-reviews", {
        ticker,
        thesisStillValid: draft.killConditionsTriggered === 0,
        killConditionsTriggered: draft.killConditionsTriggered,
        action: draft.action,
        notes: draft.notes.trim() || undefined,
      });

      setData((current) => {
        if (!current) return current;
        return {
          ...current,
          progress: {
            ...current.progress,
            completed: countCompletedAfterSave(current.items, ticker),
          },
          items: current.items.map((reviewItem) =>
            reviewItem.holding.stock.ticker === ticker ? { ...reviewItem, latestReview: saved } : reviewItem,
          ),
          reviews: [saved, ...current.reviews.filter((review) => review.id !== saved.id)],
        };
      });
      setMessage(`${ticker} 분기 리뷰 저장 완료`);
    } catch (saveError) {
      if (saveError instanceof FetchError) {
        setError(saveError.message);
      } else {
        setError("분기 리뷰를 저장하지 못했습니다.");
      }
    } finally {
      setSavingTicker(null);
    }
  };

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

      {(error || message) && (
        <p className={cn("mb-4 text-sm font-medium", error ? "text-danger" : "text-nine-primary")}>
          {error ?? message}
        </p>
      )}

      <div className="space-y-5">
        {isLoading && <p className="text-nine-secondary text-sm">분기 리뷰를 불러오는 중</p>}
        {!isLoading && !error && data?.items.length === 0 && (
          <p className="text-nine-secondary text-sm">현재 보유 종목이 없습니다.</p>
        )}
        {data?.items.map((item) => {
          const ticker = item.holding.stock.ticker;
          const draft = drafts[ticker] ?? defaultDraft(item.latestReview);
          const systemRecommendation = systemRecommendationLabel(draft.killConditionsTriggered);
          const isDanger = draft.killConditionsTriggered >= 2;
          const isSaving = savingTicker === ticker;

          return (
            <section key={ticker} className="bg-surface border border-border-color rounded-2xl p-5">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-fg-base leading-tight break-words">{item.holding.stock.name}</h2>
                  <p className="mt-1 text-[13px] text-nine-secondary break-all">{ticker}</p>
                </div>
                <div className={cn("shrink-0 text-2xl font-bold", scoreColor(item.holding.score.totalScore))}>
                  {item.holding.score.totalScore}
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <p className="text-sm font-semibold">Thesis Kill 조건</p>
                {[
                  item.holding.score.thesisKill1,
                  item.holding.score.thesisKill2,
                  item.holding.score.thesisKill3,
                ].map((condition, index) => (
                  <div key={`${ticker}-kill-${index}`} className="rounded-xl bg-bg-base border border-border-color p-3">
                    <p className="text-xs font-semibold text-nine-secondary mb-1">Kill {index + 1}</p>
                    <p className="text-sm leading-relaxed text-fg-base">
                      {condition ?? "매수 thesis kill 조건이 아직 없습니다."}
                    </p>
                  </div>
                ))}
              </div>

              <div className="bg-bg-base p-4 rounded-xl border border-border-color mb-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <span className="text-sm font-medium">Triggered Kill</span>
                  <span className={cn("font-bold text-lg", isDanger ? "text-danger" : "text-score-7")}>
                    {draft.killConditionsTriggered}/3
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {[0, 1, 2, 3].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() =>
                        updateDraft(ticker, {
                          killConditionsTriggered: count,
                          action: recommendedAction(count),
                        })
                      }
                      className={cn(
                        "h-11 rounded-lg border text-sm font-bold transition-colors",
                        draft.killConditionsTriggered === count
                          ? "border-nine-primary bg-nine-primary text-white"
                          : "border-border-color bg-surface text-nine-secondary",
                      )}
                    >
                      {count}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">시스템 권고</span>
                  <span className={cn("font-semibold text-sm", isDanger ? "text-danger" : "text-fg-base")}>
                    {systemRecommendation}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium">나의 최종 결정</p>
                <div className="grid grid-cols-3 gap-2">
                  {reviewActions.map((action) => (
                    <button
                      key={action.value}
                      type="button"
                      onClick={() => updateDraft(ticker, { action: action.value })}
                      className={cn(
                        "min-h-11 rounded-lg px-2 text-sm font-semibold transition-colors border leading-tight",
                        draft.action === action.value
                          ? "bg-nine-primary text-white border-nine-primary"
                          : "bg-bg-base border-border-color text-nine-secondary",
                      )}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
                <textarea
                  value={draft.notes}
                  onChange={(event) => updateDraft(ticker, { notes: event.target.value })}
                  placeholder="메모"
                  rows={3}
                  className="w-full rounded-xl border border-border-color bg-bg-base p-3 text-[16px] leading-relaxed focus:outline-none focus:ring-1 focus:ring-nine-primary"
                />
                {item.latestReview && (
                  <p className="text-xs text-nine-secondary">최근 저장: {formatReviewDate(item.latestReview.reviewDate)}</p>
                )}
                <button
                  type="button"
                  onClick={() => saveReview(item)}
                  disabled={isSaving}
                  className="w-full rounded-xl bg-nine-primary py-4 text-base font-bold text-white transition-opacity disabled:opacity-60"
                >
                  {isSaving ? "저장 중" : "리뷰 저장"}
                </button>
              </div>
            </section>
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

function buildDrafts(items: QuarterlyReviewItem[]): DraftsByTicker {
  return items.reduce<DraftsByTicker>((drafts, item) => {
    drafts[item.holding.stock.ticker] = defaultDraft(item.latestReview);
    return drafts;
  }, {});
}

function defaultDraft(review?: QuarterlyReview | null): ReviewDraft {
  const killConditionsTriggered = review?.killConditionsTriggered ?? 0;
  return {
    killConditionsTriggered,
    action: review?.action ?? recommendedAction(killConditionsTriggered),
    notes: review?.notes ?? "",
  };
}

function countCompletedAfterSave(items: QuarterlyReviewItem[], ticker: string) {
  return items.filter((item) => item.latestReview !== null || item.holding.stock.ticker === ticker).length;
}

function recommendedAction(killConditionsTriggered: number): QuarterlyAction {
  if (killConditionsTriggered >= 3) return "sell_all";
  if (killConditionsTriggered === 2) return "reduce_50";
  return "hold";
}

function systemRecommendationLabel(killConditionsTriggered: number) {
  if (killConditionsTriggered === 0) return "Hold";
  if (killConditionsTriggered === 1) return "모니터";
  if (killConditionsTriggered === 2) return "50% 매도";
  return "전량 매도";
}

function scoreColor(score: number) {
  if (score === 9) return "text-score-9";
  if (score >= 7) return "text-score-7";
  if (score >= 4) return "text-score-4";
  return "text-score-0";
}

function formatReviewDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
  }).format(new Date(value));
}
