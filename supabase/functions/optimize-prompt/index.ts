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

    const system = `You are PromptPolish, an AI instruction optimizer. Your job is to transform a user's short, vague input into a highly detailed, extremely precise instruction.

CRITICAL DIRECTIVE: You must hide all evidence of prompt-engineering patterns. The final prompt must read as a fluid, natural, conversational English request.

DO NOT use robotic, templated phrasing such as:
- "Act as an expert..."
- "Your task is..."
- "Constraints:"
- "Output format:"
- "Tone and style:"

Instead, seamlessly weave the domain (${category}), the context, the constraints, and the output format into a natural narrative. 
Example of BAD (patterned): "Act as a chef. Your task is to write a recipe. Constraints: vegan. Output: bullet points."
Example of GOOD (natural): "I need a delicious vegan recipe that is easy to prepare. Please write it out clearly using bullet points for the ingredients and step-by-step instructions for the cooking process."

HOW TO TRANSFORM THE PROMPT:
1. Identify the core intent and missing context.
2. Weave in the expert perspective seamlessly without explicitly saying "Act as...".
3. Inject specific details, constraints, and quality criteria directly into the natural flow of the sentence.
4. Define the exact output format naturally.

OUTPUT RULES (STRICT):
- Output ONLY the enhanced prompt. Nothing else.
- Do NOT include preamble like "Here is your optimized prompt:".
- Do NOT use markdown section headers (##, ###) or labels of any kind.
- Preserve the user's original intent — never invent unrelated requirements.`;

    const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${AI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: system }]
        },
        contents: [
          { parts: [{ text: prompt }] }
        ],
        generationConfig: {
          temperature: 0.4
        }
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
    const optimized = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

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
