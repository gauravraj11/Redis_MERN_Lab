import { useEffect, useState } from 'react';
import { request } from './api';

function CacheBadge({ cache, ms }) {
  const kind = cache === 'HIT' ? 'hit' : cache === 'MISS' ? 'miss' : 'none';
  return (
    <span className={`badge badge-${kind}`}>
      {cache} {ms !== undefined && `· ${ms} ms`}
    </span>
  );
}

const emptyForm = { name: '', price: '', category: '' };

export default function App() {
  const [products, setProducts] = useState([]);
  const [last, setLast] = useState(null);
  const [selected, setSelected] = useState(null);
  const [log, setLog] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Every request is added to the log on the right
  function addLog(method, url, r) {
    const entry = {
      time: new Date().toLocaleTimeString(),
      method,
      url,
      status: r.status,
      cache: r.cache,
      ms: r.ms,
    };
    setLog((prev) => [entry, ...prev].slice(0, 15));
    if (r.status === 429) setError(r.data?.message || 'Too many requests, slow down!');
  }

  async function checkHealth() {
    const r = await request('GET', '/api/health').catch(() => null);
    setHealth(r?.data || { server: 'down', redis: 'unknown' });
  }

  async function loadProducts() {
    setLoading(true);
    setError('');
    try {
      const r = await request('GET', '/api/products');
      addLog('GET', '/api/products', r);
      setLast(r);
      if (r.ok) setProducts(r.data);
    } catch {
      setError('Cannot reach the backend. Is it running on port 5001?');
    } finally {
      setLoading(false);
    }
  }

  async function viewProduct(id) {
    setError('');
    const url = `/api/products/${id}`;
    const r = await request('GET', url);
    addLog('GET', url, r);
    if (r.ok) setSelected(r);
  }

  async function addProduct(e) {
    e.preventDefault();
    setError('');
    const r = await request('POST', '/api/products', {
      name: form.name,
      price: Number(form.price),
      category: form.category || 'General',
    });
    addLog('POST', '/api/products', r);
    if (!r.ok) return setError(r.data?.message || 'Could not add product');
    setForm(emptyForm);
    await loadProducts(); // reload the list: does the new product appear?
  }

  async function deleteProduct(id) {
    setError('');
    const url = `/api/products/${id}`;
    const r = await request('DELETE', url);
    addLog('DELETE', url, r);
    if (selected?.data?._id === id) setSelected(null);
    await loadProducts();
  }

  // Scenario 3: fire 6 requests back to back
  async function spamRequests() {
    setError('');
    for (let i = 0; i < 6; i++) {
      const r = await request('GET', '/api/products');
      addLog('GET', '/api/products', r);
      setLast(r);
    }
  }

  useEffect(() => {
    checkHealth();
    loadProducts();
  }, []);

  return (
    <div className="app">
      <header className="header">
        <div>
          <p className="eyebrow">MERN + REDIS LAB</p>
          <h1>Product Store</h1>
        </div>
        <div className="health" onClick={checkHealth} title="Click to refresh">
          <span className={`dot ${health?.redis === 'connected' ? 'dot-on' : 'dot-off'}`} />
          Redis: {health ? health.redis : 'checking…'}
        </div>
      </header>

      <section className="stat">
        <div>
          <p className="stat-label">Last list request</p>
          {last ? <CacheBadge cache={last.cache} ms={last.ms} /> : <span className="muted">none yet</span>}
        </div>
        <div className="actions">
          <button onClick={loadProducts} disabled={loading}>
            {loading ? 'Loading…' : 'Fetch products'}
          </button>
          <button className="secondary" onClick={spamRequests}>
            Send 6 quick requests
          </button>
        </div>
      </section>

      {error && <div className="error">{error}</div>}

      <main className="layout">
        <section>
          <h2>Products ({products.length})</h2>
          <div className="grid">
            {products.map((p) => (
              <article key={p._id} className="card">
                <p className="category">{p.category}</p>
                <h3>{p.name}</h3>
                <p className="price">₹{p.price}</p>
                <div className="card-actions">
                  <button className="small" onClick={() => viewProduct(p._id)}>View</button>
                  <button className="small danger" onClick={() => deleteProduct(p._id)}>Delete</button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <aside className="side">
          <div className="panel">
            <h2>Add product</h2>
            <form onSubmit={addProduct}>
              <input
                placeholder="Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              <input
                placeholder="Price (₹)"
                type="number"
                min="0"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                required
              />
              <input
                placeholder="Category"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
              <button type="submit">Add</button>
            </form>
          </div>

          {selected && (
            <div className="panel">
              <h2>Product detail</h2>
              <CacheBadge cache={selected.cache} ms={selected.ms} />
              <h3 className="detail-name">{selected.data.name}</h3>
              <p className="muted">{selected.data.description || 'No description'}</p>
              <p className="price">₹{selected.data.price}</p>
              <button className="small" onClick={() => viewProduct(selected.data._id)}>View again</button>
            </div>
          )}

          <div className="panel">
            <h2>Request log</h2>
            <table className="log">
              <thead>
                <tr><th>Time</th><th>Request</th><th>Status</th><th>Cache</th><th>ms</th></tr>
              </thead>
              <tbody>
                {log.map((l, i) => (
                  <tr key={i}>
                    <td>{l.time}</td>
                    <td className="mono">{l.method} {l.url.replace('/api', '')}</td>
                    <td className={l.status >= 400 ? 'bad' : ''}>{l.status}</td>
                    <td><CacheBadge cache={l.cache} /></td>
                    <td>{l.ms}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </aside>
      </main>
    </div>
  );
}
