# CODEX_DELIVERY.md

## Delivery requirements

Definition of done is not code-only.

Codex must complete full delivery:

1. Work from current main.
2. Create a separate branch.
3. Implement task.
4. Run self-check.
5. Run npm run build.
6. Fix build errors within scope.
7. Check diff.
8. Commit.
9. Push branch.
10. Create PR.
11. Wait for checks if available.
12. Fix failed checks within scope.
13. Merge PR into main.
14. Wait for GitHub Pages deployment.
15. Open public deployed URL.
16. Verify required demo scenario.
17. Return final answer with public URL.

## Final answer format

Codex final answer must be:

Готово.

Что сделано:
- ...

Проверки:
- npm run build: passed
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
- GitHub Pages unavailable;
- branch protection requires manual approval;
- task requires product decision not covered by task files.

If blocked, final answer must include:

- exact blocker;
- what was completed;
- one exact next step needed from user.
