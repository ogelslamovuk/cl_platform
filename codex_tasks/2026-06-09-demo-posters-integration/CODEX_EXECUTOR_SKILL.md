# CODEX EXECUTOR SKILL — demo posters integration and deployment

## Role
You are the executor. The product decisions are already approved in this task package.

## Source of truth
Use these files as the task source of truth:
- CODEX_TASK.md
- CODEX_CONTEXT.md
- POSTER_ASSET_MANIFEST.md
- DEMO_CONTENT_TARGET_MATRIX.md
- ACCEPTANCE_CHECKLIST.md

Also read the repository root `SKILLS.md` before editing anything.

## Final acceptance rule
The final accepted result is **deployed and verified pages**, not a pull request and not a patch-only answer.

Required final path:
1. implement only the approved scope;
2. run local validation and build;
3. commit and push the approved changes to the repository branch used by the existing deployment setup;
4. do not create a pull request;
5. wait for the existing deployment workflow / GitHub Pages deployment to finish;
6. verify deployed `/main`, `/demo`, `/admin`, `/channel` pages;
7. report deployment URL(s), commit SHA and verification result.

If deployment is blocked by permissions, missing workflow, failed CI, missing Pages config or any infrastructure reason, stop and return a blocker report with exact evidence.

## Hard rules
- Work from current `main` / current deployment branch / current working tree after inspecting repository config.
- Inspect current source before editing.
- Implement only the approved scope.
- Do not ask for intermediate approvals.
- Do not create a pull request.
- Do not stop at a local diff/patch as final result.
- Do not change routes.
- Do not change store architecture.
- Do not change localStorage architecture.
- Do not change B2C purchase flow.
- Do not change seatmap business logic.
- Do not create new top-level demo entities if existing demo entities can be updated.
- Do not introduce Dubai/DTCM/NEN terms.
- Do not add production backend or real integrations.
- Do not make a broad refactor.
- Do not delete existing SVG poster files unless explicitly required by this task. Leaving old unused SVGs is acceptable.

## Asset rules
- Do not generate images.
- Do not edit image content.
- Do not rename generated PNGs arbitrarily.
- Validate exact filenames first.
- If any required PNG is missing, stop and report blocker.
- If extra PNGs are present, do not use them unless they exactly match the manifest after obvious folder extraction; report extras in final report.

## Demo data rules
- Demo data must remain business-realistic.
- No duplicate old renamed events should remain in B2C after demo data generation/enrichment.
- Preserve main flow:
  Кандидат в организаторы → Организатор → Заявка на мероприятие → Центр Управления → Одобренное событие → Операторы / розница / билеты

## Output rules
Return only:
- changed files list;
- implementation summary;
- local validation/self-check results;
- `npm run build` result;
- local smoke-check result;
- commit SHA;
- deployment workflow / GitHub Pages status;
- live deployed URL(s);
- post-deploy smoke-check result for `/main`, `/demo`, `/admin`, `/channel`;
- blocker report if blocked.
