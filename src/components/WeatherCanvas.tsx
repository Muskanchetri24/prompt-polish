import { useEffect, useRef } from "react";
import type { WeatherState } from "../hooks/useWeather";

interface Props {
  weather: WeatherState;
}

// ─── Particle system constants ───────────────────────────────────────────────
const MAX_RAIN   = 600;
const MAX_SNOW   = 300;
const MAX_STARS  = 500;
const MAX_FOG    = 80;

interface Particle {
  x: number; y: number; z: number; // z = depth 0..1
  vx: number; vy: number;
  alpha: number; size: number;
  life: number; maxLife: number;
}

function rand(a: number, b: number) { return a + Math.random() * (b - a); }

// ─── Build star field ─────────────────────────────────────────────────────
function buildStars(w: number, h: number): Particle[] {
  return Array.from({ length: MAX_STARS }, () => ({
    x: rand(0, w), y: rand(0, h), z: rand(0, 1),
    vx: 0, vy: 0,
    alpha: rand(0.3, 1), size: rand(0.5, 2.2),
    life: rand(0, 200), maxLife: rand(80, 240),
  }));
}

// ─── Rain drop ───────────────────────────────────────────────────────────
function spawnRain(w: number, windSpeed: number): Particle {
  const windAngle = Math.min(windSpeed / 15, 0.6);
  return {
    x: rand(-50, w + 50), y: rand(-40, -4),
    z: rand(0, 1),
    vx: windAngle * rand(1, 3) * (windSpeed > 0 ? 1 : -1),
    vy: rand(14, 28),
    alpha: rand(0.25, 0.6), size: rand(0.8, 1.6),
    life: 0, maxLife: 999,
  };
}

// ─── Snow flake ──────────────────────────────────────────────────────────
function spawnSnow(w: number): Particle {
  return {
    x: rand(-10, w + 10), y: rand(-20, -4),
    z: rand(0, 1),
    vx: rand(-0.6, 0.6), vy: rand(1.0, 3.5),
    alpha: rand(0.5, 0.95), size: rand(1.5, 5),
    life: 0, maxLife: 999,
  };
}

// ─── Fog particle ────────────────────────────────────────────────────────
function spawnFog(w: number, h: number): Particle {
  return {
    x: rand(-200, w + 200), y: rand(h * 0.4, h + 50),
    z: rand(0, 1),
    vx: rand(0.1, 0.5), vy: rand(-0.05, 0.05),
    alpha: rand(0.01, 0.07), size: rand(120, 260),
    life: 0, maxLife: rand(400, 900),
  };
}

// ─── Main Canvas Component ───────────────────────────────────────────────────
export default function WeatherCanvas({ weather }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d")!;
    let W = window.innerWidth;
    let H = window.innerHeight;

    const resize = () => {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const { condition, isNight, windSpeed, cloudCover } = weather;

    // Which systems are active
    const showRain  = condition === "rain" || condition === "drizzle" || condition === "thunderstorm";
    const showDriz  = condition === "drizzle";
    const showSnow  = condition === "snow";
    const showStars = isNight && condition !== "thunderstorm";
    const showFog   = condition === "fog" || condition === "mist" || condition === "dust" ||
                      (condition === "rain" && cloudCover > 70);
    const showLightning = condition === "thunderstorm";

    // Particle pools
    const rain:  Particle[] = [];
    const snow:  Particle[] = [];
    const fog:   Particle[] = [];
    const stars: Particle[] = showStars ? buildStars(W, H) : [];

    // Lightning state
    let lightningTimer = 0;
    let lightningAlpha = 0;
    let lightningNext  = rand(2000, 7000); // ms
    let lastTime = performance.now();

    // ── Spawn initial fog ─────────────────────────────────────────────────
    if (showFog) {
      for (let i = 0; i < MAX_FOG; i++) fog.push(spawnFog(W, H));
    }

    // ── RAF loop ──────────────────────────────────────────────────────────
    function tick(now: number) {
      rafRef.current = requestAnimationFrame(tick);
      const dt = Math.min(now - lastTime, 50); // cap at 50ms
      lastTime = now;

      ctx.clearRect(0, 0, W, H);

      // ── STARS ─────────────────────────────────────────────────────────
      if (showStars) {
        stars.forEach((s) => {
          s.life++;
          if (s.life > s.maxLife) s.life = 0;
          // twinkling
          const t = s.life / s.maxLife;
          const tw = Math.sin(t * Math.PI * 2) * 0.5 + 0.5;
          const a = s.alpha * (0.5 + tw * 0.5);
          ctx.save();
          ctx.globalAlpha = a;
          // star glow
          const grd = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.size * 2.5);
          grd.addColorStop(0,   "rgba(255,255,255,1)");
          grd.addColorStop(0.4, "rgba(200,220,255,0.6)");
          grd.addColorStop(1,   "rgba(160,180,255,0)");
          ctx.fillStyle = grd;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.size * 2.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });
      }

      // ── RAIN ──────────────────────────────────────────────────────────
      if (showRain) {
        const target = showDriz ? MAX_RAIN * 0.25 : MAX_RAIN;
        while (rain.length < target) rain.push(spawnRain(W, windSpeed));

        const speedMul = dt / 16.67;
        rain.forEach((r, i) => {
          r.x += r.vx * speedMul;
          r.y += r.vy * speedMul;
          if (r.y > H + 20) {
            rain[i] = spawnRain(W, windSpeed);
            return;
          }
          const len = r.size * (r.vy * 0.9);
          ctx.save();
          ctx.globalAlpha = r.alpha * (0.5 + r.z * 0.5);
          ctx.strokeStyle = r.z > 0.5 ? "rgba(180,210,240,0.85)" : "rgba(130,170,210,0.5)";
          ctx.lineWidth   = r.size * (0.4 + r.z * 0.6);
          ctx.beginPath();
          ctx.moveTo(r.x, r.y);
          ctx.lineTo(r.x + r.vx * 0.8, r.y + len);
          ctx.stroke();
          ctx.restore();
        });

        // Puddle splash shimmer at very bottom
        if (!showDriz) {
          ctx.save();
          const shimmerGrd = ctx.createLinearGradient(0, H - 80, 0, H);
          shimmerGrd.addColorStop(0, "rgba(120,160,210,0)");
          shimmerGrd.addColorStop(1, "rgba(120,160,210,0.12)");
          ctx.fillStyle = shimmerGrd;
          ctx.fillRect(0, H - 80, W, 80);
          ctx.restore();
        }
      }

      // ── SNOW ──────────────────────────────────────────────────────────
      if (showSnow) {
        while (snow.length < MAX_SNOW) snow.push(spawnSnow(W));

        const speedMul = dt / 16.67;
        snow.forEach((s, i) => {
          s.x  += s.vx * speedMul + Math.sin(s.life * 0.05) * 0.3;
          s.y  += s.vy * speedMul;
          s.life++;
          if (s.y > H + 20) {
            snow[i] = spawnSnow(W);
            return;
          }
          const depth = 0.4 + s.z * 0.6;
          ctx.save();
          ctx.globalAlpha = s.alpha * depth;
          const grd = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.size);
          grd.addColorStop(0, "rgba(255,255,255,1)");
          grd.addColorStop(0.6,"rgba(220,235,255,0.8)");
          grd.addColorStop(1, "rgba(200,220,255,0)");
          ctx.fillStyle = grd;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.size * depth, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });
      }

      // ── FOG / MIST ────────────────────────────────────────────────────
      if (showFog) {
        const speedMul = dt / 16.67;
        fog.forEach((f, i) => {
          f.x += f.vx * speedMul;
          f.y += f.vy * speedMul;
          f.life++;
          const progress = f.life / f.maxLife;
          const envelope = Math.sin(progress * Math.PI);
          if (f.life >= f.maxLife) {
            fog[i] = spawnFog(W, H);
            return;
          }
          ctx.save();
          ctx.globalAlpha = f.alpha * envelope;
          const color = condition === "dust" ? "rgba(200,160,100," : "rgba(200,210,230,";
          const grd = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.size);
          grd.addColorStop(0, color + "1)");
          grd.addColorStop(1, color + "0)");
          ctx.fillStyle = grd;
          ctx.beginPath();
          ctx.arc(f.x, f.y, f.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });
      }

      // ── LIGHTNING ─────────────────────────────────────────────────────
      if (showLightning) {
        lightningTimer += dt;
        if (lightningAlpha > 0) {
          lightningAlpha = Math.max(0, lightningAlpha - dt * 0.015);
          ctx.save();
          ctx.globalAlpha = lightningAlpha * 0.7;
          ctx.fillStyle   = "rgba(220,230,255,1)";
          ctx.fillRect(0, 0, W, H);
          ctx.restore();
        }
        if (lightningTimer >= lightningNext) {
          lightningTimer = 0;
          lightningNext  = rand(1500, 8000);
          lightningAlpha = rand(0.4, 1.0);

          // Draw a jagged bolt
          drawLightningBolt(ctx, W, H);

          // Double-flash effect
          setTimeout(() => { lightningAlpha = rand(0.2, 0.6); drawLightningBolt(ctx, W, H); }, 80);
        }
      }
    }

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weather.condition, weather.isNight, weather.windSpeed, weather.cloudCover]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: 1,
        pointerEvents: "none",
      }}
    />
  );
}

// ─── Jagged lightning bolt ────────────────────────────────────────────────
function drawLightningBolt(ctx: CanvasRenderingContext2D, W: number, H: number) {
  const startX = rand(W * 0.2, W * 0.8);
  const points: [number, number][] = [[startX, 0]];
  let x = startX;
  let y = 0;
  while (y < H * rand(0.4, 0.8)) {
    x += rand(-60, 60);
    y += rand(30, 80);
    points.push([x, y]);
  }
  ctx.save();
  ctx.globalAlpha = rand(0.7, 1.0);
  ctx.shadowBlur  = 30;
  ctx.shadowColor = "#a0d0ff";
  ctx.strokeStyle = "#d0e8ff";
  ctx.lineWidth   = rand(1.5, 4);
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  points.slice(1).forEach(([px, py]) => ctx.lineTo(px, py));
  ctx.stroke();

  // thin bright core
  ctx.strokeStyle = "white";
  ctx.lineWidth   = 0.8;
  ctx.stroke();
  ctx.restore();
}
