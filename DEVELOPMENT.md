# Craftlink AI Development Protocol

Copy these files into the matching repository root before Codex starts.

- `AGENTS.md`: permanent coding-agent rules.
- `docs/DECISIONS.md`: stable project decisions.
- `docs/API_CONTRACT.md`: shared frontend/backend API.
- `docs/ROADMAP.md`: feature-sized sequence.
- `docs/CURRENT_TASK.md`: one active feature.
- `docs/CHANGELOG.md`: concise progress.
- `docs/ARCHITECTURE.md`: repository-specific guidance.
- `docs/SESSION_PROMPT.md`: reusable prompt.

Commit these files to Git before development. This makes accidental AI edits reviewable/revertible.

The files can instruct an agent to stop, but cannot themselves force the Codex product to open a fresh session. Start the next session yourself when you want a fresh context window.

Keep both copies of `API_CONTRACT.md` synchronized.
