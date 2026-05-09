"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

// TODO: Replace with SWR & API fetch
const mockReviews = [
  {
    ticker: "012450",
    name: "한화에어로스페이스",
    killConditionsTriggered: 0,
    action: null,
  },
  {
    ticker: "BYND",
    name: "Beyond Meat",
    killConditionsTriggered: 3,
    action: "sell_all",
  }
];

export default function QuarterlyReviewsPage() {
  const [reviews, setReviews] = useState(mockReviews);

  return (
    <div className="p-5 pb-24">
      <header className="mb-8">
        <h1 className="text-2xl font-bold mb-2">2026 Q3 리뷰</h1>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 bg-border-color rounded-full overflow-hidden">
            <div className="h-full bg-nine-primary" style={{ width: "50%" }} />
          </div>
          <span className="text-sm font-medium text-nine-secondary">1/2 완료</span>
        </div>
      </header>

      <div className="space-y-6">
        {reviews.map((r) => {
          const systemRecommendation = 
            r.killConditionsTriggered === 0 ? "Hold" :
            r.killConditionsTriggered === 1 ? "모니터" :
            r.killConditionsTriggered === 2 ? "50% 매도" : "전량 매도";
            
          const isDanger = r.killConditionsTriggered >= 2;

          return (
            <div key={r.ticker} className="bg-surface border border-border-color rounded-2xl p-5">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-lg font-bold text-fg-base mb-1">{r.name}</h2>
                  <div className="text-[13px] text-nine-secondary">{r.ticker}</div>
                </div>
              </div>

              <div className="bg-bg-base p-4 rounded-xl border border-border-color mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Triggered Kill Conditions</span>
                  <span className={cn("font-bold text-lg", isDanger ? "text-danger" : "text-score-7")}>
                    {r.killConditionsTriggered}/3
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
                  {["Hold", "Reduce 50", "Sell All"].map((action) => (
                    <button
                      key={action}
                      className={cn(
                        "flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors border",
                        r.action === action?.toLowerCase().replace(" ", "_")
                          ? "bg-nine-primary text-white border-nine-primary"
                          : "bg-bg-base border-border-color text-nine-secondary"
                      )}
                    >
                      {action}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
