# ✨ PromptPolish

> **Turn vague prompts into powerful ones — instantly.**

PromptPolish is an AI-powered prompt engineering tool that takes rough, vague, or incomplete prompts and rewrites them into clear, specific, and highly effective instructions ready for any LLM (ChatGPT, Claude, Gemini, and more).

---

## 🖼️ Preview

A cinematic **typewriter intro scene** greets users on load, followed by a full-screen **photorealistic animated sky** background powered by GSAP Ken Burns animation. The app sits on top with glassmorphism-style cards.

---

## 🚀 Features

- **AI Prompt Optimization** — Rewrites prompts into clean, professional prose using Google Gemini
- **5 Prompt Categories** — General, Coding, Creative, Research, Business
- **Real-time Validation** — Character counter with warnings (10–2500 character limit)
- **One-click Copy** — Copy optimized prompt to clipboard instantly
- **Character Count** — Shows how many characters the optimized prompt contains
- **Cinematic Intro Scene** — Three.js + GSAP typewriter animation on first load
- **Animated Sky Background** — AI-generated photorealistic sky with GSAP Ken Burns motion
- **Fully Responsive** — Works across desktop, tablet, and mobile

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [TanStack Start](https://tanstack.com/start) (React 19 + Vite) |
| **Styling** | Tailwind CSS |
| **Routing** | TanStack Router (file-based) |
| **3D / Animation** | [Three.js](https://threejs.org/) + [GSAP](https://gsap.com/) |
| **Backend** | [Supabase Edge Functions](https://supabase.com/docs/guides/functions) (Deno runtime) |
| **AI Model** | Google Gemini (`google/gemini-3-flash-preview`) |
| **Package Manager** | npm |

---

## 📁 Project Structure

```
prompt-whisperer-469-main/
├── public/
│   └── sky-bg.png              # AI-generated sky background image
├── src/
│   ├── components/
│   │   ├── IntroScene.tsx      # Three.js + GSAP intro animation
│   │   └── SkyBackground.tsx  # Animated sky background (GSAP Ken Burns)
│   ├── integrations/
│   │   └── supabase/           # Supabase client, server, auth middleware
│   ├── routes/
│   │   ├── __root.tsx          # Root layout with intro scene gate
│   │   └── index.tsx           # Main application page
│   └── styles.css              # Global styles
├── supabase/
│   └── functions/
│       └── optimize-prompt/
│           └── index.ts        # Edge function: AI prompt optimization
├── package.json
├── vite.config.ts
└── README.md
```

---

## ⚙️ Getting Started

### Prerequisites

- **Node.js** v18+
- **npm** v9+
- A **Supabase** project with Edge Functions enabled
- An AI API key (for the Gemini gateway)

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd prompt-whisperer-469-main
npm install
```

### 2. Environment Variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

For the Edge Function, set secrets via Supabase CLI:

```bash
supabase secrets set AI_API_KEY=your-ai-api-key
```

### 3. Run Locally

```bash
npm run dev
```

Open [http://localhost:8080](http://localhost:8080)

### 4. Deploy Edge Function

```bash
supabase functions deploy optimize-prompt
```

---

## 🧠 How It Works

1. User pastes a rough prompt and selects a category
2. The app validates length (10–2500 characters)
3. On submit, the prompt is sent to the `optimize-prompt` Supabase Edge Function
4. The Edge Function calls the Gemini API with a carefully crafted system prompt that instructs the model to rewrite as **natural, professional prose** — no template headers like "Role:", "Context:", "Task:"
5. The optimized prompt is displayed with a character count and one-click copy button

---

## 🎨 Design Highlights

- **Intro Scene**: Three.js particle dust + ambient glow + GSAP typewriter effect with blinking cursor and progress bar
- **Sky Background**: AI-generated photorealistic cumulus cloud image animated with GSAP Ken Burns (scale + pan, no seam)
- **Glassmorphism UI**: White cards with `backdrop-blur` sitting over the sky
- **Header text**: White with `drop-shadow` for readability against the sky

---

## 📝 Prompt Optimization Rules

The AI is instructed to:

- ✅ Write as flowing, natural prose — no section headers
- ✅ Be specific and actionable
- ✅ Preserve the user's original intent
- ✅ Embed context naturally within the prose
- ❌ No "Role:", "Context:", "Task:" labels
- ❌ No meta-commentary or preamble

---

## 🔧 Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server on port 8080 |
| `npm run build` | Build production bundle |
| `npm run lint` | Run ESLint |

---

## 📄 License

MIT — feel free to use, modify, and distribute.

---

<p align="center">Built with ❤️ · Powered by Google Gemini · Animated with Three.js & GSAP</p>
