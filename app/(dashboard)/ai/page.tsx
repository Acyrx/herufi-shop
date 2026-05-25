"use client";

import { AIChat } from "@/components/ai/chat";
import { useLang } from "@/lib/i18n/context";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { BarChart3, MessageSquare, Package, Plus, ShoppingCart, Sparkles, TrendingUp, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Session {
  id: string;
  title: string;
  updated_at: string;
}

const OWNER_SUGGESTIONS = [
  "Which products are running low on stock?",
  "What were my top selling products this week?",
  "Which products are expiring soon?",
  "How is my revenue trending?",
  "What should I restock before the weekend?",
  "Show me slow-moving products",
  "Bidhaa gani zinauzwa vizuri?",
  "Ninaweza kupata faida zaidi vipi?",
];

const QUICK_ACTIONS = [
  { icon: Package, label: "Stock Status", prompt: "Give me a full stock status report — what's low, what's expiring, and what needs immediate attention?" },
  { icon: ShoppingCart, label: "Order Analysis", prompt: "Analyze my recent orders. What patterns do you see? Which payment methods are most common?" },
  { icon: TrendingUp, label: "Revenue Insights", prompt: "Give me a revenue breakdown and tell me what's driving growth or decline." },
  { icon: BarChart3, label: "Best & Worst", prompt: "Which products are my best sellers and which are the slowest moving? What should I do about the slow ones?" },
];

export default function OwnerAIPage() {
  const { lang } = useLang();
  const supabase = createClient();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [loadingSessions, setLoadingSessions] = useState(true);

  useEffect(() => { fetchSessions(); }, []);

  async function fetchSessions() {
    setLoadingSessions(true);
    const { data } = await supabase
      .from("chat_sessions")
      .select("id, title, updated_at")
      .eq("mode", "owner")
      .order("updated_at", { ascending: false })
      .limit(30);
    setSessions(data ?? []);
    setLoadingSessions(false);
  }

  async function deleteSession(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    await supabase.from("chat_sessions").delete().eq("id", id);
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (activeSessionId === id) setActiveSessionId(null);
    toast.success("Chat deleted");
  }

  function handleNewSession(id: string) {
    fetchSessions();
    setActiveSessionId(id);
  }

  function startNewChat() {
    setActiveSessionId(null);
  }

  function formatDate(iso: string) {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    if (diffHours < 24) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (diffHours < 48) return "Yesterday";
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-4 animate-fade-in">
      {/* Session history sidebar */}
      <div className="hidden lg:flex flex-col w-64 shrink-0 bg-card border border-border rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between p-3 border-b border-border">
          <span className="text-sm font-semibold text-foreground">
            {lang === "sw" ? "Mazungumzo" : "Chat History"}
          </span>
          <button
            onClick={startNewChat}
            className="flex items-center gap-1 text-xs text-primary hover:bg-primary/10 px-2 py-1 rounded-lg transition-colors"
          >
            <Plus size={12} />
            {lang === "sw" ? "Mpya" : "New"}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {loadingSessions ? (
            Array(4).fill(0).map((_, i) => (
              <div key={i} className="h-12 bg-muted rounded-lg animate-pulse" />
            ))
          ) : sessions.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              <MessageSquare size={24} className="mx-auto mb-2 opacity-30" />
              {lang === "sw" ? "Hakuna mazungumzo bado" : "No chats yet"}
            </div>
          ) : (
            sessions.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSessionId(s.id)}
                className={cn(
                  "w-full text-left px-3 py-2.5 rounded-lg transition-colors group flex items-start gap-2",
                  activeSessionId === s.id
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-muted text-foreground"
                )}
              >
                <Sparkles size={12} className="shrink-0 mt-0.5 opacity-50" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{s.title}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{formatDate(s.updated_at)}</p>
                </div>
                <button
                  onClick={(e) => deleteSession(s.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:text-destructive transition-all"
                >
                  <Trash2 size={11} />
                </button>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col gap-4 min-w-0">
        {!activeSessionId && (
          <div>
            <h2 className="text-2xl font-bold">
              {lang === "sw" ? "Msaidizi wa Biashara wa AI" : "AI Business Assistant"}
            </h2>
            <p className="text-muted-foreground text-sm">
              {lang === "sw"
                ? "Uliza maswali yoyote kuhusu biashara yako — hisa, maagizo, mapato, na zaidi."
                : "Ask anything about your business — stock movement, orders, revenue, and more."}
            </p>
          </div>
        )}

        {!activeSessionId && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  onClick={() => {
                    const textarea = document.querySelector<HTMLTextAreaElement>("textarea");
                    if (textarea) {
                      const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")?.set;
                      setter?.call(textarea, action.prompt);
                      textarea.dispatchEvent(new Event("input", { bubbles: true }));
                      textarea.focus();
                    }
                  }}
                  className="flex items-center gap-2 p-3 bg-card border border-border rounded-xl hover:border-primary/40 hover:bg-primary/5 transition-all text-left group"
                >
                  <Icon size={16} className="text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                  <span className="text-xs font-medium text-foreground">{action.label}</span>
                </button>
              );
            })}
          </div>
        )}

        <div className="flex-1 bg-card border border-border rounded-2xl overflow-hidden min-h-0">
          <AIChat
            mode="owner"
            sessionId={activeSessionId}
            onNewSession={handleNewSession}
            title={lang === "sw" ? "Herufi Business AI" : "Herufi Business AI"}
            subtitle={lang === "sw" ? "Msaidizi wako wa biashara ana data ya moja kwa moja" : "Your assistant has live access to your business data"}
            placeholder={lang === "sw" ? "Uliza kuhusu biashara yako..." : "Ask about your business..."}
            suggestions={OWNER_SUGGESTIONS}
            className="h-full"
          />
        </div>
      </div>
    </div>
  );
}
