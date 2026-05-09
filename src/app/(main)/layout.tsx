import { ReactNode } from "react";
import { MobileContainer } from "@/components/layout/MobileContainer";
import { BottomNavigation } from "@/components/layout/BottomNavigation";

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <MobileContainer hasBottomNav>
      <div className="flex-1 w-full h-full">
        {children}
      </div>
      <BottomNavigation />
    </MobileContainer>
  );
}
