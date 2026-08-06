# CLAUDE.md — temesgen.dev

Personal portfolio site for **Temesgen Gebreabzgi** (AI Software Engineer). This file is the durable context for any agent/session — read it first, keep it current.

---

## ⚠️ Maintenance rule (read this every session)

**Whenever you make a non-trivial change to this repo, update the relevant section of this file in the same change.** That includes:

- Adding/removing/renaming a dependency, page, route, component, content collection field, env var, or data file.
- Changing the LLM provider list, chatbot system prompt rules, or the design tokens in `src/styles/global.css`.
- Introducing a new convention (e.g., a new way to add projects, a new image folder layout, a new util in `src/lib/`).
- Anything that would surprise the next session if it weren't documented here.

If a change doesn't fit any existing section, add a new one. If a section becomes wrong, fix it — don't leave stale facts. Treat this file like the single source of truth a teammate would skim before opening a PR.

The companion `portfolio-info.md` at the root is the **content** source of truth (bio, projects, CV) and is also fed into the chatbot's system prompt at runtime. Keep CLAUDE.md for the *code/architecture* truth; keep `portfolio-info.md` for the *résumé/bio* truth. They serve different consumers.

---

## What this site is

- A single-author professional portfolio: hero, featured work, experience timeline, project case studies, about, contact, blog, and a floating "ask my portfolio" chatbot grounded on Temesgen's CV.
- Deployed to **Vercel** at `https://temesgen.dev` with SSR enabled (chatbot needs server output).

## Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **Astro 5** (`output: "server"`, Vercel adapter) | Static-first, but SSR for `/api/chat`. |
| Language | TypeScript (strict, via `astro/tsconfigs/strict`) | Strict mode + Zod for content schemas. |
| Styling | **Tailwind CSS v4** (via `@tailwindcss/vite`) + a small `@theme` token block + a handful of `@layer components` utilities in `src/styles/global.css` | Tokens (colors, fonts) live in CSS, not `tailwind.config`. There is no `tailwind.config.js`. |
| UI islands | **React 19** (only for `ChatWidget.tsx`) | Every other component is `.astro` and ships zero JS by default. |
| Content | **Astro Content Collections** with Zod (`src/content.config.ts`) — projects, experience, posts, medium | MDX bodies + a Medium RSS loader. |
| LLM | **Vercel AI SDK v6** with multi-provider routing (Groq → OpenAI → Gemini → Anthropic) | First `*_API_KEY` found wins; `LLM_PROVIDER` overrides; per-provider model env vars. |
| Forms | **Formspree** (`formspreeId` in `src/data/site.ts`) | No backend for the contact form. |
| Deploy | Vercel (`@astrojs/vercel`) | SSR adapter; envs configured in Vercel project. |

Path alias: `@/*` → `src/*` (configured in `tsconfig.json`).

## Repository layout

```
temesgen.dev/
├── CLAUDE.md                 ← you are here
├── portfolio-info.md         ← canonical bio + injected into chatbot system prompt
├── HERO_PROMPT.md            ← scratch notes for the hero design (gitignored)
├── astro.config.mjs          ← server output, Vercel adapter, mdx + react + tailwind
├── tsconfig.json             ← strict, jsx: react-jsx, @/* alias
├── package.json              ← dev / build / preview / check (`astro check`)
├── public/
│   ├── avatar.jpg, cv.pdf
│   └── projects/*.png|jpg    ← project covers & galleries
└── src/
    ├── content.config.ts     ← Zod schemas for projects, experience, posts
    ├── content/
    │   ├── projects/*.mdx    ← one file per project, `featured: true` → home page
    │   ├── experience/*.mdx  ← one file per role, ordered by `order`
    │   └── posts/*.mdx       ← blog; `draft: true` hides from index
    ├── data/
    │   ├── site.ts           ← name, title, socials, nav, services, formspreeId
    │   └── skills.ts         ← skillGroups, certifications, education
    ├── layouts/Base.astro    ← <html>, fonts, Nav, Footer, ChatWidget (client:idle)
    ├── components/
    │   ├── Hero.astro            ← interactive starfield + type-in role + cursor parallax
    │   ├── Nav.astro             ← sticky, blur, active-path styling
    │   ├── Footer.astro
    │   ├── ProjectCard.astro     ← used on home + /projects
    │   ├── Gallery.astro         ← thumbnail grid + fullscreen <dialog> lightbox
    │   ├── ExperienceTimeline.astro  ← regex-bolds numbers in bullets
    │   ├── SkillsGrid.astro
    │   ├── Services.astro
    │   ├── ContactCTA.astro
    │   └── ChatWidget.tsx        ← the ONLY React island
    ├── lib/
    │   ├── llm.ts             ← multi-provider AI SDK selector + chatStream()
    │   └── context.ts         ← reads portfolio-info.md and builds the system prompt
    ├── loaders/
    │   └── medium.ts          ← Astro 5 content loader: fetches medium.com/feed/@<handle> at build
    ├── pages/
    │   ├── index.astro        ← Hero + featured projects + Services + ContactCTA
    │   ├── about.astro        ← bio + SkillsGrid + education + certifications
    │   ├── experience.astro
    │   ├── contact.astro      ← Formspree form + socials + availability card
    │   ├── projects/index.astro
    │   ├── projects/[...slug].astro   ← prerender: true, getStaticPaths from collection
    │   ├── blog/index.astro
    │   ├── blog/[...slug].astro       ← prerender: true
    │   └── api/chat.ts        ← POST, SSR (prerender: false), streams tokens
    └── styles/global.css      ← @theme tokens + @layer components (.container-x, .card, .btn, .tag, .mono)
└── .claude/
    ├── settings.local.json   ← local Bash allowlist
    └── skills/temesgen.dev Design System/   ← design-system skill (colors, type, UI kit, previews)
```

## Conventions & implementation standards

### Components

- **Astro by default, React only when interactivity demands it.** Today that means only `ChatWidget.tsx`. Don't introduce a React component for something Astro + a `<script>` can do.
- **Inline `style="…"` on Astro components is intentional** throughout the codebase. We use Tailwind for tokens (`var(--color-…)`) and a few utility classes (`.container-x`, `.card`, `.btn`, `.tag`, `.mono`), but most layout/spacing is inline. Don't refactor inline styles to Tailwind classes without a reason — match the existing pattern.
- Components that ship JS use the pattern in `Hero.astro`: a self-contained IIFE `<script>` tag that progressively enhances, with a `prefers-reduced-motion` early return and a `.js` class gate so the no-JS state still looks right.
- `ChatWidget` is mounted in `Base.astro` with `client:idle` (not `client:load`) — keep it that way to protect first paint.

#### `Gallery.astro` (image previews)

Used by `src/pages/projects/[...slug].astro` for the `// gallery` block. Props: `images: string[]`, `title: string`, `label?: string` (defaults to `"// gallery"`). Renders nothing when `images` is empty, so it's safe to pass an empty array.

- **Progressive enhancement:** every thumbnail is a real `<a href="{src}" target="_blank">`, so with JS off the click opens the raw asset. The script upgrades that into a native `<dialog>` lightbox and adds a `.js` class to the root — CSS that describes JS-only affordances (the `⤢` badge, the "click to expand" hint) is gated behind `[data-gallery].js`.
- **Why native `<dialog>`:** free ESC handling, focus trap, and `::backdrop`. Astro's scoped-style hashing passes `::backdrop` through correctly (verified in build output).
- **Two view modes:** fit-to-viewport by default, and a 1:1 pan/scroll mode toggled by clicking the image (`.is-zoomed` on the stage). The screenshots are ~3000px-wide full-page captures where the text is the point, so contain-fit alone is unreadable. Every navigation resets to fit.
- Arrow-key navigation is bound to `document` and gated on `dialog.open`, not bound to the dialog — clicking the non-focusable image can move focus out of the dialog subtree. ESC is left to the browser.
- Body scroll is locked on open and restored in the single `close` handler, which also restores focus to the thumbnail that opened it. Neighbouring images are preloaded on `show()`.
- **Don't put `display: none` in an inline `style` on elements whose visibility the `.js` gate controls** — inline styles outrank the scoped stylesheet and the gate silently stops working.
- The project detail page falls back to `[cover]` when `gallery` is empty, so cover-only projects still get a preview: `const shots = d.gallery.length > 0 ? d.gallery : d.cover ? [d.cover] : [];`

### Styles & design tokens

- **Aesthetic direction**: futuristic / space-traveler with a cyber-punk lean. Current implementation is still mostly minimalist dark + sky-blue accent (`#7dd3fc`), but new visual treatments should pull in that direction — warm cosmic golds/ambers, neon-but-restrained highlights, subtle glows over flat color. The sky-blue `--color-accent` is the legacy default; prefer introducing scoped accent variants (gold, plasma teal, etc.) inside individual components rather than redefining the global token, until the broader theme refresh lands.
- Tokens live in `src/styles/global.css` inside `@theme { ... }`. Colors, fonts, and spacing read off these CSS variables (`--color-bg`, `--color-accent`, etc.). Adding a new color or font? Add it there, not in component styles.
- Component-shape utilities (`.card`, `.btn`, `.btn-primary`, `.tag`, `.mono`, `.container-x`) are defined in `@layer components`. Reuse them; don't reimplement.
- Fonts are loaded from Google Fonts in `Base.astro` head: **Inter** (sans) + **IBM Plex Mono** (mono). Headings use mono; body uses sans. Section labels follow the `// section` mono-muted pattern.
- A more complete design language (palette, type scale, voice, UI kit previews) lives in the `.claude/skills/temesgen.dev Design System/` skill — invoke it via the Skill tool when generating new UI or brand-aligned mocks.

### Content

- **Adding a project:** create `src/content/projects/<slug>.mdx`. Required frontmatter: `title`, `summary`. Optional but commonly used: `tags`, `stack`, `githubUrl`, `liveUrl`, `cover`, `gallery`, `featured`, `order`, `impact`. See `src/content.config.ts` for the full Zod schema.
- **Home page surfaces only `featured: true` projects.** `order: 1` floats to the top of both home + `/projects`.
- Project screenshots live in `/public/projects/` and are referenced as `/projects/<file>` in MDX. Name them `<slug>-1.png`, `<slug>-2.png`, … — older files use the unhyphenated `<slug>1.png` form (`chronos1.png`, `hook-lab2.png`); the hyphenated form is what to use for anything new. Never leave loose screenshots at the root of `/public/` and never keep spaces in filenames.
- Every entry in `gallery` is rendered by `Gallery.astro` as a click-to-fullscreen preview — list all the shots you have, not just two or three, since the grid is the index and the lightbox is where they're actually read. `cover` is normally `gallery[0]`; it's cropped to 16/9 in `ProjectCard`, so pick a shot that survives a centre crop.
- **Adding experience:** create `src/content/experience/<slug>.mdx` with `company`, `role`, `location`, `startDate`, `endDate`, `bullets`, `stack`, `order`. The timeline auto-bolds any number/percent/`Nx` in bullets — write impact numbers as plain text.
- **Blog posts (MDX):** `draft: true` excludes them from `/blog`. `publishDate` is coerced with `z.coerce.date()`, so `YYYY-MM-DD` strings are fine.
- **Blog posts (Medium):** pulled from `https://medium.com/feed/@temesgen5335` at build time via `src/loaders/medium.ts` into the `medium` collection. `/blog/index.astro` merges MDX + Medium entries and sorts by date; Medium entries link out to medium.com in a new tab with a `medium ↗` badge. **No detail page for Medium posts** — RSS bodies are truncated, so we deep-link. To change the handle, edit `mediumLoader({ handle: "@..." })` in `src/content.config.ts`. To add another author/publication, instantiate a second loader and add another collection. If Medium is unreachable at build time the loader logs a warning and continues with zero posts (the build does not fail).

### Data files

- `src/data/site.ts` — name, title, subtitle, location, email, phone, CV path, avatar path, Formspree ID, `socials`, `nav`, `services`. **All three pieces (`site`, `socials`, `nav`, `services`) are `as const` and exported by name** — keep that shape so consumers stay typed.
- `src/data/skills.ts` — `skillGroups`, `certifications`, `education`. Same `as const` pattern.

### LLM chatbot (`/api/chat`)

- `src/lib/llm.ts` defines provider priority: **Groq → OpenAI → Gemini → Anthropic**. The first env key found wins unless `LLM_PROVIDER=<name>` is set.
- `chatStream()` tries candidates in order — if one throws on the first read, it falls back to the next (logged via `console.warn`).
- `src/lib/context.ts` reads `portfolio-info.md` from `process.cwd()` (cached) and builds the system prompt. **Updating `portfolio-info.md` updates the chatbot's knowledge — no rebuild needed beyond a server restart that clears the cache.**
- System-prompt rules in `buildSystemPrompt()`: third person, ground answers only in `portfolio-info.md`, suggest email for unknowns, never invent facts, <150 words default.
- `src/pages/api/chat.ts` validates with Zod (`messages: [{role: 'user'|'assistant', content: 1..4000}]`, 1..20 messages), streams `text/plain`, sets `x-llm-provider` and `x-llm-model` response headers, has `prerender = false`.
- **Client-side chat persistence** (`src/components/ChatWidget.tsx`): conversation is mirrored to `localStorage` under the key `temesgen-chat-v1` with a **rolling 24h TTL** — every interaction extends `expiresAt` by 24h. On mount the widget hydrates from storage after the initial render (SSR-safe; greeting is rendered on the server, history appears in the first client effect). A `clear` button in the header (visible only when there's more than the greeting) wipes both state and storage. No server-side storage of visitor chats — everything stays per-browser-profile.
- Errors: `ProviderUnavailableError` → 503 with the canned message; any other throw → 502.

### Routing

- Dynamic project + blog routes use `getStaticPaths` and `export const prerender = true` — those pages are statically generated at build, even though the site is `output: "server"`.
- `/api/chat` is the only SSR endpoint (`prerender = false`).

### Environment variables

- Local: `.env` (gitignored). Template: `.env.example`.
- Required for chatbot: at least one of `GROQ_API_KEY`, `OPENAI_API_KEY`, `GEMINI_API_KEY`, `ANTHROPIC_API_KEY`.
- Optional: `LLM_PROVIDER`, `GROQ_MODEL`, `OPENAI_MODEL`, `GEMINI_MODEL`, `ANTHROPIC_MODEL`.
- In production, set these in Vercel project settings (not committed).

### Scripts

- `npm run dev` — Astro dev server at http://localhost:4321
- `npm run build` — production build
- `npm run preview` — preview the built site
- `npm run check` — `astro check` (typecheck content + components)

There is **no test suite** and **no linter configured**. The bar before committing is `npm run check` cleanly + a manual eyeball of the affected page.

## Git & deploy

- Default branch: `master`.
- Vercel deploys on push. `.vercel/` is committed; `.env` and `.claude/` are gitignored.
- The `dist/` directory is a leftover local build artifact and is gitignored.
- **Refreshing Medium posts:** the Medium feed is fetched only at build time. After publishing a new post on Medium, trigger a redeploy: push an empty commit (`git commit --allow-empty -m "refresh medium feed" && git push`) or click "Redeploy" in the Vercel dashboard. Automation (deploy hook + scheduled cron) is intentionally deferred until post cadence justifies it.

## Things to NOT do (collected gotchas)

- Don't add a `tailwind.config.js` — Tailwind v4 here is configured purely via `@theme` in `global.css`.
- Don't switch `ChatWidget` to `client:load` — it tanks LCP.
- Don't hardcode model IDs in `src/lib/llm.ts` defaults; respect the env-override pattern.
- Don't write to `.claude/` expecting it to be committed — that directory is gitignored.
- Don't break the `portfolio-info.md` → chatbot pipeline by relocating that file without updating `src/lib/context.ts`.
- Don't introduce a React component for something a `.astro` file can render. The island budget is intentionally small.

## Open / known follow-ups

_(Update this list as work happens — remove items when done, add new ones when you discover them.)_

- **Project screenshots are unoptimized full-resolution PNGs.** `/public/projects/` holds several multi-MB files (`chronos1.png` 4.6MB, `portfolio-1.png` 4.9MB, `loha-advertising-3.png` 2.7MB); the LOHA gallery alone is ~7.5MB across four shots. They're `loading="lazy"` so they don't block first paint, and the lightbox reuses the same URLs so expanding costs nothing extra — but the gallery grid still eventually pulls full-size assets to render 18rem-wide thumbnails. Fix by moving project images into `src/assets/` and rendering through `astro:assets` `<Image />`, which gets responsive `srcset` + WebP conversion at build; `Gallery.astro` would take `ImageMetadata[]` instead of `string[]` and the MDX frontmatter would use `image()` from the content schema. Deferred because it touches every project MDX file at once.
- **Disable AI SDK internal retries in `src/lib/llm.ts`.** Pass `maxRetries: 0` to the `streamText({...})` call inside `chatStream()`. Reason: the SDK currently retries 3× with exponential backoff before our outer try/catch fires, so a failing provider (e.g., Gemini 429 quota) blocks the response for ~5–10s before the loop moves to the next candidate. With 2–4 failing providers stacked, the user sees a 20–40s hang before a 502. Our outer for-loop is already the only retry layer that matters, so `maxRetries: 0` is the right primitive — falls through to the next provider in roughly one round-trip. While in there, also enrich the `console.warn` in the catch block to include `err.cause?.statusCode` / first nested error message so quota-vs-transient is one log line instead of a stack trace.
