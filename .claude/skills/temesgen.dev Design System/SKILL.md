---
name: temesgen-dev-design
description: Use this skill to generate well-branded interfaces and assets for temesgen.dev (the personal portfolio of Temesgen Gebreabzgi — Senior AI Software Engineer), either for production or throwaway prototypes/mocks. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the README.md file within this skill, and explore the other available files.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

## Quick orientation

- **Stack of truth:** Astro 5 SSR + Tailwind v4 (`@tailwindcss/vite`) + React 19 only for the chat widget. No animation libraries — vanilla canvas 2D + CSS only.
- **Tokens:** see `colors_and_type.css`. Surfaces near-black (`#0a0a0a` → `#171717`), one sky-blue accent `#7dd3fc` used like punctuation.
- **Type:** Inter (body) + IBM Plex Mono (everything UI), tight tracking `-0.02em`. Hero h1 is the only large sans-serif moment.
- **Voice:** lowercase chrome, `~` location prefix, `// section` labels, `→` forward CTAs, `↗` external links, no emoji.
- **Iconography:** unicode glyphs only (`→ ↗ ↓ · ~ //`). Do not introduce icon fonts or emoji.
- **Recreations live in `ui_kits/portfolio/`** — use those JSX components as drop-in copies of the real Astro components.
