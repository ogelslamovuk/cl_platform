# CODEX_EXECUTION_PLAN

Работай фазами, но без промежуточных approval.

После каждой фазы выполняй self-check и продолжай дальше.

## Фаза 0. Read & inspect

1. Прочитать root `SKILLS.md`.
2. Прочитать root `CL_PLATFORM_CONTEXT.md`.
3. Прочитать task package.
4. Изучить текущий main.
5. Определить реальные files touched.

Ожидаемые области кода по прошлому PR:

- `src/lib/store.ts`
- `src/lib/demoEngine.ts`
- `src/lib/seatMapV2.ts`
- `src/components/B2CView.tsx`
- `src/components/admin/AdminEventComplianceApplications.tsx`
- `src/components/admin/AdminOrganizerApplications.tsx`
- `src/components/admin/AdminRegistryEvents.tsx`
- `src/components/admin/AdminDecisionLog.tsx`
- `src/components/admin/AdminRegistries.tsx`
- `src/components/admin/AdminResellers.tsx`
- `src/components/admin/adminScope.ts`
- `src/components/seatmap/SeatMapConstructorCanvas.tsx`
- `src/pages/OrganizerEventCompliancePage.tsx`
- `src/pages/AdminPage.tsx`
- `src/pages/OrganizerPage.tsx`
- `/proto` page/component

Файлы могут отличаться в текущем main. Работай по фактической структуре.

## Фаза 1. Demo-data consistency

Исправить данные:

- events;
- venues;
- posters;
- regions;
- applications;
- decisions;
- reseller names.

Проверить, что нет 3000+ events и `kvitki`.

## Фаза 2. Regional scope

Довести три режима Центра Управления:

- республика;
- Могилёвская область;
- Гродненская область.

Добавить/исправить demo-data для Могилёва и Гродно.

Добавить фильтр области в заявки мероприятий.

Добавить региональный смысл в журнал решений.

## Фаза 3. Visual documents

Реализовать/доработать визуальный mock-document preview.

Типы:

- passport/ID;
- entry visa/permit;
- venue contract;
- event program;
- participation confirmation.

Подключить к заявкам организатора и мероприятия.

Добавить Escape-close.

## Фаза 4. Compliance tooltips + stage 7 layout

Заменить tooltips всех этапов compliance на утверждённые тексты.

Исправить layout текста этапа 7.

Проверить, что generic tooltip отсутствует.

## Фаза 5. SeatMap templates

Переделать 6 templates:

- театр;
- амфитеатр;
- цирк;
- малая спортивная арена;
- ледовая арена;
- дворец спорта / концертная арена.

Проверить визуальные различия и лимит до 500 мест.

## Фаза 6. B2C

Исправить `/demo`:

- убрать покупки;
- проверить buttons: `Выбрать место` vs `Купить`;
- подключить сквозные постеры;
- проверить seatmap/no-seatmap behavior.

## Фаза 7. `/proto`

4 quick login buttons открывают новые вкладки.

## Фаза 8. Modal Escape sweep

Проверить touched modals/popup.

Добавить Escape-close без broad refactor.

## Фаза 9. Final self-check

Выполнить acceptance checklist.

Запустить build.

Выполнить local smoke.

## Фаза 10. Delivery

Commit, push, PR, merge to main, GitHub Pages deploy, live smoke.

Финальный отчёт только после live smoke.
