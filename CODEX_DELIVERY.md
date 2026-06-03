# CODEX_DELIVERY.md

## Delivery requirements

Definition of done is not code-only.

Codex must complete full delivery:

1. Work from current main.
2. Create a separate branch.
3. Implement task.
4. Run self-check.
5. Run npm run build.
6. Run tests if present.
7. Fix build/test errors within scope.
8. Check git diff.
9. Commit.
10. Push branch.
11. Create PR.
12. Wait for checks if available.
13. Fix failed checks within scope.
14. Merge PR into main.
15. Wait for GitHub Pages deployment.
16. Open public deployed URL.
17. Verify required demo scenario.
18. Return final answer with public URL.

## Final answer format

Codex final answer must be:

Готово.

Что сделано:
- ...

Проверки:
- npm run build: passed
- tests: passed / not present
- Acceptance checklist: passed
- Demo scenario: checked
- PR: <link>
- Merge: completed
- GitHub Pages deploy: completed
- Public URL checked: yes

Проверять здесь:
<public URL>

## If blocked

Codex may stop only on a real external blocker:

- no GitHub auth;
- no push permission;
- no merge permission;
- branch protection requires manual approval;
- GitHub Pages unavailable;
- task requires product decision not covered by task files.

If blocked, final answer must include:

- exact blocker;
- what was completed;
- one exact next step needed from user.
