"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";
import { AlertTriangle, Lightbulb, RefreshCw, Sparkles, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Insight {
  type: "trend" | "alert" | "suggestion";
  title: string;
  message: string;
}

const TYPE_CONFIG = {
  trend: { icon: TrendingUp, color: "text-green-600", bg: "bg-green-50 dark:bg-green-900/10 border-green-100 dark:border-green-900/30" },
  alert: { icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/30" },
  suggestion: { icon: Lightbulb, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30" },
};

export function AIInsights() {
  const { t } = useLang();
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchInsights(); }, []);

  async function fetchInsights(refresh = false) {
    if (refresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await fetch("/api/ai/insights");
      const data = await res.json();
      setInsights(data.insights ?? []);
    } catch {
      setInsights([{
        type: "suggestion",
        title: "AI Insights",
        message: "Could not load insights. Check your Gemini API key in .env.local.",
      }]);
    }

    setLoading(false);
    setRefreshing(false);
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Sparkles size={16} className="text-primary" />
            </div>
            <CardTitle>{t.dashboard.aiInsights}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/dashboard/ai" className="text-xs text-primary hover:underline">
              {t.dashboard.openAiAssistant} →
            </Link>
            <Button variant="ghost" size="sm" onClick={() => fetchInsights(true)} loading={refreshing}>
              <RefreshCw size={14} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="grid sm:grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid sm:grid-cols-3 gap-3">
            {insights.map((insight, i) => {
              const cfg = TYPE_CONFIG[insight.type] ?? TYPE_CONFIG.suggestion;
              const Icon = cfg.icon;
              return (
                <div key={i} className={cn("p-4 rounded-xl border", cfg.bg)}>
                  <div className={cn("flex items-center gap-2 mb-2", cfg.color)}>
                    <Icon size={15} />
                    <span className="text-xs font-semibold uppercase tracking-wide">{insight.title}</span>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">{insight.message}</p>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
