import test from 'node:test';
import assert from 'node:assert/strict';
import { __test__, handleRequest, default as worker } from '../worker.js';

function createEnv(overrides = {}) {
  const inserts = [];
  const stored = new Map();
  const env = {
    ALLOWED_ORIGIN: 'https://gmailsmith.app',
    CONSENT_VERSION: 'v1',
    TURNSTILE_EXPECTED_HOSTNAME: 'gmailsmith.app',
    WAITLIST_OPEN: 'true',
    TURNSTILE_SECRET_KEY: 'test-secret',
    EMAIL_RATE_LIMITER: { limit: async () => ({ success: true }) },
    WAITLIST_DB: {
      prepare(sql) {
        return { bind(...params) { return { run: async () => {
          inserts.push({ sql, params });
          if (!stored.has(params[0])) stored.set(params[0], params);
          return { success: true };
        } }; } };
      },
    },
    ...overrides,
  };
  return { env, inserts, stored };
}

function validRequest(overrides = {}) {
  return new Request('https://gmailsmith.app/api/waitlist', {
    method: 'POST',
    headers: { origin: 'https://gmailsmith.app', 'content-type': 'application/json' },
    body: JSON.stringify({
      email: ' Person@Example.com ',
      consent: true,
      consentVersion: 'v1',
      turnstileToken: 'valid-token',
      source: 'community_post',
      ...overrides,
    }),
  });
}

test('normalizes valid email addresses for duplicate keys', () => {
  assert.equal(__test__.normalizeEmail('  Person@Example.com '), 'person@example.com');
});

test('rejects malformed or oversized email addresses', () => {
  assert.equal(__test__.isValidEmail('person@example.com'), true);
  assert.equal(__test__.isValidEmail('person+launch@example.com'), true);
  assert.equal(__test__.isValidEmail('not-an-email'), false);
  assert.equal(__test__.isValidEmail('+person@example.com'), false);
  assert.equal(__test__.isValidEmail('a'.repeat(250) + '@example.com'), false);
});

test('accepts and drops unsafe attribution values', () => {
  assert.equal(__test__.cleanSource('community_post-1'), 'community_post-1');
  assert.equal(__test__.cleanSource('https://example.com/?x=1'), null);
  assert.equal(__test__.cleanSource('-unsafe'), null);
});

test('does not expose a read endpoint', async () => {
  const { env } = createEnv();
  const response = await handleRequest(new Request('https://gmailsmith.app/api/waitlist'), env);
  assert.equal(response.status, 404);
});

test('requires JSON submissions and consent', async () => {
  const { env } = createEnv();
  const missingType = await handleRequest(new Request('https://gmailsmith.app/api/waitlist', { method: 'POST' }), env);
  assert.equal(missingType.status, 415);

  const missingConsent = await handleRequest(new Request('https://gmailsmith.app/api/waitlist', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'person@example.com', consent: false, consentVersion: 'v1' }),
  }), env);
  assert.equal(missingConsent.status, 400);
});

test('rejects cross-origin browser submissions', async () => {
  const { env } = createEnv();
  const response = await handleRequest(new Request('https://gmailsmith.app/api/waitlist', {
    method: 'POST',
    headers: { origin: 'https://attacker.example', 'content-type': 'application/json' },
    body: '{}',
  }), env);
  assert.equal(response.status, 403);
});

test('closed waitlist stops collecting and returns 410', async () => {
  const { env } = createEnv({ WAITLIST_OPEN: 'false' });
  const response = await handleRequest(new Request('https://gmailsmith.app/api/waitlist', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{}',
  }), env);
  assert.equal(response.status, 410);
});

test('stores normalized email only after server-validated Turnstile', async () => {
  const { env, inserts, stored } = createEnv();
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    assert.equal(url, 'https://challenges.cloudflare.com/turnstile/v0/siteverify');
    assert.equal(options.method, 'POST');
    return new Response(JSON.stringify({
      success: true,
      hostname: 'gmailsmith.app',
      action: 'waitlist',
    }), { status: 200, headers: { 'content-type': 'application/json' } });
  };
  try {
    const response = await handleRequest(validRequest(), env);
    const payload = await response.json();
    assert.equal(response.status, 200);
    assert.equal(payload.ok, true);
    assert.match(payload.message, /once/);
    assert.equal(inserts.length, 1);
    assert.equal(inserts[0].params[0], 'person@example.com');
    assert.equal(inserts[0].params[1], 'Person@Example.com');
    assert.equal(inserts[0].params[4], 'community_post');
    assert.match(inserts[0].sql, /ON CONFLICT\(email_normalized\) DO UPDATE/);
    assert.ok(inserts[0].sql.includes("julianday(waitlist_signups.consented_at) <= julianday('now', '-12 months', '+1 day')"));

    const duplicate = await handleRequest(validRequest({ email: 'person@example.com', source: 'other' }), env);
    const duplicatePayload = await duplicate.json();
    assert.deepEqual(duplicatePayload, payload);
    assert.equal(stored.size, 1);
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test('does not store submissions with a mismatched Turnstile hostname or action', async () => {
  let rateLimitCalls = 0;
  const { env, inserts } = createEnv({
    EMAIL_RATE_LIMITER: { limit: async () => { rateLimitCalls += 1; return { success: true }; } },
  });
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    success: true,
    hostname: 'attacker.example',
    action: 'waitlist',
  }), { status: 200 });
  try {
    const response = await handleRequest(validRequest(), env);
    assert.equal(response.status, 400);
    assert.equal(inserts.length, 0);
    assert.equal(rateLimitCalls, 0);
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test('rate-limits normalized addresses only after successful Turnstile verification', async () => {
  let rateLimitCalls = 0;
  const { env, inserts } = createEnv({
    EMAIL_RATE_LIMITER: { limit: async () => { rateLimitCalls += 1; return { success: false }; } },
  });
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    success: true,
    hostname: 'gmailsmith.app',
    action: 'waitlist',
  }), { status: 200 });
  try {
    const response = await handleRequest(validRequest(), env);
    assert.equal(response.status, 429);
    assert.equal(rateLimitCalls, 1);
    assert.equal(inserts.length, 0);
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test('rejects oversized JSON before parsing', async () => {
  const { env } = createEnv();
  const response = await handleRequest(new Request('https://gmailsmith.app/api/waitlist', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ excess: 'x'.repeat(5000) }),
  }), env);
  assert.equal(response.status, 413);
});

test('returns a generic retry response when storage fails', async () => {
  const { env } = createEnv({
    WAITLIST_DB: { prepare() { throw new Error('database unavailable'); } },
  });
  const previousFetch = globalThis.fetch;
  const previousConsoleError = console.error;
  globalThis.fetch = async () => new Response(JSON.stringify({
    success: true,
    hostname: 'gmailsmith.app',
    action: 'waitlist',
  }), { status: 200 });
  console.error = () => {};
  try {
    const response = await handleRequest(validRequest(), env);
    const payload = await response.json();
    assert.equal(response.status, 503);
    assert.equal(payload.ok, false);
    assert.match(payload.message, /try again shortly/);
    assert.equal(JSON.stringify(payload).includes('person@example.com'), false);
  } finally {
    globalThis.fetch = previousFetch;
    console.error = previousConsoleError;
  }
});

test('honeypot submissions receive generic success without a database write', async () => {
  const { env, inserts } = createEnv();
  const response = await handleRequest(validRequest({ company: 'bot value' }), env);
  const payload = await response.json();
  assert.equal(response.status, 200);
  assert.equal(payload.ok, true);
  assert.equal(inserts.length, 0);
});

test('daily cleanup removes expired pending and notified rows', async () => {
  let cleanupSql = '';
  const env = {
    WAITLIST_DB: { prepare(sql) { cleanupSql = sql; return { run: async () => ({ success: true }) }; } },
  };
  let awaited;
  worker.scheduled({}, env, { waitUntil(promise) { awaited = promise; } });
  await awaited;
  assert.match(cleanupSql, /-29 days/);
  assert.match(cleanupSql, /-12 months/);
  assert.ok(cleanupSql.includes("'-12 months', '+1 day'"));
});
