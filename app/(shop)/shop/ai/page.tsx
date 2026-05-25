"use client";

import { AIChat } from "@/components/ai/chat";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n/context";
import { createClient } from "@/lib/supabase/client";
import { cn, formatCurrency } from "@/lib/utils";
import {
  Camera,
  Clock,
  ImageIcon,
  Loader2,
  Lock,
  MessageSquare,
  Package,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  selling_price: number;
  quantity: number;
  image_url?: string;
  unit: string;
  description?: string;
  category?: { name: string };
}

interface Session {
  id: string;
  title: string;
  updated_at: string;
}

const CUSTOMER_SUGGESTIONS = [
  "I need rice in bulk, what do you have?",
  "What cooking oils are available?",
  "Show me products under TZS 5,000",
  "Do you have any expiring products at discount?",
  "Ninahitaji bidhaa za kupikia",
  "Ninaomba ulinganishe bei za sukari",
];

export default function CustomerAIPage() {
  const { t, lang } = useLang();
  const supabase = createClient();
  const [authReady, setAuthReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [tab, setTab] = useState<"chat" | "visual">("chat");
  const [preview, setPreview] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<{ query: string; description: string; products: Product[] } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser();
    setIsLoggedIn(!!user);
    setAuthReady(true);
    if (user) fetchSessions();
  }

  async function fetchSessions() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("chat_sessions")
      .select("id, title, updated_at")
      .eq("mode", "customer")
      .order("updated_at", { ascending: false })
      .limit(20);
    setSessions(data ?? []);
  }

  async function deleteSession(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    await supabase.from("chat_sessions").delete().eq("id", id);
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (activeSessionId === id) setActiveSessionId(null);
    toast.success("Chat deleted");
  }

  function formatDate(iso: string) {
    const d = new Date(iso);
    const now = new Date();
    const diffHours = (now.getTime() - d.getTime()) / (1000 * 60 * 60);
    if (diffHours < 24) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (diffHours < 48) return lang === "sw" ? "Jana" : "Yesterday";
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  }

  async function handleImageUpload(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }

    const url = URL.createObjectURL(file);
    setPreview(url);
    setSearching(true);
    setResults(null);

    try {
      const fd = new FormData();
      fd.append("image", file);

      const res = await fetch("/api/ai/visual-search", { method: "POST", body: fd });
      const data = await res.json();

      if (data.error && !data.products?.length) {
        toast.error("Could not identify product in image");
      } else {
        setResults(data);
        if (data.products?.length === 0) {
          toast.info("No matching products found in catalog");
        }
      }
    } catch {
      toast.error("Visual search failed. Please try again.");
    }

    setSearching(false);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleImageUpload(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleImageUpload(file);
  }

  // Auth loading
  if (!authReady) {
    return (
      <div className="max-w-4xl mx-auto flex items-center justify-center min-h-[60vh]">
        <Loader2 size={28} className="animate-spin text-primary" />
      </div>
    );
  }

  // Not logged in — show gate
  if (!isLoggedIn) {
    return (
      <div className="max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center gap-6 animate-fade-in">
        <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Lock size={36} className="text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {lang === "sw" ? "Ingia Kwanza" : "Sign In Required"}
          </h1>
          <p className="text-muted-foreground mt-2 max-w-sm">
            {lang === "sw"
              ? "Unahitaji akaunti ya Herufi ili kutumia Msaidizi wa AI wa ununuzi."
              : "You need a Herufi account to use the AI Shopping Assistant."}
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/login">
            <Button>
              <Sparkles size={14} />
              {lang === "sw" ? "Ingia" : "Sign In"}
            </Button>
          </Link>
          <Link href="/signup">
            <Button variant="outline">
              {lang === "sw" ? "Unda Akaunti" : "Create Account"}
            </Button>
          </Link>
        </div>
        <p className="text-xs text-muted-foreground">
          {lang === "sw"
            ? "Au endelea kutazama bidhaa bila akaunti"
            : "Or continue browsing products without an account"}
          {" · "}
          <Link href="/shop" className="text-primary hover:underline">
            {lang === "sw" ? "Rudi Dukani" : "Back to Shop"}
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-4">
          <Sparkles size={14} />
          {lang === "sw" ? "Inavyotumia Gemini AI" : "Powered by Gemini AI"}
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          {lang === "sw" ? "Msaidizi wa Ununuzi wa AI" : "AI Shopping Assistant"}
        </h1>
        <p className="text-muted-foreground mt-2">
          {lang === "sw"
            ? "Uliza bidhaa unazohitaji au pakia picha ili kutafuta bidhaa zinazofanana"
            : "Ask for what you need or upload a photo to find matching products"}
        </p>
      </div>

      {/* Tab switcher + history toggle */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-1 bg-muted p-1 rounded-xl">
          <button
            onClick={() => setTab("chat")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === "chat" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Search size={15} />
            {lang === "sw" ? "Tafuta kwa Maandishi" : "Text Search"}
          </button>
          <button
            onClick={() => setTab("visual")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === "visual" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Camera size={15} />
            {lang === "sw" ? "Tafuta kwa Picha" : "Visual Search"}
          </button>
        </div>

        {sessions.length > 0 && (
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Clock size={13} />
            {lang === "sw" ? "Historia" : "History"} ({sessions.length})
          </button>
        )}
      </div>

      {/* Session history panel */}
      {showHistory && sessions.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-3 space-y-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {lang === "sw" ? "Mazungumzo ya Awali" : "Previous Chats"}
            </span>
            <button
              onClick={() => { setActiveSessionId(null); setShowHistory(false); }}
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              <Plus size={11} />
              {lang === "sw" ? "Mpya" : "New chat"}
            </button>
          </div>
          {sessions.map((s) => (
            <button
              key={s.id}
              onClick={() => { setActiveSessionId(s.id); setShowHistory(false); setTab("chat"); }}
              className={cn(
                "w-full text-left px-3 py-2 rounded-lg transition-colors group flex items-center gap-2",
                activeSessionId === s.id ? "bg-primary/10 text-primary" : "hover:bg-muted"
              )}
            >
              <MessageSquare size={12} className="shrink-0 opacity-50" />
              <span className="flex-1 text-xs truncate">{s.title}</span>
              <span className="text-[10px] text-muted-foreground shrink-0">{formatDate(s.updated_at)}</span>
              <button
                onClick={(e) => deleteSession(s.id, e)}
                className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:text-destructive transition-all"
              >
                <Trash2 size={11} />
              </button>
            </button>
          ))}
        </div>
      )}

      {/* Chat Tab */}
      {tab === "chat" && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden" style={{ height: "calc(100vh - 22rem)" }}>
          <AIChat
            mode="customer"
            sessionId={activeSessionId}
            onNewSession={(id) => { fetchSessions(); setActiveSessionId(id); }}
            title={lang === "sw" ? "Msaidizi wa Ununuzi" : "Shopping Assistant"}
            subtitle={lang === "sw" ? "Niambie unachohitaji — nitakusaidia kupata bidhaa bora" : "Tell me what you need — I'll help you find the best products"}
            placeholder={lang === "sw" ? "Niambie unachohitaji..." : "Tell me what you're looking for..."}
            suggestions={CUSTOMER_SUGGESTIONS}
            className="h-full"
          />
        </div>
      )}

      {/* Visual Search Tab */}
      {tab === "visual" && (
        <div className="space-y-6">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="relative border-2 border-dashed border-border hover:border-primary/40 rounded-2xl transition-colors bg-card"
          >
            {!preview ? (
              <div className="py-16 flex flex-col items-center gap-4 text-center px-4">
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
                  <ImageIcon size={28} className="text-muted-foreground" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">
                    {lang === "sw" ? "Pakia picha ya bidhaa" : "Upload a product photo"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {lang === "sw" ? "Buruta picha hapa au bonyeza kuchagua" : "Drag & drop or click to select"} · JPG, PNG, WEBP · max 5MB
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button onClick={() => fileRef.current?.click()} variant="outline">
                    <ImageIcon size={14} />
                    {lang === "sw" ? "Chagua Picha" : "Choose Image"}
                  </Button>
                  <Button onClick={() => fileRef.current?.click()}>
                    <Camera size={14} />
                    {lang === "sw" ? "Piga Picha" : "Take Photo"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-4">
                <div className="relative inline-block">
                  <img src={preview} alt="Uploaded" className="h-48 rounded-xl object-cover" />
                  <button
                    onClick={() => { setPreview(null); setResults(null); if (fileRef.current) fileRef.current.value = ""; }}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-white rounded-full flex items-center justify-center"
                  >
                    <X size={12} />
                  </button>
                </div>
                {searching && (
                  <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
                    <Loader2 size={16} className="animate-spin text-primary" />
                    {lang === "sw" ? "Gemini AI inachambua picha yako..." : "Gemini AI is analyzing your image..."}
                  </div>
                )}
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
          </div>

          {results && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-foreground">
                    {lang === "sw" ? "Bidhaa Zinazofanana" : "Matching Products"}
                  </h3>
                  {results.description && (
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {lang === "sw" ? "Gemini iliona:" : "AI identified:"} <span className="text-foreground font-medium">{results.query}</span>
                    </p>
                  )}
                </div>
                <Badge variant={results.products.length > 0 ? "success" : "warning"}>
                  {results.products.length} {lang === "sw" ? "zilizopatikana" : "found"}
                </Badge>
              </div>

              {results.products.length === 0 ? (
                <div className="py-12 text-center border border-border rounded-xl bg-card">
                  <Package size={40} className="mx-auto mb-3 text-muted-foreground opacity-30" />
                  <p className="text-muted-foreground text-sm">
                    {lang === "sw"
                      ? "Hakuna bidhaa zinazofanana zilizopatikana. Jaribu kutafuta kwa maandishi."
                      : "No matching products found. Try text search instead."}
                  </p>
                  <Button size="sm" variant="outline" className="mt-4" onClick={() => setTab("chat")}>
                    <Search size={14} />
                    {lang === "sw" ? "Tafuta kwa Maandishi" : "Try Text Search"}
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {results.products.map((p) => (
                    <Link
                      key={p.id}
                      href={`/shop/${p.id}`}
                      className="group bg-card border border-border rounded-xl overflow-hidden hover:border-primary/40 hover:shadow-md transition-all"
                    >
                      <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden">
                        {p.image_url ? (
                          <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        ) : (
                          <Package size={28} className="text-muted-foreground/30" />
                        )}
                      </div>
                      <div className="p-3">
                        {p.category && <p className="text-[10px] text-muted-foreground">{p.category.name}</p>}
                        <p className="text-sm font-semibold line-clamp-2 group-hover:text-primary transition-colors mt-0.5">{p.name}</p>
                        <p className="text-base font-bold text-primary mt-1">{formatCurrency(p.selling_price)}</p>
                        <p className="text-[10px] text-muted-foreground">/ {p.unit}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
