import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  BarChart3,
  Settings,
  ChevronLeft,
  Menu,
  PieChart,
  Monitor,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeSwitcher } from "./ThemeSwitcher";

const navigationItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Quick Log", href: "/quick-log", icon: Monitor },
  { label: "Task Logs", href: "/task-logs", icon: FileText },
  { label: "Reports", href: "/reports", icon: PieChart },
  { label: "Rankings", href: "/rankings", icon: BarChart3 },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const location = useLocation();

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div
      className={cn(
        "h-screen bg-sidebar transition-all duration-300 border-r border-sidebar-border flex flex-col",
        isOpen ? "w-64" : "w-20"
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
        {isOpen && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Monitor className="w-4 h-4 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sidebar-foreground text-sm">
                M.A.R.S
              </span>
              <span className="text-[10px] text-sidebar-foreground/60">
                Maintenance & Recording
              </span>
            </div>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="p-1 hover:bg-sidebar-accent rounded-lg transition-colors text-sidebar-foreground"
        >
          {isOpen ? (
            <ChevronLeft className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;

          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent"
              )}
              title={!isOpen ? item.label : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {isOpen && <span className="text-sm font-medium">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer with Theme Switcher */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center justify-center">
          <ThemeSwitcher />
        </div>
      </div>
    </div>
  );
}
