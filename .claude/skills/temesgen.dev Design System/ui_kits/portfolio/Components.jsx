// Nav — mirrors src/components/Nav.astro
function Nav({ active = "experience" }) {
  const NAV = ["experience", "projects", "about", "blog", "contact"];
  return (
    <header style={{ position: "sticky", top: 0, zIndex: 30, backdropFilter: "blur(10px)", background: "rgba(10,10,10,0.7)", borderBottom: "1px solid var(--color-border)" }}>
      <div className="container-x" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBlock: "0.9rem" }}>
        <a href="#" className="mono" style={{ fontSize: "0.95rem", color: "var(--color-text-strong)" }}>temesgen.dev</a>
        <nav className="mono" style={{ display: "flex", gap: "1.1rem" }}>
          {NAV.map((label) => (
            <a key={label} href={`#${label}`} style={{ fontSize: "0.82rem", color: active === label ? "var(--color-text-strong)" : "var(--color-muted)" }}>{label}</a>
          ))}
        </nav>
      </div>
    </header>
  );
}

// Footer — mirrors Footer.astro
function Footer() {
  const links = [
    ["GitHub", "https://github.com/temesgen5335"],
    ["LinkedIn", "https://linkedin.com/in/temesgen-gebreabzgi"],
    ["X", "#"],
    ["Email", "mailto:temesgengebreab33@gmail.com"],
  ];
  return (
    <footer style={{ borderTop: "1px solid var(--color-border)", marginTop: "4rem" }}>
      <div className="container-x" style={{ paddingBlock: "2rem", display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "center", justifyContent: "space-between" }}>
        <div className="mono" style={{ color: "var(--color-muted)", fontSize: "0.8rem" }}>© 2026 Temesgen Gebreabzgi · built with Astro</div>
        <div className="mono" style={{ display: "flex", gap: "1rem", fontSize: "0.8rem" }}>
          {links.map(([label, href]) => (
            <a key={label} href={href} style={{ color: "var(--color-muted)" }}>{label}</a>
          ))}
        </div>
      </div>
    </footer>
  );
}

// ProjectCard — mirrors ProjectCard.astro
function ProjectCard({ title, summary, tags, cover, liveUrl, githubUrl, onClick }) {
  return (
    <a className="card" href="#" onClick={(e) => { e.preventDefault(); onClick && onClick(); }} style={{ display: "block", padding: "1.1rem 1.25rem", color: "inherit" }}>
      {cover && (
        <div style={{ aspectRatio: "16/9", borderRadius: "0.4rem", overflow: "hidden", marginBottom: "0.9rem", border: "1px solid var(--color-border)", background: "var(--color-bg)" }}>
          <img src={cover} alt={title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} loading="lazy" />
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "0.5rem", marginBottom: "0.4rem" }}>
        <h3 style={{ margin: 0, fontSize: "1rem" }}>{title}</h3>
        <div className="mono" style={{ fontSize: "0.7rem", color: "var(--color-muted)", display: "flex", gap: "0.5rem" }}>
          {liveUrl && <span>live ↗</span>}
          {githubUrl && <span>repo ↗</span>}
        </div>
      </div>
      <p style={{ margin: "0 0 0.8rem", color: "var(--color-text)", fontSize: "0.88rem", lineHeight: 1.55 }}>{summary}</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
        {tags.slice(0, 4).map((t) => <span key={t} className="tag">{t}</span>)}
      </div>
    </a>
  );
}

// SectionLabel — "// featured work"
function SectionLabel({ children, action }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "1.3rem" }}>
      <h2 style={{ fontSize: "0.95rem", margin: 0, color: "var(--color-muted)" }}>// {children}</h2>
      {action && <a href="#" className="mono" style={{ fontSize: "0.78rem", color: "var(--color-muted)" }}>{action}</a>}
    </div>
  );
}

// Services — mirrors Services.astro
function Services() {
  const items = [
    ["AI systems & agents", "RAG pipelines, tool-using agents, domain copilots. Prototyped to production."],
    ["LLM integration", "Multi-provider routing, prompt engineering, evaluation harnesses, cost/latency tuning."],
    ["Full-stack web", "Next.js / Astro / Svelte frontends with FastAPI or Node backends. Auth, Postgres, deploys."],
    ["Technical consulting", "Architecture reviews, ML/AI feasibility studies, data pipeline design."],
  ];
  return (
    <section style={{ paddingBlock: "3rem 1rem" }}>
      <SectionLabel>services</SectionLabel>
      <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fit, minmax(14rem, 1fr))" }}>
        {items.map(([t, b]) => (
          <div key={t} className="card" style={{ padding: "1.1rem 1.25rem" }}>
            <h3 style={{ margin: "0 0 0.45rem", fontSize: "0.95rem" }}>{t}</h3>
            <p style={{ margin: 0, color: "var(--color-text)", fontSize: "0.85rem", lineHeight: 1.55 }}>{b}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ContactCTA — mirrors ContactCTA.astro
function ContactCTA() {
  return (
    <section className="card" style={{ padding: "2rem 2rem", marginTop: "3rem" }}>
      <h2 style={{ margin: "0 0 0.5rem", fontSize: "1.4rem" }}>Let's build something.</h2>
      <p style={{ margin: "0 0 1.2rem", color: "var(--color-text)", maxWidth: "38rem", lineHeight: 1.55 }}>
        Open to senior AI engineering roles and freelance engagements — RAG systems, AI agents, production ML, and full-stack.
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
        <a className="btn btn-primary" href="mailto:temesgengebreab33@gmail.com">email temesgengebreab33@gmail.com</a>
        <a className="btn" href="#contact">contact form</a>
        <a className="btn" href="#cv" download>download cv</a>
      </div>
    </section>
  );
}

// ExperienceTimeline — mirrors ExperienceTimeline.astro
function ExperienceTimeline() {
  const entries = [
    { role: "Founding AI Engineer", company: "Chronos", location: "San Francisco, California", dates: "Jun 2025 — Present", bullets: ["Designed and built Chronos' AI financial advisor, integrating NLP and recommendation models for personalized finance insights.", "Architected multi-currency account infrastructure enabling seamless transfers, exchanges, and portfolio management."], stack: ["Python", "FastAPI", "NLP", "AI Agents"] },
    { role: "Software Engineer", company: "Bluespark Business Technology", location: "Addis Ababa, Ethiopia", dates: "Feb 2025 — Jun 2025", bullets: ["Engineered reusable API endpoints with OpenAPI/Swagger, reducing feature development time by 40%.", "Streamlined manual sales tracking, improving operational efficiency by 60% and cutting data entry errors by 70%."], stack: ["FastAPI", "PostgreSQL", "Svelte", "TailwindCSS"] },
    { role: "Generative AI Engineer", company: "10 Academy", location: "Santa Clara, California (Remote)", dates: "Apr 2024 — Oct 2024", bullets: ["Engineered scalable data warehouses for LLM fine-tuning, improving data processing efficiency by 25%.", "Developed a high-precision legal expert RAG system, reducing contract Q&A time by 40%."], stack: ["LangChain", "OpenAI GPT", "Weaviate", "Airflow", "Docker"] },
  ];
  function highlight(text) {
    return text.replace(/(\d+(?:\.\d+)?%|\d+x|\d+\+?)/g, '<strong style="color: var(--color-text-strong);">$1</strong>');
  }
  return (
    <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "1rem" }}>
      {entries.map((e, i) => (
        <li key={i} className="card" style={{ padding: "1.25rem 1.4rem" }}>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", justifyContent: "space-between", gap: "0.5rem", marginBottom: "0.4rem" }}>
            <div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.95rem", color: "var(--color-text-strong)" }}>{e.role} <span style={{ color: "var(--color-muted)" }}>·</span> {e.company}</div>
              <div className="mono" style={{ color: "var(--color-muted)", fontSize: "0.78rem", marginTop: "0.2rem" }}>{e.location}</div>
            </div>
            <div className="mono" style={{ color: "var(--color-muted)", fontSize: "0.78rem", whiteSpace: "nowrap" }}>{e.dates}</div>
          </div>
          <ul style={{ paddingLeft: "1.1rem", margin: "0.6rem 0 0.8rem", color: "var(--color-text)", lineHeight: 1.55, fontSize: "0.92rem" }}>
            {e.bullets.map((b, j) => <li key={j} dangerouslySetInnerHTML={{ __html: highlight(b) }}></li>)}
          </ul>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
            {e.stack.map((s) => <span key={s} className="tag">{s}</span>)}
          </div>
        </li>
      ))}
    </ol>
  );
}

Object.assign(window, { Nav, Footer, ProjectCard, SectionLabel, Services, ContactCTA, ExperienceTimeline });
