"use client";

import { AlertTriangle, CheckCircle2, RefreshCw, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { FetchError, fetcher } from "@/lib/client/api";
import type { ProviderStatusItem, ProviderStatusResponse } from "@/types/contracts";

export default function ProviderStatusPage() {
  const [data, setData] = useState<ProviderStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadStatus({ refreshing = false }: { refreshing?: boolean } = {}) {
    if (refreshing) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const response = await fetcher<ProviderStatusResponse>("/api/providers/status");
      setData(response);
    } catch (loadError) {
      if (loadError instanceof FetchError) {
        setError(loadError.message);
      } else {
        setError("Provider 상태를 불러오지 못했습니다.");
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    let isActive = true;

    async function loadInitialStatus() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetcher<ProviderStatusResponse>("/api/providers/status");
        if (isActive) setData(response);
      } catch (loadError) {
        if (!isActive) return;
        if (loadError instanceof FetchError) {
          setError(loadError.message);
        } else {
          setError("Provider 상태를 불러오지 못했습니다.");
        }
      } finally {
        if (isActive) setIsLoading(false);
      }
    }

    loadInitialStatus();

    return () => {
      isActive = false;
    };
  }, []);

  const summary = useMemo(() => summarize(data?.statuses ?? []), [data]);

  return (
    <div className="p-5 pb-24">
      <header className="mb-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="mb-1 text-xs font-semibold uppercase text-nine-secondary">Diagnostics</p>
            <h1 className="text-2xl font-bold leading-tight">Provider 상태</h1>
          </div>
          <button
            type="button"
            onClick={() => loadStatus({ refreshing: true })}
            disabled={isLoading || isRefreshing}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-border-color bg-surface text-nine-primary disabled:opacity-50"
            aria-label="Provider 상태 새로고침"
            title="Provider 상태 새로고침"
          >
            <RefreshCw size={18} className={isRefreshing ? "animate-spin" : ""} />
          </button>
        </div>
      </header>

      <section className="mb-5 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border-color bg-surface p-4">
          <p className="text-xs text-nine-secondary">Mode</p>
          <p className="mt-1 text-xl font-bold uppercase">{data?.providerMode ?? "mock"}</p>
        </div>
        <div className="rounded-xl border border-border-color bg-surface p-4">
          <p className="text-xs text-nine-secondary">Configured</p>
          <p className="mt-1 text-xl font-bold">
            {summary.configured}/{summary.total}
          </p>
        </div>
      </section>

      {isLoading && <p className="text-sm text-nine-secondary">Provider 상태를 불러오는 중</p>}
      {error && <p className="text-sm font-medium text-danger">{error}</p>}

      {!isLoading && !error && (
        <div className="space-y-3">
          {data?.statuses.map((status) => (
            <ProviderStatusCard key={status.provider} status={status} />
          ))}
        </div>
      )}
    </div>
  );
}

function ProviderStatusCard({ status }: { status: ProviderStatusItem }) {
  const Icon = status.configured ? CheckCircle2 : AlertTriangle;

  return (
    <article className="rounded-xl border border-border-color bg-surface p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="break-words text-base font-semibold">{providerLabel(status.provider)}</h2>
          <p className="mt-1 text-sm leading-relaxed text-nine-secondary">{status.purpose}</p>
        </div>
        <div className={`shrink-0 rounded-full p-2 ${status.configured ? "text-score-7" : "text-danger"}`}>
          <Icon size={20} />
        </div>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        <span className="rounded-lg border border-border-color bg-bg-base px-2.5 py-1 text-xs font-medium uppercase text-nine-secondary">
          {status.mode}
        </span>
        <span className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${status.configured ? "bg-score-7/10 text-score-7" : "bg-danger/10 text-danger"}`}>
          {status.configured ? "configured" : "missing env"}
        </span>
      </div>

      {status.missingEnv.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {status.missingEnv.map((name) => (
            <span key={name} className="max-w-full break-all rounded-lg border border-border-color bg-bg-base px-2.5 py-1 text-xs text-nine-secondary">
              {name}
            </span>
          ))}
        </div>
      ) : (
        <p className="flex items-center gap-2 text-sm font-medium text-score-7">
          <ShieldCheck size={16} />
          Env ready
        </p>
      )}
    </article>
  );
}

function summarize(statuses: ProviderStatusItem[]) {
  return {
    configured: statuses.filter((status) => status.configured).length,
    total: statuses.length,
  };
}

function providerLabel(provider: ProviderStatusItem["provider"]) {
  return provider
    .split("-")
    .map((part) => part.toUpperCase())
    .join(" ");
}
