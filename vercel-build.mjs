#!/usr/bin/env node
// vercel-build.mjs
// Post-build: generates dist/client/index.html for Vercel static hosting.
// TanStack Start with shellComponent renders the full <html> from JS,
// so we emit the minimal "dehydration shell" it expects on the client.

import { readFileSync, writeFileSync, readdirSync } from "fs";
import { join } from "path";

const clientDir = "dist/client";
const assetsDir = join(clientDir, "assets");

// Find built CSS and JS entry from hashed filenames
const assets  = readdirSync(assetsDir);
const cssFile  = assets.find((f) => f.endsWith(".css"));

// The client entry is the index-*.js that is NOT the chunk file
const jsFiles  = assets.filter((f) => f.startsWith("index-") && f.endsWith(".js"));
// Pick the larger one — it's the real entry (the other may be a tiny stub)
const mainJs   = jsFiles.sort((a, b) => {
  const sa = readFileSync(join(assetsDir, a)).length;
  const sb = readFileSync(join(assetsDir, b)).length;
  return sb - sa;
})[0];

if (!mainJs) {
  console.error("Could not find built JS entry in dist/client/assets/");
  console.log("Assets found:", assets);
  process.exit(1);
}

console.log(`📦  CSS  : ${cssFile ? `/assets/${cssFile}` : "(none)"}`);
console.log(`📦  JS   : /assets/${mainJs}`);

// TanStack Start with shellComponent: RootShell renders the whole <html> tree.
// The client runtime calls StartClient which bootstraps into document.body directly.
// We must NOT include a <body> or <div id="root"> — the framework owns the DOM.
// We also inject window.__TSR_DEHYDRATED__ = {} so the invariant check passes
// (it just needs the key to exist, even empty, when there's no server-rendered state).
const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>PromptPolish \u2014 AI Prompt Optimizer</title>
    <meta name="description" content="Transform vague prompts into detailed, AI-optimized instructions. Ready to paste into ChatGPT, Claude, Gemini, and any LLM." />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    ${cssFile ? `<link rel="stylesheet" href="/assets/${cssFile}" />` : ""}
    <script>window.__TSR_DEHYDRATED__={}</script>
  </head>
  <body>
    <script type="module" src="/assets/${mainJs}"></script>
  </body>
</html>
`;

writeFileSync(join(clientDir, "index.html"), html, "utf-8");
console.log(`✅  Written dist/client/index.html`);
