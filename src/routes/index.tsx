import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import {
  Sparkles, Copy, Check, RefreshCw, Wand2, Loader2,
  ArrowRight, ChevronRight, Zap, RotateCcw,
} from "lucide-react";
import SkyBackground from "../components/SkyBackground";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "PromptPolish — AI Prompt Optimizer" },
      {
        name: "description",
        content:
          "Transform vague prompts into detailed, AI-optimized instructions. Ready to paste into ChatGPT, Claude, Gemini, and any LLM.",
      },
    ],
  }),
});

type Category = "general" | "coding" | "creative" | "research" | "business";

const CATEGORIES: { id: Category; label: string; emoji: string }[] = [
  { id: "general",  label: "General",  emoji: "✨" },
  { id: "coding",   label: "Coding",   emoji: "💻" },
  { id: "creative", label: "Creative", emoji: "🎨" },
  { id: "research", label: "Research", emoji: "🔬" },
  { id: "business", label: "Business", emoji: "💼" },
];

const EXAMPLES: Record<Category, string> = {
  general:  "tell me about ai",
  coding:   "make a python script that scrapes a website",
  creative: "write a story about a dragon",
  research: "explain quantum computing",
  business: "write an email to my boss asking for a raise",
};

const ENHANCEMENTS = [
  { label: "Expert role",      icon: "🎭" },
  { label: "Intent detected",  icon: "🎯" },
  { label: "Context added",    icon: "📌" },
  { label: "Output format",    icon: "📋" },
  { label: "Quality criteria", icon: "⚡" },
];

function wordCount(t: string) {
  return t.trim().split(/\s+/).filter(Boolean).length;
}

// Animated typing dots
function TypingDots() {
  return (
    <span style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 6, height: 6, borderRadius: "50%",
            background: "rgba(255,255,255,0.7)",
            display: "inline-block",
            animation: `dotBounce 1.2s ${i * 0.2}s ease-in-out infinite`,
          }}
        />
      ))}
    </span>
  );
}

function Index() {
  const [prompt,   setPrompt]   = useState("");
  const [category, setCategory] = useState<Category>("general");
  const [result,   setResult]   = useState("");
  const [original, setOriginal] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [copied,   setCopied]   = useState(false);
  const [showOrig, setShowOrig] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to result smoothly when it appears
  useEffect(() => {
    if (result && resultRef.current) {
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
      setRevealed(false);
      setTimeout(() => setRevealed(true), 50);
    }
  }, [result]);

  const optimize = async () => {
    if (!prompt.trim() || loading) return;
    if (prompt.trim().length < 10) {
      setError("Please enter at least 10 characters.");
      return;
    }
    if (prompt.trim().length > 2500) {
      setError("Prompt must be 2500 characters or fewer.");
      return;
    }
    setLoading(true);
    setError("");
    setResult("");
    setOriginal(prompt.trim());
    setShowOrig(false);
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/optimize-prompt`;
      const r = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ prompt, category }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Failed to optimize");
      setResult(data.optimized);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const reset = () => {
    setPrompt("");
    setResult("");
    setOriginal("");
    setError("");
    setShowOrig(false);
    setRevealed(false);
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const improvePct = original && result
    ? Math.min(Math.round(((wordCount(result) - wordCount(original)) / Math.max(wordCount(original), 1)) * 100), 999)
    : 0;

  const charPct = (prompt.length / 2500) * 100;

  return (
    <>
      {/* Global keyframes */}
      <style>{`
        @keyframes dotBounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40%            { transform: scale(1.0); opacity: 1.0; }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        @keyframes pulse-ring {
          0%   { transform: scale(1);    opacity: 0.6; }
          100% { transform: scale(1.55); opacity: 0; }
        }
      `}</style>

      <div className="relative min-h-screen">
        <SkyBackground />

        <div className="relative z-10 mx-auto max-w-3xl px-4 py-12 sm:py-20">

          {/* ── Header ── */}
          <header className="text-center mb-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/20 backdrop-blur-md px-4 py-1.5 text-xs font-semibold text-white mb-6 shadow-lg shadow-black/10">
              <Zap className="w-3.5 h-3.5 text-yellow-300" />
              AI Prompt Optimizer · PromptPolish
            </div>
            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-white drop-shadow-xl leading-tight">
              From vague idea to{" "}
              <span
                style={{
                  background: "linear-gradient(90deg,#fde68a,#ffffff,#c7d2fe)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                AI-ready prompt
              </span>
            </h1>
            <p className="mt-4 text-base sm:text-lg text-white/75 max-w-lg mx-auto leading-relaxed drop-shadow">
              Type a rough idea. Get a polished, expert-crafted prompt ready to paste into any AI.
            </p>
          </header>

          {/* ── Category tabs ── */}
          <div className="flex flex-wrap justify-center gap-2 mb-5">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                onClick={() => setCategory(c.id)}
                style={{
                  transition: "all 0.2s",
                  fontFamily: "inherit",
                }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium ${
                  category === c.id
                    ? "bg-slate-900/90 text-white shadow-lg shadow-black/20 scale-105 border border-white/10"
                    : "bg-white/75 backdrop-blur text-slate-700 border border-white/60 hover:bg-white hover:scale-105 hover:shadow-md"
                }`}
              >
                <span>{c.emoji}</span>
                <span>{c.label}</span>
              </button>
            ))}
          </div>

          {/* ── Input card ── */}
          <div
            className="rounded-2xl overflow-hidden shadow-2xl shadow-black/20"
            style={{
              background: "rgba(255,255,255,0.92)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.7)",
            }}
          >
            <div className="p-5 sm:p-6">
              {/* Label row */}
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full inline-block"
                    style={{ background: loading ? "#f59e0b" : result ? "#10b981" : "#6366f1" }}
                  />
                  Your rough prompt
                </label>
                <button
                  onClick={() => setPrompt(EXAMPLES[category])}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold transition-colors flex items-center gap-0.5"
                >
                  Try example <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              {/* Textarea */}
              <textarea
                id="prompt-input"
                ref={textareaRef}
                value={prompt}
                onChange={(e) => { setPrompt(e.target.value); setError(""); }}
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") optimize();
                }}
                placeholder="e.g. write me something about marketing..."
                rows={5}
                maxLength={2500}
                style={{
                  resize: "none", width: "100%",
                  borderRadius: 12,
                  border: error ? "1.5px solid #f87171" : "1.5px solid #e2e8f0",
                  background: "#f8fafc",
                  padding: "12px 16px",
                  fontSize: 14, lineHeight: 1.65,
                  color: "#0f172a",
                  outline: "none",
                  transition: "border-color 0.2s, box-shadow 0.2s",
                  fontFamily: "inherit",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => { e.target.style.borderColor = "#6366f1"; e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.12)"; }}
                onBlur={(e)  => { e.target.style.borderColor = error ? "#f87171" : "#e2e8f0"; e.target.style.boxShadow = "none"; }}
              />

              {/* Char bar */}
              <div className="mt-2.5 flex items-center gap-3">
                <div className="flex-1 h-1 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    style={{
                      width: `${Math.min(charPct, 100)}%`,
                      height: "100%",
                      borderRadius: 999,
                      transition: "width 0.2s, background 0.3s",
                      background: charPct > 92 ? "#ef4444" : charPct > 80 ? "#f59e0b" : "#6366f1",
                    }}
                  />
                </div>
                <span className={`text-xs font-medium tabular-nums ${
                  prompt.length > 2500 ? "text-red-500" : prompt.length >= 2300 ? "text-amber-500" : "text-slate-400"
                }`}>
                  {prompt.length}/2500
                </span>
                <span className="text-xs text-slate-300 hidden sm:block">⌘↵</span>
              </div>

              {/* Inline validation */}
              {error && (
                <p className="mt-2 text-xs font-medium text-red-600 flex items-center gap-1.5">
                  <span>⚠️</span> {error}
                </p>
              )}
              {prompt.trim().length > 0 && prompt.trim().length < 10 && !error && (
                <p className="mt-2 text-xs text-amber-600 font-medium">
                  Add a bit more detail for best results.
                </p>
              )}
            </div>

            {/* Action bar */}
            <div
              className="px-5 sm:px-6 py-4 flex items-center justify-between gap-3"
              style={{ borderTop: "1px solid #f1f5f9", background: "#f8fafc" }}
            >
              <div className="flex items-center gap-2">
                {(result || prompt) && (
                  <button
                    onClick={reset}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-200 transition-all"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reset
                  </button>
                )}
              </div>
              <button
                id="enhance-btn"
                onClick={optimize}
                disabled={!prompt.trim() || loading || prompt.trim().length < 10}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "10px 22px",
                  borderRadius: 12,
                  fontSize: 14, fontWeight: 600,
                  color: "white",
                  background: loading
                    ? "linear-gradient(135deg,#7c3aed,#6d28d9)"
                    : "linear-gradient(135deg,#4f46e5 0%,#7c3aed 60%,#a855f7 100%)",
                  backgroundSize: "200% auto",
                  boxShadow: "0 4px 24px rgba(99,102,241,0.35)",
                  border: "none", cursor: loading || !prompt.trim() ? "not-allowed" : "pointer",
                  opacity: !prompt.trim() || prompt.trim().length < 10 ? 0.5 : 1,
                  transition: "all 0.2s",
                  fontFamily: "inherit",
                  position: "relative",
                  overflow: "hidden",
                }}
                onMouseEnter={(e) => { if (!loading) (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)"; }}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Enhancing</span>
                    <TypingDots />
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    Enhance Prompt
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* ── Loading skeleton ── */}
          {loading && (
            <div
              className="mt-5 rounded-2xl overflow-hidden"
              style={{
                background: "rgba(255,255,255,0.85)",
                backdropFilter: "blur(16px)",
                border: "1px solid rgba(255,255,255,0.6)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
              }}
            >
              <div
                style={{
                  height: 56,
                  background: "linear-gradient(120deg,#4338ca,#6d28d9,#7c3aed)",
                  display: "flex", alignItems: "center",
                  padding: "0 20px", gap: 12,
                }}
              >
                <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(255,255,255,0.15)" }} />
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <div style={{ width: 90, height: 8, borderRadius: 4, background: "rgba(255,255,255,0.2)" }} />
                  <div style={{ width: 130, height: 10, borderRadius: 4, background: "rgba(255,255,255,0.35)" }} />
                </div>
              </div>
              <div style={{ padding: 24 }}>
                {[95, 80, 88, 60].map((w, i) => (
                  <div key={i} style={{
                    height: 12, borderRadius: 6, marginBottom: 12,
                    width: `${w}%`,
                    background: "linear-gradient(90deg,#e2e8f0 25%,#f1f5f9 50%,#e2e8f0 75%)",
                    backgroundSize: "200% auto",
                    animation: `shimmer 1.5s ${i * 0.15}s linear infinite`,
                  }} />
                ))}
              </div>
            </div>
          )}

          {/* ── Result ── */}
          {result && (
            <div
              ref={resultRef}
              className="mt-5 rounded-2xl overflow-hidden"
              style={{
                background: "rgba(255,255,255,0.92)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255,255,255,0.7)",
                boxShadow: "0 12px 48px rgba(99,102,241,0.18), 0 2px 8px rgba(0,0,0,0.08)",
                opacity: revealed ? 1 : 0,
                transform: revealed ? "translateY(0)" : "translateY(14px)",
                transition: "opacity 0.5s ease, transform 0.5s ease",
              }}
            >
              {/* Header */}
              <div
                style={{
                  padding: "16px 20px",
                  background: "linear-gradient(120deg,#4338ca 0%,#6d28d9 55%,#7c3aed 100%)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {/* Animated sparkle icon */}
                    <div style={{ position: "relative", width: 34, height: 34 }}>
                      <div style={{
                        position: "absolute", inset: 0, borderRadius: 10,
                        background: "rgba(255,255,255,0.15)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <Sparkles style={{ width: 16, height: 16, color: "white" }} />
                      </div>
                      <div style={{
                        position: "absolute", inset: -3, borderRadius: 13,
                        border: "1.5px solid rgba(255,255,255,0.3)",
                        animation: "pulse-ring 2s ease-out infinite",
                      }} />
                    </div>
                    <div>
                      <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.55)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
                        PromptPolish Output
                      </p>
                      <p style={{ fontSize: 14, fontWeight: 700, color: "white", lineHeight: 1.2 }}>
                        Enhanced Prompt
                      </p>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {improvePct > 0 && (
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: 4,
                        background: "rgba(52,211,153,0.2)", color: "#6ee7b7",
                        border: "1px solid rgba(52,211,153,0.3)",
                        fontSize: 11, fontWeight: 700,
                        padding: "3px 10px", borderRadius: 999,
                      }}>
                        +{improvePct}% richer
                      </span>
                    )}
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", display: "none" }} className="sm:block">
                      {wordCount(result)}w
                    </span>
                    <button
                      id="copy-btn"
                      onClick={copy}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 6,
                        padding: "7px 14px", borderRadius: 8,
                        fontSize: 12, fontWeight: 600,
                        border: "1px solid",
                        cursor: "pointer",
                        transition: "all 0.2s",
                        fontFamily: "inherit",
                        ...(copied
                          ? { background: "rgba(52,211,153,0.2)", color: "#6ee7b7", borderColor: "rgba(52,211,153,0.35)" }
                          : { background: "rgba(255,255,255,0.15)", color: "white", borderColor: "rgba(255,255,255,0.2)" }),
                      }}
                    >
                      {copied
                        ? <><Check style={{ width: 13, height: 13 }} /> Copied!</>
                        : <><Copy style={{ width: 13, height: 13 }} /> Copy</>}
                    </button>
                  </div>
                </div>

                {/* Enhancement pills */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {ENHANCEMENTS.map((e) => (
                    <span
                      key={e.label}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 4,
                        fontSize: 10, fontWeight: 600,
                        padding: "2px 8px", borderRadius: 999,
                        background: "rgba(255,255,255,0.12)",
                        border: "1px solid rgba(255,255,255,0.2)",
                        color: "rgba(255,255,255,0.85)",
                      }}
                    >
                      {e.icon} {e.label}
                    </span>
                  ))}
                </div>
              </div>

              {/* Original prompt toggle */}
              {original && (
                <div style={{ borderBottom: "1px solid #f1f5f9", background: "#fafafa" }}>
                  <button
                    onClick={() => setShowOrig((v) => !v)}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", gap: 6,
                      padding: "10px 20px", background: "none", border: "none",
                      cursor: "pointer", fontSize: 12, fontWeight: 500, color: "#94a3b8",
                      fontFamily: "inherit", transition: "color 0.2s",
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#64748b"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#94a3b8"; }}
                  >
                    <RefreshCw style={{ width: 12, height: 12 }} />
                    {showOrig ? "Hide" : "Show"} original prompt
                    <ChevronRight style={{
                      width: 13, height: 13,
                      transform: showOrig ? "rotate(90deg)" : "rotate(0deg)",
                      transition: "transform 0.2s",
                    }} />
                  </button>
                  {showOrig && (
                    <div style={{
                      margin: "0 20px 12px",
                      padding: "10px 14px",
                      background: "#f1f5f9", borderRadius: 10,
                      border: "1px solid #e2e8f0",
                      fontSize: 13, color: "#64748b",
                      fontStyle: "italic", lineHeight: 1.6,
                    }}>
                      "{original}"
                    </div>
                  )}
                </div>
              )}

              {/* Prompt body */}
              <div style={{ padding: "24px 24px 20px" }}>
                <div
                  className="prose prose-slate prose-sm max-w-none"
                  style={{
                    fontSize: 15, lineHeight: 1.75, color: "#1e293b",
                  }}
                >
                  <ReactMarkdown>{result}</ReactMarkdown>
                </div>
              </div>

              {/* Footer CTA */}
              <div style={{
                padding: "12px 20px",
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
                borderTop: "1px solid #f1f5f9",
                background: "linear-gradient(90deg,#eef2ff,#f5f3ff)",
              }}>
                <p style={{ fontSize: 12, color: "#4f46e5", display: "flex", alignItems: "center", gap: 6 }}>
                  <span>✅</span>
                  <span><strong>Ready to use.</strong> Paste into ChatGPT, Claude, Gemini, or any AI.</span>
                </p>
                <button
                  onClick={copy}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 5, flexShrink: 0,
                    padding: "7px 14px", borderRadius: 8,
                    fontSize: 12, fontWeight: 600,
                    color: "#4f46e5",
                    background: "#e0e7ff",
                    border: "1px solid #c7d2fe",
                    cursor: "pointer", transition: "all 0.2s",
                    fontFamily: "inherit",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#c7d2fe"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#e0e7ff"; }}
                >
                  {copied
                    ? <><Check style={{ width: 12, height: 12 }} /> Copied</>
                    : <><Copy style={{ width: 12, height: 12 }} /> Copy prompt</>}
                </button>
              </div>
            </div>
          )}

          {/* ── Footer ── */}
          <footer className="mt-16 text-center">
            <p className="text-xs text-white/50 drop-shadow">
              Works with ChatGPT · Claude · Gemini · Llama · Mistral · and any LLM
            </p>
          </footer>
        </div>
      </div>
    </>
  );
}
