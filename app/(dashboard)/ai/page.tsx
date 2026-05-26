"use client";

import { AIChat } from "@/components/ai/chat";
import { useLang } from "@/lib/i18n/context";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  MessageSquare,
  Package,
  PenSquare,
  ShoppingCart,
  Sparkles,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Session {
  id: string;
  title: string;
  updated_at: string;
}

const OWNER_SUGGESTIONS = [
  "Which products are running low on stock?",
  "What were my top sellers this week?",
  "Which products are expiring soon?",
  "How is my revenue trending?",
  "What should I restock before the weekend?",
  "Show me slow-moving products",
  "Bidhaa gani zinauzwa vizuri zaidi?",
  "Ninaweza kupata faida zaidi vipi?",
];

const QUICK_ACTIONS = [
  {
    icon: Package,
    label: "Stock Status",
    prompt: "Give me a full stock status report — what's low, what's expiring, and what needs immediate attention?",
  },
  {
    icon: ShoppingCart,
    label: "Order Analysis",
    prompt: "Analyze my recent orders. What patterns do you see? Which payment methods are most common?",
  },
  {
    icon: TrendingUp,
    label: "Revenue Insights",
    prompt: "Give me a revenue breakdown and tell me what's driving growth or decline in my business.",
  },
  {
    icon: BarChart3,
    label: "Best & Worst",
    prompt: "Which products are my best sellers and which are slowest moving? What should I do about the slow ones?",
  },
];

export default function OwnerAIPage() {
  const { lang } = useLang();
  const supabase = createClient();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  async function fetchSessions() {
    setLoadingSessions(true);
    const { data } = await supabase
      .from("chat_sessions")
      .select("id, title, updated_at")
      .eq("mode", "owner")
      .order("updated_at", { ascending: false })
      .limit(40);
    setSessions(data ?? []);
    setLoadingSessions(false);
  }

  async function deleteSession(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    await supabase.from("chat_sessions").delete().eq("id", id);
    setSessions(prev => prev.filter(s => s.id !== id));
    if (activeSessionId === id) setActiveSessionId(null);
    toast.success("Chat deleted");
  }

  function handleNewSession(id: string) {
    fetchSessions();
    setActiveSessionId(id);
  }

  function handleQuickAction(prompt: string) {
    setActiveSessionId(null);
    setPendingPrompt(null);
    // slight delay so messages clear before new prompt fires
    setTimeout(() => setPendingPrompt(prompt), 50);
  }

  function formatDate(iso: string) {
    const d = new Date(iso);
    const diffH = (Date.now() - d.getTime()) / 3600000;
    if (diffH < 24) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (diffH < 48) return lang === "sw" ? "Jana" : "Yesterday";
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  }

  return (
    // Escape dashboard main's padding → true full-page layout
    <div className="-mx-4 md:-mx-6 -mt-4 md:-mt-6 -mb-20 md:-mb-6 flex h-[calc(100vh-4rem)] overflow-hidden bg-background">

      {/* ── LEFT SIDEBAR ── */}
      <aside className="hidden lg:flex flex-col w-60 xl:w-64 shrink-0 border-r border-border bg-card/20">

        {/* New chat */}
        <div className="p-3 border-b border-border">
          <button
            onClick={() => { setActiveSessionId(null); setPendingPrompt(null); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-lg transition-colors"
          >
            <PenSquare size={15} className="text-muted-foreground" />
            {lang === "sw" ? "Mazungumzo Mapya" : "New Chat"}
          </button>
        </div>

        {/* Quick actions */}
        <div className="p-3 border-b border-border">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
            {lang === "sw" ? "Vitendo vya Haraka" : "Quick Actions"}
          </p>
          <div className="space-y-0.5">
            {QUICK_ACTIONS.map(action => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  onClick={() => handleQuickAction(action.prompt)}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors text-left"
                >
                  <Icon size={13} className="shrink-0" />
                  {action.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Session history */}
        <div className="flex-1 overflow-y-auto p-2">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-2 mt-1">
            {lang === "sw" ? "Historia ya Mazungumzo" : "Chat History"}
          </p>
          {loadingSessions ? (
            Array(5).fill(0).map((_, i) => (
              <div key={i} className="h-9 bg-muted rounded-lg animate-pulse mb-1" />
            ))
          ) : sessions.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              <MessageSquare size={20} className="mx-auto mb-2 opacity-30" />
              {lang === "sw" ? "Hakuna mazungumzo bado" : "No chats yet"}
            </div>
          ) : (
            sessions.map(s => (
              <div
                key={s.id}
                role="button"
                tabIndex={0}
                onClick={() => { setActiveSessionId(s.id); setPendingPrompt(null); }}
                onKeyDown={e => { if (e.key === "Enter") { setActiveSessionId(s.id); setPendingPrompt(null); } }}
                className={cn(
                  "w-full text-left px-2.5 py-2 rounded-lg transition-colors group flex items-start gap-2 mb-0.5 cursor-pointer",
                  activeSessionId === s.id
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-muted text-foreground"
                )}
              >
                <Sparkles size={11} className="shrink-0 mt-0.5 opacity-40" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate leading-snug">{s.title}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{formatDate(s.updated_at)}</p>
                </div>
                <button
                  onClick={e => deleteSession(s.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:text-destructive transition-all shrink-0"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Powered by Gemini AI
          </div>
        </div>
      </aside>

      {/* ── MAIN CHAT ── */}
      <div className="flex-1 min-w-0 overflow-hidden flex flex-col">
        {/* Mobile: session controls */}
        <div className="lg:hidden flex items-center gap-2 px-3 py-2 border-b border-border bg-card/50">
          <button
            onClick={() => { setActiveSessionId(null); setPendingPrompt(null); }}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <PenSquare size={13} />
            {lang === "sw" ? "Mpya" : "New"}
          </button>
          <div className="flex gap-1 ml-auto overflow-x-auto">
            {QUICK_ACTIONS.slice(0, 2).map(a => (
              <button
                key={a.label}
                onClick={() => handleQuickAction(a.prompt)}
                className="shrink-0 px-2.5 py-1 text-[10px] bg-muted rounded-full border border-border text-muted-foreground hover:text-foreground transition-colors"
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>

        <AIChat
          mode="owner"
          sessionId={activeSessionId}
          onNewSession={handleNewSession}
          initialPrompt={pendingPrompt}
          onInitialPromptSent={() => setPendingPrompt(null)}
          title={lang === "sw" ? "Herufi Business AI" : "Herufi Business AI"}
          subtitle={
            lang === "sw"
              ? "Msaidizi wako wa biashara ana data ya moja kwa moja ya duka lako"
              : "Your AI assistant has live access to your business data"
          }
          placeholder={
            lang === "sw" ? "Uliza kuhusu biashara yako..." : "Ask about your business..."
          }
          suggestions={OWNER_SUGGESTIONS}
          className="flex-1"
        />
      </div>
    </div>
  );
}
