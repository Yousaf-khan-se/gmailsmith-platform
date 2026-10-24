import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, sign } from 'node:crypto';
import { __test__, handleRequest } from '../worker.js';

const PROJECT_ID = 'gmailsmith-510919';
const USER_ID = 'firebase-user-123';
const firebaseKeys = generateKeyPairSync('rsa', { modulusLength: 2048 });
const serviceAccountKeys = generateKeyPairSync('rsa', { modulusLength: 2048 });
const firebaseJwk = {
  ...firebaseKeys.publicKey.export({ format: 'jwk' }),
  kid: 'test-firebase-key',
  use: 'sig',
  alg: 'RS256',
};
const serviceAccountPem = serviceAccountKeys.privateKey.export({
  format: 'pem',
  type: 'pkcs8',
});

function base64url(value) {
  return Buffer.from(value).toString('base64url');
}

function makeIdToken(overrides = {}) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', kid: firebaseJwk.kid, typ: 'JWT' };
  const payload = {
    iss: `https://securetoken.google.com/${PROJECT_ID}`,
    aud: PROJECT_ID,
    sub: USER_ID,
    iat: now,
    exp: now + 3600,
    auth_time: now,
    ...overrides,
  };
  const signingInput = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(payload))}`;
  const signature = sign('RSA-SHA256', Buffer.from(signingInput), firebaseKeys.privateKey);
  return `${signingInput}.${signature.toString('base64url')}`;
}

function makeEnv(overrides = {}) {
  const rateKeys = [];
  const env = {
    FIREBASE_PROJECT_ID: PROJECT_ID,
    FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON: JSON.stringify({
      project_id: PROJECT_ID,
      client_email: 'firebase-revoke-test@example.iam.gserviceaccount.com',
      private_key: serviceAccountPem,
      token_uri: 'https://oauth2.googleapis.com/token',
    }),
    REVOCATION_RATE_LIMITER: {
      limit: async ({ key }) => {
        rateKeys.push(key);
        return { success: true };
      },
    },
    ...overrides,
  };
  return { env, rateKeys };
}

function installFetch({ tokenStatus = 200, adminStatus = 200 } = {}) {
  const calls = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, options = {}) => {
    const href = String(url);
    calls.push({ url: href, options });
    if (href === 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com') {
      return new Response(JSON.stringify({ keys: [firebaseJwk] }), {
        status: 200,
        headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=3600' },
      });
    }
    if (href === 'https://oauth2.googleapis.com/token') {
      return new Response(JSON.stringify({ access_token: 'admin-access-test', expires_in: 3600 }), {
        status: tokenStatus,
        headers: { 'content-type': 'application/json' },
      });
    }
    if (href === `https://identitytoolkit.googleapis.com/v1/projects/${PROJECT_ID}/accounts:update`) {
      return new Response(JSON.stringify({ localId: USER_ID }), {
        status: adminStatus,
        headers: { 'content-type': 'application/json' },
      });
    }
    throw new Error(`Unexpected fetch URL: ${href}`);
  };
  return { calls, restore: () => { globalThis.fetch = originalFetch; } };
}

function makeRequest(token = makeIdToken(), body) {
  return new Request('https://gmailsmith.app/api/account/revoke-sessions', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      ...(body === undefined ? {} : { 'content-type': 'application/json' }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

test('revokes only the authenticated user and returns generic success', async () => {
  __test__.resetCaches();
  const { env, rateKeys } = makeEnv();
  const fetcher = installFetch();
  try {
    const response = await handleRequest(makeRequest(makeIdToken(), { uid: 'attacker-user' }), env);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { ok: true });
    assert.deepEqual(rateKeys, [USER_ID]);

    const tokenCall = fetcher.calls.find((call) => call.url === 'https://oauth2.googleapis.com/token');
    assert.ok(tokenCall, 'Worker obtains a short-lived service-account access token');
    const tokenBody = new URLSearchParams(tokenCall.options.body);
    assert.equal(tokenBody.get('grant_type'), 'urn:ietf:params:oauth:grant-type:jwt-bearer');
    assert.equal(tokenBody.get('assertion').split('.').length, 3);

    const adminCall = fetcher.calls.find((call) => call.url.endsWith('/accounts:update'));
    assert.ok(adminCall);
    assert.equal(adminCall.options.headers.authorization, 'Bearer admin-access-test');
    assert.deepEqual(JSON.parse(adminCall.options.body), {
      localId: USER_ID,
      validSince: String(Math.floor(Date.now() / 1000)),
    });
  } finally {
    fetcher.restore();
  }
});

test('rejects non-POST methods and unrelated paths', async () => {
  const { env } = makeEnv();
  const get = await handleRequest(new Request('https://gmailsmith.app/api/account/revoke-sessions'), env);
  const other = await handleRequest(new Request('https://gmailsmith.app/api/account/users'), env);
  assert.equal(get.status, 405);
  assert.equal(other.status, 404);
});

test('requires a bearer token and rejects malformed JWTs without network calls', async () => {
  __test__.resetCaches();
  const { env } = makeEnv();
  const fetcher = installFetch();
  try {
    const missing = await handleRequest(new Request('https://gmailsmith.app/api/account/revoke-sessions', { method: 'POST' }), env);
    const malformed = await handleRequest(makeRequest('not-a-jwt'), env);
    assert.equal(missing.status, 401);
    assert.equal(malformed.status, 401);
    assert.equal(fetcher.calls.length, 0);
  } finally {
    fetcher.restore();
  }
});

for (const [name, claims] of [
  ['wrong issuer', { iss: 'https://attacker.example' }],
  ['wrong audience', { aud: 'other-project' }],
  ['expired token', { exp: Math.floor(Date.now() / 1000) - 1 }],
  ['future issued-at', { iat: Math.floor(Date.now() / 1000) + 120 }],
  ['missing subject', { sub: '' }],
  ['missing auth_time', { auth_time: undefined }],
  ['stale authentication', { auth_time: Math.floor(Date.now() / 1000) - 301 }],
  // Keep this outside the one-second boundary so the token cannot become
  // valid merely because verification happens in the next wall-clock second.
  ['future authentication time', { auth_time: Math.floor(Date.now() / 1000) + 120 }],
]) {
  test(`rejects ${name} without administrative revocation`, async () => {
    __test__.resetCaches();
    const { env, rateKeys } = makeEnv();
    const fetcher = installFetch();
    try {
      const response = await handleRequest(makeRequest(makeIdToken(claims)), env);
      assert.equal(response.status, 401);
      assert.equal(rateKeys.length, 0);
      assert.equal(fetcher.calls.some((call) => call.url.includes('/accounts:update')), false);
    } finally {
      fetcher.restore();
    }
  });
}

test('rejects a signature not issued by Firebase', async () => {
  __test__.resetCaches();
  const other = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const now = Math.floor(Date.now() / 1000);
  const head = base64url(JSON.stringify({ alg: 'RS256', kid: firebaseJwk.kid, typ: 'JWT' }));
  const body = base64url(JSON.stringify({
    iss: `https://securetoken.google.com/${PROJECT_ID}`,
    aud: PROJECT_ID,
    sub: USER_ID,
    iat: now,
    exp: now + 3600,
    auth_time: now,
  }));
  const input = `${head}.${body}`;
  const forged = `${input}.${sign('RSA-SHA256', Buffer.from(input), other.privateKey).toString('base64url')}`;
  const { env } = makeEnv();
  const fetcher = installFetch();
  try {
    const response = await handleRequest(makeRequest(forged), env);
    assert.equal(response.status, 401);
    assert.equal(fetcher.calls.some((call) => call.url.includes('/accounts:update')), false);
  } finally {
    fetcher.restore();
  }
});

test('rate limits per verified UID before obtaining an admin token', async () => {
  __test__.resetCaches();
  const rateKeys = [];
  const { env } = makeEnv({
    REVOCATION_RATE_LIMITER: {
      limit: async ({ key }) => { rateKeys.push(key); return { success: false }; },
    },
  });
  const fetcher = installFetch();
  try {
    const response = await handleRequest(makeRequest(), env);
    assert.equal(response.status, 429);
    assert.deepEqual(rateKeys, [USER_ID]);
    assert.equal(fetcher.calls.some((call) => call.url === 'https://oauth2.googleapis.com/token'), false);
  } finally {
    fetcher.restore();
  }
});

test('fails closed when project, service credentials, or rate limiter are missing', async () => {
  for (const override of [
    { FIREBASE_PROJECT_ID: '' },
    { FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON: '' },
    { REVOCATION_RATE_LIMITER: undefined },
  ]) {
    const response = await handleRequest(makeRequest(), makeEnv(override).env);
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), {
      ok: false,
      message: 'Session revocation is unavailable.',
    });
  }
});

test('rejects service-account credentials for a different Firebase project', async () => {
  const { env } = makeEnv({
    FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON: JSON.stringify({
      project_id: 'different-project',
      client_email: 'wrong@example.iam.gserviceaccount.com',
      private_key: serviceAccountPem,
      token_uri: 'https://oauth2.googleapis.com/token',
    }),
  });
  const response = await handleRequest(makeRequest(), env);
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), {
    ok: false,
    message: 'Session revocation is unavailable.',
  });
});

test('hides upstream errors, tokens, and UID from failure responses', async () => {
  __test__.resetCaches();
  const { env } = makeEnv();
  const fetcher = installFetch({ adminStatus: 403 });
  try {
    const response = await handleRequest(makeRequest(), env);
    const text = await response.text();
    assert.equal(response.status, 503);
    assert.equal(text.includes(USER_ID), false);
    assert.equal(text.includes('admin-access-test'), false);
    assert.equal(text.includes('Permission'), false);
  } finally {
    fetcher.restore();
  }
});
