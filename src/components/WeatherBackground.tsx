import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { useWeather, type WeatherCondition, type DayPhase } from "../hooks/useWeather";
import WeatherCanvas from "./WeatherCanvas";

// ─── Which photorealistic base image to use ───────────────────────────────────
function getBaseImage(phase: DayPhase, isNight: boolean, condition: WeatherCondition): string | null {
  // Fully opaque photo sky only for clear/partly-cloudy/sunny daytime scenes
  const isClear = ["sunny","clear","partly-cloudy"].includes(condition);
  if (isNight || phase === "midnight") return "/sky-night.png";
  if (phase === "dusk" || phase === "dawn") return "/sky-dusk.png";
  if (isClear) return "/sky-day.png";
  return null; // overcast/rain etc → gradient only
}

// ─── Photo opacity: clear skies show full photo; heavy weather fades it out ──
function getPhotoOpacity(condition: WeatherCondition, phase: DayPhase, isNight: boolean): number {
  if (isNight || phase === "midnight") return 0.92;
  if (phase === "dusk" || phase === "dawn") return 0.88;
  if (["sunny","clear"].includes(condition)) return 0.96;
  if (condition === "partly-cloudy") return 0.80;
  if (condition === "windy") return 0.65;
  if (condition === "cloudy") return 0.30;
  return 0; // rain/storm/snow/fog → gradient only
}

// ─── Gradient fallback palette (top → mid → bottom) ──────────────────────────
const SKY_PALETTES: Record<string, [string, string, string]> = {
  "sunny-morning":         ["#f97316","#fed7aa","#fff7ed"],
  "sunny-noon":            ["#1e40af","#3b82f6","#bfdbfe"],
  "sunny-afternoon":       ["#1d4ed8","#60a5fa","#dbeafe"],
  "sunny-dusk":            ["#9a3412","#ea580c","#fed7aa"],
  "sunny-dawn":            ["#92400e","#f59e0b","#fde68a"],
  "partly-cloudy-morning": ["#c2410c","#fb923c","#fde68a"],
  "partly-cloudy-noon":    ["#1e3a8a","#3b82f6","#bfdbfe"],
  "partly-cloudy-afternoon":["#1d4ed8","#60a5fa","#dbeafe"],
  "partly-cloudy-dusk":    ["#7c2d12","#c2410c","#f97316"],
  "partly-cloudy-dawn":    ["#78350f","#d97706","#fbbf24"],
  "cloudy-morning":        ["#374151","#6b7280","#9ca3af"],
  "cloudy-noon":           ["#1f2937","#374151","#6b7280"],
  "cloudy-afternoon":      ["#1f2937","#374151","#6b7280"],
  "cloudy-dusk":           ["#111827","#1f2937","#374151"],
  "cloudy-dawn":           ["#1f2937","#374151","#4b5563"],
  "rain-morning":          ["#0f172a","#1e293b","#334155"],
  "rain-noon":             ["#0f172a","#1e293b","#334155"],
  "rain-afternoon":        ["#0f172a","#1e293b","#334155"],
  "rain-dusk":             ["#020617","#0f172a","#1e293b"],
  "rain-dawn":             ["#0f172a","#1e293b","#334155"],
  "drizzle-morning":       ["#1e293b","#334155","#475569"],
  "drizzle-noon":          ["#1e293b","#334155","#475569"],
  "drizzle-afternoon":     ["#1e293b","#334155","#475569"],
  "drizzle-dusk":          ["#0f172a","#1e293b","#334155"],
  "drizzle-dawn":          ["#1e293b","#334155","#475569"],
  "thunderstorm-morning":  ["#030712","#0f172a","#1e293b"],
  "thunderstorm-noon":     ["#020617","#030712","#0f172a"],
  "thunderstorm-afternoon":["#020617","#030712","#0f172a"],
  "thunderstorm-dusk":     ["#000000","#030712","#0f172a"],
  "thunderstorm-dawn":     ["#020617","#030712","#0f172a"],
  "snow-morning":          ["#475569","#64748b","#94a3b8"],
  "snow-noon":             ["#374151","#6b7280","#9ca3af"],
  "snow-afternoon":        ["#374151","#6b7280","#9ca3af"],
  "snow-dusk":             ["#1f2937","#374151","#6b7280"],
  "snow-dawn":             ["#374151","#4b5563","#6b7280"],
  "fog-morning":           ["#4b5563","#6b7280","#9ca3af"],
  "fog-noon":              ["#374151","#6b7280","#9ca3af"],
  "fog-afternoon":         ["#374151","#6b7280","#9ca3af"],
  "fog-dusk":              ["#1f2937","#374151","#4b5563"],
  "fog-dawn":              ["#374151","#4b5563","#6b7280"],
  "mist-morning":          ["#4b5563","#6b7280","#9ca3af"],
  "mist-noon":             ["#374151","#6b7280","#9ca3af"],
  "mist-afternoon":        ["#374151","#6b7280","#9ca3af"],
  "mist-dusk":             ["#1f2937","#374151","#4b5563"],
  "mist-dawn":             ["#374151","#4b5563","#6b7280"],
  "dust-morning":          ["#78350f","#b45309","#d97706"],
  "dust-noon":             ["#92400e","#b45309","#d97706"],
  "dust-afternoon":        ["#92400e","#b45309","#d97706"],
  "dust-dusk":             ["#451a03","#78350f","#92400e"],
  "dust-dawn":             ["#78350f","#92400e","#b45309"],
  "windy-morning":         ["#1e3a8a","#2563eb","#93c5fd"],
  "windy-noon":            ["#1e3a8a","#2563eb","#93c5fd"],
  "windy-afternoon":       ["#1e3a8a","#2563eb","#93c5fd"],
  "windy-dusk":            ["#7c2d12","#c2410c","#f97316"],
  "windy-dawn":            ["#78350f","#b45309","#fbbf24"],
  // Night
  "clear-night":           ["#020617","#0f172a","#1e3a5f"],
  "clear-midnight":        ["#000510","#020617","#030f2a"],
  "sunny-night":           ["#020617","#0f172a","#1e3a5f"],
  "sunny-midnight":        ["#000510","#020617","#030f2a"],
  "partly-cloudy-night":   ["#030712","#0f172a","#1e2d4a"],
  "partly-cloudy-midnight":["#010408","#050d1a","#0a1428"],
  "cloudy-night":          ["#0a0c14","#111827","#1f2937"],
  "cloudy-midnight":       ["#050607","#0a0c14","#111827"],
  "rain-night":            ["#0a0c14","#111827","#1f2937"],
  "rain-midnight":         ["#050709","#0a0e14","#111827"],
  "drizzle-night":         ["#0c1018","#111827","#1e293b"],
  "drizzle-midnight":      ["#08090e","#0c1018","#111827"],
  "thunderstorm-night":    ["#020408","#070a14","#0f172a"],
  "thunderstorm-midnight": ["#010205","#040710","#0a0f1a"],
  "snow-night":            ["#111827","#1e293b","#293548"],
  "snow-midnight":         ["#0a0e18","#131c2a","#1e2a3a"],
  "fog-night":             ["#111113","#191b1e","#232628"],
  "fog-midnight":          ["#0c0d0f","#141618","#1c1f22"],
  "mist-night":            ["#10121a","#181e28","#1e2836"],
  "mist-midnight":         ["#0c0e14","#131820","#191f2e"],
  "dust-night":            ["#120e0a","#1c1610","#28201a"],
  "dust-midnight":         ["#0c0a08","#14100c","#1e1814"],
  "windy-night":           ["#050c1c","#0f1e38","#1a2e50"],
  "windy-midnight":        ["#030710","#080e20","#101828"],
  "unknown-morning":       ["#1d4ed8","#60a5fa","#dbeafe"],
  "unknown-noon":          ["#1e40af","#3b82f6","#bfdbfe"],
  "unknown-afternoon":     ["#1d4ed8","#60a5fa","#dbeafe"],
  "unknown-dusk":          ["#9a3412","#ea580c","#fed7aa"],
  "unknown-dawn":          ["#92400e","#f59e0b","#fde68a"],
  "unknown-night":         ["#020617","#0f172a","#1e3a5f"],
  "unknown-midnight":      ["#000510","#020617","#030f2a"],
};

function getPalette(condition: WeatherCondition, phase: DayPhase, isNight: boolean): [string, string, string] {
  const p = isNight ? (phase === "midnight" ? "midnight" : "night") : phase;
  const key = `${condition}-${p}`;
  return SKY_PALETTES[key] ?? SKY_PALETTES[`unknown-${p}`] ?? ["#020617","#0f172a","#1e3a5f"];
}

// ─── Ambient overlay tint per condition ───────────────────────────────────────
const OVERLAY: Record<string, string> = {
  thunderstorm: "rgba(2,4,10,0.65)",
  rain:         "rgba(5,10,20,0.42)",
  drizzle:      "rgba(8,14,25,0.32)",
  snow:         "rgba(200,215,240,0.10)",
  fog:          "rgba(170,180,190,0.40)",
  mist:         "rgba(150,165,178,0.28)",
  dust:         "rgba(160,110,50,0.28)",
};

// ─── Cloud canvas config ─────────────────────────────────────────────────────
interface CloudCfg { count: number; opacity: number; blur: number; speed: number; yRange:[number,number]; color: string }
function getCloudConfig(condition: WeatherCondition, isNight: boolean): CloudCfg {
  const n = isNight;
  if (condition === "thunderstorm") return { count:9,  opacity:0.90, blur:22, speed:0.40, yRange:[0,48],  color:"rgba(15,18,28," };
  if (condition === "rain")         return { count:8,  opacity:0.80, blur:16, speed:0.25, yRange:[0,38],  color:"rgba(30,40,55," };
  if (condition === "drizzle")      return { count:7,  opacity:0.68, blur:12, speed:0.20, yRange:[0,42],  color:"rgba(45,55,70," };
  if (condition === "snow")         return { count:6,  opacity:0.58, blur: 9, speed:0.14, yRange:[0,32],  color:"rgba(195,208,222," };
  if (condition === "fog"||condition==="mist") return { count:7, opacity:0.65, blur:18, speed:0.09, yRange:[8,62], color:"rgba(175,185,198," };
  if (condition === "dust")         return { count:6,  opacity:0.55, blur:14, speed:0.16, yRange:[4,52],  color:"rgba(175,142,98," };
  if (condition === "cloudy")       return { count:8,  opacity:n?0.62:0.55, blur:7, speed:0.18, yRange:[0,52], color:n?"rgba(18,22,36,":"rgba(175,182,195," };
  if (condition === "partly-cloudy")return { count:5,  opacity:n?0.48:0.40, blur:5, speed:0.14, yRange:[4,42], color:n?"rgba(26,32,52,":"rgba(225,232,245," };
  if (condition === "windy")        return { count:6,  opacity:n?0.42:0.32, blur:4, speed:0.55, yRange:[0,38], color:n?"rgba(20,26,42,":"rgba(215,224,240," };
  return { count:3, opacity:n?0.28:0.22, blur:4, speed:0.10, yRange:[4,32], color:n?"rgba(28,36,58,":"rgba(240,245,255," };
}

interface CloudBlob { x:number; y:number; w:number; h:number; speed:number; opacity:number; yPct:number }
function buildClouds(count:number, cfg:CloudCfg, W:number, H:number): CloudBlob[] {
  return Array.from({ length: count }, (_,i) => ({
    x:       (i / count) * W + Math.random() * 200 - 100,
    y:       0,
    w:       140 + Math.random() * 320,
    h:        55 + Math.random() *  90,
    speed:   cfg.speed * (0.5 + Math.random() * 1.0),
    opacity: cfg.opacity * (0.55 + Math.random() * 0.45),
    yPct:    cfg.yRange[0] + Math.random() * (cfg.yRange[1] - cfg.yRange[0]),
  }));
}



// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function WeatherBackground() {
  const weather     = useWeather();
  const skyRef      = useRef<HTMLDivElement>(null);
  const photoARef   = useRef<HTMLDivElement>(null);  // current photo slot
  const photoBRef   = useRef<HTMLDivElement>(null);  // next photo slot (crossfade)
  const cloudRef    = useRef<HTMLCanvasElement>(null);
  const overlayRef  = useRef<HTMLDivElement>(null);
  const godraysRef  = useRef<HTMLDivElement>(null);

  // Track previous image to crossfade properly
  const prevImgRef   = useRef<string | null>(null);
  const activeSlot   = useRef<"A"|"B">("A");

  // ── Sky + photo crossfade ──────────────────────────────────────────────────
  useEffect(() => {
    if (weather.loading) return;

    const { condition, phase, isNight } = weather;
    const [top, mid, bot] = getPalette(condition, phase, isNight);
    const newImg   = getBaseImage(phase, isNight, condition);
    const photoOpacity = getPhotoOpacity(condition, phase, isNight);

    // Gradient
    if (skyRef.current) {
      gsap.to(skyRef.current, {
        backgroundImage: `linear-gradient(to bottom, ${top} 0%, ${mid} 50%, ${bot} 100%)`,
        duration: 4, ease: "power2.inOut",
      });
    }

    // Photo crossfade
    if (newImg !== prevImgRef.current) {
      const incoming = activeSlot.current === "A" ? photoARef : photoBRef;
      const outgoing = activeSlot.current === "A" ? photoBRef : photoARef;

      if (incoming.current) {
        incoming.current.style.backgroundImage = newImg ? `url('${newImg}')` : "none";
        gsap.to(incoming.current, { opacity: newImg ? photoOpacity : 0, duration: 4, ease: "power2.inOut" });
      }
      if (outgoing.current) {
        gsap.to(outgoing.current, { opacity: 0, duration: 4, ease: "power2.inOut" });
      }

      activeSlot.current = activeSlot.current === "A" ? "B" : "A";
      prevImgRef.current = newImg;
    }

    // Overlay tint
    const ov = OVERLAY[condition] ?? "rgba(0,0,0,0)";
    if (overlayRef.current) {
      gsap.to(overlayRef.current, { backgroundColor: ov, duration: 3.5, ease: "power2.inOut" });
    }

    // God rays
    const showRays = ["sunny","clear","partly-cloudy"].includes(condition) && !isNight;
    if (godraysRef.current) {
      gsap.to(godraysRef.current, { opacity: showRays ? 1 : 0, duration: 3, ease: "power2.inOut" });
    }

  }, [weather.condition, weather.phase, weather.isNight, weather.loading]);

  // ── Slow Ken Burns on the photo layer ─────────────────────────────────────
  useEffect(() => {
    if (weather.loading) return;
    const refs = [photoARef.current, photoBRef.current].filter(Boolean) as HTMLDivElement[];
    const tls = refs.map((el) => {
      const tl = gsap.timeline({ repeat: -1, yoyo: true });
      tl.to(el, { scale: 1.05, x: "-1.5%", y: "-1.5%", duration: 22, ease: "sine.inOut" })
        .to(el, { scale: 1.08, x:  "1.8%", y: "-0.8%", duration: 20, ease: "sine.inOut" })
        .to(el, { scale: 1.04, x: "-1.0%", y: "-2.0%", duration: 24, ease: "sine.inOut" });
      return tl;
    });
    return () => tls.forEach((t) => t.kill());
  }, [weather.loading]);

  // ── Animated cloud canvas ──────────────────────────────────────────────────
  useEffect(() => {
    const canvas = cloudRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let W = window.innerWidth, H = window.innerHeight;
    canvas.width = W; canvas.height = H;

    const resize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
    window.addEventListener("resize", resize);

    const cfg    = getCloudConfig(weather.condition, weather.isNight);
    const clouds = buildClouds(cfg.count, cfg, W, H);
    let raf: number;

    function drawCloud(c: CloudBlob) {
      const y = (c.yPct / 100) * H;
      ctx.save();
      ctx.filter = `blur(${cfg.blur}px)`;
      ctx.globalAlpha = c.opacity;

      // Main body — large soft ellipse
      const grd = ctx.createRadialGradient(
        c.x + c.w * 0.5, y + c.h * 0.45, 0,
        c.x + c.w * 0.5, y + c.h * 0.5, c.w * 0.62
      );
      grd.addColorStop(0,   cfg.color + "1)");
      grd.addColorStop(0.55,cfg.color + "0.75)");
      grd.addColorStop(1,   cfg.color + "0)");
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.ellipse(c.x + c.w * 0.5, y + c.h * 0.58, c.w * 0.5, c.h * 0.42, 0, 0, Math.PI * 2);
      ctx.fill();

      // Puffy bumps on top — gives volumetric shape
      const bumpOffsets = [-0.30, -0.10, 0.12, 0.28];
      bumpOffsets.forEach((off, i) => {
        const bw = c.w * (0.20 + (i % 2) * 0.06);
        const bh = c.h * (0.38 + (i % 3) * 0.08);
        const bgrd = ctx.createRadialGradient(
          c.x + c.w * (0.5 + off), y + c.h * 0.28, 0,
          c.x + c.w * (0.5 + off), y + c.h * 0.30, bw
        );
        bgrd.addColorStop(0, cfg.color + "0.9)");
        bgrd.addColorStop(1, cfg.color + "0)");
        ctx.fillStyle = bgrd;
        ctx.beginPath();
        ctx.ellipse(c.x + c.w * (0.5 + off), y + c.h * 0.28, bw, bh, 0, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.restore();
    }

    function tick() {
      raf = requestAnimationFrame(tick);
      ctx.clearRect(0, 0, W, H);
      clouds.forEach((c) => {
        c.x += c.speed;
        if (c.x > W + c.w) c.x = -c.w - 40;
        drawCloud(c);
      });
    }
    tick();

    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, [weather.condition, weather.isNight]);

  if (weather.loading) {
    return (
      <div style={{
        position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
        background: "linear-gradient(to bottom,#020617,#0f172a,#1e3a5f)",
      }} />
    );
  }

  const [top, mid, bot] = getPalette(weather.condition, weather.phase, weather.isNight);
  const godraysX = weather.phase === "dawn" ? 12 : weather.phase === "dusk" ? 88 : 76;
  const godraysY = (weather.phase === "dawn" || weather.phase === "dusk") ? 62 : 14;
  const godraysColor = (weather.phase === "dawn" || weather.phase === "dusk")
    ? "rgba(255,130,40,0.28)" : "rgba(255,235,150,0.20)";

  return (
    <div style={{ position:"fixed", inset:0, zIndex:0, overflow:"hidden", pointerEvents:"none" }}>

      {/* ① Gradient sky base (always visible; shows through photo on bad weather) */}
      <div ref={skyRef} style={{
        position:"absolute", inset:0,
        backgroundImage:`linear-gradient(to bottom,${top} 0%,${mid} 50%,${bot} 100%)`,
      }} />

      {/* ② Photo sky layer A (crossfade slot) */}
      <div ref={photoARef} style={{
        position:"absolute", inset:"-6%",
        backgroundSize:"cover",
        backgroundPosition:"center 30%",
        opacity:0,
        willChange:"transform, opacity",
      }} />

      {/* ③ Photo sky layer B (crossfade slot) */}
      <div ref={photoBRef} style={{
        position:"absolute", inset:"-6%",
        backgroundSize:"cover",
        backgroundPosition:"center 30%",
        opacity:0,
        willChange:"transform, opacity",
      }} />

      {/* ④ Atmospheric scattering — brightens horizon naturally */}
      <div style={{
        position:"absolute", inset:0,
        background:"linear-gradient(to bottom,transparent 20%,rgba(255,255,255,0.04) 65%,rgba(255,255,255,0.12) 100%)",
      }} />

      {/* ⑤ God rays — only when sun is visible */}
      <div ref={godraysRef} style={{
        position:"absolute", inset:0,
        opacity:0,
        background:`radial-gradient(ellipse 55% 70% at ${godraysX}% ${godraysY}%,${godraysColor} 0%,rgba(255,200,80,0.06) 45%,transparent 70%)`,
        mixBlendMode:"screen",
      }} />

      {/* ⑥ Volumetric cloud canvas */}
      <canvas ref={cloudRef} style={{
        position:"absolute", inset:0, width:"100%", height:"100%", opacity:0.92,
      }} />

      {/* ⑦ Weather condition overlay tint */}
      <div ref={overlayRef} style={{
        position:"absolute", inset:0,
        backgroundColor: OVERLAY[weather.condition] ?? "rgba(0,0,0,0)",
        transition:"background-color 3.5s ease",
      }} />

      {/* ⑧ Particle canvas — rain/snow/fog/stars/lightning */}
      <WeatherCanvas weather={weather} />

      {/* ⑨ Bottom vignette — keeps card content readable */}
      <div style={{
        position:"absolute", inset:0,
        background:"linear-gradient(to bottom,transparent 50%,rgba(0,0,0,0.22) 100%)",
      }} />


    </div>
  );
}
