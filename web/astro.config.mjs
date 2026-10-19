// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Static output — the SEO foundation: every page ships as pre-rendered HTML.
// Cloudflare serves `dist/` as a static-asset Worker (`web/wrangler.jsonc`);
// the installer itself lives on R2 behind the /releases/* Worker (docs/08 §8.6).
export default defineConfig({
  output: 'static',
  site: 'https://gmailsmith.app',
  trailingSlash: 'ignore',
  integrations: [sitemap({
    filter(page) {
      const pathname = new URL(page).pathname.replace(/\/+$/, '') || '/';
      return pathname !== '/verify' && pathname !== '/reset';
    },
    serialize(item) {
      const url = new URL(item.url);
      if (url.pathname !== '/') {
        url.pathname = url.pathname.replace(/\/+$/, '');
        item.url = url.toString();
      }
      return item;
    },
  })],
});
