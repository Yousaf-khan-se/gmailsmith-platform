import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const refundPage = await readFile(
  new URL('../src/pages/refund-policy.astro', import.meta.url), 'utf8',
);
const contactPage = await readFile(
  new URL('../src/pages/contact.astro', import.meta.url), 'utf8',
);
const layout = await readFile(
  new URL('../src/layouts/Base.astro', import.meta.url), 'utf8',
);
const refund = await readFile(
  new URL('../src/content/legal/refund-policy.md', import.meta.url), 'utf8',
);
const terms = await readFile(
  new URL('../src/content/legal/terms-of-service.md', import.meta.url), 'utf8',
);
const privacy = await readFile(
  new URL('../src/content/legal/privacy-policy.md', import.meta.url), 'utf8',
);

test('refund page is public and renders the legal collection entry', () => {
  assert.match(refundPage, /find\(\(item\) => item\.id === 'refund-policy'\)/);
  assert.match(refundPage, /path="\/refund-policy"/);
});

test('refund policy states the Paddle-compatible refund windows', () => {
  assert.match(refund, /30-day money-back guarantee/i);
  assert.match(refund, /14 days/i);
  assert.match(refund, /Paddle\.com is\s+the Merchant of\s+Record/);
  assert.doesNotMatch(refund, /all sales are final|no refunds/i);
});

test('terms and privacy identify Paddle as the Merchant of Record', () => {
  assert.match(terms, /Paddle\.com is\s+the Merchant of Record/);
  assert.match(privacy, /Paddle\.com \(Paddle\)/);
});

test('footer exposes refund and contact links', () => {
  assert.match(layout, /site\.refundPolicyUrl/);
  assert.match(layout, /site\.contactUrl/);
});

test('contact page publishes the support address and a mailto form', () => {
  assert.match(contactPage, /site\.supportEmail/);
  assert.match(contactPage, /data-support-email/);
  assert.match(contactPage, /mailto:/);
});
