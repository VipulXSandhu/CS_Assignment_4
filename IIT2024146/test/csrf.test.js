/**
 * Automated tests for the CSRF demonstration.
 *
 * Uses the Node.js built-in test runner (node --test) — no extra dependency.
 * Each app (vulnerable / secure) is started on an ephemeral port. A tiny
 * cookie jar carries the session cookie across requests, exactly like a
 * browser would, which is what makes the CSRF behaviour observable.
 *
 * Run:  npm test
 */

const test = require('node:test');
const assert = require('node:assert');
const http = require('node:http');

const { createApp, validateAmount, INITIAL_BALANCE } = require('../server');

// ---- Minimal HTTP client with a cookie jar ---------------------------------

function startServer(mode) {
  const app = createApp(mode);
  const server = http.createServer(app);
  return new Promise((resolve) => {
    server.listen(0, () => {
      const { port } = server.address();
      resolve({ server, port, base: `http://127.0.0.1:${port}` });
    });
  });
}

// A client keeps one cookie string, like a single browser session.
function makeClient(base) {
  let cookie = '';
  async function request(method, path, { body, headers = {}, redirect = 'manual' } = {}) {
    const opts = { method, headers: { ...headers } };
    if (cookie) opts.headers['cookie'] = cookie;
    if (body !== undefined) {
      opts.headers['content-type'] = 'application/x-www-form-urlencoded';
      opts.body = typeof body === 'string' ? body : new URLSearchParams(body).toString();
    }
    const res = await fetch(base + path, { ...opts, redirect });
    const setCookie = res.headers.get('set-cookie');
    if (setCookie) cookie = setCookie.split(';')[0]; // keep "name=value"
    return res;
  }
  return {
    get: (p, o) => request('GET', p, o),
    post: (p, o) => request('POST', p, o),
    // Ask for JSON so transfer endpoints return machine-readable results.
    json: {
      get: (p, o) => request('GET', p, { ...o, headers: { accept: 'application/json', ...(o && o.headers) } }),
      post: (p, o) => request('POST', p, { ...o, headers: { accept: 'application/json', ...(o && o.headers) } }),
    },
    getCookie: () => cookie,
  };
}

async function login(client) {
  await client.post('/login', { body: { username: 'demo', password: 'x' } });
}

async function getBalance(client) {
  const res = await client.json.get('/api/balance');
  const data = await res.json();
  return data.balance;
}

// ===========================================================================
//  UNIT TESTS — amount validation
// ===========================================================================

test('validateAmount rejects zero, negative, non-numeric and excessive amounts', () => {
  assert.strictEqual(validateAmount(0, 5000).ok, false);
  assert.strictEqual(validateAmount(-100, 5000).ok, false);
  assert.strictEqual(validateAmount('abc', 5000).ok, false);
  assert.strictEqual(validateAmount(5001, 5000).ok, false); // exceeds balance
  assert.strictEqual(validateAmount(10.5, 5000).ok, false); // not integer
  assert.strictEqual(validateAmount('', 5000).ok, false);
  const good = validateAmount(500, 5000);
  assert.strictEqual(good.ok, true);
  assert.strictEqual(good.amount, 500);
});

// ===========================================================================
//  VULNERABLE MODE
// ===========================================================================

test('VULNERABLE: login works and initial balance is ₹5000', async () => {
  const { server, base } = await startServer('vulnerable');
  const client = makeClient(base);
  await login(client);
  assert.strictEqual(await getBalance(client), INITIAL_BALANCE);
  server.close();
});

test('VULNERABLE: GET /transfer succeeds and balance decreases', async () => {
  const { server, base } = await startServer('vulnerable');
  const client = makeClient(base);
  await login(client);
  const res = await client.json.get('/transfer?amount=500&to=savings');
  const data = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(data.success, true);
  assert.strictEqual(data.balance, 4500);
  assert.strictEqual(await getBalance(client), 4500);
  server.close();
});

test('VULNERABLE: the forged GET attack transfers money (demonstrates CSRF)', async () => {
  const { server, base } = await startServer('vulnerable');
  const client = makeClient(base);
  await login(client);
  // Simulate exactly what the attacker page causes the browser to send:
  // a GET to the transfer endpoint. The cookie jar supplies the session
  // cookie automatically, just like a real browser would.
  const res = await client.json.get('/transfer?amount=1000&to=attacker');
  const data = await res.json();
  assert.strictEqual(data.success, true);
  assert.strictEqual(data.balance, 4000); // attacker drained ₹1000
  server.close();
});

test('VULNERABLE: unauthenticated transfer is rejected', async () => {
  const { server, base } = await startServer('vulnerable');
  const client = makeClient(base); // never logs in
  const res = await client.json.get('/transfer?amount=500');
  assert.strictEqual(res.status, 401);
  server.close();
});

test('VULNERABLE: invalid / zero / negative / excessive amounts are rejected', async () => {
  const { server, base } = await startServer('vulnerable');
  const client = makeClient(base);
  await login(client);
  for (const amount of ['0', '-100', 'abc', '999999']) {
    const res = await client.json.get(`/transfer?amount=${amount}`);
    const data = await res.json();
    assert.strictEqual(data.success, false, `amount=${amount} should fail`);
  }
  // Balance untouched by any of the rejected attempts.
  assert.strictEqual(await getBalance(client), INITIAL_BALANCE);
  server.close();
});

// ===========================================================================
//  SECURE MODE
// ===========================================================================

// Pull the CSRF token out of the dashboard HTML, like a real form would carry.
async function getCsrfToken(client) {
  const res = await client.get('/dashboard');
  const html = await res.text();
  const m = html.match(/name="_csrf" value="([a-f0-9]+)"/);
  return m ? m[1] : null;
}

test('SECURE: legitimate POST with a valid CSRF token succeeds', async () => {
  const { server, base } = await startServer('secure');
  const client = makeClient(base);
  await login(client);
  const token = await getCsrfToken(client);
  assert.ok(token, 'dashboard should embed a CSRF token');
  const res = await client.json.post('/transfer', {
    body: { amount: '500', to: 'savings', _csrf: token },
  });
  const data = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(data.success, true);
  assert.strictEqual(data.balance, 4500);
  server.close();
});

test('SECURE: POST with NO CSRF token is rejected (403) and balance unchanged', async () => {
  const { server, base } = await startServer('secure');
  const client = makeClient(base);
  await login(client);
  const res = await client.json.post('/transfer', { body: { amount: '500', to: 'x' } });
  assert.strictEqual(res.status, 403);
  assert.strictEqual(await getBalance(client), INITIAL_BALANCE);
  server.close();
});

test('SECURE: POST with an INVALID CSRF token is rejected (403)', async () => {
  const { server, base } = await startServer('secure');
  const client = makeClient(base);
  await login(client);
  const res = await client.json.post('/transfer', {
    body: { amount: '500', to: 'x', _csrf: 'deadbeef-not-the-real-token' },
  });
  assert.strictEqual(res.status, 403);
  assert.strictEqual(await getBalance(client), INITIAL_BALANCE);
  server.close();
});

test('SECURE: the same GET-based attack FAILS and balance is unchanged', async () => {
  const { server, base } = await startServer('secure');
  const client = makeClient(base);
  await login(client);
  // Replay the exact attacker payload from the vulnerable demo.
  const res = await client.get('/transfer?amount=1000&to=attacker');
  assert.strictEqual(res.status, 405); // GET not allowed in secure mode
  assert.strictEqual(await getBalance(client), INITIAL_BALANCE);
  server.close();
});

test('SECURE: token rotates after a successful transfer (old token stops working)', async () => {
  const { server, base } = await startServer('secure');
  const client = makeClient(base);
  await login(client);
  const token1 = await getCsrfToken(client);
  // First transfer with token1 succeeds.
  await client.json.post('/transfer', { body: { amount: '100', to: 'a', _csrf: token1 } });
  // Reusing token1 now fails because the server rotated it.
  const replay = await client.json.post('/transfer', {
    body: { amount: '100', to: 'a', _csrf: token1 },
  });
  assert.strictEqual(replay.status, 403, 'rotated token should reject replay');
  server.close();
});

test('SECURE: invalid amounts are rejected even with a valid token', async () => {
  const { server, base } = await startServer('secure');
  const client = makeClient(base);
  await login(client);
  const token = await getCsrfToken(client);
  const res = await client.json.post('/transfer', {
    body: { amount: '-50', to: 'x', _csrf: token },
  });
  const data = await res.json();
  assert.strictEqual(res.status, 400);
  assert.strictEqual(data.success, false);
  assert.strictEqual(await getBalance(client), INITIAL_BALANCE);
  server.close();
});
