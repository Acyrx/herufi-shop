"use client";

import { cn } from "@/lib/utils";
import { Loader2, MessageCircle, Send, Sparkles, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

/* ── types ──────────────────────────────────────────────────────────────── */
interface Msg {
  role: "user" | "bot";
  text: string;
  /** faq = static hardcoded FAQ  |  cache = learned from Supabase  |  ai = fresh Gemini call */
  source?: "faq" | "cache" | "ai";
}

interface Props {
  lang: "en" | "sw";
}

/* ── static content ─────────────────────────────────────────────────────── */
const WELCOME: Record<"en" | "sw", string> = {
  en: "👋 Hi! I'm **Herufi AI**. Ask me anything about the platform — pricing, features, how it works, or how to get started!",
  sw: "👋 Habari! Mimi ni **Herufi AI**. Niulize chochote kuhusu jukwaa — bei, vipengele, jinsi inavyofanya kazi, au jinsi ya kuanza!",
};

const QUICK: Record<"en" | "sw", string[]> = {
  en: [
    "Is Herufi free to use?",
    "Does it work offline?",
    "Can I manage multiple shops?",
    "What payment methods are supported?",
    "How does the AI work?",
    "How do I get started?",
  ],
  sw: [
    "Je, Herufi ni ya bure?",
    "Inafanya kazi bila internet?",
    "Ninaweza kusimamia maduka mengi?",
    "Njia zipi za malipo zinasaidia?",
    "AI inafanyaje kazi?",
    "Nianze vipi?",
  ],
};

const LIMIT_MSG: Record<"en" | "sw", string> = {
  en: "You've used your **2 AI questions** this month. Free FAQ answers still work! Try the questions above, or check the [FAQ section](#faq) on this page.",
  sw: "Umetumia **maswali yako 2 ya AI** mwezi huu. Majibu ya FAQ ya bure bado yanafanya kazi! Jaribu maswali hapo juu, au angalia [sehemu ya FAQ](#faq) kwenye ukurasa huu.",
};

const ERR_MSG: Record<"en" | "sw", string> = {
  en: "Sorry, something went wrong. Please try again.",
  sw: "Samahani, kuna hitilafu. Tafadhali jaribu tena.",
};

/* ── tiny markdown renderer ─────────────────────────────────────────────── */
function BotText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*\n]+\*\*|\[([^\]]+)\]\(([^)]+)\))/g);
  const nodes: React.ReactNode[] = [];
  let i = 0;
  while (i < parts.length) {
    const p = parts[i];
    if (!p) { i++; continue; }
    if (p.startsWith("**") && p.endsWith("**") && p.length > 4) {
      nodes.push(<strong key={i} className="font-semibold text-foreground">{p.slice(2, -2)}</strong>);
    } else if (p.startsWith("[")) {
      const m = p.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (m) nodes.push(<a key={i} href={m[2]} className="text-primary underline">{m[1]}</a>);
      else nodes.push(p);
    } else {
      nodes.push(p);
    }
    i++;
  }
  return <>{nodes}</>;
}

function BotBubble({ text }: { text: string }) {
  return (
    <div className="text-sm leading-relaxed space-y-1.5">
      {text.split("\n").filter(l => l !== "").map((line, i) => (
        <p key={i}><BotText text={line} /></p>
      ))}
    </div>
  );
}

/* ── component ──────────────────────────────────────────────────────────── */
export function LandingChatBot({ lang }: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiRemaining, setAiRemaining] = useState<number | null>(null);
  const [pulse, setPulse] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Pulse attention after 4s if not opened yet
  useEffect(() => {
    if (open) return;
    const t = setTimeout(() => setPulse(true), 4000);
    return () => clearTimeout(t);
  }, [open]);

  // Inject welcome message on first open
  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{ role: "bot", text: WELCOME[lang], source: "faq" }]);
    }
  }, [open]); // eslint-disable-line

  // Update welcome message language if user switches lang before chatting
  useEffect(() => {
    if (messages.length === 1 && messages[0].role === "bot") {
      setMessages([{ role: "bot", text: WELCOME[lang], source: "faq" }]);
    }
  }, [lang]); // eslint-disable-line

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(text?: string) {
    const q = (text ?? input).trim();
    if (!q || loading) return;

    setMessages(prev => [...prev, { role: "user", text: q }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/landing-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, lang }),
      });

      const data = await res.json();

      if (res.status === 429) {
        setMessages(prev => [...prev, {
          role: "bot",
          text: LIMIT_MSG[lang],
          source: "faq",
        }]);
        return;
      }

      if (typeof data.remaining === "number") {
        setAiRemaining(data.remaining);
      }

      setMessages(prev => [...prev, {
        role: "bot",
        text: data.answer ?? ERR_MSG[lang],
        source: data.source ?? "ai",
      }]);
    } catch {
      setMessages(prev => [...prev, { role: "bot", text: ERR_MSG[lang], source: "faq" }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }

  function clearChat() {
    setMessages([{ role: "bot", text: WELCOME[lang], source: "faq" }]);
    setAiRemaining(null);
  }

  const showQuick = messages.length <= 2 && !loading;

  return (
    <>
      {/* ── Floating trigger button ────────────────────────────────────── */}
      <button
        onClick={() => { setOpen(o => !o); setPulse(false); }}
        aria-label="Open Herufi AI chat"
        className={cn(
          "fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-white shadow-xl shadow-primary/35",
          "flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95",
          open && "rotate-90",
          pulse && !open && "animate-bounce"
        )}
      >
        {open ? <X size={22} /> : <MessageCircle size={24} />}
        {/* Unread dot when closed */}
        {!open && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-green-500 border-2 border-white flex items-center justify-center">
            <span className="text-[7px] font-bold">AI</span>
          </span>
        )}
      </button>

      {/* ── Chat panel ────────────────────────────────────────────────── */}
      <div
        className={cn(
          "fixed z-50 bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden",
          "transition-all duration-200 origin-bottom-right",
          open ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none",
          // Responsive positioning
          "bottom-24 right-4 left-4 sm:left-auto sm:right-6 sm:w-[380px]"
        )}
        style={{ height: "min(520px, calc(100dvh - 140px))" }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 bg-primary text-white shrink-0">
          <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
            <Sparkles size={16} className="text-white" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm leading-tight">Herufi AI</p>
            <p className="text-[10px] text-white/70">
              {lang === "sw" ? "Msaidizi wa biashara" : "Business assistant"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-[10px] text-white/80">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              {lang === "sw" ? "Hai" : "Online"}
            </span>
            {messages.length > 1 && (
              <button
                onClick={clearChat}
                title={lang === "sw" ? "Futa mazungumzo" : "Clear chat"}
                className="p-1 rounded-lg hover:bg-white/20 transition-colors"
              >
                <Trash2 size={13} className="text-white/70" />
              </button>
            )}
          </div>
        </div>

        {/* AI remaining banner */}
        {aiRemaining !== null && (
          <div className="px-3 py-1.5 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800/40 shrink-0">
            <p className="text-[10px] text-amber-700 dark:text-amber-400 text-center">
              {lang === "sw"
                ? `${aiRemaining} maswali ya AI yaliyobaki mwezi huu — FAQ & majibu yaliyohifadhiwa ni ya bure`
                : `${aiRemaining} AI question${aiRemaining !== 1 ? "s" : ""} left this month — FAQ & cached answers are always free`}
            </p>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={cn("flex gap-2", msg.role === "user" ? "justify-end" : "justify-start")}
            >
              {msg.role === "bot" && (
                <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles size={11} className="text-primary" />
                </div>
              )}
              <div
                className={cn(
                  "max-w-[84%] text-sm rounded-2xl px-3 py-2.5 leading-relaxed",
                  msg.role === "user"
                    ? "bg-primary text-white rounded-tr-sm"
                    : "bg-muted/80 text-foreground rounded-tl-sm border border-border/50"
                )}
              >
                {msg.role === "bot" ? (
                  <>
                    <BotBubble text={msg.text} />
                    {msg.source === "ai" && (
                      <span className="mt-1.5 flex items-center gap-1 text-[9px] text-muted-foreground">
                        <Sparkles size={9} />
                        {lang === "sw" ? "Imetumia tokeni ya AI" : "Used 1 AI token"}
                      </span>
                    )}
                    {msg.source === "cache" && (
                      <span className="mt-1.5 flex items-center gap-1 text-[9px] text-green-600 dark:text-green-500">
                        {/* database/recycle icon inline so no extra import */}
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><polyline points="23 20 23 14 17 14"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15"/></svg>
                        {lang === "sw" ? "Jibu lililohifadhiwa · Bure" : "Cached answer · Free"}
                      </span>
                    )}
                    {msg.source === "faq" && msg !== messages[0] && (
                      <span className="mt-1.5 block text-[9px] text-muted-foreground/60">
                        {lang === "sw" ? "Jibu la FAQ · Bure" : "FAQ answer · Free"}
                      </span>
                    )}
                  </>
                ) : (
                  msg.text
                )}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div className="flex gap-2 justify-start">
              <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Loader2 size={11} className="text-primary animate-spin" />
              </div>
              <div className="bg-muted/80 border border-border/50 rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick question chips */}
        {showQuick && (
          <div className="px-3 pt-1 pb-2 flex flex-wrap gap-1.5 shrink-0 border-t border-border/50">
            <p className="w-full text-[10px] text-muted-foreground/70 mb-0.5">
              {lang === "sw" ? "Maswali ya haraka:" : "Quick questions:"}
            </p>
            {QUICK[lang].slice(0, 4).map(q => (
              <button
                key={q}
                onClick={() => send(q)}
                disabled={loading}
                className="text-[11px] px-2.5 py-1.5 bg-primary/8 text-primary rounded-full border border-primary/20 hover:bg-primary/15 transition-colors disabled:opacity-50 leading-tight"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input bar */}
        <div className="px-3 py-3 border-t border-border shrink-0 bg-background/50">
          <div className="flex gap-2 items-center">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
              disabled={loading}
              placeholder={
                lang === "sw"
                  ? "Uliza swali lolote..."
                  : "Ask anything about Herufi..."
              }
              className="flex-1 text-sm bg-card border border-input rounded-xl px-3.5 py-2.5 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15 placeholder:text-muted-foreground/60 transition-all disabled:opacity-50"
            />
            <button
              onClick={() => send()}
              disabled={!input.trim() || loading}
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all",
                input.trim() && !loading
                  ? "bg-primary text-white hover:bg-primary/90 shadow-sm shadow-primary/25"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              )}
            >
              <Send size={15} />
            </button>
          </div>
          <p className="text-[9px] text-muted-foreground/50 text-center mt-1.5 select-none">
            {lang === "sw"
              ? "FAQ ni ya bure · Maswali ya AI: 2/mwezi kwa IP"
              : "FAQ is free · AI questions: 2/month per IP"}
          </p>
        </div>
      </div>
    </>
  );
}
