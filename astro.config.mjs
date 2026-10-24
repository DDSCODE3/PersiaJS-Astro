// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: "https://persiajs.dev",

  integrations: [react()],

  markdown: {
    shikiConfig: { theme: "github-dark" },
  },

  vite: {
    plugins: [tailwindcss()]
  }
});