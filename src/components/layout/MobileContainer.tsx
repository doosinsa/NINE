import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface MobileContainerProps {
  children: ReactNode;
  className?: string;
  hasBottomNav?: boolean;
}

export function MobileContainer({ children, className, hasBottomNav = true }: MobileContainerProps) {
  return (
    <div className="w-full min-h-dvh flex justify-center bg-bg-base safe-pt safe-pb">
      <main 
        className={cn(
          "w-full max-w-[720px] bg-bg-base relative min-h-full flex flex-col",
          hasBottomNav ? "pb-[80px]" : "", // 하단 네비게이션 공간 확보
          className
        )}
      >
        {children}
      </main>
    </div>
  );
}
