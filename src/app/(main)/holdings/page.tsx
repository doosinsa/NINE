"use client";

import { ScoreBadge } from "@/components/ui/ScoreBadge";
import { useRouter } from "next/navigation";

// TODO: Replace with SWR & API fetch
const mockHoldings = [
  {
    ticker: "012450",
    name: "한화에어로스페이스",
    score: 9,
    status: "clear" as const, // clear, warning, triggered
    statusText: "양호",
  },
  {
    ticker: "005930",
    name: "삼성전자",
    score: 6, // 7->6 하락 예시
    status: "warning" as const,
    statusText: "점수 하락 (7→6)",
  },
  {
    ticker: "BYND",
    name: "Beyond Meat",
    score: 2,
    status: "triggered" as const,
    statusText: "Kill 조건 1개 발생",
  }
];

export default function HoldingsPage() {
  const router = useRouter();

  return (
    <div className="p-5">
      <header className="mb-6">
        <h1 className="text-2xl font-bold mb-1">보유 종목</h1>
        <div className="flex items-center gap-2 text-nine-secondary text-sm mt-2">
          <span>평균 NINE 점수:</span>
          <ScoreBadge score={7.5} className="text-lg" />
        </div>
      </header>

      {/* 안 봐 자산 보호 UI 원칙: 가격 변동, 차트 등 절대 노출 금지 */}
      <div className="space-y-4 mt-6">
        {mockHoldings.map((h) => (
          <div
            key={h.ticker}
            onClick={() => router.push(`/stocks/${h.ticker}`)}
            className="bg-surface border border-border-color rounded-[16px] p-5 active:scale-[0.98] transition-transform cursor-pointer"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-[18px] font-semibold text-fg-base mb-1">{h.name}</h2>
                <div className="text-[13px] text-nine-secondary">{h.ticker}</div>
              </div>
              <ScoreBadge score={h.score} className="text-[28px]" />
            </div>
            
            {/* Thesis Kill 상태 표시 영역 */}
            <div className={`text-sm font-medium p-3 rounded-lg ${
              h.status === "clear" ? "bg-score-7/10 text-score-7" :
              h.status === "warning" ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" :
              "bg-danger/10 text-danger"
            }`}>
              {h.status === "clear" ? "✓ " : h.status === "warning" ? "⚠ " : "✗ "} 
              {h.statusText}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
