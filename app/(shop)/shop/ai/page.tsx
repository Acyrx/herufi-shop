"use client";

import { AIChat } from "@/components/ai/chat";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n/context";
import { createClient } from "@/lib/supabase/client";
import { cn, formatCurrency } from "@/lib/utils";
import {
  Camera,
  ImageIcon,
  Loader2,
  Lock,
  MessageSquare,
  Package,
  PenSquare,
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
  "I need rice in bulk — what do you have?",
  "What cooking oils are available?",
  "Show me products under TZS 5,000",
  "What's new in stock this week?",
  "Ninahitaji bidhaa za kupikia",
  "Ninaomba ulinganishe bei za sukari",
];

export default function CustomerAIPage() {
  const { lang } = useLang();
  const supabase = createClient();

  const [authReady, setAuthReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [tab, setTab] = useState<"chat" | "visual">("chat");

  // Visual search state
  const [preview, setPreview] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<{
    query: string;
    description: string;
    products: Product[];
  } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Chat session state
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [loadingSessions, setLoadingSessions] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setIsLoggedIn(!!user);
    setAuthReady(true);
    if (user) fetchSessions();
  }

  async function fetchSessions() {
    setLoadingSessions(true);
    const { data } = await supabase
      .from("chat_sessions")
      .select("id, title, updated_at")
      .eq("mode", "customer")
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

  function formatDate(iso: string) {
    const d = new Date(iso);
    const diffH = (Date.now() - d.getTime()) / 3600000;
    if (diffH < 24)
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (diffH < 48) return lang === "sw" ? "Jana" : "Yesterday";
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
      const res = await fetch("/api/ai/visual-search", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (data.error && !data.products?.length) {
        toast.error("Could not identify product in image");
      } else {
        setResults(data);
        if (data.products?.length === 0)
          toast.info("No matching products found");
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

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (!authReady) {
    return (
      <div className="-mx-4 -mt-8 -mb-20 h-[calc(100vh-4rem)] flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-primary" />
      </div>
    );
  }

  // ── Auth gate ────────────────────────────────────────────────────────────────
  if (!isLoggedIn) {
    return (
      <div className="-mx-4 -mt-8 -mb-20 h-[calc(100vh-4rem)] flex flex-col items-center justify-center gap-6 px-4 text-center animate-fade-in">
        <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Lock size={36} className="text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {lang === "sw" ? "Ingia Kwanza" : "Sign In Required"}
          </h1>
          <p className="text-muted-foreground mt-2 max-w-sm text-sm">
            {lang === "sw"
              ? "Unahitaji akaunti ya Herufi ili kutumia Msaidizi wa AI wa ununuzi."
              : "You need a Herufi account to use the AI Shopping Assistant and get personalised recommendations."}
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
        <Link
          href="/shop"
          className="text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          {lang === "sw"
            ? "Rudi Dukani bila akaunti →"
            : "Continue browsing without an account →"}
        </Link>
      </div>
    );
  }

  // ── Full page layout ─────────────────────────────────────────────────────────
  return (
    <div className="-mx-4 -mt-8 -mb-20 h-[calc(100vh-4rem)] flex overflow-hidden bg-background">
      {/* ── LEFT SIDEBAR ── */}
      <aside className="hidden lg:flex flex-col w-60 xl:w-64 shrink-0 border-r border-border bg-card/20">
        {/* New chat */}
        <div className="p-3 border-b border-border">
          <button
            onClick={() => {
              setActiveSessionId(null);
              setTab("chat");
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-lg transition-colors"
          >
            <PenSquare size={15} className="text-muted-foreground" />
            {lang === "sw" ? "Mazungumzo Mapya" : "New Chat"}
          </button>
        </div>

        {/* Tab buttons */}
        <div className="p-3 border-b border-border space-y-1">
          <button
            onClick={() => setTab("chat")}
            className={cn(
              "w-full flex items-center gap-2.5 px-2.5 py-2 text-xs rounded-lg transition-colors text-left",
              tab === "chat"
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <Search size={13} />
            {lang === "sw" ? "Tafuta kwa Maandishi" : "Text Chat"}
          </button>
          <button
            onClick={() => setTab("visual")}
            className={cn(
              "w-full flex items-center gap-2.5 px-2.5 py-2 text-xs rounded-lg transition-colors text-left",
              tab === "visual"
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <Camera size={13} />
            {lang === "sw" ? "Tafuta kwa Picha" : "Visual Search"}
          </button>
        </div>

        {/* Chat history */}
        <div className="flex-1 overflow-y-auto p-2">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-2 mt-1">
            {lang === "sw" ? "Historia" : "Chat History"}
          </p>
          {loadingSessions ? (
            Array(4)
              .fill(0)
              .map((_, i) => (
                <div
                  key={i}
                  className="h-9 bg-muted rounded-lg animate-pulse mb-1"
                />
              ))
          ) : sessions.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              <MessageSquare size={20} className="mx-auto mb-2 opacity-30" />
              {lang === "sw" ? "Hakuna mazungumzo bado" : "No chats yet"}
            </div>
          ) : (
            sessions.map((s) => (
              <div
                key={s.id}
                role="button"
                tabIndex={0}
                onClick={() => { setActiveSessionId(s.id); setTab("chat"); }}
                onKeyDown={e => { if (e.key === "Enter") { setActiveSessionId(s.id); setTab("chat"); } }}
                className={cn(
                  "w-full text-left px-2.5 py-2 rounded-lg transition-colors group flex items-start gap-2 mb-0.5 cursor-pointer",
                  activeSessionId === s.id && tab === "chat"
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
                  onClick={(e) => deleteSession(s.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:text-destructive transition-all shrink-0"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Powered by Herufi AI
          </div>
        </div>
      </aside>

      {/* ── MAIN AREA ── */}
      <div className="flex-1 min-w-0 overflow-hidden flex flex-col">
        {/* Mobile tab bar */}
        <div className="lg:hidden flex items-center gap-1 p-2 border-b border-border bg-card/50">
          <button
            onClick={() => {
              setActiveSessionId(null);
              setTab("chat");
            }}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <PenSquare size={15} />
          </button>
          <div className="flex gap-1 bg-muted p-0.5 rounded-lg ml-1">
            <button
              onClick={() => setTab("chat")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                tab === "chat"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground"
              )}
            >
              <Search size={12} />
              {lang === "sw" ? "Maandishi" : "Chat"}
            </button>
            <button
              onClick={() => setTab("visual")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                tab === "visual"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground"
              )}
            >
              <Camera size={12} />
              {lang === "sw" ? "Picha" : "Visual"}
            </button>
          </div>
        </div>

        {/* ── Chat tab ── */}
        {tab === "chat" && (
          <AIChat
            mode="customer"
            sessionId={activeSessionId}
            onNewSession={(id) => {
              fetchSessions();
              setActiveSessionId(id);
            }}
            title={
              lang === "sw" ? "Msaidizi wa Ununuzi" : "AI Shopping Assistant"
            }
            subtitle={
              lang === "sw"
                ? "Niambie unachohitaji — nitakusaidia kupata bidhaa bora kwa bei nzuri"
                : "Tell me what you need — I'll find the best products based on your preferences"
            }
            placeholder={
              lang === "sw"
                ? "Niambie unachohitaji..."
                : "Tell me what you're looking for..."
            }
            suggestions={CUSTOMER_SUGGESTIONS}
            className="flex-1"
          />
        )}

        {/* ── Visual search tab ── */}
        {tab === "visual" && (
          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-medium mb-3">
                  <Camera size={12} />
                  {lang === "sw" ? "Utafutaji wa Picha" : "Visual Search"}
                </div>
                <h2 className="text-lg font-bold text-foreground">
                  {lang === "sw"
                    ? "Pakia picha ya bidhaa"
                    : "Find products by photo"}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {lang === "sw"
                    ? "Herufi AI itachambua picha yako na kupata bidhaa zinazofanana"
                    : "Herufi AI will identify the product and find matching items in our catalog"}
                </p>
              </div>

              {/* Drop zone */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className="relative border-2 border-dashed border-border hover:border-primary/40 rounded-2xl transition-colors bg-card cursor-pointer"
                onClick={() => !preview && fileRef.current?.click()}
              >
                {!preview ? (
                  <div className="py-16 flex flex-col items-center gap-4 text-center px-4">
                    <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
                      <ImageIcon size={28} className="text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">
                        {lang === "sw"
                          ? "Buruta picha hapa"
                          : "Drag & drop a photo here"}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {lang === "sw"
                          ? "au bonyeza kuchagua picha"
                          : "or click to choose"}{" "}
                        · JPG, PNG, WEBP · max 5MB
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          fileRef.current?.click();
                        }}
                      >
                        <ImageIcon size={14} />
                        {lang === "sw" ? "Chagua Picha" : "Choose Image"}
                      </Button>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          fileRef.current?.click();
                        }}
                      >
                        <Camera size={14} />
                        {lang === "sw" ? "Piga Picha" : "Take Photo"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4">
                    <div className="relative inline-block">
                      <img
                        src={preview}
                        alt="Uploaded"
                        className="h-48 rounded-xl object-cover"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreview(null);
                          setResults(null);
                          if (fileRef.current) fileRef.current.value = "";
                        }}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-white rounded-full flex items-center justify-center shadow"
                      >
                        <X size={12} />
                      </button>
                    </div>
                    {searching && (
                      <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
                        <Loader2
                          size={16}
                          className="animate-spin text-primary"
                        />
                        {lang === "sw"
                          ? "Herufi AI inachambua picha yako..."
                          : "Herufi AI is analysing your image..."}
                      </div>
                    )}
                  </div>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>

              {/* Results */}
              {results && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-foreground">
                        {lang === "sw"
                          ? "Bidhaa Zinazofanana"
                          : "Matching Products"}
                      </h3>
                      {results.query && (
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {lang === "sw" ? "AI iliona:" : "AI identified:"}{" "}
                          <span className="text-foreground font-medium">
                            {results.query}
                          </span>
                        </p>
                      )}
                    </div>
                    <Badge
                      variant={
                        results.products.length > 0 ? "success" : "warning"
                      }
                    >
                      {results.products.length}{" "}
                      {lang === "sw" ? "zilizopatikana" : "found"}
                    </Badge>
                  </div>

                  {results.products.length === 0 ? (
                    <div className="py-12 text-center border border-border rounded-xl bg-card">
                      <Package
                        size={40}
                        className="mx-auto mb-3 text-muted-foreground opacity-30"
                      />
                      <p className="text-muted-foreground text-sm">
                        {lang === "sw"
                          ? "Hakuna bidhaa zinazofanana. Jaribu kutafuta kwa maandishi."
                          : "No matching products found. Try text search instead."}
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-4"
                        onClick={() => setTab("chat")}
                      >
                        <Search size={14} />
                        {lang === "sw"
                          ? "Tafuta kwa Maandishi"
                          : "Try Text Search"}
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
                              <img
                                src={p.image_url}
                                alt={p.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                            ) : (
                              <Package
                                size={28}
                                className="text-muted-foreground/30"
                              />
                            )}
                          </div>
                          <div className="p-3">
                            {p.category && (
                              <p className="text-[10px] text-muted-foreground">
                                {p.category.name}
                              </p>
                            )}
                            <p className="text-sm font-semibold line-clamp-2 group-hover:text-primary transition-colors mt-0.5">
                              {p.name}
                            </p>
                            <p className="text-base font-bold text-primary mt-1">
                              {formatCurrency(p.selling_price)}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              / {p.unit}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
