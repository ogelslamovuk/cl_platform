# CODEX_TASK_ITERATION_01.md

## Task

Implement Iteration 1: transform the organizer event application into a multi-step event application wizard.

## Goal

The organizer must experience the event application as a living application that can be filled in stages, saved, resumed later, demo-filled, submitted, reviewed, returned for rework and resubmitted.

The Control Center must see only submitted applications, not drafts.

## Required screens/modules

Discover the minimal current files responsible for:

- organizer event compliance/application screen;
- admin/control center view for submitted event applications;
- shared state/demo data used by these screens;
- existing tooltips/help components.

Modify only the minimal necessary files.

## Wizard stages

Use exactly these 9 stages in this order:

1. Основные сведения
2. Программа и участники
3. Показы / даты проведения
4. Площадка, зал и вместимость
5. Билеты и тарифы
6. Каналы продаж
7. Проверки и подтверждения
8. Пошлины и платежи
9. Проверка и подача

## Organizer requirements

On the organizer event application page:

1. Replace the current linear/form-like application experience with a visible stepper/wizard.
2. Allow free navigation between stages. Do not force strict sequential completion.
3. Add visible progress of completion for organizer only.
4. Add stage statuses for organizer only:
   - Не заполнено
   - Черновик
   - Заполнено
   - Требует внимания
5. Add actions:
   - Сохранить
   - Сохранить и продолжить позже
   - Заполнить демо-данными
   - Далее
   - Подать на рассмотрение on the final stage
6. Saving must keep entered data in the current prototype state/localStorage flow.
7. Submitted application must appear in Control Center as before, without breaking approval flow.
8. Draft applications must not appear in Control Center.

## Stage 1: Основные сведения

Must include a 3-level demo event type catalog.

Do not build a large real classifier.

Implement a small demo tree sufficient for demonstration, for example:

- Культура -> Концерт -> Эстрадный концерт
- Культура -> Театр -> Драматический спектакль
- Спорт -> Индивидуальный -> Стрельба из лука
- Спорт -> Индивидуальный -> Бег
- Спорт -> Командный -> Футбол
- Бизнес -> Конференция -> Отраслевая конференция

Show selected path as a visible badge/string.

Store selected category path in the application data or compatible existing field(s). Do not create a parallel application entity.

## Stage 2: Программа и участники

Must include:

- program/description area;
- participants/performers list;
- manual participant limit: maximum 10 participants;
- if user tries to add more than 10 manually, show Russian UI feedback and do not add the extra participant;
- mock participant document entries;
- for foreign performers show mock document/check context;
- demo-fill may populate a realistic set of participants and documents, but must not exceed 10 visible participants.

Use mock/sample document names only. Do not use real passport data.

## Stage 3: Показы / даты проведения

Must support multiple date/time slots already compatible with current data flow.

Do not introduce a separate production performance engine.

The stage must clearly show that the event can have several shows/performances.

## Stage 4: Площадка, зал и вместимость

Venue selection must use only existing venue registry data.

Hard rule:

- If venue exists in registry, it can be selected.
- If venue does not exist in registry, organizer cannot add it here.
- Do not implement venue creation from this wizard.
- Do not add a new venue onboarding flow.

Must include a required mock document line for venue contract:

- Договор с площадкой
- status visible as attached/sample/required depending on current state

Do not build real document template generation in this iteration.

## Stage 5: Билеты и тарифы

Use only the existing seat map / tariff constructor already present in the prototype.

Hard rules:

- Do not create a new seat map constructor.
- Do not create Excel-like tariff import/export.
- Do not implement DTCM-style manual Excel seat tariff workflow.
- Do not replace the current constructor.
- If a hall/seat map is selected, continue using the existing prototype mechanism.

Show ticket categories/tariffs in a way compatible with the current prototype.

## Stage 6: Каналы продаж

Show sales channels/resellers using existing platform structures.

Do not deeply rebuild reseller/retail logic in this iteration.

The goal is to preserve and show current cross-module connection, not to implement full seller allocation yet.

## Stage 7: Проверки и подтверждения

Add a clear mock interagency checks block.

Include these mock checks:

- МВД — проверка документов участников
- Департамент по гражданству и миграции — проверка иностранных участников
- Минкульт — проверка организатора и основания проведения
- Исполком — уведомление по площадке и проведению мероприятия

Actions must be mock and visible:

- Сформировать пакет
- Отправить на проверку
- Обновить статус

Statuses must be Russian:

- Не отправлено
- Отправлено
- В обработке
- Проверено
- Требует уточнения

No real integrations.

## Stage 8: Пошлины и платежи

Keep this stage lightweight in Iteration 1.

Show current payment/fee status and payment attachments if already present.

Do not implement full balance/account payment system in Iteration 1. That is Iteration 2.

## Stage 9: Проверка и подача

Show summary of all stages.

Show missing required sections before submission.

Allow submission only when required minimum data is present.

On submission, application must become visible in Control Center.

## Admin / Control Center requirements

Control Center must not show organizer drafts.

For submitted applications, admin must be able to:

- open application details;
- view all submitted sections;
- view selected event catalog path;
- view participants/documents summary;
- view venue and venue contract status;
- view interagency check statuses;
- view payment/fee status;
- leave one general admin comment;
- return for rework;
- approve;
- reject.

For this iteration:

- only one general admin comment is required;
- do not implement per-field comments;
- do not implement per-stage admin comments unless already easy within existing structure;
- organizer must clearly see the admin comment when application is returned for rework.

## Tooltips / help

All new fields, blocks and non-obvious actions must have visible HelpTooltip or the existing project help pattern.

Hard rules:

- Use existing HelpTooltip/help components if present.
- Do not use HTML title as the main tooltip.
- Do not put HelpTooltip inside a button.
- Tooltip text must be Russian.
- Do not add tooltips to table headers or plain table values unless directly tied to an action.

## Design rules

- Keep current visual style.
- Do not redesign the application.
- Do not add new UI libraries.
- Do not change branding.
- Do not introduce English UI text.
- Do not add unnecessary animations or visual concepts.
- Do not modify navigation/menu unless absolutely required for this task.

## Hard forbidden scope

Do not:

- create DTCM/NEN/Dubai entities;
- create a new event application entity parallel to EventComplianceApplicationRecord;
- create venue from organizer wizard;
- create new seat map/tariff constructor;
- implement Excel seat map/tariff workflow;
- implement real government integrations;
- implement real payment gateway;
- deeply rebuild resellers/retail;
- break existing candidate organizer -> organizer -> application -> admin -> event flow;
- change unrelated pages;
- add backend;
- add dependencies unless absolutely necessary and justified.

## Required demo scenario after deployment

Codex must verify this scenario on deployed site:

1. Open organizer event application page.
2. Click Заполнить демо-данными.
3. Confirm all 9 stages are visible.
4. Confirm stage navigation works freely.
5. Confirm event type catalog has 3 levels and selected path is visible.
6. Confirm participants/documents are visible and manual limit is 10.
7. Confirm venue is selected from registry and venue contract line is visible.
8. Confirm ticket/tariff area uses current constructor/flow and no new constructor is introduced.
9. Confirm mock interagency checks are visible.
10. Save and continue later.
11. Return to application and confirm data is preserved.
12. Submit application.
13. Open Control Center.
14. Confirm submitted application is visible.
15. Confirm drafts are not visible.
16. Add general admin comment and return for rework.
17. Open organizer page again and confirm comment is clearly visible.
18. Approve application and confirm existing post-approval flow is not broken.
