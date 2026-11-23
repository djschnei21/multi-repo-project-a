# multi-repo-project-a: todo-web (frontend)

The frontend half of a two-repo Cursor demo. It is a vanilla JavaScript Todo app
served by a small Node server, with no npm dependencies and no build step.

| Repo | Role | Default port |
| --- | --- | --- |
| **multi-repo-project-a** (this repo) | `todo-web`, the frontend | 3000 |
| [multi-repo-project-b](https://github.com/djschnei21/multi-repo-project-b) | `todo-api`, the backend | 4000 |

The browser only talks to this repo's server. `server.js` proxies every `/api/*`
request to the backend, and the API contract lives in the backend's `openapi.yaml`.

## Run both repos locally

Clone the two repos side by side:

```bash
git clone https://github.com/djschnei21/multi-repo-project-a
git clone https://github.com/djschnei21/multi-repo-project-b

(cd multi-repo-project-b && npm start) &   # API on http://localhost:4000
(cd multi-repo-project-a && npm start)     # app on http://localhost:3000
```

Run `npm test` in each repo to run its tests. Set `API_URL` to point the frontend at a different backend.

## How the repos are set up for Cursor

| File | Purpose |
| --- | --- |
| `AGENTS.md` (both repos) | Tells agents what the repo does, where the sibling repo is, and that `openapi.yaml` is the shared contract |
| `.cursor/rules/*.mdc` (both repos) | Rules scoped by file glob: `api-client.mdc` here, `api-contract.mdc` in the backend |
| `.cursor/environment.json` (this repo) | Cloud Agent config for the two-repo environment: install both repos, then start the API and web app in named terminals |
| `multi-repo.code-workspace` (this repo) | Opens both repos as one multi-root workspace in the Cursor editor |

To use `environment.json` in a multi-repo Cloud Agent environment, add both repos
to the environment in the Cursor dashboard and point the environment's
environment.json location at this repo. Multi-repo Cloud Agent environments clone
each repo to `/agent/repos/<repo-name>` and run `install` from `/agent`, so the
config uses those full paths.

## Demo prompts

**One agent changes both repos.** Start a Cloud Agent on the two-repo environment:

> Add a priority (low, medium, or high, default medium) to todos. Store and validate it in the API, document it in openapi.yaml, show it as a colored badge in the web app, and let users pick it when they add a todo. Update the tests in both repos.

The agent edits both repos, runs both test suites, and opens one pull request per repo.

**An agent asks for access to the other repo.** Start a Cloud Agent on this repo only:

> Add an optional due date to todos and show overdue todos in red.

The backend has no due dates, so the agent asks for access to multi-repo-project-b and changes it too.

**A frontend-only change.** The API already supports renaming (`PATCH` with `title`), but the client doesn't use it:

> Let users rename a todo by double-clicking its title.

The agent reads the contract in the backend repo and changes only this repo.

**A Project splits the work.** Create a Cursor Project with both repos:

> Add tags to todos and a tag filter in the web app.

The coordinator plans the change, then hands the backend and frontend work to separate agents that run in parallel.
