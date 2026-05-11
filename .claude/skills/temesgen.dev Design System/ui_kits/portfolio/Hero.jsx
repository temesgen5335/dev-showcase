// Hero — recreates Hero.astro AND demonstrates the redesign brief from HERO_PROMPT.md
// The "static" variant matches the live codebase exactly.
// The "animated" variant adds the starfield + cursor glow + type-in (vanilla canvas, no libs).

const SITE = {
  name: "Temesgen Gebreabzgi",
  location: "Addis Ababa, Ethiopia",
  title: "Senior Software Engineer",
  subtitle: "Certified AI Engineer · Building scalable full-stack AI systems",
  cvPath: "#cv",
};

function Starfield() {
  const ref = React.useRef(null);
  React.useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    if (typeof window === "undefined") return; // SSR guard
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    const isMobile = window.matchMedia("(max-width: 640px)").matches;
    const count = isMobile ? 30 : 80;
    const ctx = canvas.getContext("2d");
    let raf, w, h, dpr, stars, gridOffset = 0;
    let tilt = { x: 0, y: 0 };

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const r = canvas.getBoundingClientRect();
      w = r.width; h = r.height;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        a: 0.2 + Math.random() * 0.6, // base alpha
        s: 0.5 + Math.random() * 1.2, // size
        // drift <5px/s; convert to per-frame at ~60fps
        vx: (Math.random() - 0.5) * 0.06,
        vy: (Math.random() - 0.5) * 0.06,
        tw: 0.5 + Math.random() * 1.5, // twinkle period (s)
        ph: Math.random() * Math.PI * 2,
      }));
    }

    function onMove(e) {
      // parallax tilt — max 6deg, expressed as small px offsets
      const r = canvas.getBoundingClientRect();
      const cx = (e.clientX - r.left) / r.width - 0.5;
      const cy = (e.clientY - r.top) / r.height - 0.5;
      tilt.x = cx * 6; tilt.y = cy * 6;
    }

    function frame(t) {
      ctx.clearRect(0, 0, w, h);
      // perspective grid horizon: bottom 30%, low opacity sky
      const horizonY = h * 0.7;
      ctx.strokeStyle = "rgba(125, 211, 252, 0.06)";
      ctx.lineWidth = 1;
      // verticals
      for (let i = -8; i <= 8; i++) {
        ctx.beginPath();
        ctx.moveTo(w / 2, horizonY);
        ctx.lineTo(w / 2 + i * (w / 6), h);
        ctx.stroke();
      }
      // horizontals scrolling forward at a crawl — use perspective curve
      gridOffset = (gridOffset + 0.2) % 30;
      for (let i = 0; i < 8; i++) {
        const p = (i + gridOffset / 30) / 8;
        const y = horizonY + Math.pow(p, 2) * (h - horizonY);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      // stars w/ tilt
      stars.forEach((s) => {
        s.x += s.vx; s.y += s.vy;
        if (s.x < 0) s.x = w; if (s.x > w) s.x = 0;
        if (s.y < 0) s.y = h; if (s.y > h) s.y = 0;
        const tw = (Math.sin(t / 1000 * (1 / s.tw) + s.ph) + 1) / 2;
        const alpha = s.a * (0.4 + tw * 0.6);
        ctx.fillStyle = `rgba(229, 229, 229, ${alpha})`;
        ctx.beginPath();
        ctx.arc(s.x + tilt.x, s.y + tilt.y, s.s, 0, Math.PI * 2);
        ctx.fill();
      });
      raf = requestAnimationFrame(frame);
    }

    function start() {
      resize();
      raf = requestAnimationFrame(frame);
    }
    function stop() { cancelAnimationFrame(raf); }

    // Lazy-init after first paint to keep TTI clean.
    const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 200));
    idle(start);

    window.addEventListener("resize", resize);
    if (!isMobile) window.addEventListener("mousemove", onMove);
    // Pause RAF when document is hidden — matters on mobile / background tabs.
    function onVis() { document.hidden ? stop() : (raf || (raf = requestAnimationFrame(frame))); }
    document.addEventListener("visibilitychange", onVis);
    return () => { stop(); window.removeEventListener("resize", resize); window.removeEventListener("mousemove", onMove); document.removeEventListener("visibilitychange", onVis); };
  }, []);
  return <canvas ref={ref} className="hero-canvas"></canvas>;
}

function CursorGlow() {
  const ref = React.useRef(null);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(hover: none)").matches) return;
    let tx = 0, ty = 0, x = 0, y = 0, raf;
    function onMove(e) {
      const r = el.getBoundingClientRect();
      tx = e.clientX - r.left; ty = e.clientY - r.top;
    }
    function tick() {
      // lerp 0.08 — slow follow gives a "presence" feel without feeling laggy.
      x += (tx - x) * 0.08; y += (ty - y) * 0.08;
      el.style.setProperty("--mx", `${x}px`);
      el.style.setProperty("--my", `${y}px`);
      raf = requestAnimationFrame(tick);
    }
    el.parentElement.addEventListener("mousemove", onMove);
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); el.parentElement.removeEventListener("mousemove", onMove); };
  }, []);
  return <div ref={ref} className="hero-cursor-glow"></div>;
}

function TypeIn({ text, speed = 25, delay = 600 }) {
  const [out, setOut] = React.useState("");
  React.useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setOut(text); return;
    }
    let i = 0; let to;
    const start = setTimeout(function loop() {
      setOut(text.slice(0, ++i));
      if (i < text.length) to = setTimeout(loop, speed);
    }, delay);
    return () => { clearTimeout(start); clearTimeout(to); };
  }, [text, speed, delay]);
  return <>{out}<span style={{ opacity: out.length < text.length ? 1 : 0, color: "var(--color-accent)" }}>▍</span></>;
}

function Hero({ animated = true }) {
  return (
    <section className="hero-stage">
      {animated && <Starfield />}
      {animated && <CursorGlow />}
      <div className="mono" style={{ color: "var(--color-muted)", fontSize: "0.78rem", marginBottom: "0.9rem" }}>
        <span className="dot-pulse"></span>~ {SITE.location.toLowerCase()} <span className="flicker" style={{ display: "inline-block" }}>· available for senior ai roles + freelance</span>
      </div>
      <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.4rem)", lineHeight: 1.05, margin: "0 0 1rem", fontFamily: "var(--font-sans)", animation: animated ? "fadeBlur 300ms ease-out both" : "none" }}>
        {SITE.name}.
      </h1>
      <p style={{ fontFamily: "var(--font-mono)", fontSize: "clamp(0.95rem, 2vw, 1.1rem)", color: "var(--color-text)", margin: "0 0 0.5rem" }}>
        {animated ? <TypeIn text={SITE.subtitle} /> : SITE.subtitle}
      </p>
      <p style={{ maxWidth: "44rem", color: "var(--color-text)", fontSize: "1rem", lineHeight: 1.6, margin: "1.25rem 0 2rem", animation: animated ? "fadeIn 400ms ease-out 1.2s both" : "none" }}>
        Ambitious AI Engineer with strong expertise in Generative AI, Machine Learning, Data Engineering, and Full-stack Software development. Currently the Founding AI Engineer at <strong style={{ color: "var(--color-text-strong)" }}>Chronos</strong>.
      </p>
      <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
        <a href="#experience" className="btn btn-primary">view experience →</a>
        <a href={SITE.cvPath} className="btn">download cv</a>
        <a href="#contact" className="btn">get in touch</a>
      </div>
      <div style={{ marginTop: "2rem", fontFamily: "var(--font-mono)", fontSize: "0.78rem", color: "var(--color-muted)" }}>
        <span className="scroll-cue">↓</span> scroll
      </div>
      <style>{`
        @keyframes fadeBlur { from { opacity: 0; filter: blur(6px); } to { opacity: 1; filter: blur(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @media (prefers-reduced-motion: reduce) {
          .hero-stage h1, .hero-stage p { animation: none !important; }
        }
      `}</style>
    </section>
  );
}

window.Hero = Hero;
