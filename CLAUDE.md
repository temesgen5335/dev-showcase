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

> ⚠️ **`CLAUDE.md` and `AGENTS.md` are byte-identical twins — edit one, regenerate the other in the same change.** `CLAUDE.md` is Claude Code's entry point; `AGENTS.md` is the tool-agnostic one. They differ only in the title, the "you are here" line, the `Keep <file> for the` sentence, and the design-system skill path. Regenerate with:
> ```sh
> sed -e 's/^# CLAUDE\.md — temesgen\.dev$/# AGENTS.md — temesgen.dev/' \
>     -e 's/Keep CLAUDE\.md for the/Keep AGENTS.md for the/' \
>     -e 's|^├── CLAUDE\.md                 ← you are here$|├── AGENTS.md                 ← you are here|' \
>     -e 's|`\.claude/skills/temesgen\.dev Design System/`|`.agents/skills/temesgen.dev Design System/` (mirrored at `.claude/skills/` for Claude Code)|' \
>     CLAUDE.md > AGENTS.md
> ```
> This drift is not hypothetical: `AGENTS.md` was once 56 lines behind and contained **none** of a session's documented work. `wc -l CLAUDE.md AGENTS.md` should always match. If maintaining two copies stops being worth it, collapse one into a one-line pointer at the other rather than letting them diverge.

The companion `portfolio-info.md` at the root is the **content** source of truth (bio, projects, CV) and is also fed into the chatbot's system prompt at runtime. Keep CLAUDE.md for the *code/architecture* truth; keep `portfolio-info.md` for the *résumé/bio* truth. They serve different consumers.

---

## What this site is

- A single-author professional portfolio: hero, featured work, experience timeline, project case studies, about, contact, blog, and a floating "ask my portfolio" chatbot grounded on Temesgen's CV.
- Deployed to **Vercel** at `https://temesgen.dev` with SSR enabled (chatbot needs server output).

## Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **Astro 5** (`output: "static"` + `prefetch`, Vercel adapter) | Static-first, but SSR for `/api/chat`. |
| Language | TypeScript (strict, via `astro/tsconfigs/strict`) | Strict mode + Zod for content schemas. |
| Styling | **Tailwind CSS v4** (via `@tailwindcss/vite`) + a small `@theme` token block + a handful of `@layer components` utilities in `src/styles/global.css` | Tokens (colors, fonts) live in CSS, not `tailwind.config`. There is no `tailwind.config.js`. |
| UI islands | **React 19** (only for `ChatWidget.tsx`) | Every other component is `.astro` and ships zero JS by default. |
| Content | **Astro Content Collections** with Zod (`src/content.config.ts`) — projects, experience, posts, medium | MDX bodies + a Medium RSS loader. |
| LLM | **Vercel AI SDK v6** with multi-provider routing (Groq → OpenAI → Gemini → Anthropic) | First `*_API_KEY` found wins; `LLM_PROVIDER` overrides; per-provider model env vars. |
| Forms | **Formspree** (`formspreeId` in `src/data/site.ts`) | No backend for the contact form. |
| Images | **`astro:assets`** — sources in `src/assets/projects/`, rendered via `<Image />` / `getImage()` | Build-time WebP + responsive `srcset`. Nothing image-shaped belongs in `public/`. |
| Fonts | **Self-hosted** via `experimental.fonts` + `<Font>` | No render-blocking request to fonts.googleapis.com. |
| Deploy | Vercel (`@astrojs/vercel`) | Static CDN output; the adapter's function serves only `/api/chat`. Envs configured in Vercel project. |

Path alias: `@/*` → `src/*` (configured in `tsconfig.json`).

## Repository layout

```
temesgen.dev/
├── CLAUDE.md                 ← you are here
├── portfolio-info.md         ← canonical bio + injected into chatbot system prompt
├── HERO_PROMPT.md            ← scratch notes for the hero design (gitignored)
├── astro.config.mjs          ← static output, hover prefetch, Vercel adapter, mdx + react + tailwind
├── tsconfig.json             ← strict, jsx: react-jsx, @/* alias
├── package.json              ← dev / build / preview / check (`astro check`)
├── integrations/
│   └── prune-unreferenced-images.mjs  ← build hook, drops originals Vite emits but nothing uses
├── public/
│   └── avatar.jpg, cv.pdf   ← only assets needing a stable, un-hashed URL
└── src/
    ├── assets/
    │   └── projects/*.png|jpg  ← project covers & galleries, optimized by astro:assets
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

**`integrations/` is build-critical and lives outside `src/`.** `astro.config.mjs` imports `./integrations/prune-unreferenced-images.mjs` at config load, so if that file is missing the build fails before it starts. It is easy to miss when staging changes — confirm `git status` has no untracked file under `integrations/` before pushing a deploy.

## Conventions & implementation standards

### Components

- **Astro by default, React only when interactivity demands it.** Today that means only `ChatWidget.tsx`. Don't introduce a React component for something Astro + a `<script>` can do.
- **Inline `style="…"` on Astro components is intentional** throughout the codebase. We use Tailwind for tokens (`var(--color-…)`) and a few utility classes (`.container-x`, `.card`, `.btn`, `.tag`, `.mono`), but most layout/spacing is inline. Don't refactor inline styles to Tailwind classes without a reason — match the existing pattern.
- Components that ship JS use the pattern in `Hero.astro`: a self-contained IIFE `<script>` tag that progressively enhances, with a `prefers-reduced-motion` early return and a `.js` class gate so the no-JS state still looks right.
- `ChatWidget` is mounted in `Base.astro` with `client:idle` (not `client:load`) — keep it that way to protect first paint.

#### `Gallery.astro` (image previews)

Used by `src/pages/projects/[...slug].astro` for the `// gallery` block. Props: `images: ImageMetadata[]`, `title: string`, `label?: string` (defaults to `"// gallery"`). Renders nothing when `images` is empty, so it's safe to pass an empty array.

- **Two derivatives per image, which is why it takes `ImageMetadata` and not a URL string.** The grid renders `<Image widths={[400, 800]} />`; the lightbox needs full resolution, so the component also calls `getImage()` per image and points the `<a href>` at that. A 2.6MB source PNG becomes ~10KB (400w), ~29KB (800w), and ~200KB (full) — so the grid is ~100× lighter than it was and the full file is fetched only when someone actually opens the lightbox.
- **`width={800}` on the grid `<Image>` is load-bearing.** With only `widths`, Astro emits the plain `src` fallback at full resolution, duplicating the lightbox derivative for no gain — srcset-aware browsers never fetch `src`. Capping it dropped 38 files and ~4.5MB from the build.
- **Progressive enhancement:** every thumbnail is a real `<a href="{fullWebp}" target="_blank">`, so with JS off the click opens the optimized full-size image. The script upgrades that into a native `<dialog>` lightbox and adds a `.js` class to the root — CSS that describes JS-only affordances (the `⤢` badge, the "click to expand" hint) is gated behind `[data-gallery].js`.
- The lightbox script reads its sources straight off the DOM (`a.getAttribute("href")`), which is exactly why the `href` carries the full-size derivative — **the script needed no changes at all across the `astro:assets` migration.** Keep that contract: whatever the `<a href>` points at is what the lightbox displays.
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
- Fonts are **self-hosted**, not loaded from Google's CDN: **Inter** (sans) + **IBM Plex Mono** (mono), declared in `astro.config.mjs` under `experimental.fonts` (still experimental as of Astro 5.18) and rendered by two `<Font cssVariable="…" preload />` tags in the `Base.astro` head. Astro downloads and subsets them at build and serves them from `/_astro/fonts/`, so there's no third-party round trip before first paint. Headings use mono; body uses sans. Section labels follow the `// section` mono-muted pattern.
  - `--font-sans` / `--font-mono` in `@theme` point at the `--font-inter` / `--font-ibm-plex-mono` variables the `<Font>` component emits. **Adding a family means all three steps** — config entry, `<Font>` tag in `Base.astro`, and the `@theme` token — or the token resolves to nothing.
  - Each family sets `fallbacks` explicitly. IBM Plex Mono's **must stay monospace**: Astro's default fallback chain is `sans-serif` metric-matched against Arial, which would swap every mono heading into a proportional face while the font loads.
- A more complete design language (palette, type scale, voice, UI kit previews) lives in the `.claude/skills/temesgen.dev Design System/` skill — invoke it via the Skill tool when generating new UI or brand-aligned mocks.

### Content

- **Adding a project:** create `src/content/projects/<slug>.mdx`. Required frontmatter: `title`, `summary`. Optional but commonly used: `tags`, `stack`, `githubUrl`, `liveUrl`, `cover`, `gallery`, `featured`, `order`, `impact`. See `src/content.config.ts` for the full Zod schema.
- **Home page surfaces only `featured: true` projects.** `order: 1` floats to the top of both home + `/projects`.
- **Project screenshots live in `src/assets/projects/` — NOT `public/`** — and are referenced from MDX by **relative path**: `cover: "../../assets/projects/<file>"`. `cover` and `gallery` are typed with `image()` in `src/content.config.ts`, so they resolve to `ImageMetadata` and get build-time WebP + responsive `srcset`. An absolute `/projects/<file>` path will fail the schema at build — that's the pre-`astro:assets` form and no longer valid.
  - Anything that must keep a stable, un-hashed URL stays in `public/`: `avatar.jpg` (favicon + `og:image`) and `cv.pdf`. `astro:assets` content-hashes filenames, which is wrong for an OG image an external scraper caches.
  - Name them `<slug>-1.png`, `<slug>-2.png`, … — older files use the unhyphenated `<slug>1.png` form (`chronos1.png`, `hook-lab2.png`); the hyphenated form is what to use for anything new. Never keep spaces in filenames.
  - Drop the raw screenshot in at full resolution. Don't pre-compress or pre-resize — the build emits a 400w and an 800w WebP for the grid plus one full-resolution WebP for the lightbox, and hand-shrinking the source only starves those derivatives.
  - **Dev and production serve images by different mechanisms.** `npm run dev` optimizes on demand through the `/_image?href=…` endpoint; the build pre-generates hashed files into `_astro/*.webp`. Same output, different request path — so never read dev-server image timings or URLs as production behaviour, and expect the URLs in dev HTML not to match a built page.
- Every entry in `gallery` is rendered by `Gallery.astro` as a click-to-fullscreen preview — list all the shots you have, not just two or three, since the grid is the index and the lightbox is where they're actually read. `cover` is normally `gallery[0]`; it's cropped to 16/9 in `ProjectCard`, so pick a shot that survives a centre crop.
- **Adding experience:** create `src/content/experience/<slug>.mdx` with `company`, `role`, `location`, `startDate`, `endDate`, `bullets`, `stack`, `order`. The timeline auto-bolds any number/percent/`Nx` in bullets — write impact numbers as plain text.
- **Blog posts (MDX):** `draft: true` excludes them from `/blog`. `publishDate` is coerced with `z.coerce.date()`, so `YYYY-MM-DD` strings are fine.
- **Blog posts (Medium):** pulled from `https://medium.com/feed/@temesgen5335` at build time via `src/loaders/medium.ts` into the `medium` collection. `/blog/index.astro` merges MDX + Medium entries and sorts by date; Medium entries link out to medium.com in a new tab with a `medium ↗` badge. **No detail page for Medium posts** — RSS bodies are truncated, so we deep-link. To change the handle, edit `mediumLoader({ handle: "@..." })` in `src/content.config.ts`. To add another author/publication, instantiate a second loader and add another collection. If Medium is unreachable at build time the loader logs a warning and continues with zero posts (the build does not fail).

### Data files

- `src/data/site.ts` — name, title, subtitle, location, email, phone, CV path, avatar path, Formspree ID, `socials`, `nav`, `services`. **All three pieces (`site`, `socials`, `nav`, `services`) are `as const` and exported by name** — keep that shape so consumers stay typed.
- `src/data/skills.ts` — `skillGroups`, `certifications`, `education`. Same `as const` pattern.

### LLM chatbot (`/api/chat`)

- `src/lib/llm.ts` defines provider priority: **Groq → Gemini → OpenAI → Anthropic**. Only providers with a non-empty key become candidates. `LLM_PROVIDER=<name>` moves that provider first — it does **not** disable the others.
- **Each provider carries an ordered `models` list, not one model, and all of a provider's models are tried before moving to the next provider.** A retired model ID therefore costs one extra round trip instead of dropping the provider. Capped at `MAX_MODELS_PER_PROVIDER` (3), so worst case is 4 providers × 3 ≈ 12 attempts; at `maxRetries: 0` each failure is roughly one round trip.
  - `*_MODEL` env vars accept a **comma-separated list** (`GROQ_MODEL=openai/gpt-oss-20b,openai/gpt-oss-120b`). Env-named models are tried first and the built-in list follows as backup, deduped — so a stale `.env` value degrades to one wasted attempt rather than an outage.
  - The `[llm]` warning names what happens next — `trying groq/<next>` (same provider) vs `switching to gemini/<model>` — so "this model is dead" reads differently from "this provider is dead".
  - **Verified against the live keys (2026-08-17):** `openai/gpt-oss-20b`, `openai/gpt-oss-120b` (Groq) and `gemini-3-flash-preview` (Gemini). The `qwen/qwen3.6-27b`, `gpt-4o-mini`, `claude-sonnet-5`, and `claude-haiku-4-5` entries are **unverified** — Qwen is listed but unexercised, and the OpenAI/Anthropic keys are empty strings so those providers never load.
  - `gemini-2.5-flash` is **deliberately absent**: it appears in this key's model list but is refused with "no longer available to new users". Presence in a provider's catalog is not proof of access for a given key.
- `chatStream()` tries candidates in order and **reads `result.fullStream`, not `result.textStream`** — this is load-bearing. The AI SDK delivers a provider failure as a `{ type: "error" }` stream part; `textStream` swallows it and just ends. The old code probed `textStream`'s first read, saw a clean end-of-stream, treated it as success, and returned **200 with an empty body** — so failover never engaged once and a retired model looked like the assistant silently answering nothing. It now commits to a provider only after that provider emits real text, and treats "no text at all" as a failure worth failing over.
- `streamText` is called with `maxRetries: 0`. The candidate loop is the only retry layer that matters; the SDK default (retries with exponential backoff) stalled the response ~5-10s per dead provider first.
- **Model IDs rot, and a stale one is indistinguishable from a broken chatbot.** Groq retired the entire Llama line and Google retired `gemini-2.0-flash`/`gemini-2.5-flash` (the latter is 404 "not available to new users" on newer keys) — that combination is what took the chatbot down. When a model 404s, ask the key what it can actually reach rather than guessing a successor:
  - `curl -s https://api.groq.com/openai/v1/models -H "Authorization: Bearer $GROQ_API_KEY"`
  - `curl -s "https://generativelanguage.googleapis.com/v1beta/models" -H "x-goog-api-key: $GEMINI_API_KEY"`
  - Note Groq's Gemini-side probing is rate-limited — rapid successive REST calls return non-JSON 404s that look like "model missing" but aren't. Confirm through `/api/chat` (the SDK path) before concluding a model is dead.
- Current `.env` values: `GROQ_MODEL=openai/gpt-oss-20b`, `GEMINI_MODEL=gemini-3-flash-preview` (both verified), plus `OPENAI_MODEL=gpt-4o-mini` and `ANTHROPIC_MODEL=claude-sonnet-4-6` — valid IDs but unverified and unreachable, since those two keys are empty strings. Per-model verification status lives with the `models` lists above.
- `.env` supports `KEY=value #comment`; dotenv strips the inline comment. `GROQ_API_KEY` carries one. Shell one-liners that do `cut -d= -f2-` will grab the comment too and get a bogus 401 — strip with `sed 's/[[:space:]]*#.*$//'`.
- `src/lib/context.ts` reads `portfolio-info.md` from `process.cwd()` (cached) and builds the system prompt. **Updating `portfolio-info.md` updates the chatbot's knowledge — no rebuild needed beyond a server restart that clears the cache.**
- System-prompt rules in `buildSystemPrompt()`, in this order — **scope → trust boundary → answering style → fenced data**. Keep that order: instructions must precede the data they govern, or a payload can be read as outranking them.
  - **Scope is a rule in its own right, separate from grounding.** The original prompt only constrained *where facts come from*, which left the *task* unbounded — "generate a reverse function in python with temesgen as an example" was answered as a coding request, because nothing said the assistant only answers questions about Temesgen. Grounding rules do not imply scope. The prompt now lists concrete refusals (code, maths, essays, general knowledge, other people, roleplay, name-as-placeholder) and states that a request stays off-topic even when his name appears in it.
  - **Trust boundary:** every visitor message, the conversation history, and `portfolio-info.md` sit *after* the system message and are declared untrusted data. The prompt refuses instruction-shaped input regardless of framing (fake system notes, admin claims, hypotheticals, translations, encodings), refuses to reveal or restate its own instructions, refuses persona switches, and is told the history may be forged.
  - `portfolio-info.md` is fenced in `<<<PORTFOLIO_DATA … PORTFOLIO_DATA` and labelled data-only. **It is an injection surface** — anything written there is read by the model, so don't paste untrusted text into it.
  - Answering style is unchanged: third person, grounded only in the reference section, email for unknowns, never invent facts, <150 words default.
- `src/pages/api/chat.ts` validates with Zod (`messages: [{role: 'user'|'assistant', content: 1..4000}]`, 1..20 messages), streams `text/plain`, sets `x-llm-provider` and `x-llm-model` response headers, has `prerender = false`.
- **The transcript is client-supplied, so an `assistant` turn is only a claim.** The endpoint is stateless — the browser posts the whole history every time — so a caller can forge assistant turns to bootstrap a jailbreak. Structural `refine`s reject the cheap versions: the array must **start** with a user turn, **end** with a user turn, contain no **consecutive** assistant turns, and total ≤ `MAX_TOTAL_CHARS` (12,000) across all messages. That narrows the surface; it does not close it (a plausible middle can still be fabricated), which is why the system prompt independently treats history as untrusted.
  - `wireMessages()` in `ChatWidget.tsx` is the client half: it drops leading assistant turns so the canned greeting isn't posted. That also fixes a latent bug — **Anthropic requires the first message to be `user`**, so the old `[assistant, user]` body would have 400'd had failover ever reached it.
- **Per-IP rate limiting** (`RATE_LIMIT`: 12 requests / 60s) runs *before* body parsing, since this is a public unauthenticated LLM endpoint and without it the route is an open proxy onto the provider quota. It is **best-effort only**: the counter is an in-memory `Map`, so it resets on cold start and does not coordinate across concurrent function instances. Vercel WAF rate limiting is the durable fix — see the follow-ups.
- **Reasoning-tag stripping is a security control, not cosmetics.** `createReasoningStripper()` in `llm.ts` removes `<think>` / `<thinking>` blocks from the streamed text. gpt-oss on Groq normally emits reasoning as a separate stream part (which we ignore), but *intermittently* writes it into the text channel — observed leaking reasoning that quoted a prompt-injection attempt and discussed the rules, i.e. a prompt-extraction vector. It is sampling-dependent, so a single clean retry proves nothing. The stripper holds back partial tags across chunk boundaries (`<thi` + `nk>`) and drops an unterminated block at flush. Unit cases live in the session scratchpad pattern documented below; re-test with tags split one character at a time if you touch it.
- **Only real turns are ever sent or stored.** `send()` parks an empty assistant placeholder in state to drive the "…" indicator, and the persist effect fires on every state change — so `conversational()` filters empty-content and error-bubble (`error: true`) messages at all three boundaries: **load, persist, and send**. Skipping any one of them re-opens the bug below.
  - **Why it matters:** the API requires `content` to be 1..4000 chars. If a stream died before emitting a token (provider failure, or a dev-server restart mid-request), the empty placeholder got persisted, reloaded, and then sent — so *every* later message 400'd with a raw Zod error, permanently, until the visitor found the `clear` button. `loadStoredChat()` therefore **strips** bad messages rather than rejecting the whole history, which self-heals storage that's already poisoned.
  - Error bubbles are flagged `error: true` so our own "⚠️ …" copy never gets fed back into the model's context as if the assistant had said it.
  - A 200 whose body yields zero bytes is surfaced as an error bubble instead of a blank message.
- **"The chat button renders then disappears" is usually a content blocker, not a bug.** The launcher is a `position: fixed` pill in the bottom-right corner — the exact shape ad/annoyance filter lists target — so Arc's built-in blocking, uBlock Origin, or an Arc "zap" will remove or hide it moments after the server-rendered HTML paints. This was investigated once and cost real time; before touching hydration, run this in the browser console on the affected page:
  ```js
  (() => { const b = [...document.querySelectorAll('button')]
      .find(x => /ask my portfolio/i.test(x.getAttribute('aria-label') || ''));
    if (!b) return 'REMOVED FROM DOM — blocker or Arc zap, not a code bug';
    const cs = getComputedStyle(b), r = b.getBoundingClientRect();
    return (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0 || !r.width)
      ? 'HIDDEN BY CSS — blocker cosmetic filter' : 'VISIBLE — widget is fine'; })()
  ```
  Confirm in a private window with extensions disabled before debugging the island. Verified working: React hydrates the island (`islandHydrated: true`), throws no exceptions, and stays stable in both dev and the production build.
- **Beware `--virtual-time-budget` when verifying `client:idle` islands.** Headless-Chrome `--dump-dom` runs can capture the DOM mid-hydration and report the widget missing, producing a convincing false negative. Drive a real browser over the DevTools protocol (Node 22 has a built-in `WebSocket`, so no dependency is needed) instead of trusting a single `--dump-dom` count.
- **The `/api/chat` 400 body is user-visible copy.** The widget renders the response text straight into a chat bubble, so validation failures return a plain sentence; the Zod detail goes to `console.warn` server-side. Don't put `JSON.stringify(error.flatten())` back in there.
- **Client-side chat persistence** (`src/components/ChatWidget.tsx`): conversation is mirrored to `localStorage` under the key `temesgen-chat-v1` with a **rolling 24h TTL** — every interaction extends `expiresAt` by 24h. On mount the widget hydrates from storage after the initial render (SSR-safe; greeting is rendered on the server, history appears in the first client effect). A `clear` button in the header (visible only when there's more than the greeting) wipes both state and storage. No server-side storage of visitor chats — everything stays per-browser-profile.
- Errors: `ProviderUnavailableError` → 503 with the canned message; any other throw → 502.

### Routing

- **The site is `output: "static"`: every page is prebuilt HTML served straight off the Vercel CDN.** `/api/chat` is the only on-demand route (`prerender = false`), so it is the only thing in the serverless function.
- Dynamic project + blog routes use `getStaticPaths`. Their `export const prerender = true` is now redundant under `output: "static"` but is kept as documentation of intent.
- **Adding a page? Do nothing — it's static by default.** Only add `prerender = false` if a route genuinely needs per-request data, and understand that doing so puts it behind a ~24MB function (sharp + the AI SDK) with a cold-start penalty and no CDN caching. Prefer build-time data or a client-side fetch to `/api/chat`-style endpoints instead.
- **Link prefetch is on globally** via `prefetch: { prefetchAll: true, defaultStrategy: 'hover' }` in `astro.config.mjs`. Hovering (or focusing) any internal `<a>` pulls that page's HTML into the browser cache, so the click resolves from cache. The runtime is a ~2.2KB gzipped module (`_astro/page.*.js`) injected into every page; it scans all `<a>` tags, so no `data-astro-prefetch` attribute is needed. Opt a single link out with `data-astro-prefetch="false"`.
- There is intentionally **no `<ClientRouter />`** (view transitions). The `Hero.astro` / `Gallery.astro` scripts are load-time IIFEs; adding the client router would require re-initialising each on `astro:page-load`. Static HTML + hover prefetch already makes navigation feel instant without shipping a router.

### Environment variables

- Local: `.env` (gitignored). Template: `.env.example`.
- Required for chatbot: at least one of `GROQ_API_KEY`, `OPENAI_API_KEY`, `GEMINI_API_KEY`, `ANTHROPIC_API_KEY`.
- Optional: `LLM_PROVIDER` (reorders, does not restrict), `GROQ_MODEL`, `OPENAI_MODEL`, `GEMINI_MODEL`, `ANTHROPIC_MODEL` — each `*_MODEL` accepts a comma-separated list, tried left to right before the built-in fallbacks.
- In production, set these in Vercel project settings (not committed).

### Scripts

- `npm run dev` — Astro dev server at http://localhost:4321
- `npm run build` — production build
- `npm run preview` — preview the built site
- `npm run check` — `astro check` (typecheck content + components)
- `npm test` — the one unit test: `tests/reasoning-stripper.test.mts`, run via Node's `--experimental-strip-types` (no test framework, no dependency)

There is **no linter configured** and **almost no test suite** — deliberately. The bar before committing is `npm run check` cleanly + a manual eyeball of the affected page.

The single exception is `tests/reasoning-stripper.test.mts`, and the reason it exists is the rule for adding more: **test the things whose failure is invisible and whose correct behaviour can't be confirmed by looking at the page.** The reasoning stripper qualifies on both counts — it defends against sampling-dependent model output, so a clean manual run proves nothing, and its bugs live in stream-chunk boundaries you cannot reach from the UI. Rendering, layout, and content don't qualify; eyeball those. Don't add a test framework for this — plain Node type-stripping keeps the dependency count at zero.

## Git & deploy

- Default branch: `master`.
- Vercel deploys on push. `.gitignore` covers `node_modules`, `dist/`, `.astro/`, `.vercel/` (link metadata + build output), `.env`, `.env.local`, `.DS_Store`, `*.log`, and `HERO_PROMPT.md`.
- **`.claude/` is NOT gitignored.** `.claude/skills/` and `.agents/skills/` are both tracked and committed (32 files each). Only `.claude/settings.local.json` stays out, and it is excluded by the *user's global* ignore file (`~/.config/git/ignore`), not by this repo — so on any other machine it shows up as untracked.
- The `dist/` directory is a leftover local build artifact and is gitignored.
- **Refreshing Medium posts:** the Medium feed is fetched only at build time. After publishing a new post on Medium, trigger a redeploy: push an empty commit (`git commit --allow-empty -m "refresh medium feed" && git push`) or click "Redeploy" in the Vercel dashboard. Automation (deploy hook + scheduled cron) is intentionally deferred until post cadence justifies it.

### Vercel environment variables (the chatbot's only deploy-time dependency)

Code ships with a push; **`.env` does not** — it's gitignored, so production reads Vercel's project env vars. The model IDs are the part that rots.

| Var | Production value | Why |
|---|---|---|
| `GROQ_API_KEY` | the raw `gsk_…` key | **Paste the key only.** `.env` stores it as `gsk_… #Regenerated` and dotenv strips that inline comment — Vercel does **not**. A pasted comment produces a 401 that reads as "invalid key". |
| `GEMINI_API_KEY` | the raw key | Second provider in the chain. |
| `GROQ_MODEL` | `openai/gpt-oss-20b`, **or delete it** | Now identical to the first built-in model, so it is redundant. A *stale* value here is worse than none — it's tried first and burns a failed attempt. |
| `GEMINI_MODEL` | `gemini-3-flash-preview`, **or delete it** | Same reasoning. |
| `LLM_PROVIDER` | `groq`, **or delete it** | Groq is already first in `PROVIDERS`, so this is a no-op either way. |
| `OPENAI_*` / `ANTHROPIC_*` | leave unset | Empty or absent both mean "not a candidate"; setting them without real keys gains nothing. |

Because the built-in `models` lists now lead with the verified IDs, **the only strictly required production vars are the two API keys** — every `*_MODEL` var is optional. Deleting the model vars is the lower-maintenance choice: it moves model selection into version-controlled code instead of dashboard state that no diff will ever show you.

## Things to NOT do (collected gotchas)

- Don't add a `tailwind.config.js` — Tailwind v4 here is configured purely via `@theme` in `global.css`.
- Don't switch `ChatWidget` to `client:load` — it tanks LCP.
- Don't hardcode model IDs in `src/lib/llm.ts` defaults; respect the env-override pattern.
- Don't assume `.claude/` is gitignored — it isn't, and the design-system skill under it is tracked. Edits there land in commits, and they must be mirrored to `.agents/skills/` (see the twin rule).
- Don't break the `portfolio-info.md` → chatbot pipeline by relocating that file without updating `src/lib/context.ts`.
- Don't introduce a React component for something a `.astro` file can render. The island budget is intentionally small.
- **Don't put project images in `public/`.** Files there bypass `astro:assets` entirely and ship as unoptimized originals with a `max-age=0, must-revalidate` cache header. `public/` is only for assets needing a stable un-hashed URL (`avatar.jpg`, `cv.pdf`). This was the single biggest performance bug the site has had — 42MB of raw PNGs.
- **Don't add `prerender = false` to a page** just because the site has an adapter. That moves the page off the CDN into a cold-startable 24MB function — the exact regression that made every nav slow before. Only `/api/chat` should be on-demand.
- **Don't `<Image>` a gallery shot without `width`** alongside `widths` — Astro will silently emit a full-resolution `src` fallback nobody fetches.
- Don't reference `/projects/<file>` in project frontmatter — image paths are now relative (`../../assets/projects/<file>`) and the absolute form fails the `image()` schema.

## Open / known follow-ups

_(Update this list as work happens — remove items when done, add new ones when you discover them.)_

- **`experimental.fonts` is experimental.** Watch for it stabilising in a future Astro minor; when it does, move the `fonts` array out of `experimental` in `astro.config.mjs`. It also fetches from Google at build time, so a build in a network-restricted environment will fail on fonts (the Medium loader degrades gracefully in that situation; fonts do not).
- **`prune-unreferenced-images.mjs` is a workaround, not a feature.** It exists because Vite emits the original file for every imported image asset even when only derivatives are referenced. If Astro ever gains a first-class way to suppress that, delete the integration. It reads every text file in the output on each build — fine at this size, worth revisiting if the site grows a lot of pages.
- **The `/api/chat` function still bundles ~16MB of `sharp`** (24MB total) because Astro's image service is part of the server entry, even though every image is now optimized at build time and the chat endpoint never touches one. This only costs chatbot cold-start latency, not page loads — pages are static. Worth investigating whether `sharp` can be excluded from the function bundle.
- **Set the production LLM env vars in Vercel** — see the table in *Git & deploy → Vercel environment variables*. Until then `temesgen.dev`'s chatbot runs on whatever stale `*_MODEL` values the dashboard holds; the new code defaults will now rescue it, but each stale value still burns one failed attempt per request.
- **Move rate limiting to Vercel WAF.** The in-memory per-IP limiter in `api/chat.ts` is best-effort: state is per function instance, so it resets on cold start and doesn't coordinate across concurrent instances. Vercel's firewall rate limiting is enforced at the edge before the function runs, which is both cheaper and actually correct. Until then, treat the current limiter as a speed bump, not a control.
- **Consider an input-side topical check.** Scope enforcement is entirely prompt-side, so it inherits the model's sampling variance in both directions — measured over 8 legitimate and 8 adversarial prompts (see the eval pattern in `Things to NOT do`), it holds, but it is not deterministic. A cheap classifier pass, or a keyword pre-filter for the obvious cases, would make refusals stable at the cost of latency. Deferred: the prompt-side guard measured clean and a portfolio bot's blast radius is small.
- **Add a real key for a third provider.** Only Groq and Gemini have keys; `OPENAI_API_KEY` and `ANTHROPIC_API_KEY` are empty strings, so the chain is two deep. Both Groq and Gemini retired their configured models simultaneously, which is exactly the scenario a third provider would have absorbed.
- **Consider pinning to Vercel AI Gateway** instead of four provider SDKs. It gives one endpoint with built-in model fallback and would move this whole rot problem out of `llm.ts` — worth weighing next time model IDs break.
