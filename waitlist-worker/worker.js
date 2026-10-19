const MAX_BODY_BYTES = 4096;
const MAX_EMAIL_LENGTH = 254;
const MAX_TURNSTILE_TOKEN_LENGTH = 2048;
const SUCCESS_MESSAGE =
  'Thanks — you’re on the list. We’ll email you once when GmailSmith is available.';

function jsonResponse(payload, status, origin, env) {
  const headers = new Headers({
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'no-referrer',
  });

  if (origin && origin === env.ALLOWED_ORIGIN) {
    headers.set('access-control-allow-origin', origin);
    headers.set('vary', 'Origin');
  }

  return new Response(JSON.stringify(payload), { status, headers });
}

function isValidEmail(value) {
  if (typeof value !== 'string') return false;
  const email = value.trim();
  if (email.length === 0 || email.length > MAX_EMAIL_LENGTH) return false;
  const match = /^([A-Za-z0-9][A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]{0,63})@((?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)$/u.exec(email);
  if (!match) return false;
  return match[2].split('.').at(-1).length >= 2;
}

function normalizeEmail(value) {
  return value.trim().toLowerCase();
}

function cleanSource(value) {
  if (typeof value !== 'string') return null;
  const source = value.trim();
  return /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,79}$/u.test(source) ? source : null;
}

async function sha256(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function verifyTurnstile(token, env) {
  const body = new URLSearchParams({
    secret: env.TURNSTILE_SECRET_KEY,
    response: token,
  });
  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!response.ok) throw new Error('turnstile_unavailable');
  const result = await response.json();
  return result.success === true &&
    result.hostname === env.TURNSTILE_EXPECTED_HOSTNAME &&
    result.action === 'waitlist';
}

async function submitWaitlist(request, env, origin) {
  if (env.WAITLIST_OPEN !== 'true') {
    return jsonResponse({ ok: false, message: 'Waitlist signup is currently closed.' }, 410, origin, env);
  }

  const contentType = request.headers.get('content-type') || '';
  if (!contentType.toLowerCase().startsWith('application/json')) {
    return jsonResponse({ ok: false, message: 'Please submit the form again.' }, 415, origin, env);
  }

  const contentLength = Number(request.headers.get('content-length'));
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    return jsonResponse({ ok: false, message: 'Please submit the form again.' }, 413, origin, env);
  }

  let rawBody;
  try {
    const reader = request.body?.getReader();
    if (!reader) return jsonResponse({ ok: false, message: 'Please submit the form again.' }, 400, origin, env);
    const chunks = [];
    let totalBytes = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > MAX_BODY_BYTES) {
        await reader.cancel();
        return jsonResponse({ ok: false, message: 'Please submit the form again.' }, 413, origin, env);
      }
      chunks.push(value);
    }
    const all = new Uint8Array(totalBytes);
    let offset = 0;
    for (const chunk of chunks) {
      all.set(chunk, offset);
      offset += chunk.byteLength;
    }
    rawBody = new TextDecoder('utf-8', { fatal: true }).decode(all);
  } catch {
    return jsonResponse({ ok: false, message: 'Please submit the form again.' }, 400, origin, env);
  }

  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return jsonResponse({ ok: false, message: 'Please submit the form again.' }, 400, origin, env);
  }
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return jsonResponse({ ok: false, message: 'Please submit the form again.' }, 400, origin, env);
  }

  // Silent success prevents automated form fillers from learning whether the
  // endpoint is accepting entries. Honeypot values are never stored or logged.
  if (typeof payload.company === 'string' && payload.company.trim()) {
    return jsonResponse({ ok: true, message: SUCCESS_MESSAGE }, 200, origin, env);
  }

  if (!isValidEmail(payload.email)) {
    return jsonResponse({ ok: false, message: 'Enter a valid email address.' }, 400, origin, env);
  }
  if (payload.consent !== true || payload.consentVersion !== env.CONSENT_VERSION) {
    return jsonResponse({ ok: false, message: 'Confirm the one-time availability email to join.' }, 400, origin, env);
  }
  if (typeof payload.turnstileToken !== 'string' ||
      payload.turnstileToken.length === 0 ||
      payload.turnstileToken.length > MAX_TURNSTILE_TOKEN_LENGTH) {
    return jsonResponse({ ok: false, message: 'Complete the security check, then try again.' }, 400, origin, env);
  }

  const email = payload.email.trim();
  const normalizedEmail = normalizeEmail(email);

  if (!env.TURNSTILE_SECRET_KEY) {
    return jsonResponse({ ok: false, message: 'Signup is temporarily unavailable. Please try again shortly.' }, 503, origin, env);
  }
  try {
    const verified = await verifyTurnstile(payload.turnstileToken, env);
    if (!verified) {
      return jsonResponse({ ok: false, message: 'Security check expired. Complete it again and retry.' }, 400, origin, env);
    }
  } catch {
    return jsonResponse({ ok: false, message: 'Security check is temporarily unavailable. Please retry shortly.' }, 503, origin, env);
  }

  // Rate-limit only verified submissions so a tokenless caller cannot use a
  // victim's email address to consume their per-address allowance.
  try {
    const rateLimitKey = await sha256(normalizedEmail);
    const rateLimit = await env.EMAIL_RATE_LIMITER.limit({ key: rateLimitKey });
    if (!rateLimit.success) {
      return jsonResponse({ ok: false, message: 'Too many attempts. Wait a minute and try again.' }, 429, origin, env);
    }
  } catch {
    return jsonResponse({ ok: false, message: 'Signup is temporarily unavailable. Please try again shortly.' }, 503, origin, env);
  }

  if (!env.WAITLIST_DB) {
    return jsonResponse({ ok: false, message: 'Signup is temporarily unavailable. Please try again shortly.' }, 503, origin, env);
  }

  const source = cleanSource(payload.source);
  const consentedAt = new Date().toISOString();
  try {
    await env.WAITLIST_DB.prepare(`
      INSERT INTO waitlist_signups
        (email_normalized, email, consented_at, consent_version, source, launch_notice_sent_at)
      VALUES (?, ?, ?, ?, ?, NULL)
      ON CONFLICT(email_normalized) DO UPDATE SET
        email = excluded.email,
        consented_at = excluded.consented_at,
        consent_version = excluded.consent_version,
        source = excluded.source,
        launch_notice_sent_at = NULL
      WHERE julianday(waitlist_signups.consented_at) <= julianday('now', '-12 months', '+1 day')
    `).bind(normalizedEmail, email, consentedAt, env.CONSENT_VERSION, source).run();
  } catch {
    // Do not log or return an email address or database error details.
    console.error('Waitlist signup storage failed.');
    return jsonResponse({ ok: false, message: 'Signup is temporarily unavailable. Please try again shortly.' }, 503, origin, env);
  }

  return jsonResponse({ ok: true, message: SUCCESS_MESSAGE }, 200, origin, env);
}

export async function handleRequest(request, env) {
  const url = new URL(request.url);
  if (url.pathname !== '/api/waitlist') {
    return new Response('Not found', { status: 404, headers: { 'cache-control': 'no-store' } });
  }

  const origin = request.headers.get('origin');
  if (origin && origin !== env.ALLOWED_ORIGIN) {
    return jsonResponse({ ok: false, message: 'Request not allowed.' }, 403, null, env);
  }

  if (request.method === 'OPTIONS') {
    if (!origin) return new Response(null, { status: 204 });
    return new Response(null, {
      status: 204,
      headers: {
        'access-control-allow-origin': origin,
        'access-control-allow-methods': 'POST, OPTIONS',
        'access-control-allow-headers': 'content-type',
        'access-control-max-age': '600',
        'vary': 'Origin',
      },
    });
  }
  if (request.method !== 'POST') {
    return new Response('Not found', { status: 404, headers: { 'cache-control': 'no-store' } });
  }

  return submitWaitlist(request, env, origin);
}

async function cleanupExpired(env) {
  await env.WAITLIST_DB.prepare(`
    DELETE FROM waitlist_signups
    WHERE (launch_notice_sent_at IS NOT NULL
           AND julianday(launch_notice_sent_at) <= julianday('now', '-29 days'))
       OR (launch_notice_sent_at IS NULL
           -- The daily cron runs once per 24 hours; this buffer keeps the
           -- maximum pending retention at 12 months.
           AND julianday(consented_at) <= julianday('now', '-12 months', '+1 day'))
  `).run();
}

export default {
  fetch: handleRequest,
  async scheduled(_controller, env, ctx) {
    ctx.waitUntil(cleanupExpired(env));
  },
};

export const __test__ = { cleanSource, isValidEmail, normalizeEmail, sha256 };
