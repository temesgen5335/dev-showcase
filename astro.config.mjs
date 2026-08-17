import { defineConfig, fontProviders } from 'astro/config';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import vercel from '@astrojs/vercel';
import tailwindcss from '@tailwindcss/vite';
import pruneUnreferencedImages from './integrations/prune-unreferenced-images.mjs';

export default defineConfig({
  site: 'https://temesgen.dev',
  // Static-first: every page is prebuilt HTML on the CDN. `/api/chat` opts back
  // into on-demand rendering with `export const prerender = false`.
  output: 'static',
  adapter: vercel(),
  integrations: [mdx(), react(), pruneUnreferencedImages()],
  // Warm the HTML for a link into the browser cache on hover, so the click
  // itself is a cache read rather than a network round trip.
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover',
  },
  // Self-host the two families instead of loading them from fonts.googleapis.com. Astro
  // downloads and subsets them at build time and serves them from our own origin, which
  // removes a render-blocking third-party stylesheet plus two preconnects before first paint.
  // `fonts` is still under `experimental` as of Astro 5.18.
  experimental: {
    fonts: [
      {
        provider: fontProviders.google(),
        name: 'Inter',
        cssVariable: '--font-inter',
        weights: [400, 500, 600],
        styles: ['normal'],
        subsets: ['latin'],
        fallbacks: ['ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      {
        // Fallbacks must be monospace: headings and section labels are all mono, and
        // Astro's default fallback chain is sans-serif (metric-matched against Arial),
        // which would reflow mono text into a proportional face during the swap.
        provider: fontProviders.google(),
        name: 'IBM Plex Mono',
        cssVariable: '--font-ibm-plex-mono',
        weights: [400, 500, 600],
        styles: ['normal'],
        subsets: ['latin'],
        fallbacks: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
    ],
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
