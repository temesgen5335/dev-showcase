import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import vercel from '@astrojs/vercel';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://temesgen.dev',
  output: 'server',
  adapter: vercel(),
  integrations: [mdx(), react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
