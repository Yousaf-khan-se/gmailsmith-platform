// @ts-check
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

const root = fileURLToPath(new URL('.', import.meta.url));

// Map each route to its source file so <lastmod> reflects real edits rather
// than the build clock. Legal pages render from src/content/legal, so their
// content file wins over the thin route wrapper.
function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

const pagesDir = join(root, 'src', 'pages');
const routeSources = new Map();
for (const file of walk(pagesDir)) {
  if (!file.endsWith('.astro')) continue;
  const route = '/' + relative(pagesDir, file).split(sep).join('/')
    .replace(/\.astro$/, '')
    .replace(/(^|\/)index$/, '')
    .replace(/\/$/, '');
  routeSources.set(route, file);
}

for (const [route, file] of Object.entries({
  '/privacy': 'src/content/legal/privacy-policy.md',
  '/terms': 'src/content/legal/terms-of-service.md',
  '/refund-policy': 'src/content/legal/refund-policy.md',
})) {
  const full = join(root, file);
  if (existsSync(full)) routeSources.set(route, full);
}

function lastModified(file) {
  try {
    const path = relative(root, file).split(sep).join('/');
    const committed = execFileSync('git', ['log', '-1', '--format=%cI', '--', path], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    if (committed) return new Date(committed).toISOString();
  } catch {
    // Shallow clone, tarball, or no git: fall through to the file timestamp.
  }
  return statSync(file).mtime.toISOString();
}

const lastmods = new Map();
for (const [route, file] of routeSources) lastmods.set(route, lastModified(file));

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
      const pathname = url.pathname.replace(/\/+$/, '') || '/';
      if (pathname !== '/') {
        url.pathname = pathname;
        item.url = url.toString();
      }
      const lastmod = lastmods.get(pathname);
      if (lastmod) item.lastmod = lastmod;
      return item;
    },
  })],
});
