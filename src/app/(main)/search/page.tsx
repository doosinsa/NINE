"use client";

import { useState } from "react";
import { Search as SearchIcon } from "lucide-react";
import { StockCard } from "@/components/domain/StockCard";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;
    
    setIsSearching(true);
    // Mock API call
    setTimeout(() => {
      setResult({
        ticker: query.toUpperCase(),
        name: "Mock Search Result",
        country: "US",
        score: 5,
        isOutsideUniverse: true,
      });
      setIsSearching(false);
    }, 1500);
  };

  return (
    <div className="p-5">
      <header className="mb-6">
        <h1 className="text-2xl font-bold mb-2">충동 검색</h1>
        <p className="text-sm text-nine-secondary">오늘 7/10 사용 (일일 Cap)</p>
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

      {result && !isSearching && (
        <div>
          <h2 className="text-sm font-semibold text-nine-secondary mb-3">검색 결과</h2>
          <StockCard 
            ticker={result.ticker}
            name={result.name}
            score={result.score}
            country={result.country}
          />
          {result.isOutsideUniverse && (
            <button className="w-full py-4 mt-4 rounded-xl font-bold bg-nine-primary text-white">
              유니버스 추가 및 정식 채점
            </button>
          )}
        </div>
      )}
    </div>
  );
}
