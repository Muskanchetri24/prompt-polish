#!/usr/bin/env node
// vercel-build.mjs
// Runs after `vite build` to produce index.html in dist/client
// so Vercel can serve the app as a static SPA.

import { readFileSync, writeFileSync, readdirSync } from "fs";
import { join } from "path";

const clientDir = "dist/client";
const assetsDir = join(clientDir, "assets");

// Find the CSS and main JS entry from built assets
const assets = readdirSync(assetsDir);
const cssFile  = assets.find((f) => f.endsWith(".css"));
const mainJs   = assets.find((f) => f.startsWith("index-") && f.endsWith(".js"));

if (!cssFile || !mainJs) {
  console.error("Could not find built CSS or JS in dist/client/assets/");
  console.log("Assets found:", assets);
  process.exit(1);
}

console.log(`📦  CSS  : /assets/${cssFile}`);
console.log(`📦  JS   : /assets/${mainJs}`);

const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>PromptPolish — AI Prompt Optimizer</title>
    <meta name="description" content="Transform vague prompts into detailed, AI-optimized instructions. Ready to paste into ChatGPT, Claude, Gemini, and any LLM." />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="stylesheet" href="/assets/${cssFile}" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/assets/${mainJs}"></script>
  </body>
</html>
`;

writeFileSync(join(clientDir, "index.html"), html, "utf-8");
console.log(`✅  Written dist/client/index.html`);
