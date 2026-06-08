# CODEX_TASK — polish round 4

## Goal

Improve `cl_platform` demo credibility and UI/UX polish before presentation, while preserving all existing working flows.

This is an enrichment iteration, not a rewrite.

## Product expectation

After this iteration, the platform should feel more like a serious Belarus-oriented GovTech / RegTech demo for cultural and mass-events regulation:

- realistic events and organizations;
- varied posters;
- event types matching venues;
- clear statuses;
- visible decision/audit trail;
- meaningful control/risk events;
- readable admin tables;
- structured application forms;
- visible mock fee/payment status with transparent calculation;
- business-like operator cabinet;
- no raw technical mock labels in the main UI.

## User/demo expectation

During live demo, the presenter should be able to open `/main`, `/proto`, `/organizer`, `/admin`, `/channel`, `/demo` and show a richer, cleaner, more credible product without explaining away obvious mock/test artifacts.

The demo must not regress.

## Approved scope

Implement the following phases.

---

# Phase 0 — Inspect and baseline

Before changes:

1. Read root `SKILLS.md`.
2. Read `CL_PLATFORM_CONTEXT.md` if present.
3. Read all files in this task package.
4. Inspect current source ownership for:
   - demo data;
   - B2C event cards/posters;
   - admin dashboard;
   - admin application tables;
   - control section;
   - decision log / operation log;
   - organizer application form;
   - event application form;
   - channel/operator page;
   - shared status badge / table helpers if present.
5. Run current build before changes if possible.
6. Do not change auth/demo-login/routes.

---

# Phase 1 — Realistic demo data, event types, venue matching, posters

## Requirements

Replace visible toy/demo content with realistic demo content.

Do not remove existing entities if other modules depend on them. Enrich or replace display fields safely.

## Event mix

Ensure B2C/admin/channel data includes at least 8 visible events across different formats:

1. `Фестиваль «Васільковы край»` — open-air / general admission — Верхний город, Минск.
2. `Концерт «Песня роднай зямлі»` — seated hall — Белорусская государственная филармония.
3. `Театральный форум «Сцэна Беларусі»` — seated hall — Театр имени Якуба Коласа, Витебск.
4. `Детская программа «Казкі Палесся»` — seated hall / small venue — Гомельский городской центр культуры.
5. `Концерт мастеров искусств «Беларусь у сэрцы»` — large seated hall — Дворец Республики.
6. `Фестиваль ремёсел «Слуцкие пояса»` — capacity / small venue — Дом культуры, Слуцк.
7. `Музыкальный вечер «Звоны Нясвіжа»` — chamber / limited capacity — Замковый комплекс «Несвиж».
8. `Хореографическая программа «Кола традыцый»` — seated hall — Гродненский драматический театр.

Optional, if current data structure makes it easy:

9. `Концерт «Новые имена»` — chamber hall.
10. `Концерт «Дняпроўскія галасы»` — seated hall — Могилёвская областная филармония.

## Venue matching rules

- камерное мероприятие не проводить во Дворце Республики;
- open-air фестиваль не должен выглядеть как seated hall;
- театр проводить в театральной площадке;
- детскую программу проводить в малой/средней площадке;
- Дворец Республики использовать только для крупного концерта;
- open-air / capacity-only events must not open detailed seatmap as if every seat exists.

## Posters

Add or update at least 8 different vertical poster assets.

Rules:

- vertical poster ratio, approximately 2:3 or 3:4;
- visually distinct layouts;
- no repeated clone poster;
- no internal text like `Demo`, `Mock`, `Центр управления · Demo`;
- no English poster text;
- no real person photos;
- no watermarks;
- calm cultural/event poster style.

SVG posters are acceptable.

## Public numbers and labels

Avoid visible technical IDs.

Show human-readable numbers:

- organizer application: `РО-2026-0001`;
- event application: `ЗМ-2026-0001`;
- operation: `ОП-2026-0001`;
- ticket: `БИЛ-2026-0001`;
- registry entry: `РЕЕСТР-ОРГ-2026-0001`.

Internal ids may remain in code/storage if required.

## Organization names

Use realistic demo names, for example:

- ГУ «Минскконцерт»;
- ГУ «Белорусская государственная филармония»;
- ООО «Культурная инициатива Беларуси»;
- ЧУП «Праздничная сцена»;
- ГУ «Гомельский городской центр культуры»;
- ГУК «Гродненский областной драматический театр».

No real passport data.

## Document labels

Visible labels must be Russian and business-realistic:

- `Программа мероприятия.pdf`;
- `Договор с площадкой.pdf`;
- `Схема зала.pdf`;
- `План территории.pdf`;
- `Список исполнителей.pdf`;
- `Согласие площадки.pdf`;
- `Возрастная категория.pdf`;
- `Квитанция об оплате пошлины.pdf`;
- `Афиша мероприятия.pdf`.

Safe mock filenames may remain internally.

---

# Phase 2 — Visible Russian UI polish

## Requirements

Remove visible English/dev labels from the main UI.

Focus on routes:

- `/main`;
- `/proto`;
- `/organizer`;
- `/organizer/register` or current organizer application route;
- `/organizer/compliance` or current event application route;
- `/admin`;
- `/channel`;
- `/demo`.

Do not rename internal enum/type/function names unless required for display.

## Required visible replacements

Use context-appropriate Russian replacements:

- `Sync:` → `Обновлено:`;
- `Records` → `Записи` / `Журнал`;
- `Company name` → `Наименование юридического лица`;
- `Save draft` → `Сохранить черновик`;
- `Submit application` → `Отправить заявку`;
- `Signature verification status` → `Статус проверки подписи`;
- `invalid` → `Требуется проверка` / `Недействительно`;
- `OpenAPI` → `Документация API`;
- `Webhook` → `Веб-хуки` only in technical API context;
- `Partner Info` → `Сведения об операторе`;
- `Request limit` → `Лимит запросов`;
- `Demo engine` → `Демо-данные`;
- `Reset demo` → `Сбросить демо`;
- `Mock Data` → `Демо-данные`;
- `Event name` → `Название мероприятия`;
- `Organizer` → `Организатор`;
- `Status` → `Статус`;
- `approve` → `Одобрить`;
- `return` → `Вернуть на доработку`;
- `reject` → `Отклонить`;
- `Sold out` → `Распродано`;
- `Invalid` → `Недействительно`.

## Terminology

Use:

- `мероприятие`, not `ивент`;
- `билетный оператор` or `оператор`, not raw `реселлер` in formal admin context;
- `Центр Управления` exactly where current branding uses it;
- `заявка на мероприятие`;
- `заявка организатора`;
- `площадка`;
- `госпошлина`;
- `журнал решений`;
- `журнал операций`;
- `реестр`.

---

# Phase 3 — Status headers, decision history and admin decision log

## Requirements

Add clear status context for organizer/event applications.

Do this by enriching existing application screens and existing admin decision/log screens. Do not create new routes.

## Application status header

For organizer application screens, show compact header with:

- public application number;
- current status;
- last update;
- region;
- next action.

Allowed statuses:

- `Черновик`;
- `На рассмотрении`;
- `Требует доработки`;
- `Включён в реестр`;
- `Отклонена`.

For event application screens, show compact header with:

- public application number;
- event name;
- organizer;
- venue;
- date;
- region;
- application status;
- fee/payment status;
- next action.

Allowed statuses:

- `Черновик`;
- `На проверке`;
- `Ожидает оплаты пошлины`;
- `Оплачено`;
- `Одобрено`;
- `Вернуть на доработку`;
- `Отклонено`.

## History block

Add or enrich `История заявки` block.

Each record should show:

- date/time;
- actor: `Организатор`, `Центр Управления`, `Система`;
- action;
- comment/ground;
- resulting status.

Minimum demo records for event applications:

- `Черновик мероприятия создан`;
- `Документы загружены`;
- `Заявка отправлена`;
- `Пошлина рассчитана`;
- `Оплата пошлины подтверждена`;
- `Межведомственная проверка завершена`;
- `Решение принято`.

## Admin decision log

Use existing admin decision/log section if present.

It must show at least 8 meaningful decision records.

Columns/fields:

- date/time;
- object type;
- public object number;
- object name;
- region;
- decision;
- author;
- basis/comment;
- resulting status.

Decision examples:

- `Включить организатора в реестр`;
- `Вернуть заявку на доработку`;
- `Одобрить проведение мероприятия`;
- `Отклонить заявку`;
- `Подтвердить оплату пошлины`;
- `Опубликовать мероприятие`;
- `Подключить билетного оператора`;
- `Ограничить доступ оператора к мероприятию`.

---

# Phase 4 — Admin dashboard, tables and control section

## Dashboard

Improve `/admin` dashboard without changing routes/menu.

Expected zones:

1. KPI summary:
   - `Заявки на рассмотрении`;
   - `Мероприятия на проверке`;
   - `Одобренные мероприятия`;
   - `Билеты выпущены`;
   - `Контрольные события`;
   - `Операторы подключены`.

2. `Требует решения`:
   - 3–6 records;
   - type;
   - title;
   - region;
   - status/deadline;
   - action to open.

3. `Последние решения`:
   - last 5 decision log records.

4. `Операционная сводка`:
   - sales;
   - refunds;
   - redemptions;
   - control flags.

Do not change the left admin menu.

## Tables

Improve readability for admin application, registry, ticket, operations and control tables where touched.

Requirements:

- status badges;
- row hover state;
- long names wrap safely or show secondary text;
- summary above important tables: total / pending / requires attention / approved;
- basic local filters if already easy and safe: status, region, period, type;
- action buttons must be visually distinguishable:
  - `Одобрить` positive;
  - `Вернуть на доработку` warning/secondary;
  - `Отклонить` destructive;
  - `Открыть` neutral.

Do not rewrite all tables into a new universal component unless it is already the project pattern.

## Control section

Fill `Контроль` with at least 5 meaningful demo control cases:

1. repeated redemption of ticket `БИЛ-2026-0017`;
2. sale by operator without access;
3. issued tickets exceed approved capacity;
4. ticket redeemed at wrong venue;
5. suspicious refund series.

Each row must explain:

- object type;
- object name;
- region/city;
- what happened;
- why it matters;
- priority;
- status;
- action to open related object.

Do not use meaningless technical failures.

---

# Phase 5 — Forms, fee block, operator cabinet and empty states

## Forms

Visually group current fields. Do not create a risky multi-page wizard unless current architecture already supports it safely.

Organizer application sections:

1. `Сведения об организации`;
2. `Руководитель и контактные лица`;
3. `Юридический адрес`;
4. `Опыт проведения мероприятий`;
5. `Документы`;
6. `Подтверждение и отправка`.

Event application sections:

1. `Основная информация`;
2. `Площадка и вместимость`;
3. `Программа и исполнители`;
4. `Возрастная категория`;
5. `Билеты и тарифы`;
6. `Документы`;
7. `Пошлина и подача`.

Each section should have:

- title;
- short explanation;
- current fields preserved;
- save/submit actions preserved.

## Financial model selector and transparent fee block

This part is mandatory for round 4. Follow `FEE_MODEL_UI_REQUIREMENTS.md`.

### `/proto` financial settings

In the existing financial settings area on `/proto`, add a compact selector labelled `Порядок начисления платежей`:

- `По действующим правилам` — default;
- `Расширенный расчёт`.

The selector must affect the demo fee display in event application Step 8.

Below the selector, show a compact tariff/pricing visualization for the selected option: current BV scale for `По действующим правилам`, and demo surcharge/coefficient table for `Расширенный расчёт`.

Do not rename it as `по максимуму`, `Dubai`, `DTCM`, `арабская модель` or similar.

### Event application Step 8: `Пошлинные платежи`

Strengthen the existing fee block so it explains the total.

Show:

- calculation basis;
- capacity/ticket range;
- rate in base units;
- base unit amount used in demo;
- formula;
- total in BYN;
- status: `Не требуется`, `Ожидает оплаты`, `Оплачено`;
- mock receipt if paid;
- action `Показать расчёт`.

For the current example `420 BYN · 10 базовых величин`, the UI must explain:

```text
10 базовых величин × 42 BYN = 420 BYN
```

And show why the 10 BV tier was selected, for example:

```text
Диапазон: 151–300 мест / входных билетов.
Ставка для диапазона: 10 базовых величин.
```

### Expanded calculation

When `Расширенный расчёт` is selected in `/proto`, Step 8 must show an expanded demo breakdown with several line items by event parameters, but must not prominently label the working screen with the selector option name.

Example line items:

- `Базовое рассмотрение заявки`;
- `Проверка площадки и вместимости`;
- `Проверка схемы зала / билетной модели`;
- `Проверка состава исполнителей`;
- `Проверка материалов и документов`;
- `Контроль билетных каналов`;
- `Постсобытийная сверка продаж`.

This is a demo scenario. Do not present it as current law.

Do not implement real payment.

## Operator cabinet `/channel`

Make it more business-like and consistent.

Do not change actual operation logic.

Expected structure:

- summary block with operator name, connection status, available events, sold tickets, refunds, last update;
- section `Доступные мероприятия`;
- section `Операции`;
- section `Отчёты`;
- section `Интеграция API`;
- API details should not dominate the main screen;
- use Russian technical labels.

## Empty states

Add or improve empty states for key lists:

- no applications;
- no control events;
- no operations;
- no documents;
- no events available for operator;
- filter has no results.

Tone: Russian, business-like, no emoji.

---

## Out of scope

Do not do:

- auth/demo login changes;
- route changes;
- backend;
- real API;
- real payment;
- real digital signature;
- new B2C purchase flow;
- global design system;
- global rebrand;
- mobile-first redesign;
- dependency changes unless unavoidable and justified.

## Files and areas to inspect first

Inspect actual current source before editing.

Likely areas:

- demo data/store files;
- B2C/demo page components;
- poster assets under `public/`;
- organizer application components/pages;
- event application/compliance components/pages;
- admin components;
- control component;
- decision/op journal component;
- channel/operator page.

Use actual file owners from current repo. Do not guess if code differs.

## Self-check requirements

Before delivery, verify:

1. No auth/demo-login/routes changed.
2. Main flow still works.
3. At least 8 visible realistic events exist.
4. At least 8 distinct vertical posters exist and are used.
5. Event type matches venue type.
6. No obvious visible toy ids remain on main demo screens.
7. Main visible UI text is Russian on target routes.
8. Applications show status context.
9. Decision log has at least 8 meaningful records.
10. Control section has at least 5 meaningful business control cases.
11. Admin dashboard has `Требует решения` and latest decisions.
12. Tables have readable status badges and clearer actions.
13. Forms are visually grouped by sections.
14. Event application has mock fee block.
15. `/channel` looks business-oriented and no longer dominated by raw API/dev labels.
16. Key empty states are present.
17. `npm run build` passes.
18. Smoke-check target routes locally.
19. Deploy to GitHub Pages.
20. Live smoke-check target routes.
21. `/proto` has fee calculation selector: `По действующим правилам` / `Расширенный расчёт`.
22. Event application Step 8 explains fee calculation, including the `10 × 42 BYN = 420 BYN` case where applicable.
23. Expanded calculation shows expanded demo line-item charges without Dubai/DTCM UI terms.


## Delivery requirements

Complete delivery means:

- branch created;
- changes committed;
- PR created;
- PR merged;
- GitHub Pages deployed;
- live smoke-check passed;
- final report returned.

If merge/deploy permission is unavailable, return hard blocker report.
