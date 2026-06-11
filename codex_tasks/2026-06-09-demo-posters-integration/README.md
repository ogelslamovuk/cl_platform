# cl_platform — demo posters integration task package

## Purpose
This package is for Codex. It integrates the final 17 generated PNG posters into the existing `cl_platform` demo data and B2C showcase.

## Important execution rule
Final accepted result is **not a pull request** and not a local patch only.

Final accepted result is:
- changes implemented in the repository;
- `npm run build` passed;
- existing deployment workflow completed;
- deployed pages are live;
- live deployed routes were smoke-checked and reported.

Codex must not create a PR. Codex must not stop at a diff/patch-only result unless deployment is blocked by permissions or infrastructure.

## Poster input locations
The 17 generated PNG posters may be provided in either of these locations:

```text
D:\JetBrains\cl_platform\codex_tasks\2026-06-09-demo-posters-integration\poster_assets_here\*.png
```

or:

```text
D:\JetBrains\cl_platform\images_task\generated_posters\*.png
```

An archive is also acceptable if placed at:

```text
D:\JetBrains\cl_platform\images_task\generated_posters\cl_platform_demo_posters_17_png.zip
```

The filenames must match `POSTER_ASSET_MANIFEST.md` exactly.

## How to run
1. Put this task package folder into the repo:

```text
D:\JetBrains\cl_platform\codex_tasks\2026-06-09-demo-posters-integration\
```

2. Put the 17 PNG posters into `poster_assets_here/` or `images_task/generated_posters/`.
3. Open Codex in the repo.
4. Send the contents of `CODEX_INITIAL_MESSAGE.md` as the first message.
5. Attach or make available the whole task package folder.

## Expected result
Codex should:
- validate the 17 PNG files;
- copy 17 PNG files into `public/demo/posters/`;
- update demo data so all B2C demo events use these posters;
- update renamed/cleaned demo content consistently;
- keep the B2C flow working;
- make Михаил Стасов appear at the top of the афиша;
- run local build and smoke checks;
- commit/push only the approved scope to the deployment branch used by the repository;
- wait for the existing deployment workflow / GitHub Pages deployment;
- smoke-check deployed `/main`, `/demo`, `/admin`, `/channel` pages;
- return live URLs, commit SHA, deployment status and verification report.
