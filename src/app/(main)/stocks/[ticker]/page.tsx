"use client";

import { useEffect, useState, use } from "react";
import { ScoreBadge } from "@/components/ui/ScoreBadge";
import { Watermark } from "@/components/ui/Watermark";
import { ThesisKillModal } from "@/components/domain/ThesisKillModal";
import { FetchError, fetcher, postFetcher } from "@/lib/client/api";
import type {
  Decision,
  ManualScoreRequest,
  ManualScoreResponse,
  StockDetailResponse,
} from "@/types/contracts";

export default function StockDetailPage({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = use(params);
  
  const [detail, setDetail] = useState<StockDetailResponse | null>(null);
  const [demandScore, setDemandScore] = useState(0);
  const [supplyScore, setSupplyScore] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const quantScore = detail?.score.scoreQuant ?? 0;
  const totalScore = quantScore + demandScore + supplyScore;

  useEffect(() => {
    let isActive = true;

    async function loadDetail() {
      setIsLoading(true);
      setError(null);

      try {
        const data = await fetcher<StockDetailResponse>(`/api/stocks/${encodeURIComponent(ticker)}`);
        if (!isActive) return;
        setDetail(data);
        setDemandScore(data.score.scoreDemand);
        setSupplyScore(data.score.scoreSupply);
      } catch (loadError) {
        if (!isActive) return;
        if (loadError instanceof FetchError && loadError.code === "NOT_FOUND") {
          setError("NINE universe에서 종목을 찾지 못했습니다.");
        } else {
          setError("종목 정보를 불러오지 못했습니다.");
        }
      } finally {
        if (isActive) setIsLoading(false);
      }
    }

    loadDetail();

    return () => {
      isActive = false;
    };
  }, [ticker]);

  const saveDecision = async (
    decision: Decision,
    extra: Partial<Pick<ManualScoreRequest, "thesisKill1" | "thesisKill2" | "thesisKill3" | "positionSizeKrw" | "boughtAtPrice" | "boughtAtDate">> = {},
  ) => {
    if (!detail || isSaving) return false;

    setIsSaving(true);
    setError(null);
    setSaveMessage(null);

    try {
      const response = await postFetcher<ManualScoreRequest, ManualScoreResponse>("/api/scores/manual", {
        ticker: detail.stock.ticker,
        scoreDemand: demandScore,
        scoreSupply: supplyScore,
        decision,
        ...extra,
      });

      setDetail({ ...detail, score: response.score });
      setDemandScore(response.score.scoreDemand);
      setSupplyScore(response.score.scoreSupply);
      setSaveMessage(response.warning ?? `${decisionLabel(decision)} 저장 완료`);
      return true;
    } catch (saveError) {
      if (saveError instanceof FetchError) {
        setError(saveError.message);
      } else {
        setError("저장하지 못했습니다.");
      }
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleBuy = () => {
    setIsModalOpen(true);
  };

  const handleSaveBuy = async (data: {
    thesisKill1: string;
    thesisKill2: string;
    thesisKill3: string;
    positionSizeKrw: number;
    boughtAtPrice: number;
    boughtAtDate: string;
  }) => {
    const saved = await saveDecision("buy", data);
    if (!saved) throw new Error("Failed to save buy decision.");
  };

  if (isLoading) {
    return (
      <div className="p-5 pb-32">
        <p className="text-nine-secondary">종목 정보를 불러오는 중</p>
      </div>
    );
  }

  if (error && !detail) {
    return (
      <div className="p-5 pb-32">
        <p className="text-danger font-medium">{error}</p>
      </div>
    );
  }

  if (!detail) return null;

  return (
    <div className="p-5 pb-32">
      <header className="mb-8">
        <h1 className="text-[24px] font-bold mb-1">{detail.stock.name}</h1>
        <div className="text-[14px] text-nine-secondary">{detail.stock.ticker} · {detail.stock.country}</div>
      </header>

      {/* Hero Score Section */}
      <div className="flex flex-col items-center justify-center mb-10 mt-6">
        <ScoreBadge score={totalScore} className="text-[80px] leading-none mb-4" />
        <Watermark />
      </div>

      {detail.latestBrief && (
        <section className="bg-surface p-5 rounded-2xl border border-border-color mb-8 space-y-3">
          <h2 className="font-semibold">Brief</h2>
          <p className="text-sm text-nine-secondary">{detail.latestBrief.structuralDemand}</p>
          <p className="text-sm text-nine-secondary">{detail.latestBrief.supplyConstraint}</p>
          <p className="text-sm text-nine-secondary">{detail.latestBrief.epsRevisionDriver}</p>
        </section>
      )}

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
            style={{ "--slider-progress": `${(demandScore / 3) * 100}%` } as React.CSSProperties}
            className="score-slider w-full appearance-none"
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
            style={{ "--slider-progress": `${(supplyScore / 3) * 100}%` } as React.CSSProperties}
            className="score-slider w-full appearance-none"
          />
        </div>
      </div>

      {/* Action Buttons */}
      {(error || saveMessage) && (
        <div className={`mb-4 text-sm font-medium ${error ? "text-danger" : "text-nine-primary"}`}>
          {error ?? saveMessage}
        </div>
      )}
      <div className="flex gap-3">
        <button
          onClick={() => saveDecision("pass")}
          disabled={isSaving}
          className="flex-1 py-4 rounded-xl font-semibold bg-surface border border-border-color text-nine-secondary active:scale-[0.98] transition-transform disabled:opacity-60"
        >
          Pass
        </button>
        <button
          onClick={() => saveDecision("watch")}
          disabled={isSaving}
          className="flex-1 py-4 rounded-xl font-semibold bg-surface border border-border-color text-nine-secondary active:scale-[0.98] transition-transform disabled:opacity-60"
        >
          Watch
        </button>
        <button 
          onClick={handleBuy}
          disabled={isSaving}
          className="flex-[2] py-4 rounded-xl font-bold bg-nine-primary text-white active:scale-[0.98] transition-transform shadow-sm disabled:opacity-60"
        >
          Buy
        </button>
      </div>

      <ThesisKillModal 
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        ticker={ticker}
        currentScore={totalScore}
        isSaving={isSaving}
        onSave={handleSaveBuy}
      />
    </div>
  );
}

function decisionLabel(decision: Decision) {
  if (decision === "pass") return "Pass";
  if (decision === "watch") return "Watch";
  return "Buy";
}
