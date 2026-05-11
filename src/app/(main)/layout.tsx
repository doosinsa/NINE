import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { MobileContainer } from "@/components/layout/MobileContainer";
import { BottomNavigation } from "@/components/layout/BottomNavigation";
import { isAuthenticatedRequest } from "@/lib/server/auth";

export default async function MainLayout({ children }: { children: ReactNode }) {
  if (!(await isAuthenticatedRequest())) {
    redirect("/login");
  }

  return (
    <MobileContainer hasBottomNav>
      <div className="flex-1 w-full h-full">
        {children}
      </div>
      <BottomNavigation />
    </MobileContainer>
  );
}
