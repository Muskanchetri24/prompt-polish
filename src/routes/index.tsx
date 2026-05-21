import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Sparkles, Copy, Check, RefreshCw, Wand2, Loader2 } from "lucide-react";
import SkyBackground from "../components/SkyBackground";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "PromptPolish — Turn vague prompts into powerful ones" },
      {
        name: "description",
        content:
          "Free AI-powered prompt optimizer. Paste any vague or messy prompt and get a structured, effective version in seconds.",
      },
    ],
  }),
});

type Category = "general" | "coding" | "creative" | "research" | "business";

const CATEGORIES: { id: Category; label: string; emoji: string }[] = [
  { id: "general", label: "General", emoji: "✨" },
  { id: "coding", label: "Coding", emoji: "💻" },
  { id: "creative", label: "Creative", emoji: "🎨" },
  { id: "research", label: "Research", emoji: "🔬" },
  { id: "business", label: "Business", emoji: "💼" },
];

const EXAMPLES: Record<Category, string> = {
  general: "tell me about ai",
  coding: "make a python script that scrapes a website",
  creative: "write a story about a dragon",
  research: "explain quantum computing",
  business: "write an email to my boss asking for a raise",
};

function Index() {
  const [prompt, setPrompt] = useState("");
  const [category, setCategory] = useState<Category>("general");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const optimize = async () => {
    if (!prompt.trim() || loading) return;
    if (prompt.trim().length < 10) {
      setError("Please enter a prompt with more than 10 characters.");
      return;
    }
    if (prompt.trim().length > 2500) {
      setError("Prompt must be 2500 characters or fewer.");
      return;
    }
    setLoading(true);
    setError("");
    setResult("");
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
    setTimeout(() => setCopied(false), 1500);
  };

  const reset = () => {
    setPrompt("");
    setResult("");
    setError("");
  };

  const loadExample = () => setPrompt(EXAMPLES[category]);

  return (
    <div className="relative min-h-screen">
      {/* Animated sky background */}
      <SkyBackground />

      {/* Page content sits above the canvas */}
      <div className="relative z-10 mx-auto max-w-5xl px-4 py-12 sm:py-20">
        {/* Header */}
        <header className="text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/50 backdrop-blur-md px-3 py-1 text-xs font-medium text-indigo-800 mb-5 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            AI-powered prompt engineering
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-white drop-shadow-lg">
            Turn vague prompts into{" "}
            <span className="bg-gradient-to-r from-yellow-200 via-white to-indigo-200 bg-clip-text text-transparent">
              powerful ones
            </span>
          </h1>
          <p className="mt-4 text-base sm:text-lg text-white/85 max-w-2xl mx-auto drop-shadow">
            Paste a rough idea. Get a structured, specific, effective prompt — ready to send to any LLM.
          </p>
        </header>

        {/* Category tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategory(c.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                category === c.id
                  ? "bg-slate-900 text-white shadow-md"
                  : "bg-white text-slate-700 border border-slate-200 hover:border-slate-300"
              }`}
            >
              <span className="mr-1.5">{c.emoji}</span>
              {c.label}
            </button>
          ))}
        </div>

        {/* Input card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-indigo-100/50 border border-slate-200 overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-slate-700">Your prompt</label>
              <button
                onClick={loadExample}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Try an example →
              </button>
            </div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. write me something about marketing"
              rows={5}
              maxLength={2500}
              className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <div className="mt-2 flex items-center justify-between">
              <span className={`text-xs font-medium ${
                prompt.length > 2500 ? "text-red-500" :
                prompt.length >= 2300 ? "text-amber-500" :
                "text-slate-400"
              }`}>{prompt.length}/2500</span>
            </div>
            {prompt.trim().length > 0 && prompt.trim().length < 10 && (
              <p className="mt-2 text-xs font-medium text-red-600 flex items-center gap-1">
                <span>⚠️</span> Please enter a prompt with more than 10 characters.
              </p>
            )}
            {prompt.length > 2500 && (
              <p className="mt-2 text-xs font-medium text-red-600 flex items-center gap-1">
                <span>⚠️</span> Prompt must be 2500 characters or fewer.
              </p>
            )}
          </div>
          <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex flex-wrap gap-2 justify-end">
            {(result || prompt) && (
              <button
                onClick={reset}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-200 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Reset
              </button>
            )}
            <button
              onClick={optimize}
              disabled={!prompt.trim() || loading}
              className="inline-flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-200"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Optimizing…
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  Optimize Prompt
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="mt-6 bg-white rounded-2xl shadow-xl shadow-indigo-100/50 border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-indigo-50 to-fuchsia-50">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <h2 className="text-sm font-semibold text-slate-900">Optimized prompt</h2>
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                  {result.length.toLocaleString()} chars
                </span>
              </div>
              <button
                onClick={copy}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-white border border-slate-200 hover:border-slate-300 text-slate-700 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-green-600" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy
                  </>
                )}
              </button>
            </div>
            <div className="p-6 prose prose-slate prose-sm max-w-none prose-headings:font-semibold prose-headings:text-slate-900 prose-p:text-slate-700 prose-strong:text-slate-900 prose-li:text-slate-700">
              <ReactMarkdown>{result}</ReactMarkdown>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-16 text-center text-xs text-white/60 drop-shadow">
          Works with ChatGPT, Claude, Gemini, and any LLM
        </footer>
      </div>
    </div>
  );
}
