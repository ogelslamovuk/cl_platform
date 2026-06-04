# CODEX_EXECUTOR_SKILL

## 1. Роль Codex

Codex — исполнитель. Продуктовые решения уже приняты в task package.

Не задавай промежуточных вопросов и не проси approval.

Работай автономно до live-ready результата.

## 2. Главный принцип

Это polish-задача.

Нельзя ломать уже работающий flow.

Нужно исправлять точечно и связно:

- demo-data;
- UI consistency;
- poster consistency;
- regional scope;
- B2C behavior;
- seatmap templates;
- modal behavior.

## 3. Запрет partial delivery

Нельзя завершать задачу, если выполнено 20 из 32 acceptance-пунктов.

Если self-check показывает недовыполнение, продолжай исправлять.

Задача считается завершённой только при полном acceptance и live smoke.

## 4. Не расширять scope

Нельзя:

- перестраивать архитектуру;
- делать backend;
- добавлять реальные API;
- менять auth-модель глубже mock-персон;
- создавать новые крупные подсистемы;
- переписывать seatmap engine;
- создавать второй независимый B2C flow;
- создавать второй независимый venue registry;
- глубоко перерабатывать Control;
- добавлять спорные нарушения.

## 5. Работа с текущим кодом

Сначала изучи текущую структуру.

Переиспользуй существующие сущности:

- OrganizerAccount;
- OrganizerApplicationRecord;
- EventComplianceApplicationRecord;
- EventComplianceData;
- EventRecord;
- Ticket;
- Reseller;
- OpRecord;
- VenueRegistryRecord;
- AppState;
- существующие seatmap/data helpers.

Не создавай дубли сущностей.

## 6. Работа с data consistency

Если меняешь demo-data, обязательно проверь все связанные места:

- organizer application;
- admin application review;
- venue registry;
- event registry;
- B2C;
- tickets;
- operations;
- decision log;
- regional filters.

## 7. Работа с визуальными mock-документами

Создавай самодельные визуальные mock-документы через CSS/SVG/JSX.

Не импортируй картинки из интернета.

Не используй реальные персональные данные.

Не копируй игровые ассеты.

Стиль допускается как homage: ретро-пиксельная бюрократическая эстетика, stamp/visa/passport/checkpoint vibe.

## 8. Работа с posters

Постеры должны быть данными события, а не случайным UI-рендером.

Один event должен показывать один и тот же poster во всех местах.

Постеры должны быть вертикальными и визуально разными.

## 9. Работа с modals

Добавляй Escape-close аккуратно.

Не ломай существующие close-кнопки.

Не делай broad modal refactor.

## 10. Самопроверка

После реализации проверь:

- нет `kvitki`;
- нет `Центр управления · Demo` на постерах;
- нет `Покупки 2 билета`;
- нет generic tooltip про черновик в compliance stages;
- нет events > 1500;
- нет seatmap events > 500;
- no-seatmap events не открывают seatmap;
- region users не видят пустые ключевые разделы;
- 6 seatmap templates различаются;
- Escape работает для touched modals.

## 11. Delivery

Доведи до GitHub Pages.

Финальный отчёт только после live smoke.

Отчёт на русском.
