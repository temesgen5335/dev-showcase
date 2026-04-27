# claude-portfolio

Personal portfolio for **Temesgen Gebreabzgi** — AI Software Engineer.

Built with Astro 5 + TypeScript + Tailwind v4. Content lives in typed MDX content
collections so everything is queryable at build time. A single `portfolio-info.md`
is the source of truth and is also injected into the "Ask my portfolio" chatbot's
system prompt at runtime.

## Stack

- Astro 5 (server output, Vercel adapter)
- TypeScript (strict)
- Tailwind CSS v4 (via `@tailwindcss/vite`)
- MDX content collections with Zod schemas
- React 19 (used only for the `ChatWidget` island)
- Vercel AI SDK v6 with multi-provider support:
  Groq → OpenAI → Gemini → Anthropic (first `*_API_KEY` found wins)

## Getting started

```bash
cp .env.example .env          # add at least one LLM provider key
npm install
npm run dev                   # http://localhost:4321
```

Build & preview locally:

```bash
npm run build
npm run preview
```

## Chatbot provider priority

The server looks for env vars in this order and uses the first key it finds:

1. `GROQ_API_KEY` (default model: `llama-3.3-70b-versatile`)
2. `OPENAI_API_KEY` (default: `gpt-4o-mini`)
3. `GEMINI_API_KEY` (default: `gemini-2.0-flash`)
4. `ANTHROPIC_API_KEY` (default: `claude-sonnet-4-6`)

Override with `LLM_PROVIDER=groq|openai|gemini|anthropic` or set a specific
`*_MODEL` env var. See `.env.example` for all knobs.

The chatbot's system prompt is built at runtime from `portfolio-info.md` —
so updating that file updates the chatbot's knowledge automatically.

## Content

| File | Purpose |
|---|---|
| `portfolio-info.md` | Canonical bio / CV / project data. Also the chatbot's knowledge base. |
| `src/content/experience/*.mdx` | One MDX per role. Typed frontmatter via Zod. |
| `src/content/projects/*.mdx` | One MDX per project. Featured flag controls home page. |
| `src/content/posts/*.mdx` | Blog posts (drafts excluded from index). |
| `src/data/site.ts` | Name, links, nav, services. |
| `src/data/skills.ts` | Skill groups, education, certifications. |

## Deploy

Deploys cleanly to **Vercel**:

```bash
vercel --prod
```

Set the LLM provider env vars in the Vercel project settings. SSR is required
for `/api/chat` — no extra config needed beyond the Astro Vercel adapter.

## Structure

```
src/
├── content/           # MDX collections (experience, projects, posts)
├── components/        # Astro + ChatWidget.tsx React island
├── layouts/Base.astro
├── lib/
│   ├── llm.ts         # multi-provider AI SDK selector
│   └── context.ts     # system prompt builder
├── pages/
│   ├── index.astro
│   ├── experience.astro
│   ├── projects/[index,[...slug]].astro
│   ├── blog/[index,[...slug]].astro
│   ├── about.astro
│   ├── contact.astro
│   └── api/chat.ts    # POST, SSR, streams tokens
├── data/{site,skills}.ts
└── styles/global.css
```
