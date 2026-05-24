// @ts-nocheck — Deno edge function, not compiled by Node.js TypeScript
// Optimize Prompt edge function
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Per-category expert roles & enhancement focus
const CATEGORY_META: Record<string, { role: string; focus: string }> = {
  coding: {
    role: "senior software engineer",
    focus: "Specify the exact programming language and version, framework if relevant, expected inputs/outputs, error handling requirements, performance constraints, and whether the response should include runnable code, comments, and a usage example.",
  },
  creative: {
    role: "professional creative writer",
    focus: "Specify genre, narrative POV, tone, intended audience, approximate length, key themes or motifs, stylistic constraints (e.g. no clichés), and what emotional reaction the piece should evoke.",
  },
  research: {
    role: "expert research analyst",
    focus: "Specify the scope and depth of coverage, the level of technical detail, preferred citation style, output format (summary, bullet points, comparative table), and any caveats or counterarguments to address.",
  },
  business: {
    role: "senior business strategist and professional copywriter",
    focus: "Specify the target audience, communication channel (email, report, pitch deck, social post), desired tone (formal/persuasive/casual), key message or call-to-action, length constraints, and brand voice.",
  },
  general: {
    role: "expert AI assistant",
    focus: "Identify the user's core goal, inject missing context, define the desired output format, specify tone and audience, add relevant constraints, and ensure the prompt is fully self-contained.",
  },
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { prompt, category = "general" } = await req.json();
    if (!prompt || typeof prompt !== "string") {
      return new Response(JSON.stringify({ error: "Missing prompt" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const AI_API_KEY = Deno.env.get("AI_API_KEY") ?? Deno.env.get("LOVABLE_API_KEY");
    if (!AI_API_KEY) throw new Error("AI_API_KEY missing");

    const meta = CATEGORY_META[category] ?? CATEGORY_META.general;

    const system = `You are PromptPolish, an AI instruction optimizer that works exactly like the Promptly browser extension. Your job is to transform a user's short, vague, or poorly structured input into a single, detailed, AI-optimized prompt that large language models can act on immediately and with high precision.

HOW TO TRANSFORM THE PROMPT:

STEP 1 — DETECT INTENT
Identify what the user actually wants: the task type, domain (${category}), expected output, and any implied constraints or audience.

STEP 2 — ASSIGN AN EXPERT ROLE
Begin the optimized prompt with a role-assignment sentence: "Act as a ${meta.role}..." This primes the AI to respond with the right expertise, tone, and depth.

STEP 3 — INJECT MISSING CONTEXT & SPECIFICITY
Expand on the user's idea with the details they forgot to mention. ${meta.focus}

STEP 4 — STRUCTURE THE INSTRUCTION
Write the full, enhanced prompt as a single cohesive instruction using these professional prompt-engineering techniques, naturally embedded:
  • Role assignment at the opening ("Act as a...")
  • Clear task definition with concrete action verbs
  • Numbered or bulleted requirements when listing specs, steps, or deliverables
  • Output format specification (e.g. "Provide the response as a numbered list", "Return only the code block", "Write in 3 paragraphs")
  • Tone, audience, and style guidance where relevant
  • Constraints and quality criteria at the end (e.g. "Ensure the solution handles edge cases", "Keep the tone professional but approachable")

STEP 5 — VALIDATE
The final prompt must be:
  ✓ Self-contained — the AI receiving it needs zero follow-up to respond well
  ✓ Specific — no vague words like "good", "nice", "simple", "some"
  ✓ Unambiguous — one clear interpretation
  ✓ Actionable — starts with a role, ends with quality criteria

OUTPUT RULES (STRICT):
- Output ONLY the enhanced prompt. Nothing else.
- Do NOT include preamble like "Here is your optimized prompt:" or any explanation.
- Do NOT use markdown section headers (##, ###) or labels like "Role:", "Task:", "Context:".
- The output is a ready-to-use prompt the user can copy and paste directly into ChatGPT, Claude, Gemini, or any LLM.
- Preserve the user's original intent — never invent unrelated requirements.
- If the user's prompt is already well-formed, still enhance it with missing precision and structure.`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: system },
          { role: "user", content: prompt },
        ],
        temperature: 0.4,
      }),
    });

    if (!resp.ok) {
      if (resp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (resp.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please check your API quota." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await resp.text();
      console.error("Gateway error", resp.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const optimized = data.choices?.[0]?.message?.content ?? "";

    return new Response(JSON.stringify({ optimized }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("optimize-prompt error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
