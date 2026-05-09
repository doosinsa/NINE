"use client";

import { useState } from "react";
import { Drawer } from "vaul";
import { cn } from "@/lib/utils";

interface ThesisKillModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  ticker: string;
  currentScore: number;
  onSave: (data: {
    thesisKill1: string;
    thesisKill2: string;
    thesisKill3: string;
    positionSizeKrw: number;
    boughtAtPrice: number;
  }) => void;
}

export function ThesisKillModal({
  isOpen,
  onOpenChange,
  ticker,
  currentScore,
  onSave,
}: ThesisKillModalProps) {
  const [tk1, setTk1] = useState("");
  const [tk2, setTk2] = useState("");
  const [tk3, setTk3] = useState("");
  const [posSize, setPosSize] = useState("");
  const [price, setPrice] = useState("");

  const isWarning = currentScore < 7;
  const isFormValid = tk1.length >= 30 && tk2.length >= 30 && tk3.length >= 30 && posSize && price;

  const handleSave = () => {
    if (!isFormValid) return;
    onSave({
      thesisKill1: tk1,
      thesisKill2: tk2,
      thesisKill3: tk3,
      positionSizeKrw: Number(posSize) * 10000,
      boughtAtPrice: Number(price),
    });
    setTk1("");
    setTk2("");
    setTk3("");
    setPosSize("");
    setPrice("");
    onOpenChange(false);
  };

  return (
    <Drawer.Root open={isOpen} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50" />
        <Drawer.Content className="bg-surface flex flex-col rounded-t-[20px] fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[720px] max-h-[90dvh] z-50">
          <div className="p-5 bg-surface rounded-t-[20px] flex-1 overflow-y-auto">
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-nine-secondary/30 mb-6" />
            <Drawer.Title className="font-bold text-xl mb-4">
              {ticker} 매수 기록
            </Drawer.Title>
            
            {isWarning && (
              <div className="bg-danger/10 text-danger p-3 rounded-lg text-sm mb-6 font-medium">
                7점 미만 매수는 시스템 권고와 다른 결정이야. 그래도 진행할래?
              </div>
            )}
            
            <p className="text-sm text-nine-secondary mb-4">
              출구 조건 없이 매수 못 함. 3개 조건 먼저 적어. (각 30자 이상)
            </p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-1">Thesis Kill 1</label>
                <textarea 
                  className="w-full border border-border-color rounded-lg p-3 text-[16px] bg-bg-base placeholder-nine-secondary/50 focus:outline-none focus:ring-1 focus:ring-nine-primary"
                  rows={2}
                  value={tk1}
                  onChange={(e) => setTk1(e.target.value)}
                  placeholder="ex) 핵심 제품 매출 증가율이 2분기 연속 YOY 10% 미만으로 떨어질 경우"
                />
                <p className="text-xs text-nine-secondary text-right mt-1">{tk1.length}/100</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Thesis Kill 2</label>
                <textarea 
                  className="w-full border border-border-color rounded-lg p-3 text-[16px] bg-bg-base placeholder-nine-secondary/50 focus:outline-none focus:ring-1 focus:ring-nine-primary"
                  rows={2}
                  value={tk2}
                  onChange={(e) => setTk2(e.target.value)}
                  placeholder="ex) 주요 원자재 가격 급등으로 GPM이 40% 밑으로 하락할 경우"
                />
                <p className="text-xs text-nine-secondary text-right mt-1">{tk2.length}/100</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Thesis Kill 3</label>
                <textarea 
                  className="w-full border border-border-color rounded-lg p-3 text-[16px] bg-bg-base placeholder-nine-secondary/50 focus:outline-none focus:ring-1 focus:ring-nine-primary"
                  rows={2}
                  value={tk3}
                  onChange={(e) => setTk3(e.target.value)}
                  placeholder="ex) 창업자 또는 현 CEO가 사임하거나 횡령 등 중대 이슈가 발생할 경우"
                />
                <p className="text-xs text-nine-secondary text-right mt-1">{tk3.length}/100</p>
              </div>
            </div>

            <div className="flex gap-4 mb-8">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">매수 비중 (만원)</label>
                <input 
                  type="number" 
                  className="w-full border border-border-color rounded-lg p-3 text-[16px] bg-bg-base focus:outline-none focus:ring-1 focus:ring-nine-primary"
                  value={posSize}
                  onChange={(e) => setPosSize(e.target.value)}
                  placeholder="1000"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">매수가</label>
                <input 
                  type="number" 
                  className="w-full border border-border-color rounded-lg p-3 text-[16px] bg-bg-base focus:outline-none focus:ring-1 focus:ring-nine-primary"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="150"
                />
              </div>
            </div>
            
            <button
              onClick={handleSave}
              disabled={!isFormValid}
              className={cn(
                "w-full py-4 rounded-xl font-bold text-lg transition-colors mb-[env(safe-area-inset-bottom)]",
                isFormValid 
                  ? "bg-nine-primary text-white" 
                  : "bg-border-color text-nine-secondary cursor-not-allowed"
              )}
            >
              저장하기
            </button>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
