import { cn } from "@/lib/utils";
import { TrendingDown, TrendingUp } from "lucide-react";
import type { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: ReactNode;
  iconBg?: string;
  className?: string;
}

export function StatCard({ title, value, change, changeLabel, icon, iconBg = "bg-primary/10", className }: StatCardProps) {
  const isPositive = change !== undefined && change >= 0;

  return (
    <div className={cn("bg-card rounded-xl border border-border p-6 animate-fade-in", className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
          {change !== undefined && (
            <div className={cn("flex items-center gap-1 mt-2 text-xs font-medium", isPositive ? "text-green-600" : "text-red-500")}>
              {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              <span>{Math.abs(change).toFixed(1)}%</span>
              {changeLabel && <span className="text-muted-foreground">{changeLabel}</span>}
            </div>
          )}
        </div>
        <div className={cn("p-3 rounded-xl", iconBg)}>
          {icon}
        </div>
      </div>
    </div>
  );
}
