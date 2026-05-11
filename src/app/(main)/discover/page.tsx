"use client";

import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { FetchError, fetcher, postFetcher } from "@/lib/client/api";
import type {
  DiscoverResponse,
  DiscoverSendToCoreRequest,
  DiscoverSendToCoreResponse,
} from "@/types/contracts";

export default function DiscoverPage() {
  const [data, setData] = useState<DiscoverResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sendingThemeId, setSendingThemeId] = useState<number | null>(null);
  const [messageByThemeId, setMessageByThemeId] = useState<Record<number, string>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    async function loadThemes() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetcher<DiscoverResponse>("/api/discover");
        if (isActive) setData(response);
      } catch (loadError) {
        if (!isActive) return;
        if (loadError instanceof FetchError) {
          setError(loadError.message);
        } else {
          setError("Discover 테마를 불러오지 못했습니다.");
        }
      } finally {
        if (isActive) setIsLoading(false);
      }
    }

    loadThemes();

    return () => {
      isActive = false;
    };
  }, []);

  const handleSendToCore = async (sourceThemeId: number, tickers: string[]) => {
    setSendingThemeId(sourceThemeId);
    setError(null);

    try {
      const response = await postFetcher<DiscoverSendToCoreRequest, DiscoverSendToCoreResponse>("/api/discover", {
        sourceThemeId,
        tickers,
      });
      setMessageByThemeId((previous) => ({
        ...previous,
        [sourceThemeId]: sendToCoreMessage(response),
      }));
    } catch (sendError) {
      if (sendError instanceof FetchError) {
        setError(sendError.message);
      } else {
        setError("Core 송부에 실패했습니다.");
      }
    } finally {
      setSendingThemeId(null);
    }
  };

  return (
    <div className="p-5 pb-24">
      <header className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Discover</h1>
        <p className="text-sm text-nine-secondary">
          {data ? `${formatWeek(data.weekOf)} 글로벌 부상 테마 ${data.themes.length}개` : "이번 주 글로벌 부상 테마"}
        </p>
      </header>

      <div className="space-y-6">
        {isLoading && <p className="text-nine-secondary text-sm">테마를 불러오는 중</p>}
        {error && <p className="text-danger text-sm font-medium">{error}</p>}
        {!isLoading && !error && data?.themes.length === 0 && (
          <p className="text-nine-secondary text-sm">이번 주 Discover 테마가 없습니다.</p>
        )}
        {data?.themes.map((theme) => (
          <div key={theme.id} className="bg-surface border border-border-color rounded-2xl p-5">
            <h2 className="text-lg font-bold mb-4 text-fg-base">{theme.themeName}</h2>
            
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div className="bg-bg-base p-3 rounded-xl border border-border-color">
                <p className="text-xs text-nine-secondary mb-1">뉴스 빈도 변화</p>
                <p className="font-bold text-score-7">{formatPercent(theme.newsFrequencyChange)}</p>
              </div>
              <div className="bg-bg-base p-3 rounded-xl border border-border-color">
                <p className="text-xs text-nine-secondary mb-1">수출 신호 변화</p>
                <p className="font-bold text-fg-base">
                  {theme.exportSignalChange === null ? "-" : formatPercent(theme.exportSignalChange)}
                </p>
              </div>
            </div>

            {theme.capexSignal && (
              <p className="text-sm text-nine-secondary mb-5">{theme.capexSignal}</p>
            )}

            <div className="mb-5">
              <p className="text-sm font-medium mb-2">대표 종목</p>
              <div className="flex flex-wrap gap-2">
                {theme.representativeTickers.map(t => (
                  <span key={t} className="px-3 py-1.5 bg-bg-base border border-border-color rounded-lg text-sm text-nine-secondary">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {messageByThemeId[theme.id] && (
              <p className="text-sm text-nine-primary font-medium mb-3">{messageByThemeId[theme.id]}</p>
            )}

            <button
              onClick={() => handleSendToCore(theme.id, theme.representativeTickers)}
              disabled={sendingThemeId === theme.id}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold bg-bg-base border border-border-color text-nine-primary transition-colors active:scale-[0.98] disabled:opacity-60"
            >
              <span>{sendingThemeId === theme.id ? "송부 중" : "Core 송부"}</span>
              <ArrowRight size={18} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatPercent(value: number) {
  return `${value > 0 ? "+" : ""}${Math.round(value * 100)}%`;
}

function formatWeek(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
  }).format(new Date(value));
}

function sendToCoreMessage(response: DiscoverSendToCoreResponse) {
  return `추가 ${response.addedTickers.length}개, 스킵 ${response.skippedTickers.length}개 · 다음 채점 ${response.nextScoringCycle}`;
}
