"use client";

import { useState, use } from "react";
import { ScoreBadge } from "@/components/ui/ScoreBadge";
import { Watermark } from "@/components/ui/Watermark";
import { ThesisKillModal } from "@/components/domain/ThesisKillModal";

// TODO: Replace with SWR & API fetch
export default function StockDetailPage({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = use(params);
  
  const [demandScore, setDemandScore] = useState(3);
  const [supplyScore, setSupplyScore] = useState(3);
  const quantScore = 3; // 자동 계산(Mock)
  const totalScore = quantScore + demandScore + supplyScore;

  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleBuy = () => {
    setIsModalOpen(true);
  };

  const handleSaveBuy = (data: any) => {
    console.log("Saved Buy Decision:", data);
    // API 호출 로직 들어갈 자리
  };

  return (
    <div className="p-5 pb-32">
      <header className="mb-8">
        <h1 className="text-[24px] font-bold mb-1">한화에어로스페이스</h1>
        <div className="text-[14px] text-nine-secondary">{ticker} · KR</div>
      </header>

      {/* Hero Score Section */}
      <div className="flex flex-col items-center justify-center mb-10 mt-6">
        <ScoreBadge score={totalScore} className="text-[80px] leading-none mb-4" />
        <Watermark />
      </div>

      {/* Manual Scoring Section */}
      <div className="space-y-8 bg-surface p-6 rounded-2xl border border-border-color mb-8">
        <div>
          <div className="flex justify-between items-end mb-4">
            <h3 className="font-semibold">Quant Score (자동)</h3>
            <span className="text-xl font-bold text-nine-primary">{quantScore}/3</span>
          </div>
          <div className="w-full h-2 bg-border-color rounded-full overflow-hidden">
            <div className="h-full bg-nine-primary transition-all" style={{ width: `${(quantScore/3)*100}%` }} />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-end mb-4">
            <h3 className="font-semibold">Demand Score (수동)</h3>
            <span className="text-xl font-bold text-nine-primary">{demandScore}/3</span>
          </div>
          <input 
            type="range" 
            min="0" max="3" step="1" 
            value={demandScore}
            onChange={(e) => setDemandScore(Number(e.target.value))}
            className="w-full accent-nine-primary h-2 bg-border-color rounded-lg appearance-none cursor-pointer"
          />
        </div>

        <div>
          <div className="flex justify-between items-end mb-4">
            <h3 className="font-semibold">Supply Score (수동)</h3>
            <span className="text-xl font-bold text-nine-primary">{supplyScore}/3</span>
          </div>
          <input 
            type="range" 
            min="0" max="3" step="1" 
            value={supplyScore}
            onChange={(e) => setSupplyScore(Number(e.target.value))}
            className="w-full accent-nine-primary h-2 bg-border-color rounded-lg appearance-none cursor-pointer"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button className="flex-1 py-4 rounded-xl font-semibold bg-surface border border-border-color text-nine-secondary active:scale-[0.98] transition-transform">
          Pass
        </button>
        <button className="flex-1 py-4 rounded-xl font-semibold bg-surface border border-border-color text-nine-secondary active:scale-[0.98] transition-transform">
          Watch
        </button>
        <button 
          onClick={handleBuy}
          className="flex-[2] py-4 rounded-xl font-bold bg-nine-primary text-white active:scale-[0.98] transition-transform shadow-sm"
        >
          Buy
        </button>
      </div>

      <ThesisKillModal 
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        ticker={ticker}
        currentScore={totalScore}
        onSave={handleSaveBuy}
      />
    </div>
  );
}
