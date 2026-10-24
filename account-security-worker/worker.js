const REVOCATION_PATH = '/api/account/revoke-sessions';
const FIREBASE_JWKS_URL =
  'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_IDENTITY_TOOLKIT_SCOPE = 'https://www.googleapis.com/auth/identitytoolkit';
const MAX_AUTH_AGE_SECONDS = 5 * 60;
const MAX_TOKEN_LENGTH = 8192;
const MAX_SERVICE_ACCOUNT_JSON_LENGTH = 16 * 1024;

let firebaseKeysCache = null;
let firebaseKeysExpiresAt = 0;
const adminTokenCache = new Map();

class InvalidTokenError extends Error {}
class ServiceUnavailableError extends Error {}

function jsonResponse(payload, status) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
      'referrer-policy': 'no-referrer',
    },
  });
}

function errorResponse(status) {
  if (status === 401) {
    return jsonResponse({ ok: false, message: 'Please sign in again to continue.' }, status);
  }
  if (status === 429) {
    return jsonResponse({ ok: false, message: 'Please wait before trying again.' }, status);
  }
  return jsonResponse({ ok: false, message: 'Session revocation is unavailable.' }, 503);
}

function decodeBase64Url(value) {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]*$/u.test(value)) {
    throw new InvalidTokenError();
  }
  const base64 = value.replace(/-/gu, '+').replace(/_/gu, '/') +
    '='.repeat((4 - (value.length % 4)) % 4);
  let binary;
  try {
    binary = atob(base64);
  } catch {
    throw new InvalidTokenError();
  }
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function encodeBase64Url(value) {
  const bytes = value instanceof Uint8Array ? value : new TextEncoder().encode(value);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/gu, '-').replace(/\//gu, '_').replace(/=+$/gu, '');
}

function parseJsonSegment(segment) {
  try {
    return JSON.parse(new TextDecoder().decode(decodeBase64Url(segment)));
  } catch {
    throw new InvalidTokenError();
  }
}

function parseFirebaseIdToken(token) {
  if (typeof token !== 'string' || token.length === 0 || token.length > MAX_TOKEN_LENGTH) {
    throw new InvalidTokenError();
  }
  const parts = token.split('.');
  if (parts.length !== 3) throw new InvalidTokenError();
  const header = parseJsonSegment(parts[0]);
  const claims = parseJsonSegment(parts[1]);
  if (!header || header.alg !== 'RS256' || typeof header.kid !== 'string' ||
      !claims || typeof claims !== 'object' || Array.isArray(claims)) {
    throw new InvalidTokenError();
  }
  return { header, claims, signingInput: `${parts[0]}.${parts[1]}`, signature: decodeBase64Url(parts[2]) };
}

async function loadFirebaseKeys(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && firebaseKeysCache && firebaseKeysExpiresAt > now) {
    return firebaseKeysCache;
  }

  let response;
  try {
    response = await fetch(FIREBASE_JWKS_URL, {
      headers: { accept: 'application/json' },
      cf: { cacheTtl: 3600, cacheEverything: true },
    });
  } catch {
    throw new ServiceUnavailableError();
  }
  if (!response.ok) throw new ServiceUnavailableError();

  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new ServiceUnavailableError();
  }
  if (!payload || !Array.isArray(payload.keys) || payload.keys.length === 0) {
    throw new ServiceUnavailableError();
  }

  firebaseKeysCache = payload.keys;
  firebaseKeysExpiresAt = now + 50 * 60 * 1000;
  return firebaseKeysCache;
}

async function findFirebaseKey(kid) {
  let keys = await loadFirebaseKeys();
  let jwk = keys.find((key) => key.kid === kid && key.use !== 'enc' &&
    (!key.alg || key.alg === 'RS256'));
  if (!jwk && firebaseKeysCache) {
    keys = await loadFirebaseKeys(true);
    jwk = keys.find((key) => key.kid === kid && key.use !== 'enc' &&
      (!key.alg || key.alg === 'RS256'));
  }
  if (!jwk) throw new InvalidTokenError();
  return jwk;
}

async function verifyFirebaseIdToken(token, projectId, nowSeconds = Math.floor(Date.now() / 1000)) {
  const parsed = parseFirebaseIdToken(token);
  const { header, claims, signingInput, signature } = parsed;
  const jwk = await findFirebaseKey(header.kid);

  let key;
  let verified;
  try {
    key = await crypto.subtle.importKey(
      'jwk', jwk,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify'],
    );
    verified = await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5', key, signature, new TextEncoder().encode(signingInput),
    );
  } catch {
    throw new InvalidTokenError();
  }
  if (!verified) throw new InvalidTokenError();

  if (claims.iss !== `https://securetoken.google.com/${projectId}` ||
      claims.aud !== projectId ||
      typeof claims.sub !== 'string' || claims.sub.length === 0 || claims.sub.length > 128 ||
      !Number.isInteger(claims.exp) || claims.exp <= nowSeconds ||
      !Number.isInteger(claims.iat) || claims.iat > nowSeconds + 60 ||
      !Number.isInteger(claims.auth_time) || claims.auth_time > nowSeconds ||
      nowSeconds - claims.auth_time > MAX_AUTH_AGE_SECONDS) {
    throw new InvalidTokenError();
  }

  return claims;
}

function decodePemPrivateKey(pem) {
  if (typeof pem !== 'string' || !pem.includes('-----BEGIN PRIVATE KEY-----')) {
    throw new ServiceUnavailableError();
  }
  const base64 = pem
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/gu, '');
  try {
    return decodeBase64Url(base64.replace(/\+/gu, '-').replace(/\//gu, '_').replace(/=+$/gu, ''));
  } catch {
    // PEM uses standard Base64, so restore its standard alphabet for decoding.
    try {
      const standard = base64.replace(/-/gu, '+').replace(/_/gu, '/') +
        '='.repeat((4 - (base64.length % 4)) % 4);
      return Uint8Array.from(atob(standard), (character) => character.charCodeAt(0));
    } catch {
      throw new ServiceUnavailableError();
    }
  }
}

function loadServiceAccount(env) {
  const projectId = env.FIREBASE_PROJECT_ID;
  const raw = env.FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON;
  if (typeof projectId !== 'string' || !/^[a-z][a-z0-9-]{4,28}[a-z0-9]$/u.test(projectId) ||
      typeof raw !== 'string' || raw.length === 0 || raw.length > MAX_SERVICE_ACCOUNT_JSON_LENGTH) {
    throw new ServiceUnavailableError();
  }

  let account;
  try {
    account = JSON.parse(raw);
  } catch {
    throw new ServiceUnavailableError();
  }
  if (!account || account.project_id !== projectId ||
      typeof account.client_email !== 'string' ||
      !account.client_email.endsWith('.iam.gserviceaccount.com') ||
      typeof account.private_key !== 'string' ||
      (account.token_uri && account.token_uri !== GOOGLE_TOKEN_URL)) {
    throw new ServiceUnavailableError();
  }

  return {
    projectId,
    clientEmail: account.client_email,
    privateKey: account.private_key,
    privateKeyId: typeof account.private_key_id === 'string' ? account.private_key_id : undefined,
    tokenUri: GOOGLE_TOKEN_URL,
  };
}

function rateLimiterAvailable(env) {
  return Boolean(env.REVOCATION_RATE_LIMITER &&
    typeof env.REVOCATION_RATE_LIMITER.limit === 'function');
}

async function rateLimitUser(env, uid) {
  let result;
  try {
    result = await env.REVOCATION_RATE_LIMITER.limit({ key: uid });
  } catch {
    throw new ServiceUnavailableError();
  }
  if (!result || result.success !== true) return false;
  return true;
}

async function createServiceAccountAssertion(account, nowSeconds = Math.floor(Date.now() / 1000)) {
  const header = { alg: 'RS256', typ: 'JWT' };
  if (account.privateKeyId) header.kid = account.privateKeyId;
  const claims = {
    iss: account.clientEmail,
    scope: GOOGLE_IDENTITY_TOOLKIT_SCOPE,
    aud: account.tokenUri,
    iat: nowSeconds,
    exp: nowSeconds + 300,
  };
  const input = `${encodeBase64Url(JSON.stringify(header))}.${encodeBase64Url(JSON.stringify(claims))}`;

  let key;
  let signature;
  try {
    key = await crypto.subtle.importKey(
      'pkcs8', decodePemPrivateKey(account.privateKey),
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['sign'],
    );
    signature = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(input),
    );
  } catch {
    throw new ServiceUnavailableError();
  }
  return `${input}.${encodeBase64Url(new Uint8Array(signature))}`;
}

async function getAdminAccessToken(account) {
  const cacheKey = `${account.projectId}:${account.clientEmail}`;
  const now = Date.now();
  const cached = adminTokenCache.get(cacheKey);
  if (cached && cached.expiresAt > now + 30_000) return cached.accessToken;

  const assertion = await createServiceAccountAssertion(account);
  let response;
  try {
    response = await fetch(account.tokenUri, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion,
      }),
    });
  } catch {
    throw new ServiceUnavailableError();
  }
  if (!response.ok) throw new ServiceUnavailableError();

  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new ServiceUnavailableError();
  }
  if (typeof payload.access_token !== 'string' || payload.access_token.length === 0) {
    throw new ServiceUnavailableError();
  }
  const expiresIn = Number(payload.expires_in);
  const lifetimeMs = Number.isFinite(expiresIn) && expiresIn > 60
    ? Math.min(expiresIn, 3600) * 1000
    : 300_000;
  const entry = { accessToken: payload.access_token, expiresAt: now + lifetimeMs - 30_000 };
  adminTokenCache.set(cacheKey, entry);
  return entry.accessToken;
}

async function revokeUserRefreshTokens(account, uid, nowSeconds = Math.floor(Date.now() / 1000)) {
  const accessToken = await getAdminAccessToken(account);
  let response;
  try {
    response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/projects/${encodeURIComponent(account.projectId)}/accounts:update`,
      {
        method: 'POST',
        headers: {
          authorization: `Bearer ${accessToken}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ localId: uid, validSince: String(nowSeconds) }),
      },
    );
  } catch {
    throw new ServiceUnavailableError();
  }
  if (!response.ok) throw new ServiceUnavailableError();

  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new ServiceUnavailableError();
  }
  if (payload.localId !== uid) throw new ServiceUnavailableError();
}

async function handleRequest(request, env) {
  const url = new URL(request.url);
  if (url.pathname !== REVOCATION_PATH) return jsonResponse({ ok: false, message: 'Not found.' }, 404);
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ ok: false, message: 'Method not allowed.' }), {
      status: 405,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store',
        'x-content-type-options': 'nosniff',
        allow: 'POST',
      },
    });
  }

  let account;
  if (!rateLimiterAvailable(env)) return errorResponse(503);
  try {
    account = loadServiceAccount(env);
  } catch {
    return errorResponse(503);
  }

  const authorization = request.headers.get('authorization') || '';
  const match = /^Bearer ([^\s]+)$/u.exec(authorization);
  if (!match || match[1].length > MAX_TOKEN_LENGTH) return errorResponse(401);

  let claims;
  try {
    claims = await verifyFirebaseIdToken(match[1], account.projectId);
  } catch (error) {
    return error instanceof ServiceUnavailableError ? errorResponse(503) : errorResponse(401);
  }

  let allowed;
  try {
    allowed = await rateLimitUser(env, claims.sub);
  } catch {
    return errorResponse(503);
  }
  if (!allowed) return errorResponse(429);

  try {
    await revokeUserRefreshTokens(account, claims.sub);
    return jsonResponse({ ok: true }, 200);
  } catch {
    return errorResponse(503);
  }
}

export { handleRequest };

export const __test__ = {
  resetCaches() {
    firebaseKeysCache = null;
    firebaseKeysExpiresAt = 0;
    adminTokenCache.clear();
  },
  verifyFirebaseIdToken,
  createServiceAccountAssertion,
};

export default { fetch: handleRequest };
