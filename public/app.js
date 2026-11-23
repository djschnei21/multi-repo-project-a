import { allTags, createApiClient, filterByTag, parseTags, summarize } from './api.js';

const api = createApiClient();

const list = document.querySelector('#todos');
const form = document.querySelector('#new-todo');
const input = document.querySelector('#title');
const tagsInput = document.querySelector('#tags');
const tagFilter = document.querySelector('#tag-filter');
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
  title.className = 'title';
  title.textContent = todo.title;

  const tags = (todo.tags ?? []).map((tag) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'tag';
    chip.textContent = tag;
    chip.title = `Show only "${tag}"`;
    chip.addEventListener('click', () => setFilter(tag));
    return chip;
  });

  const remove = document.createElement('button');
  remove.className = 'remove';
  remove.textContent = '×';
  remove.title = 'Delete';
  remove.addEventListener('click', () => run(() => api.deleteTodo(todo.id)));

  item.append(checkbox, title, ...tags, remove);
  return item;
}

let todos = [];
let activeTag = null;

function filterButton(label, tag) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'tag';
  button.textContent = label;
  button.setAttribute('aria-pressed', String(activeTag === tag));
  button.addEventListener('click', () => setFilter(tag));
  return button;
}

function render() {
  const tags = allTags(todos);
  if (activeTag && !tags.includes(activeTag)) activeTag = null;

  tagFilter.hidden = tags.length === 0;
  tagFilter.replaceChildren(
    filterButton('All', null),
    ...tags.map((tag) => filterButton(tag, tag)),
  );

  const visible = filterByTag(todos, activeTag);
  list.replaceChildren(...visible.map(renderTodo));
  summary.textContent = activeTag
    ? `${summarize(visible)} · tagged "${activeTag}"`
    : summarize(visible);
}

function setFilter(tag) {
  activeTag = activeTag === tag ? null : tag;
  render();
}

async function refresh() {
  todos = await api.listTodos();
  render();
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
    await api.createTodo(title, parseTags(tagsInput.value));
    input.value = '';
    tagsInput.value = '';
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
