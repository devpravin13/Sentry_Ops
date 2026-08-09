# Contributing to Sentry_Ops

Thanks for your interest in contributing to Sentry_Ops — a unified health monitoring tool covering network, application, database, and server layers with proactive downtime-prevention alerts.

This project uses a **fork → clone → branch → pull request** workflow. You do not need write access to this repo to contribute.

---

## Getting Started

### 1. Fork the repository
Click **Fork** in the top-right of the GitHub repo page. This creates your own copy under your GitHub account.

### 2. Clone your fork locally
```bash
git clone https://github.com/<your-username>/Sentry_Ops.git
cd Sentry_Ops
```

### 3. Add the upstream remote
This lets you pull in the latest changes from the main repo later.
```bash
git remote add upstream https://github.com/<original-owner>/Sentry_Ops.git
git remote -v   # confirm origin (your fork) and upstream (main repo) are set
```

### 4. Install the BMAD framework
This project uses [BMAD](https://github.com/bmad-code-org/BMAD-METHOD) (Breakthrough Method for Agile AI-Driven Development) to drive planning and development. The `_bmad` framework installation itself is **not** committed to this repo — install it fresh so you're always on a consistent version:
```bash
npx bmad-method install
```
When prompted to select modules, choose the same set the project uses:
- `[+]` **BMad Core Module** (always installed)
- `[+]` **BMad Method**

Leave the rest unchecked unless a maintainer says otherwise. This regenerates the `_bmad` folder locally — you don't need to (and shouldn't) copy it from elsewhere.

The `_bmad-output` folder (PRD, architecture doc, epics/stories, sprint status) **is** committed — that's real project content, not tool scaffolding. Read `_bmad-output/PRD.md` and `_bmad-output/architecture.md` before picking up a story, so your implementation matches the agreed design.

### 5. Install dependencies
<!-- TODO: fill in once the tech stack is finalized via the BMAD architecture step, e.g.:
Backend:
```bash
cd backend
npm install        # or: pip install -r requirements.txt
```
Frontend:
```bash
cd frontend
npm install
```
-->

### 6. Set up local configuration
<!-- TODO: document any required .env variables, local DB setup, or config files needed to run the project (e.g. DB connection strings, SMTP settings for the email alert feature, monitored-host config). Provide a `.env.example` in the repo root and reference it here. -->

### 7. Run the project locally
<!-- TODO: e.g.
```bash
npm run dev
```
-->

---

## Project Structure

| Path | Committed? | What it is |
|---|---|---|
| `_bmad/` | ❌ gitignored | BMAD framework install (agents, workflows). Regenerate via `npx bmad-method install`. |
| `_bmad-output/` | ✅ committed | Generated PRD, architecture doc, epics/stories, sprint status — the actual planning artifacts. |
| `.agents/` | ⚠️ check before committing | Agent-related config — confirm with a maintainer whether this holds shared project config or local/machine-specific state. |
| `.claude/`, `.opencode/` | ❌ gitignored | Local AI-tool session state and config — machine-specific, regenerate locally. |
| `.github/` | ✅ committed | GitHub Actions workflows, issue/PR templates. |
| `docs/` | ✅ committed | Project documentation. |

---

## Making a Contribution

### 1. Sync your fork before starting new work
```bash
git checkout main
git fetch upstream
git merge upstream/main
git push origin main
```

### 2. Create a feature branch
Branch off `main` for every change — never commit directly to `main`.
```bash
git checkout -b feature/<short-description>
# e.g. feature/db-latency-alert, fix/email-notification-bug
```

Suggested branch prefixes:
- `feature/` — new functionality
- `fix/` — bug fixes
- `docs/` — documentation-only changes
- `refactor/` — code changes that don't alter behavior

### 3. Make your changes
- Keep each PR scoped to a single story/task where possible — smaller PRs are reviewed faster.
- If you're picking up a BMAD-generated story, reference the story file/ID in your commit messages and PR description.

### 4. Commit
Use clear, present-tense commit messages:
```
Add DB query latency threshold monitoring
Fix email alert not firing on server CPU spike
```

### 5. Push to your fork
```bash
git push origin feature/<short-description>
```

### 6. Open a Pull Request
Open a PR from your fork's branch into `main` on the upstream repo. In the PR description, include:
- What the change does and why
- Which layer(s) it touches (network / application / database / server / alerting / dashboard)
- How you tested it
- Any related story/issue reference

---

## Coding Conventions

<!-- TODO: fill in once the architecture/stack is set, e.g.:
- Language/style: <e.g. TypeScript, ESLint + Prettier config in repo root>
- Naming conventions: <e.g. camelCase for variables, PascalCase for components/classes>
- Commit message style: <e.g. Conventional Commits>
- Required tests: <e.g. new alert rules must include a unit test in /tests/alerts>
-->

## Code Review Process

1. Every PR requires at least **one approving review** before merge (enforced via branch protection on `main`).
2. Automated checks (if configured — e.g. linting, tests) must pass.
3. Address review comments by pushing additional commits to the same branch — no need to open a new PR.
4. Once approved and checks pass, a maintainer will merge the PR (squash merge preferred to keep `main` history clean).

## Reporting Issues

Found a bug or have a feature idea? Open a GitHub Issue describing:
- What you expected to happen
- What actually happened
- Steps to reproduce (for bugs)
- Which layer/component it relates to

## Questions?

Open an issue, or reach out to the maintainer directly.