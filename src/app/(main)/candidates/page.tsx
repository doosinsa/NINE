"use client";

import { StockCard } from "@/components/domain/StockCard";
import { useRouter } from "next/navigation";
import { useState } from "react";

// TODO: Replace with SWR & API fetch
const mockCandidates = [
  {
    ticker: "012450",
    name: "한화에어로스페이스",
    country: "KR" as const,
    score: 9,
    isNewSevenPlus: true,
    scoreChange: 2,
  },
  {
    ticker: "PLTR",
    name: "Palantir Technologies",
    country: "US" as const,
    score: 8,
    isNewSevenPlus: false,
    scoreChange: 0,
  },
  {
    ticker: "005930",
    name: "삼성전자",
    country: "KR" as const,
    score: 4,
    isNewSevenPlus: false,
    scoreChange: -1,
  }
];

export default function CandidatesPage() {
  const router = useRouter();
  const [filter, setFilter] = useState("전체");
  
  const filters = ["전체", "한국", "미국", "신규 7점+", "점수 변화"];

  return (
    <div className="p-5">
      <header className="mb-6">
        <h1 className="text-2xl font-bold mb-1">이번 주 후보 {mockCandidates.length}개</h1>
        <p className="text-nine-secondary text-sm">갱신 시각: 오늘 오전 10:00</p>
      </header>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 no-scrollbar">
        {filters.map(f => (
          <button 
            key={f} 
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              filter === f 
                ? "bg-nine-primary text-white" 
                : "bg-surface border border-border-color text-nine-secondary"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {mockCandidates.map((c) => (
          <StockCard 
            key={c.ticker}
            ticker={c.ticker}
            name={c.name}
            score={c.score}
            country={c.country}
            isNewSevenPlus={c.isNewSevenPlus}
            scoreChange={c.scoreChange}
            onClick={() => router.push(`/stocks/${c.ticker}`)}
            onSwipeLeft={() => console.log("Pass", c.ticker)}
            onSwipeRight={() => console.log("Watchlist", c.ticker)}
          />
        ))}
      </div>
    </div>
  );
}
