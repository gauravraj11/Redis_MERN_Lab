// Every call returns { data, status, cache, ms } so the UI can show
// HIT / MISS and how long the request took.
export async function request(method, url, body) {
  const start = performance.now();
  const res = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const ms = Math.round(performance.now() - start);
  const data = await res.json().catch(() => null);

  return {
    data,
    status: res.status,
    ok: res.ok,
    cache: res.headers.get('X-Cache') || '-',
    ms,
  };
}
