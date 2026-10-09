// /releases/* — serves desktop release artifacts straight from the private
// R2 bucket via the RELEASES binding (docs/08 §8.6). Consumers:
//   - the site's download button + manifest fetch (same origin)
//   - the app's update banner polls /releases/latest.json from its local
//     origin, so CORS is open on every response.
const TYPES = {
  json: 'application/json; charset=utf-8',
  txt: 'text/plain; charset=utf-8',
  exe: 'application/vnd.microsoft.portable-executable',
  jpeg: 'image/jpeg',
  png: 'image/png',
};

function contentTypeFor(key) {
  const ext = key.split('.').pop().toLowerCase();
  return TYPES[ext] || 'application/octet-stream';
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': '*',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: cors });
    }
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method not allowed', { status: 405, headers: cors });
    }

    const key = decodeURIComponent(url.pathname.replace(/^\/releases\//, ''));
    if (!key || key.startsWith('/') || key.includes('..')) {
      return new Response('Bad request', { status: 400, headers: cors });
    }

    const object = await env.RELEASES.get(key);
    if (object === null) {
      return new Response('Not found', { status: 404, headers: cors });
    }

    const headers = new Headers(cors);
    headers.set('Content-Type', contentTypeFor(key));
    // The manifest must never be cached long: the app's force_below lock
    // and the download button read it on every visit (docs/08 §8.1).
    headers.set(
      'Cache-Control',
      key === 'latest.json'
        ? 'public, max-age=60, must-revalidate'
        : 'public, max-age=86400',
    );
    headers.set('Content-Length', String(object.size));
    if (key.endsWith('.exe')) {
      headers.set('Content-Disposition', `attachment; filename="${key}"`);
    }

    if (request.method === 'HEAD') {
      return new Response(null, { headers });
    }
    return new Response(object.body, { headers });
  },
};
