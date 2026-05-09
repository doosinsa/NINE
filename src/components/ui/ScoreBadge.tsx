import { cn } from "@/lib/utils";

interface ScoreBadgeProps {
  score: number;
  className?: string;
}

export function ScoreBadge({ score, className }: ScoreBadgeProps) {
  let colorClass = "text-score-0";
  if (score >= 9) {
    colorClass = "text-score-9";
  } else if (score >= 7) {
    colorClass = "text-score-7";
  } else if (score >= 4) {
    colorClass = "text-score-4";
  }

  return (
    <span className={cn("font-bold transition-colors", colorClass, className)}>
      {score}
    </span>
  );
}
