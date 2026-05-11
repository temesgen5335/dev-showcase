# Portfolio UI Kit — `ui_kits/portfolio/`

High-fidelity recreation of `temesgen.dev`. Every component here has a 1:1 source in `temesgen-dev/src/components/`. Implementations are simplified for prototyping (mock chat replies, in-memory routing, no Astro content collections) but visually identical.

## Files

| File | Source in real codebase |
|---|---|
| `styles.css` | `src/styles/global.css` (Tailwind v4 `@theme` flattened to plain CSS vars) |
| `Hero.jsx` | `src/components/Hero.astro` + the `HERO_PROMPT.md` redesign (starfield + grid horizon + cursor glow + char-by-char type-in) |
| `Components.jsx` | `Nav.astro` · `Footer.astro` · `ProjectCard.astro` · `Services.astro` · `ContactCTA.astro` · `ExperienceTimeline.astro` |
| `ChatWidget.jsx` | `ChatWidget.tsx` — mocked replies, no network; same visuals + streaming feel |
| `index.html` | the `/`, `/experience`, and per-project case-study screens stitched together as a click-thru |

## Click-thru

`index.html` boots into the home page. From there you can:
- click any project card → in-memory routes to a project case-study screen
- click "view experience →" → routes to `/experience` with the timeline
- open the chat FAB bottom-right → ask one of the suggestion chips → fake-streamed reply

## Animation policy

The Hero faithfully implements the `HERO_PROMPT.md` brief in vanilla canvas 2D + CSS only. No Framer Motion, GSAP, three.js, anime.js. RAF loops pause on `document.hidden` and on `prefers-reduced-motion: reduce`. Mobile drops parallax + cursor glow but keeps starfield + type-in. SSR guards are noted with comments where they matter.

## The 3 knobs most likely tuned

In `Hero.jsx`:

1. **Particle density** — `const count = isMobile ? 30 : 80;` inside `Starfield`.
2. **Type-in speed** — `<TypeIn text={...} speed={25} delay={600} />` in `Hero`. Lower = faster.
3. **Accent intensity** — the `rgba(125, 211, 252, ...)` literals: grid lines at `0.06`, cursor glow peak at `0.18` (set in `styles.css` `.hero-cursor-glow`). Bump `0.06 → 0.10` for a more visible horizon; bump glow alpha for a stronger cursor.
