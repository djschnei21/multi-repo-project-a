import { createApiClient, summarize } from './api.js';

const api = createApiClient();

const list = document.querySelector('#todos');
const form = document.querySelector('#new-todo');
const input = document.querySelector('#title');
const errorBox = document.querySelector('#error');
const summary = document.querySelector('#summary');
const status = document.querySelector('#api-status');

function showError(error) {
  errorBox.textContent = error ? error.message : '';
  errorBox.hidden = !error;
}

function renderTodo(todo) {
  const item = document.createElement('li');
  item.className = todo.done ? 'done' : '';

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = todo.done;
  checkbox.addEventListener('change', () => run(() => api.setDone(todo.id, checkbox.checked)));

  const title = document.createElement('span');
  title.textContent = todo.title;

  const remove = document.createElement('button');
  remove.className = 'remove';
  remove.textContent = '×';
  remove.title = 'Delete';
  remove.addEventListener('click', () => run(() => api.deleteTodo(todo.id)));

  item.append(checkbox, title, remove);
  return item;
}

async function refresh() {
  const todos = await api.listTodos();
  list.replaceChildren(...todos.map(renderTodo));
  summary.textContent = summarize(todos);
}

async function run(action) {
  try {
    await action();
    await refresh();
    showError(null);
  } catch (error) {
    showError(error);
  }
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const title = input.value.trim();
  if (!title) return;
  run(async () => {
    await api.createTodo(title);
    input.value = '';
  });
});

api
  .health()
  .then(() => {
    status.textContent = 'API online';
    status.classList.add('ok');
  })
  .catch(() => {
    status.textContent = 'API offline';
    status.classList.add('down');
  });

run(() => Promise.resolve());
