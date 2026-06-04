# CODEX_INITIAL_MESSAGE

Проект: `cl_platform`.

Работай автономно до полностью готового live-результата.

## Обязательный порядок чтения

Перед любыми правками прочитай:

1. корневой `SKILLS.md`;
2. корневой `CL_PLATFORM_CONTEXT.md`;
3. `codex_tasks/2026-06-04-demo-polish/CODEX_EXECUTOR_SKILL.md`;
4. `codex_tasks/2026-06-04-demo-polish/CODEX_GITHUB_ISSUE.md`;
5. `codex_tasks/2026-06-04-demo-polish/CODEX_EXPECTED_RESULT.md`;
6. `codex_tasks/2026-06-04-demo-polish/CODEX_EXECUTION_PLAN.md`;
7. `codex_tasks/2026-06-04-demo-polish/CODEX_FORBIDDEN_SCOPE.md`;
8. `codex_tasks/2026-06-04-demo-polish/CODEX_DATA_RULES.md`;
9. `codex_tasks/2026-06-04-demo-polish/CODEX_VALIDATION_AND_DELIVERY.md`.

## Режим работы

Это не analysis-only задача.

Промежуточные approval не запрашивать.

Все продуктовые решения уже утверждены в task package. Твоя задача — выполнить их полностью, проверить, исправить недочёты и довести результат до GitHub Pages.

## Ветка

Работай от актуального `main`.

Создай рабочую ветку:

`codex/demo-polish-2026-06-04`

## Главная цель

Это полировочная итерация после большого UI/UX-прохода.

Нельзя ломать уже работающий demo-flow.

Нужно довести до цельности:

- mock-data;
- B2C витрину;
- poster consistency;
- визуальные mock-документы;
- compliance tooltips;
- regional scope;
- event/venue/seatmap consistency;
- seatmap templates;
- `/proto` quick login behavior;
- modal Escape behavior.

## Delivery

Задача считается завершённой только когда:

1. все правки реализованы;
2. `npm run build` passed;
3. local smoke passed;
4. изменения закоммичены;
5. ветка pushed;
6. PR создан;
7. PR merged в `main`;
8. GitHub Pages deploy completed;
9. live smoke passed на маршрутах:
   - `https://ogelslamovuk.github.io/cl_platform/#/main`
   - `https://ogelslamovuk.github.io/cl_platform/#/demo`
   - `https://ogelslamovuk.github.io/cl_platform/#/organizer`
   - `https://ogelslamovuk.github.io/cl_platform/#/admin`
   - `https://ogelslamovuk.github.io/cl_platform/#/channel`
   - `https://ogelslamovuk.github.io/cl_platform/#/proto`

Финальный ответ дай только после live smoke.

Финальный отчёт — на русском языке, кратко, с указанием branch, commit SHA, PR, deploy run, live URLs, build status, smoke status, changed files.
