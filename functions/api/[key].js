// Cloudflare Pages Function: /api/pool-tests and /api/pool-ranges
//
// Backed by a KV namespace bound as POOL_KV (Pages project settings ->
// Functions -> KV namespace bindings).
//
// Protected by a shared passcode, set as the POOL_PASSCODE environment
// variable (Pages project settings -> Environment variables). The browser
// must send it back on every request as the X-Pool-Key header.

const ALLOWED_KEYS = new Set(['pool-tests', 'pool-ranges']);

function isAuthorized(request, env) {
  const provided = request.headers.get('X-Pool-Key') || '';
  // If no passcode has been configured on the deployment, refuse everything
  // rather than silently running unprotected.
  return Boolean(env.POOL_PASSCODE) && provided === env.POOL_PASSCODE;
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function onRequestGet(context) {
  const { params, request, env } = context;
  const key = params.key;

  if (!ALLOWED_KEYS.has(key)) return json({ error: 'Not found' }, 404);
  if (!isAuthorized(request, env)) return json({ error: 'Unauthorized' }, 401);
  if (!env.POOL_KV) return json({ error: 'KV namespace not bound' }, 500);

  const value = await env.POOL_KV.get(key);
  return json({ key, value });
}

export async function onRequestPost(context) {
  const { params, request, env } = context;
  const key = params.key;

  if (!ALLOWED_KEYS.has(key)) return json({ error: 'Not found' }, 404);
  if (!isAuthorized(request, env)) return json({ error: 'Unauthorized' }, 401);
  if (!env.POOL_KV) return json({ error: 'KV namespace not bound' }, 500);

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  if (typeof body.value !== 'string') {
    return json({ error: '"value" must be a string' }, 400);
  }

  await env.POOL_KV.put(key, body.value);
  return json({ ok: true });
}
