# Definition of Done — polish round 3

The task is done only when all sections below are passed.

## 1. Implementation completeness

- [ ] Approved scope from `CODEX_TASK.md` implemented.
- [ ] Out-of-scope items not implemented.
- [ ] Auth/demo login/routes untouched.
- [ ] No broad refactor unrelated to the task.
- [ ] Existing main demo chain preserved.

## 2. Product result

- [ ] Demo data looks business-realistic.
- [ ] At least 8 realistic events are visible.
- [ ] Event types match venues and formats.
- [ ] At least 8 distinct vertical posters are used.
- [ ] Internal toy IDs are not visible as primary labels on main demo screens.
- [ ] Visible UI text on target routes is Russian and business-like.
- [ ] Applications have clear status context.
- [ ] Application history / audit trail is visible.
- [ ] Admin decision log contains meaningful records.
- [ ] Control section contains meaningful business control events.
- [ ] Admin dashboard shows tasks requiring decisions and latest decisions.
- [ ] Admin tables are more readable and have clearer statuses/actions.
- [ ] Forms are grouped into understandable sections.
- [ ] Event application shows mock fee/payment status.
- [ ] Operator cabinet is business-like and not dominated by raw developer/API labels.
- [ ] Empty states are present where relevant.

## 3. Non-regression

- [ ] `/main` still opens.
- [ ] `/proto` still opens.
- [ ] `/organizer` still opens or behaves as before.
- [ ] organizer application flow is not worse than before.
- [ ] event application/compliance flow is not worse than before.
- [ ] `/admin` still opens.
- [ ] admin applications can still be reviewed in demo mode.
- [ ] `/channel` still opens and shows operator data.
- [ ] `/demo` still opens and shows event cards.
- [ ] B2C seat selection for seated events still works.
- [ ] Capacity/open-air events do not pretend to be detailed seated halls.
- [ ] No route removed.
- [ ] No current working action silently removed.

## 4. Technical checks

- [ ] `npm run build` passed.
- [ ] Local smoke-check passed for required routes.
- [ ] No obvious console-breaking runtime error on smoke routes.
- [ ] No dependency changes unless explicitly justified.
- [ ] No new dead UI actions introduced.

## 5. Live delivery

- [ ] Branch created.
- [ ] Commit SHA recorded.
- [ ] PR created.
- [ ] PR merged to `main`.
- [ ] GitHub Pages deploy completed.
- [ ] Live smoke-check passed on required routes.

## 6. Required final report

Final report must be in Russian and include exact statuses:

```text
Branch: <branch>
Commit SHA: <sha>
PR: <url>
Merge status: passed / failed / blocked
GitHub Pages deploy: passed / failed / blocked
npm run build: passed / failed
Local smoke-check: passed / failed
Live smoke-check: passed / failed
Changed files: <list>
Done: <yes/no>
Blockers: <none/list>
```

Do not report `готово` unless live GitHub Pages smoke-check passed.
