import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ApiError,
  allTags,
  createApiClient,
  filterByTag,
  parseTags,
  summarize,
} from '../public/api.js';

function fakeFetch(status, payload) {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, ...init });
    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => payload,
    };
  };
  return { calls, fetchImpl };
}

test('listTodos GETs /api/todos', async () => {
  const { calls, fetchImpl } = fakeFetch(200, [{ id: 1, title: 'a', done: false }]);
  const todos = await createApiClient({ fetchImpl }).listTodos();
  assert.equal(calls[0].url, '/api/todos');
  assert.equal(calls[0].method, 'GET');
  assert.equal(todos.length, 1);
});

test('createTodo POSTs the title as JSON', async () => {
  const { calls, fetchImpl } = fakeFetch(201, { id: 2, title: 'b', done: false });
  await createApiClient({ fetchImpl, baseUrl: 'http://api' }).createTodo('b');
  assert.equal(calls[0].url, 'http://api/api/todos');
  assert.equal(calls[0].method, 'POST');
  assert.deepEqual(JSON.parse(calls[0].body), { title: 'b' });
});

test('createTodo sends tags when given', async () => {
  const { calls, fetchImpl } = fakeFetch(201, { id: 2, title: 'b', done: false, tags: ['work'] });
  await createApiClient({ fetchImpl }).createTodo('b', ['work']);
  assert.deepEqual(JSON.parse(calls[0].body), { title: 'b', tags: ['work'] });
});

test('createTodo omits an empty tag list', async () => {
  const { calls, fetchImpl } = fakeFetch(201, { id: 2, title: 'b', done: false, tags: [] });
  await createApiClient({ fetchImpl }).createTodo('b', []);
  assert.deepEqual(JSON.parse(calls[0].body), { title: 'b' });
});

test('setDone PATCHes the done flag', async () => {
  const { calls, fetchImpl } = fakeFetch(200, { id: 3, title: 'c', done: true });
  await createApiClient({ fetchImpl }).setDone(3, true);
  assert.equal(calls[0].url, '/api/todos/3');
  assert.equal(calls[0].method, 'PATCH');
  assert.deepEqual(JSON.parse(calls[0].body), { done: true });
});

test('deleteTodo resolves to undefined on 204', async () => {
  const { fetchImpl } = fakeFetch(204);
  assert.equal(await createApiClient({ fetchImpl }).deleteTodo(4), undefined);
});

test('errors from the API become ApiError', async () => {
  const { fetchImpl } = fakeFetch(400, { error: 'title is required' });
  await assert.rejects(createApiClient({ fetchImpl }).createTodo(''), (error) => {
    assert.ok(error instanceof ApiError);
    assert.equal(error.status, 400);
    assert.equal(error.message, 'title is required');
    return true;
  });
});

test('summarize counts completed todos', () => {
  assert.equal(summarize([]), '0 of 0 done');
  assert.equal(summarize([{ done: true }, { done: false }, { done: true }]), '2 of 3 done');
});

test('parseTags splits comma-separated input', () => {
  assert.deepEqual(parseTags(' work, urgent ,,'), ['work', 'urgent']);
  assert.deepEqual(parseTags(''), []);
});

test('allTags collects sorted unique tags and tolerates a missing tags field', () => {
  const todos = [{ tags: ['work', 'urgent'] }, { tags: ['home', 'work'] }, {}];
  assert.deepEqual(allTags(todos), ['home', 'urgent', 'work']);
});

test('filterByTag keeps only todos with the tag', () => {
  const todos = [
    { id: 1, tags: ['work'] },
    { id: 2, tags: ['home'] },
    { id: 3 },
  ];
  assert.deepEqual(filterByTag(todos, 'work').map((todo) => todo.id), [1]);
  assert.equal(filterByTag(todos, null), todos);
});
