// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Static output — the SEO foundation: every page ships as pre-rendered HTML.
// Cloudflare Pages serves `dist/`; the installer itself lives on R2 behind
// the /releases/* Worker (see docs/08 §8.6).
export default defineConfig({
  output: 'static',
  site: 'https://gmail.smith.app',
  trailingSlash: 'ignore',
  integrations: [sitemap()],
});
