# Contributing to Reposignal

Thank you for your interest in contributing to Reposignal.
This document explains **how to set up Reposignal locally** and **how to contribute correctly**.

Reposignal consists of **three parts**:

1. **Reposignal GitHub App (Probot)** – this repository
2. **Reposignal Backend API** – separate repository
3. **Reposignal Frontend** – separate repository

You will need **all three running locally** for most contributions.

---

## Prerequisites

Ensure you have the following installed:

* **Node.js 20+**
* **npm**
* **PostgreSQL 14+**
* **Redis 6+**
* **Git**
* A **GitHub account** (personal account is sufficient)

---

## 1. Create a GitHub App (Required)

Reposignal runs as a **GitHub App**, not a personal token.

### Steps

1. Go to: [https://github.com/settings/apps/new](https://github.com/settings/apps/new)
2. Fill in:

   * **GitHub App name**: `Reposignal (Local)`
   * **Homepage URL**: `http://localhost:3000`
   * **Webhook URL**: (temporary, will use Smee)
   * **Webhook secret**: any string (use same in `.env`)
3. Permissions:

   * **Repository permissions**

     * Issues: Read & Write
     * Pull requests: Read & Write
     * Metadata: Read
   * **Organization permissions**: none required
4. Subscribe to events:

   * Installation
   * Issues
   * Issue comments
   * Pull requests
   * Pull request reviews
5. Create the app
6. Generate and download the **Private Key**
7. Install the app on a test repository (or your fork)

Keep:

* **APP_ID**
* **PRIVATE_KEY**
* **CLIENT ID**
* **CLIENT SECRET**

---

## 2. Webhook Proxy (Smee)

GitHub cannot reach localhost directly.

1. Go to [https://smee.io/new](https://smee.io/new)
2. Copy the generated URL
3. Use it as `WEBHOOK_PROXY_URL`

Run Smee:

```bash
npx smee-client --url <YOUR_SMEE_URL> --path /api/github/webhooks --port 3000
```

---

## 3. Environment Setup

Create `.env` from the example:

```bash
cp .env.example .env
```

### `.env` (Local Development)

```env
# GitHub App
APP_ID=
WEBHOOK_SECRET=development
PRIVATE_KEY=

# OAuth (used by backend)
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# Logging
LOG_LEVEL=debug
NODE_ENV=development

# Webhook proxy
WEBHOOK_PROXY_URL=

# Backend communication
BACKEND_BASE_URL=http://localhost:5000
BOT_API_KEY=dev-bot-key

# Redis (BullMQ)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_USERNAME=
REDIS_PASSWORD=
```

⚠️ **Never commit `.env`**

---

## 4. Start Required Services

### PostgreSQL

Create a database for Reposignal backend.

### Redis

Used for BullMQ cleanup jobs.

```bash
redis-server
```

---

## 5. Run Backend & Frontend

Reposignal backend and frontend live in **separate repositories**.

Follow their respective `Contributing.md` files to:

* Run backend on `http://localhost:5000`
* Run frontend on `http://localhost:9000`

Ensure:

* Backend is reachable from the bot
* Frontend can authenticate via backend cookies

---

## 6. Run the Reposignal GitHub App (This Repo)

```bash
npm install
npm run start
```

This will:

* Start Probot
* Connect via Smee
* Listen for GitHub events

---

## 7. Contribution Workflow

### Fork & Branch

1. Fork this repository
2. Create a branch from `main`

   ```bash
   git checkout -b feature/your-change
   ```

### Issues

* Pick an existing issue **or**
* Open a new issue before large changes

### Pull Requests

* Keep PRs focused
* Reference the issue being addressed
* Ensure bot behavior matches `utils/openapi.ts`

---

## 8. Testing Changes

Use a test repository where the GitHub App is installed.

You can test:

* Issue creation
* Issue comments (`/reposignal` commands)
* Pull request merges
* Contributor rating commands

The **Reposignal bot itself** should be used to:

* Classify issues
* Apply tags
* Rate difficulty & responsiveness

---
