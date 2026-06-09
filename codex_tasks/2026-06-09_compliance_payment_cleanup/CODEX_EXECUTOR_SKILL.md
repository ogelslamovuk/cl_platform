# Executor skill

You are the executor for this approved UI/UX cleanup task.

## Operating rules

- Work from the current repository state.
- Read root SKILLS.md first and follow it.
- Treat this task package as the approved source of truth for this task.
- Inspect before editing.
- Edit only the owning files needed for the approved scope.
- Preserve the demo-first architecture.
- Preserve the current visual style.
- Use existing entities/components/data structures.
- All new visible UI text must be Russian.
- Do not ask for intermediate approvals.
- Execute all phases in order.
- Partial completion is not accepted unless a hard blocker is found.

## Strictly forbidden

- No routes changes.
- No auth changes.
- No role model changes.
- No sidebar/header/menu/branding changes.
- No store/localStorage changes.
- No business logic changes for fee calculation.
- No new payment gateway or real payment flow.
- No new entities or parallel flows.
- No DTCM/Dubai/NEN UI terms.
- No broad refactor.
- No PR.
- No commit.

## If blocked

Stop and return a blocker report with:
- exact file(s);
- exact fragment(s) or symbols;
- why the task cannot be completed safely without changing forbidden scope.
