export const site = {
  name: "Temesgen Gebreabzgi",
  shortName: "temesgen.dev",
  title: "Senior Software Engineer",
  subtitle: "Certified AI Engineer · Building scalable full-stack AI systems",
  location: "Addis Ababa, Ethiopia",
  tagline: "Turning ideas into intelligent solutions.",
  description:
    "Senior AI Software Engineer building scalable GenAI, RAG, and full-stack systems. Founding AI Engineer at Chronos.",
  email: "temesgengebreab33@gmail.com",
  phone: "+251918414543",
  cvPath: "/cv.pdf",
  avatarPath: "/avatar.jpg",
  formspreeId: "mqadaepr",
} as const;

export const socials = [
  { label: "GitHub", href: "https://github.com/temesgen5335" },
  { label: "LinkedIn", href: "https://linkedin.com/in/temesgen-gebreabzgi" },
  { label: "X", href: "https://twitter.com/temesgen5335" },
  { label: "Email", href: "mailto:temesgengebreab33@gmail.com" },
] as const;

export const nav = [
  { label: "experience", href: "/experience" },
  { label: "projects", href: "/projects" },
  { label: "about", href: "/about" },
  { label: "blog", href: "/blog" },
  { label: "contact", href: "/contact" },
] as const;

export const services = [
  {
    title: "AI systems & agents",
    body: "RAG pipelines, tool-using agents, domain copilots. Prototyped to production.",
  },
  {
    title: "LLM integration",
    body: "Multi-provider routing, prompt engineering, evaluation harnesses, cost/latency tuning.",
  },
  {
    title: "Full-stack web",
    body: "Next.js / Astro / Svelte frontends with FastAPI or Node backends. Auth, Postgres, deploys.",
  },
  {
    title: "Technical consulting",
    body: "Architecture reviews, ML/AI feasibility studies, data pipeline design.",
  },
] as const;
