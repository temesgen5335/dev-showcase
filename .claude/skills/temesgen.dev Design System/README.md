# temesgen.dev — Design System

> Visual + interaction system extracted from **`temesgen-dev`** (Astro 5 + Tailwind v4),
> the personal portfolio of **Temesgen Gebreabzgi** — Senior Software Engineer based in Addis Ababa, Ethiopia.

---

## Sources

This system was extracted from one codebase. None of these paths are accessible to readers without a fresh attach — they're recorded so future agents know where to re-read for ground truth.

- **Codebase:** `/Users/temesgeng/repos/temesgen-dev` (mounted as `temesgen-dev/` in the original session)
- **Stack:** Astro 5.14 SSR · Tailwind v4 (via `@tailwindcss/vite`) · TypeScript strict · React 19 (only for `ChatWidget`)
- **Primary tokens of truth:** [`reference/global.css`](reference/global.css)
- **Brand voice / facts of truth:** [`reference/portfolio-info.md`](reference/portfolio-info.md) — also injected verbatim into the "ask my portfolio" chatbot's system prompt
- **Hero brief (taste anchor):** [`reference/HERO_PROMPT.md`](reference/HERO_PROMPT.md) — articulates the aesthetic better than any moodboard

## Product surfaces

This system covers exactly one product: **`temesgen.dev`** — a personal portfolio + résumé + chatbot. Everything in this design system is calibrated for that one site. Routes:

- `/` — hero, featured projects, services, contact CTA
- `/experience` — timeline of roles
- `/projects` — full grid + per-project case study pages
- `/about`, `/blog`, `/contact`
- Floating: **ask my portfolio** — RAG-grounded chat widget (bottom-right pill)

---

## Identity in one paragraph

Temesgen is an AI engineer (Founding AI Engineer at Chronos; previously 10 Academy, Bluespark, Ethiopia's Ministry of Innovation and Technology). The portfolio reads like a **quiet terminal on a derelict ship** — Linear/Vercel-grade restraint, near-black surfaces, IBM Plex Mono for any "UI chrome" copy, Inter for body, **one** sky-blue accent (`#7dd3fc`) used like punctuation. Tons of negative space. It is **not** Blade Runner billboard.

---

## CONTENT FUNDAMENTALS

How copy is written across the site. This is consistent enough that it functions as a brand voice rule.

### Casing

- **Almost everything UI-facing is lowercase.** Nav: `experience · projects · about · blog · contact`. Buttons: `view experience →`, `download cv`, `get in touch`, `email temesgen@…`, `ask my portfolio`. Section headers: `// featured work`, `// services`, `// languages`. Card meta: `live ↗`, `repo ↗`.
- **Sentence-case is reserved for prose blocks** — paragraphs in About, project summaries, the contact CTA headline (`Let's build something.`).
- **Title-case proper nouns** are kept as-is in long-form copy: *Founding AI Engineer at Chronos. Previously at 10 Academy, Bluespark, and Ethiopia's Ministry of Innovation and Technology.*

### Tone

- **First person in long-form** ("I'm a full-stack developer…"); **third person in chrome** ("Temesgen's portfolio assistant…").
- **Confident, measurable, unfussy.** Numbers do the bragging — `+25%`, `−40%`, `30+ projects shipped`. Adjectives are scarce.
- **Technical without being clubby.** Says "RAG pipelines" not "AI magic"; says "FastAPI + PostgreSQL" not "modern stack".
- **No emoji** anywhere in chrome or marketing copy. The chatbot uses `⚠️` for error messages — that is the only emoji in the entire codebase.

### Signature prose patterns

- **Mono badge with `~` prefix**, the prompt-style location/availability line:
  `~ addis ababa, ethiopia · available for senior ai roles + freelance`
- **Mono section headers with `//` prefix** (code comment vibe):
  `// featured work` · `// services` · `// languages`
- **CTA verbs lowercase + `→` arrow** for forward actions:
  `view experience →` · `all projects →` · `contact form →`
- **External links suffixed with `↗`** in mono micro-copy: `live ↗`, `repo ↗`.
- **Middot separator** (`·`) joins peer phrases at the same level:
  `Certified AI Engineer · Building scalable full-stack AI systems`.
- **Strong-tag for company / metric highlight inside otherwise muted bullets** (see `ExperienceTimeline.astro` — regex auto-bolds any `\d+%`, `\dx`, `\d+`).

### What never appears

- No exclamation marks in chrome (one `Let's build something.` is as warm as it gets).
- No "Hey 👋" / "Welcome!" hero greetings.
- No buzzword stack ("supercharged", "blazing-fast", "AI-powered" as a compliment to itself).
- No emoji icons on cards, buttons, or list items.

---

## VISUAL FOUNDATIONS

### Color

| Role | Token | Hex | Usage |
|---|---|---|---|
| Page bg | `--color-bg` | `#0a0a0a` | full-bleed page; never a card |
| Surface | `--color-surface` | `#111111` | cards, chat panel |
| Surface 2 | `--color-surface-2` | `#171717` | hovered cards, user chat bubble |
| Border | `--color-border` | `#262626` | default 1px hairline on every card/button/input |
| Border hover | `--color-border-hover` | `#404040` | hover/active hairline |
| Muted | `--color-muted` | `#737373` | mono badges, `// section labels`, meta |
| Text | `--color-text` | `#e5e5e5` | paragraphs |
| Text strong | `--color-text-strong` | `#fafafa` | headings, primary button bg, anchor default |
| Accent | `--color-accent` | `#7dd3fc` | hover-link color, `::selection`, hero starfield, sparing punctuation |

**Accent rules.** Sky-blue `#7dd3fc` is a single accent and is used like punctuation, never as a fill. It appears as: link-hover color, `::selection` background, Hero starfield/grid horizon at very low opacity (~0.06), and the cursor radial highlight (~0.18 peak). It must **never** become a button background, gradient, or large area fill.

### Type

- **Two families. No third.** Inter (sans, body) and IBM Plex Mono (everything UI: headings, buttons, badges, tags, nav). Loaded from Google Fonts at weights 400/500/600.
- **Tight tracking on Plex Mono headings:** `letter-spacing: -0.02em`, `font-weight: 500`. This is what makes the mono feel architectural rather than monospaced-default.
- **Hero `h1` is the one place sans-serif goes large** (`clamp(2rem, 5vw, 3.4rem)`, line-height `1.05`).
- **Mono micro-text is everywhere** at `0.72`–`0.85rem`. Never below `0.7rem`.

### Spacing & layout

- **Container:** `max-width: 64rem` (1024px), inline padding `1.5rem`. Single-column page, never multi-column at the page level.
- **Section rhythm:** `padding-block: 3rem 2rem` for hero-adjacent sections; `2.5rem 1rem` for tighter list sections; `4rem` margin-top on the footer.
- **Grid:** `display: grid; gap: 1rem; grid-template-columns: repeat(auto-fit, minmax(18rem, 1fr));` — one pattern, used for project cards, services, skill groups.
- **Generous negative space.** The page is intentionally short on chrome and long on whitespace.

### Backgrounds

- **Flat near-black.** No images on the page background. No gradient blobs. No glassmorphism.
- **The Nav uses a `backdrop-filter: blur(10px)` over `rgba(10,10,10,0.7)`** — this is the *only* place transparency + blur is used in the system.
- **The Hero (per redesign brief) introduces canvas-2D starfield + a low-opacity perspective grid** — both at very low intensity, never decorative.

### Borders & cards

- All cards: `border: 1px solid var(--color-border)`, `border-radius: 0.5rem`, `background: var(--color-surface)`.
- Hover state on cards: `border-color: var(--color-border-hover)` only — no shadow shift, no transform, no scale. **150ms ease.**
- **No drop shadows on cards.** The system uses one shadow, on the chat popover only: `0 18px 50px rgba(0,0,0,0.5)`.

### Corner radii

The system uses a small, consistent radius scale; values match what's used in the codebase verbatim.

| Token | Value | Used on |
|---|---|---|
| `--radius-xs` | `0.25rem` (4px) | tag |
| `--radius-sm` | `0.35rem` (~6px) | input, chat input |
| `--radius-md` | `0.375rem` (6px) | button |
| `--radius-lg` | `0.4rem` (~6px) | project cover image |
| `--radius-xl` | `0.5rem` (8px) | card |
| `--radius-2xl` | `0.6rem` (~10px) | chat panel |
| `--radius-pill` | `999px` | chat FAB |

### Hover / press states

- **Buttons:** border darkens (`#262626` → `#404040`), background lifts one step (`#111` → `#171717`), 150ms. No scale, no shadow.
- **Primary button:** white-on-black inverts the resting state. Hover only nudges background `#fafafa` → `#e5e5e5`.
- **Links:** color shifts from `#fafafa` → `#7dd3fc` on hover. No underline ever.
- **Press / active:** the codebase has no explicit pressed-state styling. Interpret as native browser default — no shrink, no overshoot.

### Animation

- **The whole project ships zero animation libraries.** Vanilla CSS transitions + canvas 2D + RAF only. Do not introduce Framer Motion, GSAP, three.js, or anime.js.
- **Default transition:** `150ms ease` on `border-color` / `background`. That is the rhythm.
- **Reveal motion (Hero only):** name fade + slight blur-out (300ms ease-out); role line types char-by-char at ~35ms/char, runs once; positioning paragraph fades in last.
- **Idle micro-motion:** availability dot pulses softly on a 2s loop. A single mono UI chip "data-flickers" (1-frame opacity dip) every 8–12s, randomized.
- **Reduced motion:** `prefers-reduced-motion: reduce` snaps to the static end-state. No canvas, no type-in, no pulses. This is a hard rule — the system MUST respect it.

### Imagery vibe

- **Project screenshots are the only imagery.** They live at `assets/projects/*.png|jpg`, rendered at `aspect-ratio: 16/9`, `object-fit: cover`, inside a card with a 1px border.
- The avatar is a single small JPG, used for `<link rel="icon">` and OG image only — it is **not** rendered into any UI surface.
- No illustrations, no stock photography, no photography of any kind in the chrome.

### Iconography

- **No icon font, no SVG icon library, no PNG icon set.** The codebase ships zero icon files.
- **Iconography is unicode glyphs only**, set in IBM Plex Mono so they inherit the UI rhythm:
  - `→` forward CTA arrow (`view experience →`)
  - `↗` external link (`live ↗`, `repo ↗`)
  - `↓` scroll cue (Hero)
  - `·` middot separator
  - `~` location badge prefix
  - `//` section label prefix
- This is a deliberate constraint, not an oversight. **Do not introduce Lucide, Heroicons, or emoji** to "complete" the set. If a new affordance genuinely needs an icon, prefer another unicode glyph in the same monospace voice.

---

## Index — what's in this folder

| Path | What it is |
|---|---|
| `README.md` | this file |
| `SKILL.md` | Agent Skills frontmatter — drop this folder into `.claude/skills/` |
| `colors_and_type.css` | base + semantic CSS vars (color, type, radii, spacing, motion) |
| `assets/avatar.jpg` | profile photo (used for favicon + OG only) |
| `assets/projects/*` | project screenshots (Chronos, SolveIT, Hook Lab) |
| `reference/global.css` | the original Tailwind v4 `@theme` + `@layer` from the codebase |
| `reference/portfolio-info.md` | brand voice + facts of truth |
| `reference/HERO_PROMPT.md` | the aesthetic brief that defines the system's taste |
| `preview/*.html` | small spec cards rendered in the Design System tab |
| `ui_kits/portfolio/` | high-fidelity recreation of the portfolio site |

---

## Substitutions / caveats

- **Fonts** are loaded from Google Fonts at runtime, not bundled. The codebase already ships a `<link>` to `fonts.googleapis.com` for `IBM Plex Mono` (400/500/600) and `Inter` (400/500/600). Mocks here do the same. **No font files exist in this repo.**
- **No icon assets exist** — see the Iconography section. Anything that asks for an icon should be solved with a unicode glyph or omitted.
- The system was extracted from a single codebase with a single product surface, so ratios are calibrated for desktop reading width (~64rem). It is responsive down to 360px (Hero brief mandates this); no separate mobile UI kit is needed.
