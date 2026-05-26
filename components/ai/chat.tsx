"use client";

import { createClient } from "@/lib/supabase/client";
import { cn, formatCurrency } from "@/lib/utils";
import {
  ArrowRight,
  ArrowUp,
  Check,
  Copy,
  Loader2,
  Package,
  Sparkles,
  User,
  X,
} from "lucide-react";
import Link from "next/link";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";

// ── Types ────────────────────────────────────────────────────────────────────

export interface Message {
  role: "user" | "model";
  parts: [{ text: string }];
}

interface ProductPreview {
  id: string;
  name: string;
  selling_price: number;
  quantity: number;
  image_url?: string;
  unit: string;
  description?: string;
  category?: { name: string };
}

interface AIChatProps {
  mode: "owner" | "customer";
  sessionId?: string | null;
  onNewSession?: (id: string) => void;
  placeholder?: string;
  suggestions?: string[];
  className?: string;
  title?: string;
  subtitle?: string;
  initialPrompt?: string | null;
  onInitialPromptSent?: () => void;
}

// ── Markdown renderer ────────────────────────────────────────────────────────

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*\n]+\*\*|\*[^*\n]+\*|`[^`\n]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4)
      return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2)
      return <em key={i}>{part.slice(1, -1)}</em>;
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2)
      return <code key={i} className="bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded text-xs font-mono">{part.slice(1, -1)}</code>;
    return part;
  });
}

function MarkdownBlock({ text, isStreaming }: { text: string; isStreaming?: boolean }) {
  if (!text && isStreaming) {
    return <span className="inline-block w-0.5 h-4 bg-current ml-0.5 animate-pulse align-middle" />;
  }

  const blocks = text.split(/\n\n+/);
  return (
    <div className="space-y-2">
      {blocks.map((block, i) => {
        const lines = block.split("\n");

        // Pure bullet list
        const bulletLines = lines.filter(l => /^[-*•] /.test(l.trim()));
        if (bulletLines.length > 0 && bulletLines.length >= lines.filter(Boolean).length * 0.7) {
          return (
            <ul key={i} className="list-disc ml-5 space-y-0.5">
              {bulletLines.map((l, j) => (
                <li key={j}>{renderInline(l.trim().replace(/^[-*•] /, ""))}</li>
              ))}
            </ul>
          );
        }

        // Pure numbered list
        const numberedLines = lines.filter(l => /^\d+\. /.test(l.trim()));
        if (numberedLines.length > 0 && numberedLines.length >= lines.filter(Boolean).length * 0.7) {
          return (
            <ol key={i} className="list-decimal ml-5 space-y-0.5">
              {numberedLines.map((l, j) => (
                <li key={j}>{renderInline(l.trim().replace(/^\d+\. /, ""))}</li>
              ))}
            </ol>
          );
        }

        // Headers
        if (block.startsWith("### ")) return <p key={i} className="font-semibold">{renderInline(block.slice(4))}</p>;
        if (block.startsWith("## ")) return <p key={i} className="font-bold">{renderInline(block.slice(3))}</p>;
        if (block.startsWith("# ")) return <p key={i} className="font-bold">{renderInline(block.slice(2))}</p>;

        // Mixed content
        if (lines.some(l => /^[-*•\d] /.test(l.trim()))) {
          return (
            <div key={i} className="space-y-0.5">
              {lines.filter(Boolean).map((l, j) => {
                if (/^[-*•] /.test(l.trim()))
                  return <div key={j} className="flex gap-2"><span className="text-muted-foreground shrink-0">•</span><span>{renderInline(l.trim().replace(/^[-*•] /, ""))}</span></div>;
                if (/^\d+\. /.test(l.trim()))
                  return <div key={j} className="flex gap-2"><span className="text-muted-foreground shrink-0">{l.match(/^\d+/)?.[0]}.</span><span>{renderInline(l.trim().replace(/^\d+\. /, ""))}</span></div>;
                return <p key={j}>{renderInline(l)}</p>;
              })}
            </div>
          );
        }

        // Regular paragraph
        return (
          <p key={i} className="leading-relaxed">
            {lines.filter(Boolean).map((line, j) => (
              <Fragment key={j}>
                {renderInline(line)}
                {j < lines.filter(Boolean).length - 1 && <br />}
              </Fragment>
            ))}
          </p>
        );
      })}
      {isStreaming && (
        <span className="inline-block w-0.5 h-4 bg-primary ml-0.5 animate-pulse align-middle" />
      )}
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export function AIChat({
  mode,
  sessionId,
  onNewSession,
  placeholder,
  suggestions = [],
  className,
  title,
  subtitle,
  initialPrompt,
  onInitialPromptSent,
}: AIChatProps) {
  const supabase = createClient();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  // Product catalog for customer mode
  const [catalog, setCatalog] = useState<ProductPreview[]>([]);
  // Product detail sidebar
  const [sidebarProduct, setSidebarProduct] = useState<ProductPreview | null>(null);

  const activeSessionId = useRef<string | null>(sessionId ?? null);
  const initialSentRef = useRef<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load product catalog once (customer mode)
  useEffect(() => {
    if (mode !== "customer") return;
    supabase
      .from("products")
      .select("id, name, selling_price, quantity, image_url, unit, description, category:categories(name)")
      .eq("is_active", true)
      .gt("quantity", 0)
      .limit(200)
      .then(({ data }) => setCatalog((data as unknown as ProductPreview[]) ?? []));
  }, [mode]);

  // Detect products mentioned in completed AI messages
  const productDetections = useMemo(() => {
    if (mode !== "customer" || catalog.length === 0) return {} as Record<number, ProductPreview[]>;
    const result: Record<number, ProductPreview[]> = {};
    messages.forEach((msg, i) => {
      if (streaming && i === messages.length - 1) return; // skip incomplete
      if (msg.role !== "model" || msg.parts[0].text.length < 20) return;
      const lower = msg.parts[0].text.toLowerCase();
      const found = catalog
        .filter(p => p.name.length > 3 && lower.includes(p.name.toLowerCase()))
        .slice(0, 5);
      if (found.length > 0) result[i] = found;
    });
    return result;
  }, [messages, catalog, mode, streaming]);

  // Load / clear session
  useEffect(() => {
    activeSessionId.current = sessionId ?? null;
    initialSentRef.current = null;
    if (sessionId) {
      loadSessionMessages(sessionId);
    } else {
      setMessages([]);
    }
  }, [sessionId]);

  // Auto-send initial prompt (quick actions)
  useEffect(() => {
    if (
      initialPrompt &&
      initialPrompt !== initialSentRef.current &&
      messages.length === 0 &&
      !streaming
    ) {
      initialSentRef.current = initialPrompt;
      onInitialPromptSent?.();
      const t = setTimeout(() => send(initialPrompt), 80);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPrompt, messages.length, streaming]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function loadSessionMessages(sid: string) {
    setLoadingHistory(true);
    const { data } = await supabase
      .from("chat_messages")
      .select("role, content")
      .eq("session_id", sid)
      .order("created_at", { ascending: true });
    if (data) {
      setMessages(data.map(m => ({ role: m.role as "user" | "model", parts: [{ text: m.content }] })));
    }
    setLoadingHistory(false);
  }

  async function ensureSession(firstMessage: string): Promise<string | null> {
    if (activeSessionId.current) return activeSessionId.current;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const t = firstMessage.length > 60 ? firstMessage.slice(0, 60) + "…" : firstMessage;
    const { data, error } = await supabase
      .from("chat_sessions")
      .insert({ user_id: user.id, mode, title: t })
      .select("id")
      .single();
    if (error || !data) return null;
    activeSessionId.current = data.id;
    onNewSession?.(data.id);
    return data.id;
  }

  async function persistMessage(sid: string | null, role: "user" | "model", content: string) {
    if (!sid) return;
    await supabase.from("chat_messages").insert({ session_id: sid, role, content });
  }

  async function touchSession(sid: string | null) {
    if (!sid) return;
    await supabase.from("chat_sessions").update({ updated_at: new Date().toISOString() }).eq("id", sid);
  }

  async function send(text?: string) {
    const userText = (text ?? input).trim();
    if (!userText || streaming) return;

    const userMsg: Message = { role: "user", parts: [{ text: userText }] };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setStreaming(true);

    const sid = await ensureSession(userText);
    await persistMessage(sid, "user", userText);

    const modelMsg: Message = { role: "model", parts: [{ text: "" }] };
    setMessages([...updated, modelMsg]);

    let fullResponse = "";
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updated, mode, sessionId: sid }),
      });
      if (!res.ok || !res.body) throw new Error("Failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullResponse += decoder.decode(value, { stream: true });
        setMessages(prev => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: "model", parts: [{ text: fullResponse }] };
          return copy;
        });
      }
    } catch {
      fullResponse = "Sorry, I couldn't process that. Please try again.";
      setMessages(prev => {
        const copy = [...prev];
        copy[copy.length - 1] = { role: "model", parts: [{ text: fullResponse }] };
        return copy;
      });
    }

    await persistMessage(sid, "model", fullResponse);
    await touchSession(sid);
    setStreaming(false);
    inputRef.current?.focus();
  }

  async function copyMessage(text: string, idx: number) {
    await navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  const lastIdx = messages.length - 1;

  return (
    <>
      {/* ── Chat panel ── */}
      <div className={cn("flex flex-col flex-1 min-h-0 bg-background", className)}>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {loadingHistory ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 size={24} className="animate-spin text-primary" />
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center px-4 py-10">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Sparkles size={26} className="text-primary" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-1">{title ?? "AI Assistant"}</h2>
              <p className="text-muted-foreground text-sm text-center max-w-sm mb-8">
                {subtitle ?? "Ask me anything"}
              </p>
              {suggestions.length > 0 && (
                <div className="w-full max-w-2xl grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {suggestions.slice(0, 6).map(s => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="text-left px-4 py-3 text-sm bg-card border border-border rounded-xl hover:border-primary/40 hover:bg-primary/5 transition-all text-foreground leading-snug"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={cn("flex gap-3", msg.role === "user" ? "justify-end" : "justify-start")}
                >
                  {msg.role === "model" && (
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Sparkles size={15} className="text-primary" />
                    </div>
                  )}

                  <div className={cn("min-w-0", msg.role === "user" ? "max-w-[80%]" : "flex-1")}>
                    {msg.role === "user" ? (
                      <div className="bg-primary text-white rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap">
                        {msg.parts[0].text}
                      </div>
                    ) : (
                      <div className="group relative">
                        <div className="text-sm text-foreground">
                          <MarkdownBlock
                            text={msg.parts[0].text}
                            isStreaming={streaming && i === lastIdx}
                          />
                        </div>

                        {/* Copy button */}
                        {msg.parts[0].text && !streaming && (
                          <button
                            onClick={() => copyMessage(msg.parts[0].text, i)}
                            className="absolute -top-1 right-0 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-muted text-muted-foreground"
                          >
                            {copiedIdx === i ? <Check size={13} className="text-primary" /> : <Copy size={13} />}
                          </button>
                        )}

                        {/* Product cards (customer mode) */}
                        {productDetections[i] && productDetections[i].length > 0 && (
                          <div className="flex gap-2 mt-3 overflow-x-auto pb-1 -mx-1 px-1">
                            {productDetections[i].map(p => (
                              <button
                                key={p.id}
                                onClick={() => setSidebarProduct(p)}
                                className="shrink-0 w-24 bg-card border border-border rounded-xl overflow-hidden hover:border-primary/50 hover:shadow-md transition-all text-left group/card"
                              >
                                <div className="w-full h-16 bg-muted flex items-center justify-center overflow-hidden">
                                  {p.image_url ? (
                                    <img
                                      src={p.image_url}
                                      alt={p.name}
                                      className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-200"
                                    />
                                  ) : (
                                    <Package size={18} className="text-muted-foreground/30" />
                                  )}
                                </div>
                                <div className="p-1.5">
                                  <p className="text-[10px] font-semibold text-foreground line-clamp-2 leading-tight group-hover/card:text-primary transition-colors">
                                    {p.name}
                                  </p>
                                  <p className="text-[10px] text-primary font-bold mt-0.5">
                                    {formatCurrency(p.selling_price)}
                                  </p>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {msg.role === "user" && (
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0 mt-0.5">
                      <User size={14} className="text-white" />
                    </div>
                  )}
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          )}
          {messages.length === 0 && <div ref={bottomRef} />}
        </div>

        {/* Suggestion chips when chatting */}
        {messages.length > 0 && suggestions.length > 0 && !streaming && (
          <div className="border-t border-border/50 px-4 pt-3 pb-1">
            <div className="max-w-3xl mx-auto flex gap-2 overflow-x-auto pb-1">
              {suggestions.slice(0, 4).map(s => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="shrink-0 px-3 py-1.5 text-xs bg-muted hover:bg-accent text-muted-foreground hover:text-foreground rounded-full border border-border transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input bar */}
        <div className="p-4 bg-card/30 border-t border-border shrink-0">
          <div className="max-w-3xl mx-auto">
            <div className="flex gap-3 items-end bg-card rounded-2xl border border-input focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 px-4 py-3 transition-all">
              <textarea
                ref={inputRef}
                rows={1}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder ?? "Message AI..."}
                disabled={streaming || loadingHistory}
                className="flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50 max-h-40"
                style={{ height: "auto" }}
                onInput={e => {
                  const t = e.currentTarget;
                  t.style.height = "auto";
                  t.style.height = Math.min(t.scrollHeight, 160) + "px";
                }}
              />
              <button
                onClick={() => send()}
                disabled={!input.trim() || streaming}
                className={cn(
                  "h-9 w-9 rounded-xl flex items-center justify-center transition-all shrink-0",
                  input.trim() && !streaming
                    ? "bg-primary text-white hover:bg-primary/90 shadow-sm"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                )}
              >
                {streaming ? <Loader2 size={15} className="animate-spin" /> : <ArrowUp size={15} />}
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground text-center mt-2 select-none">
              Enter to send · Shift+Enter for new line
            </p>
          </div>
        </div>
      </div>

      {/* ── Product detail sidebar ── */}
      {sidebarProduct && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px]"
            onClick={() => setSidebarProduct(null)}
          />
          {/* Panel */}
          <div className="fixed inset-y-0 right-0 z-50 w-72 sm:w-80 bg-card border-l border-border shadow-2xl flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
              <span className="font-semibold text-sm text-foreground">Product Details</span>
              <button
                onClick={() => setSidebarProduct(null)}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {/* Image */}
              <div className="w-full aspect-square bg-muted flex items-center justify-center overflow-hidden">
                {sidebarProduct.image_url ? (
                  <img
                    src={sidebarProduct.image_url}
                    alt={sidebarProduct.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Package size={56} className="text-muted-foreground/20" />
                )}
              </div>

              <div className="p-4 space-y-3">
                {sidebarProduct.category && (
                  <span className="text-xs font-semibold text-primary uppercase tracking-wide">
                    {sidebarProduct.category.name}
                  </span>
                )}
                <h3 className="font-bold text-foreground text-lg leading-tight">
                  {sidebarProduct.name}
                </h3>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold text-primary">
                    {formatCurrency(sidebarProduct.selling_price)}
                  </span>
                  <span className="text-sm text-muted-foreground">/ {sidebarProduct.unit}</span>
                </div>

                {sidebarProduct.description && (
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {sidebarProduct.description}
                  </p>
                )}

                <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
                  <span
                    className={cn(
                      "w-2 h-2 rounded-full",
                      sidebarProduct.quantity > 10
                        ? "bg-green-500"
                        : sidebarProduct.quantity > 0
                        ? "bg-amber-500"
                        : "bg-red-500"
                    )}
                  />
                  {sidebarProduct.quantity > 0
                    ? `${sidebarProduct.quantity} ${sidebarProduct.unit} in stock`
                    : "Out of stock"}
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="p-4 border-t border-border shrink-0">
              <Link
                href={`/shop/${sidebarProduct.id}`}
                onClick={() => setSidebarProduct(null)}
                className="flex items-center justify-center gap-2 w-full h-11 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                View in Shop
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </>
      )}
    </>
  );
}
