Работай в репозитории cl_platform.

Сначала прочитай:
1. SKILLS.md в корне репозитория.
2. CL_PLATFORM_CONTEXT.md, если он есть в репозитории или приложен.
3. Все файлы task package из папки:
   codex_tasks/2026-06-09-demo-posters-integration/

Входные ассеты лежат здесь, проверь оба варианта:
- D:\JetBrains\cl_platform\codex_tasks\2026-06-09-demo-posters-integration\poster_assets_here\
- D:\JetBrains\cl_platform\images_task\generated_posters\

Возможный архив:
- D:\JetBrains\cl_platform\images_task\generated_posters\cl_platform_demo_posters_17_png.zip

Выполни задачу строго по CODEX_TASK.md и CODEX_EXECUTOR_SKILL.md.

Критично:
- не создавай pull request;
- не возвращай результат как "готовый patch/diff" вместо внедрения;
- финальный принимаемый результат — задеплоенные и перепроверенные страницы;
- работай в рамках approved scope;
- если репозиторий/права/CI не позволяют выполнить deploy, остановись и верни blocker report с точной причиной.

Не задавай уточняющих вопросов.
Не выходи за scope.
Не меняй routes, store architecture, localStorage architecture, purchase flow, seatmap logic, admin/operator flows.
Если входной архив/папка с постерами отсутствует или filenames не совпадают с POSTER_ASSET_MANIFEST.md — остановись и верни blocker report с точным списком missing/extra filenames.

После реализации:
1. выполни self-check;
2. выполни npm run build;
3. выполни local smoke-check маршрутов /main, /demo, /admin, /channel;
4. закоммить и запушь approved changes в deployment branch, который используется текущим репозиторием;
5. дождись завершения существующего deployment workflow / GitHub Pages deployment;
6. выполни post-deploy smoke-check live pages: /main, /demo, /admin, /channel;
7. верни финальный отчёт: changed files, commit SHA, deployed URL(s), deployment status, build result, local smoke result, post-deploy smoke result, blockers if any.
