# Context for polish round 4

## Project

`cl_platform` — demo-first прототип государственной платформы для управления рынком культурных и массовых мероприятий.

Главная цепочка:

```text
Кандидат в организаторы → Организатор → Заявка на мероприятие → Центр Управления → Одобренное событие → Операторы / розница / билеты
```

Эту цепочку нельзя ломать.

## Current business intent

Презентация скоро. Нужно срочно усилить доверие к прототипу, но без опасных переделок.

Главное правило итерации:

```text
Ничего не должно стать хуже. Только обогащать, прояснять и усиливать текущий demo-flow.
```



## Round 4 addition: fee calculation selector and fee transparency

User-approved addition before Codex launch:

- strengthen Step 8 `Пошлинные платежи` in the event application;
- do not leave unexplained totals like `Начислено 420 BYN · 10 базовых величин`;
- add a fee calculation selector to `/proto` financial settings;
- use two labels: `По действующим правилам` and `Расширенный расчёт`;
- default: `По действующим правилам`;
- in Step 8 show calculation basis, formula, total, status and detailed breakdown; do not highlight the selected option name there;
- for `420 BYN · 10 БВ`, explain: `10 × 42 BYN = 420 BYN`;
- expanded calculation is a demo scenario with expanded line-item charges by event parameters, not a legal claim;
- no Dubai/DTCM terms in UI;
- no real payment gateway.

Full requirements are in `FEE_MODEL_UI_REQUIREMENTS.md`.

## Approved product scope from audit discussion

Делать:

1. Убрать игрушечный mock-контент.
2. Сделать разные постеры.
3. Разнообразить типы мероприятий и связать их с подходящими площадками.
4. Полностью русифицировать visible UI на основных маршрутах.
5. Добавить / усилить явные статусы заявок.
6. Добавить журнал решений / audit trail в Центре Управления.
7. Улучшить читаемость админских таблиц.
8. Заполнить раздел `Контроль` осмысленными demo-нарушениями.
9. Желательно: улучшить админский dashboard.
10. Желательно: разделить длинные формы на секции.
11. Добавить понятный mock-блок госпошлины: расчёт, основание, формула, детализация и статус оплаты.
12. Желательно: привести кабинет билетного оператора к деловому стилю.
13. Желательно: добавить нормальные empty states.

Не делать:

1. Не трогать demo-flow входа / авторизацию.
2. Не делать полноценную security/auth систему.
3. Не делать новый B2C purchase flow с оплатой, QR и PDF.
4. Не делать глобальный визуальный ребрендинг.
5. Не делать переключатель светлая/тёмная тема.
6. Не делать полноценный mobile/adaptive redesign.
7. Не делать реальные интеграции, реальные платежи, реальные цифровые подписи.

## Legal/product anchors

Использовать белорусский контекст:

- культурно-зрелищное мероприятие;
- организатор;
- реестр организаторов;
- заявление / заявка;
- программа мероприятия;
- договор с площадкой;
- возрастная категория;
- проектная вместимость / планируемое количество билетов;
- госпошлина;
- удостоверение на право организации и проведения мероприятия;
- структурное подразделение облисполкома / Мингорисполкома в сфере культуры.

DTCM/Dubai — только продуктовый референс, не UI-термины.

## Fee reference for demo block / current-rules calculation

Использовать как mock-логику отображения госпошлины для режима `По действующим правилам`, без реальной оплаты:

- 1–150 мест / билетов — 3 БВ;
- 151–300 — 10 БВ;
- 301–500 — 30 БВ;
- 501–1000 — 50 БВ;
- 1001–1500 — 80 БВ;
- 1501–2000 — 100 БВ;
- 2001–3000 — 150 БВ;
- свыше 3000 — 200 БВ;
- при отсутствии проектной вместимости и реализации билетов — 3 БВ.

Освобождение можно показать только как mock-status: `Госпошлина не требуется`, без сложной юридической логики.

## DTCM reference ideas allowed only as adapted patterns

Можно использовать как продуктовые паттерны:

- заявка как case file;
- staged application flow;
- документы к заявке;
- ticket fee / fee visibility;
- approved seller/operator logic;
- ticket tracking;
- operational dashboards;
- reconciliation / post-event logic.

Нельзя использовать в UI:

- DTCM;
- Dubai;
- eForm;
- ePermit;
- NEN;
- New Event Notification;
- Dubai Tourism.
