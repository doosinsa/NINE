import { cn } from "@/lib/utils";

interface WatermarkProps {
  className?: string;
}

export function Watermark({ className }: WatermarkProps) {
  return (
    <p className={cn("text-[12px] opacity-40 font-normal text-nine-secondary text-center pointer-events-none select-none", className)}>
      이 점수는 prep이지 신탁이 아님
    </p>
  );
}
