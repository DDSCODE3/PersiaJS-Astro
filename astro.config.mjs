
// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://ddscode3.github.io',
  base: '/PersiaJS-Astro',

  integrations: [react()],

  markdown: {
    shikiConfig: { theme: 'github-dark' },
  },

  vite: {
    plugins: [tailwindcss()],
  },
});
