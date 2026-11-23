# todo-web (multi-repo-project-a): frontend

This repo is the frontend of a two-repo project. The backend is
`multi-repo-project-b` (todo-api), which serves the REST API this app calls.

## Stack
- Node 20+, ES modules, no npm dependencies and no build step.
- `public/` holds the browser app: `index.html`, `app.js` (UI), `api.js` (API client), `styles.css`.
- `server.js` serves `public/` and proxies `/api/*` to the backend (`API_URL`, default `http://localhost:4000`).
- Tests use `node:test` and live in `test/`. Run them with `npm test`.

## Cross-repo contract
- The API contract is `openapi.yaml` in multi-repo-project-b. It is the source of truth.
- All HTTP calls go through `public/api.js`. Do not call `fetch` from `public/app.js`.
- If a feature needs a new endpoint or field, add it to the backend first
  (handler, `openapi.yaml`, tests), then update `public/api.js`, the UI, and the tests here.

## Cursor Cloud specific instructions
- In a multi-repo environment the backend is checked out next to this repo
  (`../multi-repo-project-b`).
- Start the backend (`npm start` in multi-repo-project-b), then `npm start` here and open http://localhost:3000.
- Run `npm test` in both repos before you open pull requests, and open one PR per repo.
