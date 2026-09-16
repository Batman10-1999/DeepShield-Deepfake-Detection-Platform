import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  FileCheck2,
  History,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import logo from "@/assets/deepshield-logo.png";

const COLLAPSED_KEY = "deepshield.sidebar.collapsed";

const groups = [
  {
    label: "Overview",
    items: [{ icon: LayoutDashboard, label: "Dashboard", to: "/" as const }],
  },
  {
    label: "Records",
    items: [
      { icon: FileCheck2, label: "Verification Certificate", to: "/certificate" as const },
      { icon: History, label: "Analysis History", to: "/history" as const },
    ],
  },
  {
    label: "System",
    items: [{ icon: Settings, label: "Settings", to: "/settings" as const }],
  },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Restore after hydration so server and first client render match.
  useEffect(() => {
    setCollapsed(window.localStorage.getItem(COLLAPSED_KEY) === "1");
  }, []);

  const toggle = () => {
    setCollapsed((c) => {
      window.localStorage.setItem(COLLAPSED_KEY, c ? "0" : "1");
      return !c;
    });
  };

  return (
    <aside
      className={`sidebar-surface sticky top-0 hidden h-screen shrink-0 flex-col border-r border-border/70 transition-[width] duration-300 ease-out md:flex ${
        collapsed ? "w-[5.5rem]" : "w-[17rem]"
      }`}
    >
      {/* Logo */}
      <div className="flex flex-col items-center gap-2.5 px-4 pt-7 pb-6 text-center">
        <img
          src={logo}
          alt="DeepShield"
          className={`logo-glow object-contain transition-all duration-300 ${
            collapsed ? "h-10 w-10" : "h-[4.5rem] w-[4.5rem]"
          }`}
        />
        {!collapsed && (
          <div>
            <div className="brand-wordmark text-2xl leading-none">DeepShield</div>
            <div className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Trust Platform
            </div>
          </div>
        )}
      </div>

      {/* Collapse toggle */}
      <div className={`px-4 pb-4 flex ${collapsed ? "justify-center" : "justify-end"}`}>
        <button
          onClick={toggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-pressed={collapsed}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-sidebar-hover transition-colors"
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        {groups.map((group, gi) => (
          <div key={group.label} className={gi === 0 ? "" : "mt-5"}>
            {!collapsed && <div className="section-label px-3 pb-2">{group.label}</div>}
            <div className="flex flex-col gap-1">
              {group.items.map((it) => {
                const active = it.to === "/" ? pathname === "/" : pathname.startsWith(it.to);
                return (
                  <Link
                    key={it.to}
                    to={it.to}
                    title={collapsed ? it.label : undefined}
                    aria-current={active ? "page" : undefined}
                    className={`nav-item ${active ? "nav-item-active font-semibold" : ""} ${
                      collapsed ? "justify-center px-0" : ""
                    }`}
                  >
                    <it.icon
                      className="h-[18px] w-[18px] shrink-0"
                      strokeWidth={active ? 2.3 : 1.9}
                    />
                    {!collapsed && <span className="truncate">{it.label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
