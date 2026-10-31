import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const layout = await readFile(
  new URL('../src/layouts/Base.astro', import.meta.url), 'utf8',
);
const site = await readFile(new URL('../src/site.ts', import.meta.url), 'utf8');

test('beta announcement is shared-site chrome and only appears with downloads', () => {
  assert.match(layout, /site\.availability === 'download' && \(/);
  assert.match(layout, /role="note" aria-label="Beta announcement"/);
  assert.match(layout,
    /GmailSmith is in beta\.<\/strong> The free plan is available now;\s*paid plans are coming soon\./);
});

test('confirmed pricing remains unchanged and payment links remain disabled', () => {
  assert.match(site, /name: 'Free'[\s\S]*?price: '\$0'[\s\S]*?25 emails\/day/);
  assert.match(site, /name: 'Personal'[\s\S]*?price: '\$4\.99'[\s\S]*?\$39\/year[\s\S]*?500 emails\/day/);
  assert.match(site, /name: 'Agency'[\s\S]*?price: '\$12\.99'[\s\S]*?\$99\/year[\s\S]*?Three computers/);
  assert.match(site, /purchaseUrl: ''/);
  assert.match(site, /checkoutMonthly: ''/);
  assert.match(site, /checkoutYearly: ''/);
});
