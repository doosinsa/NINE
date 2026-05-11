"use client";

import { StockCard } from "@/components/domain/StockCard";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { FetchError, fetcher } from "@/lib/client/api";
import type { Candidate, CandidatesResponse } from "@/types/contracts";

const filters = ["전체", "한국", "미국", "신규 7점+", "점수 변화"] as const;
type CandidateFilter = (typeof filters)[number];

export default function CandidatesPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<CandidateFilter>("전체");
  const [data, setData] = useState<CandidatesResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    async function loadCandidates() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetcher<CandidatesResponse>("/api/candidates");
        if (isActive) setData(response);
      } catch (loadError) {
        if (!isActive) return;
        if (loadError instanceof FetchError) {
          setError(loadError.message);
        } else {
          setError("후보 리스트를 불러오지 못했습니다.");
        }
      } finally {
        if (isActive) setIsLoading(false);
      }
    }

    loadCandidates();

    return () => {
      isActive = false;
    };
  }, []);

  const filteredCandidates = useMemo(() => {
    const candidates = data?.candidates ?? [];
    return candidates.filter((candidate) => matchesFilter(candidate, filter));
  }, [data, filter]);

  return (
    <div className="p-5">
      <header className="mb-6">
        <h1 className="text-2xl font-bold mb-1">이번 주 후보 {data?.total ?? 0}개</h1>
        <p className="text-nine-secondary text-sm">
          {data ? `갱신 시각: ${formatUpdatedAt(data.generatedAt)}` : "갱신 시각 확인 중"}
        </p>
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
        {isLoading && <p className="text-nine-secondary text-sm">후보를 불러오는 중</p>}
        {error && <p className="text-danger text-sm font-medium">{error}</p>}
        {!isLoading && !error && filteredCandidates.length === 0 && (
          <p className="text-nine-secondary text-sm">조건에 맞는 후보가 없습니다.</p>
        )}
        {filteredCandidates.map((candidate) => (
          <StockCard
            key={candidate.stock.ticker}
            ticker={candidate.stock.ticker}
            name={candidate.stock.name}
            score={candidate.score.totalScore}
            country={candidate.stock.country}
            isNewSevenPlus={candidate.isNewSevenPlus}
            scoreChange={candidate.scoreChange}
            onClick={() => router.push(`/stocks/${encodeURIComponent(candidate.stock.ticker)}`)}
          />
        ))}
      </div>
    </div>
  );
}

function matchesFilter(candidate: Candidate, filter: CandidateFilter) {
  if (filter === "한국") return candidate.stock.country === "KR";
  if (filter === "미국") return candidate.stock.country === "US";
  if (filter === "신규 7점+") return candidate.isNewSevenPlus;
  if (filter === "점수 변화") return candidate.scoreChange !== null && candidate.scoreChange !== 0;
  return true;
}

function formatUpdatedAt(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}
