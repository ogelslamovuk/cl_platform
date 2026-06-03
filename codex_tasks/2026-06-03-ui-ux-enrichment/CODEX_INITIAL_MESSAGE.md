# CODEX_INITIAL_MESSAGE.md

Ты работаешь в репозитории `cl_platform`.

Задача: автономно выполнить полный пакет UI/UX и demo-flow обогащения прототипа перед демонстрацией платформы министерскому/регуляторному уровню.

Это не exploratory-задача и не обсуждение. Ожидаемый результат уже утверждён. Промежуточные approve у пользователя не запрашивать.

## 0. Что положить в репозиторий перед запуском

В корень репозитория положить / заменить:

- `SKILLS.md` из этого task package — обновлённый корневой project skill для `cl_platform`.

В папку задачи положить все файлы task package:

```text
codex_tasks/2026-06-03-ui-ux-enrichment/
```

## 1. Что прочитать перед любыми правками

Обязательно прочитать в таком порядке:

1. `SKILLS.md` в корне репозитория.
2. `CL_PLATFORM_CONTEXT.md` в корне репозитория.
3. `codex_tasks/2026-06-03-ui-ux-enrichment/CODEX_EXECUTOR_SKILL.md`.
4. Все остальные файлы task package:
   - `CODEX_GITHUB_ISSUE.md`;
   - `CODEX_EXPECTED_RESULT.md`;
   - `CODEX_EXECUTION_PLAN.md`;
   - `CODEX_VALIDATION_AND_DELIVERY.md`;
   - `CODEX_FORBIDDEN_SCOPE.md`;
   - `CODEX_DATA_RULES.md`.

## 2. Режим выполнения

Работать в режиме:

```text
AUTONOMOUS FULL DELIVERY
```

Не спрашивать пользователя:

- подтверждение плана;
- подтверждение после фаз;
- подтверждение отдельных UI-решений;
- разрешение на переход к следующей фазе.

Ожидаемый результат уже утверждён в task package.

Codex должен самостоятельно пройти все фазы, сам себя проверить, исправить недочёты и довести задачу до live-ready результата.

## 3. Главный запрет

Нельзя сломать существующий рабочий demo-flow:

```text
Кандидат в организаторы → Организатор → Заявка на мероприятие → Центр Управления → Одобренное событие → Операторы / розница / билеты
```

Все изменения должны обогащать текущий прототип, а не переписывать его заново.

## 4. Hard blocker protocol

Останавливаться можно только при hard blocker.

Hard blocker — это только:

- build невозможно восстановить без выхода за forbidden scope;
- конфликт репозитория невозможно безопасно решить в рамках scope;
- push/PR/merge/deploy технически заблокирован;
- текущее состояние проекта противоречит task package так, что безопасно выполнить задачу невозможно.

При hard blocker вернуть точный отчёт:

- фаза;
- команда;
- полный вывод ошибки;
- какие файлы уже изменены;
- что требуется для продолжения.

Не писать `готово`, если есть blocker.

## 5. Delivery

Задача считается завершённой только когда:

1. все фазы выполнены;
2. `npm run build` passed;
3. local smoke-check по маршрутам passed;
4. изменения закоммичены;
5. ветка запушена;
6. изменения попали в `main` через стандартный GitHub-flow проекта;
7. GitHub Pages deploy completed;
8. live routes проверены;
9. финальный отчёт на русском содержит commit SHA, branch, PR link, deploy status, live URLs, smoke-check result и список изменённых файлов.

Live routes:

- `https://ogelslamovuk.github.io/cl_platform/#/main`
- `https://ogelslamovuk.github.io/cl_platform/#/demo`
- `https://ogelslamovuk.github.io/cl_platform/#/organizer`
- `https://ogelslamovuk.github.io/cl_platform/#/admin`
- `https://ogelslamovuk.github.io/cl_platform/#/channel`

## 6. Начало работы

После чтения всех файлов сразу начинай выполнение.

Не возвращай промежуточный план пользователю.

Делай задачу автономно до live-ready результата.
