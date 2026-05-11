"use client";

import { useState } from "react";
import { Search as SearchIcon } from "lucide-react";
import { StockCard } from "@/components/domain/StockCard";
import { FetchError, fetcher, postFetcher } from "@/lib/client/api";
import type { SearchResponse } from "@/types/contracts";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isStartingAnalysis, setIsStartingAnalysis] = useState(false);
  const [searchResponse, setSearchResponse] = useState<SearchResponse | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;
    
    setIsSearching(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetcher<SearchResponse>(`/api/search?q=${encodeURIComponent(trimmedQuery)}`);
      setSearchResponse(response);
    } catch (searchError) {
      if (searchError instanceof FetchError) {
        setError(searchError.message);
      } else {
        setError("검색하지 못했습니다.");
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleStartAnalysis = async () => {
    if (!searchResponse) return;

    setIsStartingAnalysis(true);
    setError(null);
    setMessage(null);

    try {
      const response = await postFetcher<{ ticker: string }, SearchResponse>("/api/search", {
        ticker: searchResponse.query,
      });
      setSearchResponse(response);
      setMessage(
        response.result
          ? "유니버스 종목으로 확인했습니다."
          : "분석 요청을 기록했습니다. 다음 정식 채점 사이클에서 확인하세요.",
      );
    } catch (analysisError) {
      if (analysisError instanceof FetchError) {
        setError(analysisError.message);
      } else {
        setError("분석을 시작하지 못했습니다.");
      }
    } finally {
      setIsStartingAnalysis(false);
    }
  };

  return (
    <div className="p-5">
      <header className="mb-6">
        <h1 className="text-2xl font-bold mb-2">충동 검색</h1>
        <p className="text-sm text-nine-secondary">
          오늘 {searchResponse?.dailyCap.used ?? 0}/{searchResponse?.dailyCap.limit ?? 10} 사용 (일일 Cap)
        </p>
      </header>

      <form onSubmit={handleSearch} className="relative mb-8">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <SearchIcon size={20} className="text-nine-secondary" />
        </div>
        <input 
          type="text" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="종목명 또는 티커 (ex. AAPL)"
          className="w-full bg-surface border border-border-color rounded-2xl py-4 pl-12 pr-4 text-[16px] focus:outline-none focus:ring-1 focus:ring-nine-primary"
        />
      </form>

      {isSearching && (
        <div className="text-center py-10">
          <div className="animate-pulse flex flex-col items-center">
            <div className="w-8 h-8 rounded-full border-2 border-nine-primary border-t-transparent animate-spin mb-4" />
            <p className="text-nine-secondary text-sm">유니버스 밖 종목 분석 중... (10~15초)</p>
          </div>
        </div>
      )}

      {error && <p className="text-danger text-sm font-medium mb-4">{error}</p>}
      {message && <p className="text-nine-primary text-sm font-medium mb-4">{message}</p>}

      {searchResponse && !isSearching && (
        <div>
          <h2 className="text-sm font-semibold text-nine-secondary mb-3">검색 결과</h2>
          {searchResponse.result ? (
            <StockCard
              ticker={searchResponse.result.stock.ticker}
              name={searchResponse.result.stock.name}
              score={searchResponse.result.score.totalScore}
              country={searchResponse.result.stock.country}
            />
          ) : (
            <div className="bg-surface border border-border-color rounded-2xl p-5">
              <h3 className="font-semibold mb-1">{searchResponse.query.toUpperCase()}</h3>
              <p className="text-sm text-nine-secondary">현재 NINE universe 밖 종목입니다.</p>
            </div>
          )}
          {searchResponse.requiresOutsideUniverseAnalysis && (
            <button
              onClick={handleStartAnalysis}
              disabled={isStartingAnalysis || searchResponse.dailyCap.remaining <= 0}
              className="w-full py-4 mt-4 rounded-xl font-bold bg-nine-primary text-white disabled:opacity-60"
            >
              {isStartingAnalysis ? "분석 시작 중" : "유니버스 추가 및 정식 채점"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
