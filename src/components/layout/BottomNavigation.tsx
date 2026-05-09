"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Home, Briefcase, Search, Lightbulb } from "lucide-react";

export function BottomNavigation() {
  const pathname = usePathname();

  const tabs = [
    { name: "후보", href: "/candidates", icon: Home },
    { name: "보유", href: "/holdings", icon: Briefcase },
    { name: "검색", href: "/search", icon: Search },
    { name: "Discover", href: "/discover", icon: Lightbulb },
  ];

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[720px] bg-surface border-t border-border-color pb-[env(safe-area-inset-bottom)] z-50">
      <ul className="flex items-center justify-around h-16 px-2">
        {tabs.map((tab) => {
          const isActive = pathname?.startsWith(tab.href);
          const Icon = tab.icon;
          return (
            <li key={tab.name} className="flex-1">
              <Link
                href={tab.href}
                className={cn(
                  "flex flex-col items-center justify-center w-full h-full gap-1 transition-colors",
                  isActive ? "text-nine-primary font-semibold" : "text-nine-secondary"
                )}
              >
                <Icon size={24} className={isActive ? "opacity-100" : "opacity-70"} />
                <span className="text-[10px]">{tab.name}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
