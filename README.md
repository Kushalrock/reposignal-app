# Reposignal

Reposignal is a **GitHub App** that adds **issue-level discovery context** to repositories.

It helps contributors find meaningful open-source work and gives maintainers control over how their issues are discovered — without changing existing workflows.

Reposignal is **issue-first**, **opt-in**, and **privacy-respecting** by design.

---

## What Reposignal Does

### For Maintainers

Reposignal allows maintainers to:

* Opt repositories in or out of discovery
* Classify issues by difficulty and type
* Add repository context (languages, frameworks, domains)
* Pause discovery without uninstalling the app
* Keep issue and PR threads clean (bot messages auto-delete)

All actions are explicit and reversible.

### For Contributors

Reposignal allows contributors to:

* Discover issues by difficulty, language, framework, and domain
* Explore issues anonymously (no login required)
* View repository context without popularity bias
* Provide post-merge feedback privately

There are **no public ratings, scores, or leaderboards**.
---

## How It Works (High Level)

1. Maintainer installs the Reposignal GitHub App
2. Reposignal receives installation and repository events
3. Maintainers optionally classify issues using slash commands
4. Contributors discover issues via the Reposignal frontend
5. After merge, contributors can submit **anonymous feedback**
6. Aggregated signals improve discovery context over time

---

## Slash Commands (Examples)

### Maintainer Commands

```text
/reposignal difficulty 3
/reposignal type bug
/reposignal hide
/reposignal tags backend infra
```

### Contributor Commands (Post-merge only)

```text
/reposignal rate difficulty 3
/reposignal rate responsiveness 2
```

Contributor feedback is:

* Anonymous
* One-time per PR
* Never publicly visible

---

## Logging & Auditability

Reposignal maintains an **immutable, human-readable log** of actions.

* Logs explain *what happened*, not *who to judge*
* Human-triggered actions are attributed to humans
* Contributor feedback is logged **without identity**
* Logs are auditable and maintainer-visible (filtered)

No sensitive data is stored.

---

## Architecture Overview

* **GitHub App / Bot:** Probot (Node.js)
* **Backend API:** Hono + Drizzle + PostgreSQL
* **Queue / Cleanup:** BullMQ
* **Frontend:** Next.js (separate repository)
* **Auth:** GitHub OAuth + secure cookies

The bot uses only `/bot/*` endpoints.
Public and frontend APIs are strictly separated.

---

## Development Status

Reposignal is under active development.

* Core architecture: stable
* API contracts: defined via OpenAPI
* Frontend & backend: versioned independently

Issues and discussions are welcome.

---