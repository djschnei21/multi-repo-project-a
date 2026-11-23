import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createWebServer } from '../server.js';

let fakeApi;
let web;
let webUrl;
const received = [];

const listen = (server) =>
  new Promise((resolve) => server.listen(0, () => resolve(`http://localhost:${server.address().port}`)));

before(async () => {
  fakeApi = createServer(async (req, res) => {
    let body = '';
    for await (const chunk of req) body += chunk;
    received.push({ method: req.method, url: req.url, body });
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ proxied: true }));
  });
  const apiUrl = await listen(fakeApi);
  web = createWebServer({ apiUrl });
  webUrl = await listen(web);
});

after(() => {
  web.close();
  fakeApi.close();
});

test('serves index.html at /', async () => {
  const res = await fetch(`${webUrl}/`);
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type'), /text\/html/);
  assert.match(await res.text(), /<h1>Todos<\/h1>/);
});

test('serves JavaScript modules with the right content type', async () => {
  const res = await fetch(`${webUrl}/api.js`);
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type'), /text\/javascript/);
});

test('returns 404 for unknown files', async () => {
  const res = await fetch(`${webUrl}/missing.txt`);
  assert.equal(res.status, 404);
});

test('proxies /api requests to todo-api, including the body', async () => {
  const res = await fetch(`${webUrl}/api/todos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'via proxy' }),
  });
  assert.deepEqual(await res.json(), { proxied: true });
  assert.deepEqual(received.at(-1), {
    method: 'POST',
    url: '/api/todos',
    body: JSON.stringify({ title: 'via proxy' }),
  });
});
