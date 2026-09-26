# Codex Session Starter

Normal session prompt:

Read `AGENTS.md` and all relevant files under `docs/`, especially `DECISIONS.md`, `API_CONTRACT.md`, `ROADMAP.md`, and `CURRENT_TASK.md`. Inspect the existing repository before editing. If CURRENT_TASK is UNASSIGNED or COMPLETE, select the first incomplete unblocked roadmap feature and assign it according to AGENTS.md. Implement only that one feature. Run its required checks/tests, update the roadmap/current-task/changelog files, then stop. Do not begin the next feature.

Specific feature prompt:

Read `AGENTS.md` and the project docs. Work only on roadmap feature `<FEATURE-ID>`. Confirm its dependencies are complete, assign it in CURRENT_TASK, implement it, run relevant checks/tests, update tracking files, then stop.
