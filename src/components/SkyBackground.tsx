import { useEffect, useRef } from "react";
import { gsap } from "gsap";

export default function SkyBackground() {
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = imgRef.current;
    if (!el) return;

    // Very slow Ken Burns: gentle scale + slight pan, no horizontal scroll = no seam
    const tl = gsap.timeline({ repeat: -1, yoyo: true });
    tl.to(el, { scale: 1.07, y: "-2.2%", x: "-2.0%", duration: 16, ease: "sine.inOut" })
      .to(el, { scale: 1.05, y: "-0.8%", x:  "1.8%", duration: 14, ease: "sine.inOut" })
      .to(el, { scale: 1.08, y: "-2.8%", x: "-1.4%", duration: 18, ease: "sine.inOut" });

    return () => { tl.kill(); };
  }, []);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 0, overflow: "hidden", pointerEvents: "none" }}>
      <div
        ref={imgRef}
        style={{
          position: "absolute",
          inset: "-8%",
          backgroundImage: "url('/sky-bg.png')",
          backgroundSize: "cover",
          backgroundPosition: "center center",
          willChange: "transform",
        }}
      />
      {/* Soft bottom haze for card readability */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(to bottom, rgba(255,255,255,0) 50%, rgba(255,255,255,0.20) 100%)",
      }} />
    </div>
  );
}
