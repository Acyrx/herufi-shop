"use client";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { ArrowUp, Bot, Loader2, Sparkles, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export interface Message {
  role: "user" | "model";
  parts: [{ text: string }];
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
}

export function AIChat({
  mode,
  sessionId,
  onNewSession,
  placeholder,
  suggestions = [],
  className,
  title,
  subtitle,
}: AIChatProps) {
  const supabase = createClient();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const activeSessionId = useRef<string | null>(sessionId ?? null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    activeSessionId.current = sessionId ?? null;
    if (sessionId) {
      loadSessionMessages(sessionId);
    } else {
      setMessages([]);
    }
  }, [sessionId]);

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
      setMessages(
        data.map((m) => ({
          role: m.role as "user" | "model",
          parts: [{ text: m.content }],
        }))
      );
    }
    setLoadingHistory(false);
  }

  async function ensureSession(firstMessage: string): Promise<string | null> {
    if (activeSessionId.current) return activeSessionId.current;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const sessionTitle = firstMessage.length > 60
      ? firstMessage.slice(0, 60) + "…"
      : firstMessage;

    const { data, error } = await supabase
      .from("chat_sessions")
      .insert({ user_id: user.id, mode, title: sessionTitle })
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
    await supabase
      .from("chat_sessions")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", sid);
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
        body: JSON.stringify({ messages: updated, mode }),
      });

      if (!res.ok || !res.body) throw new Error("Failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullResponse += decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: "model", parts: [{ text: fullResponse }] };
          return copy;
        });
      }
    } catch {
      fullResponse = "Sorry, I couldn't process that. Please try again.";
      setMessages((prev) => {
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

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      {(title || subtitle) && (
        <div className="flex items-center gap-3 p-4 border-b border-border bg-card/50">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Sparkles size={18} className="text-primary" />
          </div>
          <div>
            {title && <p className="font-semibold text-foreground">{title}</p>}
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <div className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Gemini AI
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loadingHistory ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 size={24} className="animate-spin text-primary" />
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-4 py-8">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Sparkles size={32} className="text-primary" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-foreground">{title ?? "AI Assistant"}</p>
              <p className="text-sm text-muted-foreground mt-1">{subtitle ?? "Ask me anything"}</p>
            </div>
            {suggestions.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center max-w-md mt-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="px-3 py-1.5 text-xs bg-muted hover:bg-muted/80 text-foreground rounded-full border border-border transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={cn("flex gap-3", msg.role === "user" ? "flex-row-reverse" : "flex-row")}>
              <div
                className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                  msg.role === "user" ? "bg-primary text-white" : "bg-muted text-foreground"
                )}
              >
                {msg.role === "user" ? <User size={14} /> : <Bot size={14} />}
              </div>
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap",
                  msg.role === "user"
                    ? "bg-primary text-white rounded-tr-sm"
                    : "bg-muted text-foreground rounded-tl-sm"
                )}
              >
                {msg.parts[0].text || (streaming && i === messages.length - 1 ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : "")}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border bg-card/50">
        {messages.length > 0 && suggestions.length > 0 && !streaming && (
          <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
            {suggestions.slice(0, 3).map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="shrink-0 px-2.5 py-1 text-xs bg-muted hover:bg-muted/80 text-muted-foreground rounded-full border border-border transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder ?? "Type a message..."}
            disabled={streaming || loadingHistory}
            className="flex-1 resize-none rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 max-h-32"
            style={{ height: "auto" }}
            onInput={(e) => {
              const t = e.currentTarget;
              t.style.height = "auto";
              t.style.height = Math.min(t.scrollHeight, 128) + "px";
            }}
          />
          <Button
            onClick={() => send()}
            disabled={!input.trim() || streaming}
            size="sm"
            className="h-10 w-10 p-0 rounded-xl shrink-0"
          >
            {streaming ? <Loader2 size={16} className="animate-spin" /> : <ArrowUp size={16} />}
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground text-center mt-2">
          Press Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
