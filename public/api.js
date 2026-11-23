// Client for todo-api. The contract is openapi.yaml in multi-repo-project-b.

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function createApiClient({ baseUrl = '', fetchImpl = (...args) => fetch(...args) } = {}) {
  async function request(path, { method = 'GET', body } = {}) {
    const res = await fetchImpl(`${baseUrl}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    if (res.status === 204) return undefined;

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new ApiError(res.status, data.error ?? `Request failed with ${res.status}`);
    return data;
  }

  return {
    health: () => request('/api/health'),
    listTodos: () => request('/api/todos'),
    createTodo: (title) => request('/api/todos', { method: 'POST', body: { title } }),
    setDone: (id, done) => request(`/api/todos/${id}`, { method: 'PATCH', body: { done } }),
    deleteTodo: (id) => request(`/api/todos/${id}`, { method: 'DELETE' }),
  };
}

export function summarize(todos) {
  const done = todos.filter((todo) => todo.done).length;
  return `${done} of ${todos.length} done`;
}
