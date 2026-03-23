import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  className?: string;
}

export function KPICard({
  title,
  value,
  icon: Icon,
  trend,
  trendUp,
  className,
}: KPICardProps) {
  return (
    <div
      className={cn(
        "bg-card rounded-lg p-6 border border-border shadow-sm hover:shadow-md transition-all hover:scale-105 duration-200",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          <p className="text-2xl md:text-3xl font-bold text-foreground">
            {value}
          </p>
          {trend && (
            <p
              className={cn(
                "text-xs mt-2 font-medium",
                trendUp ? "text-green-600" : "text-red-600"
              )}
            >
              {trend}
            </p>
          )}
        </div>
        <div className="p-3 rounded-lg bg-primary/10">
          <Icon className="w-6 h-6 text-primary" />
        </div>
      </div>
    </div>
  );
}
