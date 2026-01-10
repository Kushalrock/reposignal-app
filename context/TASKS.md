# TASKS.md — Reposignal GitHub Bot (Probot)

> **Project**: Reposignal GitHub Bot
> **Type**: GitHub App (Probot)
> **Runtime**: Node.js (npm)
> **Queue**: BullMQ (Redis)
> **Backend Contract**: `utils/openapi.ts`
> **Allowed Endpoints**: `/bot/*` ONLY
> **State Ownership**: Backend ONLY

---

## 0. ABSOLUTE SYSTEM RULES (NON-NEGOTIABLE)

These rules override **all** implementation decisions.

1. **Bot owns ZERO persistent state**

   * No database
   * No local storage
   * No cached business logic
2. **Backend is the single source of truth**

   * Bot never infers state
3. **Every backend call MUST match `utils/openapi.ts`**

   * No guessing
   * No undocumented routes
4. **Bot messages must be ephemeral**

   * All bot messages are cleaned up
5. **Human actions are logged as human actions**

   * Bot is not the actor unless fully autonomous
6. **Contributor feedback is anonymous and irreversible**

   * Identity is never logged
   * Feedback can only happen once per PR
7. **Bot is silent by default**

   * No chatter
   * No reminders beyond one nudge

Violation of any rule = incorrect implementation.

---

## 1. BOT AUTHENTICATION → BACKEND

### 1.1 Authentication

All bot → backend calls use:

```
Authorization: Bearer BOT_API_KEY
```

* Provided via environment variables
* Never logged
* Never exposed

---

## 2. OPENAPI CONTRACT (MANDATORY)

### 2.1 Source of Truth

```
utils/openapi.ts
```

Before implementing ANY backend call:

* Verify method
* Verify path
* Verify request body
* Verify response shape

No deviations allowed.

---

## 3. LOGGING SYSTEM (MOST IMPORTANT)

### 3.1 Why Logs Exist

Logs are:

* Auditable
* Human-readable
* Maintainer-visible (filtered)
* Non-sensitive
* Immutable

Logs explain **what happened**, not **how someone felt**.

---

## 4. LOG ENTRY MODEL (FINAL, CANONICAL)

### `logs` table

| Field           | Description                                        |
| --------------- | -------------------------------------------------- |
| id              | uuid (pk)                                          |
| timestamp       | timestamptz                                        |
| actor_type      | enum(`system`, `bot`, `maintainer`, `contributor`) |
| actor_github_id | bigint | null                                      |
| actor_username  | text | null                                        |
| action          | text                                               |
| entity_type     | enum(`repo`, `issue`, `installation`, `feedback`)  |
| entity_id       | text                                               |
| context         | jsonb                                              |

---

## 5. LOGGING RULES (CRITICAL)

### Rule 1 — Bot Is NOT the Actor for Human-Triggered Actions

If a maintainer runs:

```
/reposignal difficulty 5
```

Log:

```json
{
  "actor_type": "maintainer",
  "actor_github_id": 123,
  "actor_username": "Akshay",
  "action": "issue_difficulty_set",
  "entity_type": "issue",
  "entity_id": "issue#123",
  "context": { "difficulty": 5 }
}
```

Even though the **bot executed it**.

---

### Rule 2 — Bot or System Is Actor Only for Autonomous Events

Examples:

**Installation received**

```json
{
  "actor_type": "system",
  "action": "installation_created",
  "entity_type": "installation",
  "entity_id": "installation#456"
}
```

**Automatic inference**

```json
{
  "actor_type": "bot",
  "action": "inference_applied",
  "entity_type": "repo",
  "entity_id": "repo#abc"
}
```

---

### Rule 3 — Contributor Identity Is NEVER Logged for Feedback

When contributor runs:

```
/reposignal rate difficulty 3
```

Log:

```json
{
  "actor_type": "contributor",
  "actor_github_id": null,
  "actor_username": null,
  "action": "feedback_received",
  "entity_type": "repo",
  "entity_id": "repo#abc",
  "context": { "difficulty_rating": 3 }
}
```

No GitHub ID.
No username.
No PR reference.

This is deliberate and mandatory.

---

## 6. INSTALLATION LIFECYCLE

### 6.1 `installation.created`

#### Bot Tasks

1. Extract:

   * `installation.id`
   * `account.type`
   * `account.login`
2. Call backend:

   ```
   POST /bot/installations/sync
   ```
3. Backend handles:

   * Installation creation
   * Repository association
   * Setup window

#### Log

```json
{
  "actor_type": "system",
  "action": "installation_created",
  "entity_type": "installation",
  "entity_id": "installation#456"
}
```

---

## 7. ISSUE FLOW

### 7.1 `issues.opened`

#### Preconditions (from backend)

* Repo installed
* Repo state ≠ `off`
* Classification allowed

#### Bot Behavior

1. Post **one** subtle nudge
2. Capture `comment_id`
3. Schedule cleanup

#### Log

```json
{
  "actor_type": "bot",
  "action": "issue_nudge_posted",
  "entity_type": "issue",
  "entity_id": "issue#123"
}
```

---

## 8. ISSUE COMMENT COMMANDS (MAINTAINERS)

### Supported Commands

```
/reposignal difficulty 1–5
/reposignal type docs|bug|feature|refactor|test|infra
/reposignal hide
```

### Permission Check

Allowed:

* write
* maintain
* admin

Silent ignore otherwise.

---

### Execution Flow

1. Parse command
2. Validate permissions
3. Call backend
4. Respond with confirmation
5. Schedule cleanup

---

### Logs (Examples)

**Difficulty set**

```json
{
  "actor_type": "maintainer",
  "actor_username": "Akshay",
  "action": "issue_classified",
  "entity_type": "issue",
  "entity_id": "issue#123",
  "context": { "difficulty": 5 }
}
```

**Issue hidden**

```json
{
  "actor_type": "maintainer",
  "action": "issue_hidden",
  "entity_type": "issue",
  "entity_id": "issue#123"
}
```

---

## 9. PULL REQUEST FEEDBACK FLOW

### 9.1 `pull_request.closed`

Conditions:

* PR merged
* Repo feedback enabled

#### Bot Behavior

1. Post **one** feedback nudge
2. Capture `comment_id`
3. Schedule cleanup

#### Log

```json
{
  "actor_type": "bot",
  "action": "feedback_prompted",
  "entity_type": "repo",
  "entity_id": "repo#abc"
}
```

---

## 10. CONTRIBUTOR COMMAND RULES (STRICT)

Contributor commands valid ONLY if:

| Condition          | Required  |
| ------------------ | --------- |
| Thread             | PR        |
| PR state           | merged    |
| Commenter          | PR author |
| Feedback submitted | NO        |

Otherwise → silent ignore.

---

### Supported Commands

```
/reposignal rate difficulty 1–5
/reposignal rate responsiveness 1–5
```

---

### Execution Flow

1. Validate PR author
2. Check backend for existing feedback
3. Submit feedback
4. Respond once
5. Cleanup all messages

---

### Log (Anonymous)

```json
{
  "actor_type": "contributor",
  "actor_github_id": null,
  "actor_username": null,
  "action": "feedback_received",
  "entity_type": "repo",
  "entity_id": "repo#abc",
  "context": {
    "difficulty_rating": 3,
    "responsiveness_rating": 2
  }
}
```

---

## 11. BULLMQ CLEANUP SYSTEM

### Queue

```
reposignal-cleanup
```

### Deletes or edits:

* Bot messages
* Maintainer commands
* Contributor commands

### Log

```json
{
  "actor_type": "system",
  "action": "comment_cleaned_up",
  "entity_type": "issue",
  "entity_id": "comment#789"
}
```

---

## 12. FINAL GUARANTEE

When implemented correctly:

* Logs tell the full story
* Humans remain accountable
* Contributors remain safe
* GitHub threads stay clean
* Bot disappears after acting
