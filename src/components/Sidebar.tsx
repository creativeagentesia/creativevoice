import { Link, useLocation } from "react-router-dom";
import { Home, MessageSquare, Calendar, Settings, Mic } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

export function Sidebar() {
  const location = useLocation();
  const { t } = useTranslation();

  const navigation = [
    { name: t("nav.liveDemo"), href: "/", icon: Home },
    { name: t("nav.conversations"), href: "/conversations", icon: MessageSquare },
    { name: t("nav.reservations"), href: "/reservations", icon: Calendar },
    { name: t("nav.settings"), href: "/settings", icon: Settings },
  ];

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar border-r border-sidebar-border">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 px-6 border-b border-sidebar-border">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
            <Mic className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-sidebar-accent-foreground">Voice Agent</h1>
            <p className="text-xs text-sidebar-foreground">AI Receptionist</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                )}
              >
                <item.icon className={cn("h-5 w-5", isActive && "text-sidebar-primary")} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-sidebar-border p-4">
          <div className="rounded-lg bg-sidebar-accent/50 p-3">
            <p className="text-xs text-sidebar-foreground">
              {t("nav.poweredBy")} OpenAI Realtime API
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
