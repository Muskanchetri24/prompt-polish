// @ts-nocheck — Deno edge function, not compiled by Node.js TypeScript
// Optimize Prompt edge function
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CATEGORY_GUIDE: Record<string, string> = {
  coding: "Specify language/framework, inputs, outputs, constraints, error handling, and ask for runnable code with brief explanation.",
  creative: "Specify genre, tone, POV, audience, length, structure, and stylistic constraints.",
  research: "Specify scope, depth, sources, format (bullet/table), and required citations or caveats.",
  business: "Specify audience, tone, goal, channel, length, call-to-action, and brand voice.",
  general: "Add explicit role, goal, context, constraints, format, and success criteria.",
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

    const guide = CATEGORY_GUIDE[category] ?? CATEGORY_GUIDE.general;

    const system = `You are an expert prompt engineer. Your job is to rewrite the user's rough, vague, or incomplete prompt into a polished, professional, and highly effective prompt that any LLM can act on immediately.

Category: ${category}
Category guidance: ${guide}

Rules:
- Write the optimized prompt as natural, flowing prose — NOT as a structured template with labels like "Role:", "Context:", "Task:", "Requirements:", "Output Format:", or "Constraints:".
- The output must read like a single, clear, confident instruction that a professional would write. It should be specific, actionable, and complete.
- Embed all necessary context, specificity, and intent naturally within the prose.
- Use numbered or bulleted lists ONLY if the task genuinely requires listing steps or options — not as structural filler.
- Do NOT add meta-commentary, preamble, labels, section headers, or explanatory notes.
- Preserve the user's original intent — do not invent unrelated requirements.
- Return ONLY the rewritten prompt. Nothing else.`;

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
