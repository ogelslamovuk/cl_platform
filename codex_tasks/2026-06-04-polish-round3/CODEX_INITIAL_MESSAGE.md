# CODEX_INITIAL_MESSAGE.md

Работай автономно по задаче polish round 3 для `cl_platform`.

## Источник задачи

Task package должен лежать в репозитории в папке:

`codex_tasks/2026-06-04-polish-round3/`

Перед любыми изменениями прочитай в таком порядке:

1. `SKILLS.md` в корне репозитория.
2. `CL_PLATFORM_CONTEXT.md`, если он есть в корне или task package.
3. `codex_tasks/2026-06-04-polish-round3/CODEX_EXECUTOR_SKILL.md`
4. `codex_tasks/2026-06-04-polish-round3/CODEX_EXPECTED_RESULT.md`
5. `codex_tasks/2026-06-04-polish-round3/CODEX_IMPLEMENTATION_TASK.md`
6. `codex_tasks/2026-06-04-polish-round3/CODEX_ACCEPTANCE_CHECKLIST.md`

## Режим работы

Не спрашивай промежуточные approve.

Expected result уже согласован. Твоя задача — довести результат до acceptance autonomously.

Останавливайся только если:
- невозможно продолжить технически;
- build/deploy недоступны из-за прав;
- выполнение требует сломать существующий demo-flow.

## Главный запрет

Не ломай текущий рабочий demo-flow:

`Кандидат в организаторы -> Организатор -> Заявка на мероприятие -> Центр Управления -> Одобренное событие -> Реселлеры / розница / билеты`

Это polish-итерация. Нельзя превращать её в refactor ради refactor.

## Delivery

Нужно довести до live-ready результата:

1. Работать от текущего `main`.
2. Создать отдельную ветку.
3. Выполнить задачу полностью.
4. Запустить `npm run build`.
5. Сделать smoke-check по маршрутам:
   - `/main`
   - `/proto`
   - `/organizer`
   - `/admin`
   - `/channel`
   - `/demo`
6. Создать PR.
7. Merge в `main`.
8. Дождаться успешного GitHub Pages deploy.
9. Проверить live routes.
10. В финальном ответе дать:
   - branch;
   - commit;
   - PR;
   - deploy run;
   - live URLs;
   - что проверено;
   - список изменённых файлов.
