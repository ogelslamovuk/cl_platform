# CODEX_EXECUTOR_SKILL.md — автономный исполнитель для задачи UI/UX enrichment 2026-06-03

## 1. Purpose

This file is mandatory for the task package:

```text
codex_tasks/2026-06-03-ui-ux-enrichment/
```

It defines how Codex must execute the current task.

This task is approved for autonomous execution. Codex must not ask the user for intermediate approvals.

The expected result is fully described in the task package. Codex must deliver all of it, not a subset.

---

## 2. Execution mode

Mode:

```text
AUTONOMOUS FULL DELIVERY
```

Codex must:

1. read root `SKILLS.md`;
2. read root `CL_PLATFORM_CONTEXT.md`;
3. read all files in `codex_tasks/2026-06-03-ui-ux-enrichment/`;
4. inspect the current project;
5. implement the task in phases;
6. self-check after every phase;
7. continue fixing until all expected results are met;
8. run build;
9. run smoke-check;
10. commit/push/PR/merge/deploy;
11. verify GitHub Pages live routes;
12. return final report only after live-ready result.

Codex must not pause after planning.

Codex must not return a plan for user approval.

Codex must not ask whether to continue to the next phase.

---

## 3. Completion standard

The task is complete only when every requirement in `CODEX_EXPECTED_RESULT.md` is implemented.

Partial result is not acceptable.

Unacceptable final statuses:

- 20 of 24 points done;
- most things done;
- minor parts skipped;
- ready for user to finish manually;
- build passed but live not checked;
- PR created but not merged/deployed;
- local result only.

Required final status:

```text
All phases done. Build passed. Smoke passed. Merged/deployed. Live routes checked.
```

---

## 4. Self-correction loop

After each phase Codex must check its own work against the expected result.

If something is missing, broken or inconsistent:

1. do not ask the user;
2. fix it;
3. rerun the relevant check;
4. continue to the next phase only after the current phase passes.

If a later phase breaks an earlier phase, Codex must return to the earlier phase and fix it.

The final pass must check the whole demo flow end-to-end.

---

## 5. Hard blockers only

Codex may stop only for a hard blocker.

Hard blockers are limited to:

- build cannot be fixed without violating forbidden scope;
- repository state has conflicts that cannot be resolved safely within task scope;
- push/PR/merge/deploy is technically blocked by permissions or remote configuration;
- the current code contradicts the task in a way that makes safe implementation impossible.

For a hard blocker Codex must report:

- exact phase;
- exact command;
- exact error output;
- files already changed;
- what action is required to continue.

Codex must not call a blocker `готово`.

Codex must not use uncertain wording like `если есть права`. It must try the required delivery path and either complete it or report the exact blocker.

---

## 6. Scope boundaries

The task is large, but it is still an enrichment task.

Codex must not:

- rewrite the application architecture;
- replace the store;
- replace localStorage flow;
- add backend;
- add real МВД / migration / payment APIs;
- introduce real personal documents;
- introduce Dubai/DTCM terminology into UI;
- create a second venue registry;
- create a second ticket purchase flow;
- create a second seatmap system if current one can be extended;
- break existing Organizer/Admin/Channel/B2C routes;
- change branding;
- add dependencies without a direct technical necessity.

---

## 7. Required implementation phases

Codex must execute the phases from `CODEX_EXECUTION_PLAN.md`.

The minimum phase set is:

1. project inspection;
2. organizer event application enrichment;
3. organizer dashboard KPI click-through;
4. admin dashboard, tooltip, bell, menu;
5. admin applications and operator applications;
6. regional model and registries;
7. venue/event registry cleanup;
8. operators/tickets/operations/control/decision log;
9. seatmap templates;
10. B2C vertical posters;
11. final cross-flow cleanup;
12. build/smoke/live delivery.

Codex must not skip any phase.

---

## 8. Critical product decisions already approved

The following decisions are fixed and must not be re-decided by Codex:

### Organizer event application

- current event card must appear in the top area;
- `Подать на рассмотрение` only on final step;
- step 2 must show participants and visual mock documents/passports;
- document preview must be visible as modal/popup;
- venue contract must be shown as a document with preview;
- fees must show BYN as primary value and BV as secondary label;
- no invented fee for participants or acceleration;
- final step tiles must be clickable.

### Checks / ведомственные проверки

- checks are mock-only;
- МВД check is tied to physical persons from step 2;
- migration check appears only for foreign participants;
- MinCulture/expert check is tied to program/materials/age rating;
- regional body check is tied to venue, date, region, contract and fee status;
- do not build real integrations.

### Regional model

- region level is область;
- no district-level permissions;
- super-admin sees all regions;
- regional user sees only one region;
- event region is determined by event venue/place, not organizer legal address.

### Control

Allowed control events:

- repeated redemption of the same ticket;
- ticket redeemed at wrong venue;
- issued tickets exceed approved capacity;
- sale by operator without access to event;
- mismatch between issued tickets and approved quota;
- suspicious refund series;
- invalid QR/barcode.

Forbidden control events:

- attempt to publish without fee payment;
- sale refused because no tickets are available;
- technical error without business object.

### Seatmap templates

Seatmap templates must be seated configurations only:

1. Theatre;
2. Amphitheatre;
3. Circus;
4. Small sports arena;
5. Ice arena;
6. Sports palace / concert arena.

Open-air is not a seatmap template.

### Open-air / capacity-only

Open-air events:

- have no seatmap;
- can have large capacity;
- use general admission / entrance ticket;
- in B2C use direct purchase, not seat selection;
- in admin registries show `Без схемы` / `Параметры входа`.

### B2C posters

- all posters vertical;
- approximate ratio 2:3 or 3:4;
- desktop grid must be clean;
- poster artwork must not contain `Центр управления · Demo`;
- posters must be different, with at least 2–3 visual templates.

---

## 9. Demo-data cleanup rules

Codex must remove or replace demo data that makes the prototype look stupid or impossible.

Must remove/replace:

- huge seated events with thousands of rendered seats;
- fake sale refusal operation `нет доступных билетов`;
- meaningless technical control flags;
- duplicated-looking registry data;
- identical poster clones;
- inconsistent region/status data.

Must preserve:

- coherent cross-flow demo;
- working sample events;
- working B2C purchase;
- working admin review path;
- working operator/channel route.

---

## 10. Validation protocol

Codex must perform validation from `CODEX_VALIDATION_AND_DELIVERY.md`.

Required:

```bash
npm run build
```

Required local smoke routes:

- `/#/main`;
- `/#/demo`;
- `/#/organizer`;
- `/#/admin`;
- `/#/channel`.

Each route must be marked `passed` or `failed`.

No `partial`, `looks OK`, `should work`.

---

## 11. Live delivery protocol

This task requires live delivery.

Codex must deliver to GitHub Pages and verify live URLs:

- `https://ogelslamovuk.github.io/cl_platform/#/main`
- `https://ogelslamovuk.github.io/cl_platform/#/demo`
- `https://ogelslamovuk.github.io/cl_platform/#/organizer`
- `https://ogelslamovuk.github.io/cl_platform/#/admin`
- `https://ogelslamovuk.github.io/cl_platform/#/channel`

Required final path:

1. changes implemented;
2. build passed;
3. local smoke passed;
4. commit created;
5. branch pushed;
6. PR/main flow completed;
7. GitHub Pages deployed;
8. live smoke passed;
9. final report returned.

Do not stop at PR creation.

Do not stop at build success.

Do not stop at local server.

---

## 12. Final report format

Final report must be in Russian.

It must include:

- branch;
- commit SHA;
- PR link;
- merge status;
- GitHub Pages deploy status;
- live URLs;
- changed files;
- `npm run build: passed`;
- local smoke-check result by route;
- live smoke-check result by route;
- phase summary by phase: `done` / `not done`;
- any known limitations only if they are not acceptance blockers.

If any phase is `not done`, Codex must not call the task completed.

---

## 13. Final instruction

Do not negotiate the task.

Do not optimize the task scope downward.

Do not ask for intermediate approval.

Do not stop after a partial result.

Implement, verify, correct, deliver live, report.
