# SKILLS.md — cl_platform project skill for Codex Desktop

## 1. Purpose

This file is the permanent execution guide for Codex in the `cl_platform` repository.

Codex must read this file before any work in this repository.

`cl_platform` is a demonstration prototype of a Belarus-oriented state-level platform for regulating and managing the cultural and mass-events market.

The product must look like a coherent national digital infrastructure platform for serious institutional / ministry-level presentations.

This is not a production backend project. The goal is to enrich the visible demo flow, make the platform understandable and convincing, and avoid breaking existing working flows.

---

## 2. Core product flow that must never be broken

The main demo chain is:

```text
Кандидат в организаторы → Организатор → Заявка на мероприятие → Центр Управления → Одобренное событие → Операторы / розница / билеты
```

Every change must preserve this chain.

A task is unacceptable if, after the change:

- organizer registration/application flow no longer works;
- organizer event application can no longer be created, saved, reviewed or submitted;
- Admin / Центр Управления can no longer review and approve applications;
- approved events no longer reach event registry / sales / B2C demo;
- B2C purchase flow is broken;
- channel/operator flow is broken;
- localStorage demo data is corrupted in a way that blocks the demo.

---

## 3. Demo-first principle

For this repository, visible demo value is more important than hidden technical depth.

Good implementation:

- uses existing frontend/demo architecture;
- enriches current screens and data;
- makes the flow easier to understand;
- connects visible data across modules;
- uses mock documents, mock checks, mock payments and mock statuses where needed;
- keeps UI mature, business-like and coherent.

Bad implementation:

- broad refactor without explicit task requirement;
- production backend;
- real API integrations;
- real payment gateway;
- real government integrations;
- deep architecture work that does not improve the demo;
- duplicate modules or duplicate flows;
- decorative UI that hides broken product logic.

---

## 4. DTCM / Dubai reference rule

DTCM / Dubai event licensing is a product reference only.

Use it as inspiration for:

- long-living application / case-file model;
- staged application flow;
- document attachment model;
- fee/payment visibility;
- approved seller/operator logic;
- ticket tracking;
- operational dashboards;
- post-event reconciliation.

Never introduce Dubai-specific product language into user-facing UI.

Forbidden user-facing or code-level concepts unless a task explicitly requires them:

- `DTCMApplication`;
- `DubaiPermit`;
- `NewEventNotification` / `NEN`;
- `DubaiSettlement`;
- `DubaiFee`;
- Arabic/Dubai-specific legal terms.

The platform is Belarus-oriented. All visible UI text must be Russian.

---

## 5. Existing entities are the source of truth

Reuse and enrich existing entities. Do not create parallel replacements.

Known concepts / entities include:

- `OrganizerAccount`;
- `OrganizerApplicationRecord`;
- `OrganizerRegistryRecord`;
- `EventComplianceApplicationRecord`;
- `EventComplianceData`;
- `EventRecord`;
- `Ticket`;
- `Reseller` / operator;
- `OpRecord`;
- `VenueRegistryRecord`;
- `AppState`.

New fields may be added to existing demo entities when required by the task.

Creating a new top-level entity is allowed only when the task explicitly requires it and no existing entity can be safely extended.

---

## 6. Scope discipline

Codex must implement only the approved scope.

Forbidden without explicit task requirement:

- changing routes;
- changing branding;
- changing unrelated screens;
- changing dependencies;
- replacing the store architecture;
- replacing localStorage flow;
- rewriting components broadly;
- creating new design systems;
- moving large files for aesthetic reasons;
- deleting working modules;
- silently changing business rules.

If a requirement conflicts with current architecture, Codex must stop and report the exact conflict instead of inventing a new product direction.

---

## 7. UI and UX rules

All new visible UI text must be Russian.

Avoid raw technical labels in UI when a human-readable label exists.

Examples:

- `sell` → `Продажа`;
- `redeem` → `Погашение`;
- `refund` → `Возврат`;
- `issue` → `Выпуск`;
- `published` → `Опубликовано`;
- `approved` → `Одобрено`;
- `issued` → `Выпущен`.

Do not show implementation details as user-facing business states.

Buttons, KPI cards, document cards and important tiles must have clear behavior when they look clickable.

Tooltip rules:

- do not use HTML `title` as the main tooltip mechanism;
- use the existing `HelpTooltip` pattern where the project already uses it;
- tooltip must render above cards, modals, tables and containers;
- tooltip must not be clipped by parent overflow;
- do not create duplicated tooltips on the same element;
- do not place `HelpTooltip` inside a button when it can break click behavior.

---

## 8. Demo data rules

Demo data must look business-realistic.

Forbidden demo data:

- impossible operations;
- random technical errors without business meaning;
- fake passport numbers or real personal data;
- real passport scans;
- huge seated events pretending to be small halls;
- duplicate records that make modules look broken;
- inconsistent statuses across Organizer / Admin / B2C / Channel.

Safe mock documents are allowed.

Use clearly fake filenames and fake persons, for example:

- `passport_artist_01_mock.pdf`;
- `passport_artist_02_mock.pdf`;
- `passport_tech_01_mock.pdf`;
- `group_roster_mock.pdf`;
- `venue_contract_mock.pdf`.

---

## 9. Geography and regional access

For regional demo logic, the main access level is область.

Do not implement district-level permissions unless explicitly requested.

A republican / super-admin mode may see all regions.

A regional user must see only their region.

The event application region is determined by event venue / place of event, not by organizer legal address.

Regional filtering should be visible and consistent across relevant admin registries and applications.

---

## 10. SeatMap / venue rules

Source of truth for venues is:

```text
Центр Управления → Реестр площадок
```

Do not create a second independent venue registry.

Do not create a second independent purchase flow.

Do not create a second independent seatmap implementation if the existing `SeatMapModal` / seatmap flow can be reused or extended.

Seatmap events:

- have real seats;
- should be limited to demo-scale seating, normally up to 500 seats;
- must continue to support B2C seat selection;
- must show meaningful place/tariff/price information.

Capacity-only / open-air events:

- may have large capacity;
- must not render each seat;
- must not open the detailed seatmap as if it were a hall;
- should use general admission / entrance-ticket behavior.

Open-air is not a seatmap template.

Seatmap templates must only be seated configurations.

---

## 11. Tickets and operations

Tickets and operations are different concepts.

Ticket registry shows ticket records:

- ticket ID;
- event;
- price/tariff;
- channel/operator;
- status;
- QR/barcode/mock code;
- buyer/user mock reference if available.

Operation journal shows actions:

- successful sale;
- refund completed;
- ticket redeemed;
- event published;
- fee paid;
- ticket limit changed;
- operator connected.

Forbidden operation examples:

- `Продажа — отказ — нет доступных билетов`;
- technical failure without business object;
- fake manual refusal that would never happen in the real flow.

---

## 12. Control / risk dashboard rules

Control must show meaningful business control events.

Allowed demo cases:

- repeated redemption of the same ticket;
- ticket redeemed at wrong venue;
- issued tickets exceed approved capacity;
- sale by operator without access to event;
- mismatch between issued tickets and approved quota;
- suspicious refund series;
- invalid QR/barcode.

Do not show meaningless pre-publication blockers as violations when the application flow should prevent them earlier.

Every control row must explain:

- object type;
- object name;
- region/city;
- what happened;
- why it matters;
- priority;
- action to open the related object.

---

## 13. B2C / poster rules

B2C event cards should look like real event listings.

Posters must be vertical.

Use approximate ratio 2:3 or 3:4.

Do not stretch horizontal banners into posters.

Do not use the same poster clone for every event.

Use at least several distinct poster layouts when the task touches posters.

Remove internal demo labels from poster artwork, especially:

```text
Центр управления · Demo
```

---

## 14. Task package workflow

For large tasks prepared as a task package:

- Codex must read this `SKILLS.md` first;
- then read `CL_PLATFORM_CONTEXT.md`;
- then read all task package files;
- the task package is the approved source of truth;
- Codex must not ask for intermediate approvals when the package says autonomous execution;
- Codex must execute all phases and self-check each phase;
- partial completion is not accepted.

If the task package defines `CODEX_EXECUTOR_SKILL.md`, it is mandatory for that task and overrides generic execution style where more specific.

---

## 15. Build, smoke and live delivery

For any task expected to be visible on GitHub Pages, delivery is not complete until the live site is updated and checked.

Default live routes:

- `https://ogelslamovuk.github.io/cl_platform/#/main`
- `https://ogelslamovuk.github.io/cl_platform/#/demo`
- `https://ogelslamovuk.github.io/cl_platform/#/organizer`
- `https://ogelslamovuk.github.io/cl_platform/#/admin`
- `https://ogelslamovuk.github.io/cl_platform/#/channel`

Required completion path:

1. implement changes;
2. run self-check;
3. run `npm run build`;
4. run smoke-check for required routes;
5. commit changes;
6. push branch;
7. create PR or use the repository standard flow;
8. merge to `main`;
9. wait for GitHub Pages deploy;
10. verify live routes;
11. return final report.

Do not report `готово` before live verification when live delivery is required.

If a platform permission, remote conflict or deploy failure blocks delivery, report a hard blocker with exact command/output and stop. Do not hide blockers behind optimistic wording.

---

## 16. Final report rules

Final report must be in Russian.

For live-delivery tasks, include:

- branch;
- commit SHA;
- PR link;
- merge status;
- GitHub Pages deploy status;
- live URLs;
- changed files;
- `npm run build: passed`;
- local smoke-check result;
- live smoke-check result;
- phase summary: `done` / `not done`.

Do not use vague statuses:

- `почти готово`;
- `должно работать`;
- `визуально должно быть нормально`;
- `частично ок`.

Use exact statuses: `passed`, `failed`, `blocked`.

---

## 17. Final mental model

Codex is not a product owner in this repository.

Codex is the implementation executor.

The product direction is defined by the task package and project context.

The correct behavior is:

```text
read → inspect → implement within scope → self-check → build → smoke → deploy → live-check → final report
```

The incorrect behavior is:

```text
decide product direction → refactor broadly → partially implement → ask the user to test everything manually
```
