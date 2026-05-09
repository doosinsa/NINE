"use client";

import { ArrowRight } from "lucide-react";

const mockThemes = [
  {
    id: 1,
    name: "AI 데이터센터 전력망",
    newsChange: 120,
    exportSignal: 15,
    tickers: ["GE", "HD", "000000(한국전력)"]
  },
  {
    id: 2,
    name: "온디바이스 AI 엣지 추론",
    newsChange: 85,
    exportSignal: null,
    tickers: ["QCOM", "ARM"]
  }
];

export default function DiscoverPage() {
  return (
    <div className="p-5 pb-24">
      <header className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Discover</h1>
        <p className="text-sm text-nine-secondary">이번 주 글로벌 부상 테마 5개</p>
      </header>

      <div className="space-y-6">
        {mockThemes.map((theme) => (
          <div key={theme.id} className="bg-surface border border-border-color rounded-2xl p-5">
            <h2 className="text-lg font-bold mb-4 text-fg-base">{theme.name}</h2>
            
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div className="bg-bg-base p-3 rounded-xl border border-border-color">
                <p className="text-xs text-nine-secondary mb-1">뉴스 빈도 변화</p>
                <p className="font-bold text-score-7">+{theme.newsChange}%</p>
              </div>
              <div className="bg-bg-base p-3 rounded-xl border border-border-color">
                <p className="text-xs text-nine-secondary mb-1">수출 신호 변화</p>
                <p className="font-bold text-fg-base">
                  {theme.exportSignal ? `+${theme.exportSignal}%` : "-"}
                </p>
              </div>
            </div>

            <div className="mb-5">
              <p className="text-sm font-medium mb-2">대표 종목</p>
              <div className="flex flex-wrap gap-2">
                {theme.tickers.map(t => (
                  <span key={t} className="px-3 py-1.5 bg-bg-base border border-border-color rounded-lg text-sm text-nine-secondary">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <button className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold bg-bg-base border border-border-color text-nine-primary transition-colors active:scale-[0.98]">
              <span>Core 송부</span>
              <ArrowRight size={18} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
