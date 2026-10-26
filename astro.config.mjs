// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: "https://persiajs.dev",

  integrations: [react(), sitemap()],

  markdown: {
    shikiConfig: { theme: "github-dark" },
  },

  vite: {
    plugins: [tailwindcss()]
  }
});