"use client";

import { motion } from "framer-motion";
import { ScoreBadge } from "../ui/ScoreBadge";
import { cn } from "@/lib/utils";

interface StockCardProps {
  ticker: string;
  name: string;
  score: number;
  country: "KR" | "US";
  isNewSevenPlus?: boolean;
  scoreChange?: number | null;
  onSwipeLeft?: () => void; // Pass
  onSwipeRight?: () => void; // Watchlist 추가
  onClick?: () => void;
  className?: string;
}

export function StockCard({
  ticker,
  name,
  score,
  country,
  isNewSevenPlus,
  scoreChange,
  onSwipeLeft,
  onSwipeRight,
  onClick,
  className
}: StockCardProps) {
  return (
    <motion.div
      drag={onSwipeLeft || onSwipeRight ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={(e, { offset }) => {
        if (offset.x > 100 && onSwipeRight) onSwipeRight();
        if (offset.x < -100 && onSwipeLeft) onSwipeLeft();
      }}
      onClick={onClick}
      className={cn(
        "bg-surface border border-border-color rounded-[16px] p-5 relative overflow-hidden",
        "active:scale-[0.98] transition-transform cursor-pointer select-none",
        className
      )}
    >
      {isNewSevenPlus && (
        <div className="absolute top-0 right-0 bg-badge text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg">
          NEW 7+
        </div>
      )}
      
      <div className="flex justify-between items-start gap-3">
        <div className="min-w-0 flex-1 pr-1">
          <h2 className="text-[18px] font-semibold tracking-tight text-fg-base mb-1 break-words leading-snug">
            {name}
          </h2>
          <div className="flex min-w-0 items-center gap-2">
            <span className="text-[13px] font-medium text-nine-secondary">
              {country}
            </span>
            <span className="min-w-0 break-all text-[13px] text-nine-secondary/70">
              {ticker}
            </span>
          </div>
        </div>
        
        <div className="flex shrink-0 flex-col items-end">
          <ScoreBadge score={score} className="text-[32px] leading-none" />
          {scoreChange !== undefined && scoreChange !== null && (
            <span className={cn(
              "text-[12px] font-medium mt-1",
              scoreChange > 0 ? "text-score-7" : scoreChange < 0 ? "text-danger" : "text-nine-secondary"
            )}>
              {scoreChange > 0 ? "+" : ""}{scoreChange}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
