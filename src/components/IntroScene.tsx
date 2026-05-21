import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { gsap } from "gsap";

interface IntroSceneProps {
  onComplete: () => void;
}

export default function IntroScene({ onComplete }: IntroSceneProps) {
  const mountRef   = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const badgeRef   = useRef<HTMLDivElement>(null);
  const titleRef   = useRef<HTMLDivElement>(null);
  const cursorRef  = useRef<HTMLSpanElement>(null);
  const tagRef     = useRef<HTMLParagraphElement>(null);
  const barRef     = useRef<HTMLDivElement>(null);
  const [titleText, setTitleText] = useState("");
  const [visible, setVisible]     = useState(true);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    const W = window.innerWidth, H = window.innerHeight;

    // ── Renderer ────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.setClearColor(0x060c18, 1);
    Object.assign(renderer.domElement.style, {
      position: "absolute", inset: "0", width: "100%", height: "100%",
    });
    el.appendChild(renderer.domElement);

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 100);
    camera.position.z = 5;

    // ── Floating dust particles ──────────────────────────────────────
    const DUST = 900;
    const dustPos = new Float32Array(DUST * 3);
    const dustAlpha = new Float32Array(DUST);
    for (let i = 0; i < DUST; i++) {
      dustPos[i * 3]     = (Math.random() - 0.5) * 18;
      dustPos[i * 3 + 1] = (Math.random() - 0.5) * 10;
      dustPos[i * 3 + 2] = (Math.random() - 0.5) * 6;
      dustAlpha[i]        = Math.random();
    }
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
    const dustMat = new THREE.PointsMaterial({
      color: 0x4a8fc4, size: 0.022, transparent: true, opacity: 0,
      sizeAttenuation: true, depthWrite: false,
    });
    const dust = new THREE.Points(dustGeo, dustMat);
    scene.add(dust);

    // ── Ambient glow behind text ─────────────────────────────────────
    const glowC = document.createElement("canvas");
    glowC.width = glowC.height = 512;
    const gc = glowC.getContext("2d")!;
    const gg = gc.createRadialGradient(256, 256, 0, 256, 256, 256);
    gg.addColorStop(0,   "rgba(40,100,200,0.35)");
    gg.addColorStop(0.5, "rgba(20, 60,160,0.12)");
    gg.addColorStop(1,   "rgba(10, 30,100,0.00)");
    gc.fillStyle = gg; gc.fillRect(0, 0, 512, 512);
    const glowTex = new THREE.CanvasTexture(glowC);
    const glowMat = new THREE.SpriteMaterial({
      map: glowTex, transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const glowSprite = new THREE.Sprite(glowMat);
    glowSprite.scale.set(10, 6, 1);
    scene.add(glowSprite);

    // ── rAF loop ─────────────────────────────────────────────────────
    let animId: number;
    const timer = new THREE.Timer();
    function tick() {
      animId = requestAnimationFrame(tick);
      timer.update();
      const t = timer.getElapsed();
      dust.rotation.y = t * 0.012;
      dust.rotation.x = t * 0.006;
      renderer.render(scene, camera);
    }
    tick();

    // ── GSAP + typewriter timeline ────────────────────────────────────
    const TITLE = "PromptPolish";
    const tl = gsap.timeline({
      onComplete: () => {
        gsap.to(overlayRef.current, {
          opacity: 0, duration: 0.55, ease: "power2.inOut",
          onComplete: () => { setVisible(false); onComplete(); },
        });
      },
    });

    // 0.0 — dust + glow fade in
    tl.to(dustMat,  { opacity: 0.55, duration: 1.0, ease: "power2.out" }, 0);
    tl.to(glowMat,  { opacity: 1.0,  duration: 0.9, ease: "power2.out" }, 0.2);

    // 0.3 — badge slides down
    tl.fromTo(badgeRef.current,
      { opacity: 0, y: -14 },
      { opacity: 1, y: 0, duration: 0.4, ease: "power3.out" },
      0.25
    );

    // 0.6 — type each letter
    let typed = "";
    const typeDelay = 0.62;
    const charDuration = 0.045;
    for (let i = 0; i < TITLE.length; i++) {
      tl.call(() => {
        typed += TITLE[i];
        setTitleText(typed);
      }, [], typeDelay + i * charDuration);
    }

    // after typing ends — tagline
    const afterType = typeDelay + TITLE.length * charDuration;
    tl.fromTo(tagRef.current,
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" },
      afterType + 0.12
    );

    // progress bar fills
    tl.fromTo(barRef.current,
      { scaleX: 0 },
      { scaleX: 1, duration: 0.8, ease: "power2.inOut", transformOrigin: "left" },
      afterType + 0.08
    );

    // cursor blink then hide
    tl.to(cursorRef.current, { opacity: 0, duration: 0.15, repeat: 3, yoyo: true }, afterType + 0.05);
    tl.to(cursorRef.current, { opacity: 0, duration: 0.2 }, afterType + 0.8);

    // hold
    tl.to({}, { duration: 0.5 }, afterType + 1.0);

    // exit
    tl.to(dustMat, { opacity: 0, duration: 0.3 }, afterType + 1.35);
    tl.to(glowMat, { opacity: 0, duration: 0.3 }, afterType + 1.35);

    return () => {
      cancelAnimationFrame(animId);
      tl.kill();
      dustGeo.dispose(); dustMat.dispose(); glowMat.dispose(); glowTex.dispose();
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, [onComplete]);

  if (!visible) return null;

  return (
    <div
      ref={overlayRef}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "#060c18", overflow: "hidden",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
      }}
    >
      <div ref={mountRef} style={{ position: "absolute", inset: 0 }} />

      {/* Content */}
      <div style={{ position: "relative", zIndex: 1, textAlign: "center", padding: "0 24px" }}>

        {/* Badge */}
        <div
          ref={badgeRef}
          style={{
            opacity: 0,
            display: "inline-flex", alignItems: "center", gap: "8px",
            marginBottom: "28px",
            padding: "5px 14px",
            border: "1px solid rgba(80,140,220,0.35)",
            borderRadius: "999px",
            background: "rgba(30,60,120,0.30)",
            backdropFilter: "blur(8px)",
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: "0.7rem",
            fontWeight: 600,
            letterSpacing: "0.18em",
            textTransform: "uppercase" as const,
            color: "rgba(140,190,255,0.85)",
          }}
        >
          <span style={{
            width: 6, height: 6, borderRadius: "50%",
            background: "#4aadee",
            boxShadow: "0 0 8px #4aadee",
            flexShrink: 0,
          }} />
          AI Prompt Engineering
        </div>

        {/* Typing title */}
        <div
          ref={titleRef}
          style={{
            fontFamily: "'Inter', system-ui, sans-serif",
            fontWeight: 700,
            fontSize: "clamp(2.8rem, 8vw, 5.2rem)",
            letterSpacing: "-0.03em",
            color: "#ffffff",
            textShadow: "0 0 30px rgba(80,150,255,0.4)",
            lineHeight: 1.1,
            minHeight: "1.2em",
          }}
        >
          {titleText}
          <span
            ref={cursorRef}
            style={{
              display: "inline-block",
              width: "3px",
              height: "0.85em",
              background: "#4aadee",
              marginLeft: "4px",
              verticalAlign: "middle",
              boxShadow: "0 0 10px #4aadee",
              borderRadius: "1px",
            }}
          />
        </div>

        {/* Tagline */}
        <p
          ref={tagRef}
          style={{
            opacity: 0,
            marginTop: "16px",
            fontFamily: "'Inter', system-ui, sans-serif",
            fontWeight: 400,
            fontSize: "clamp(0.9rem, 2.2vw, 1.05rem)",
            color: "rgba(160,195,235,0.65)",
            letterSpacing: "0.02em",
          }}
        >
          Turn vague prompts into powerful ones
        </p>

        {/* Progress bar */}
        <div style={{
          marginTop: "36px",
          width: "180px",
          height: "2px",
          background: "rgba(80,140,220,0.15)",
          borderRadius: "2px",
          overflow: "hidden",
          margin: "36px auto 0",
        }}>
          <div
            ref={barRef}
            style={{
              width: "100%", height: "100%",
              background: "linear-gradient(90deg, #2a7ad8, #4aadee, #a0d4ff)",
              boxShadow: "0 0 10px rgba(74,173,238,0.7)",
              borderRadius: "2px",
              transformOrigin: "left",
              scaleX: 0,
            } as React.CSSProperties}
          />
        </div>
      </div>
    </div>
  );
}
