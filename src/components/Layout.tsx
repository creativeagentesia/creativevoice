import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { LanguageSwitcher } from "./LanguageSwitcher";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="pl-64">
        {/* Top Header with Language Switcher */}
        <div className="sticky top-0 z-30 flex h-14 items-center justify-end border-b border-border bg-background/80 backdrop-blur-sm px-6">
          <LanguageSwitcher />
        </div>
        <div className="min-h-screen">{children}</div>
      </main>
    </div>
  );
}
