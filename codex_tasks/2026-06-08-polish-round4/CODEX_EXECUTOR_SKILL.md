# Codex executor skill for polish round 3

## 1. Role

You are not the product owner. You are the implementation executor.

Product direction is fixed in this package. Your job is to inspect the current code, implement within scope, self-check, build, deploy and live-check.

## 2. Hard principle

Do not make anything worse.

This means:

- do not remove current working actions;
- do not remove visible demo modules;
- do not break the main flow;
- do not make screens less informative;
- do not replace working UI with empty placeholders;
- do not hide data that was previously visible unless the task explicitly says to move it to a better place;
- do not introduce new dead buttons;
- do not create visually impressive but non-working duplicate flows.

## 3. Autonomy rule

Do not ask the user for intermediate approvals.

Work autonomously until one of these happens:

1. Definition of Done is fully satisfied.
2. A hard blocker prevents completion.

If blocked, return a blocker report with exact facts.

## 4. Scope rule

Implement only what is in `CODEX_TASK.md`.

If you find related problems outside scope, do not fix them unless they directly block this task.

## 5. Strategy vs micro-decisions

You may make small implementation decisions:

- exact component composition;
- exact class names within existing style approach;
- exact safe place for a status badge;
- exact local helper function name;
- exact mock data structure extension if needed.

You may not make strategic decisions:

- new product modules;
- new routes;
- new design system;
- new auth model;
- new payment flow;
- new seatmap implementation;
- new backend;
- new architecture.

## 6. Implementation style

Prefer additive enrichment over replacement.

When changing visible data:

- keep internal ids if code needs them;
- add display labels / public numbers if needed;
- do not expose technical ids to UI;
- preserve existing object relationships.

When changing UI:

- preserve existing click handlers;
- preserve current route behavior;
- reuse existing components/patterns;
- avoid broad refactors;
- keep styling coherent with existing project.

## 7. Text rules

All new visible UI text must be Russian.

Avoid raw technical labels when a human-readable label exists.

Examples:

- `sell` → `Продажа`;
- `redeem` → `Погашение`;
- `refund` → `Возврат`;
- `approved` → `Одобрено`;
- `published` → `Опубликовано`;
- `invalid` → `Требуется проверка` / `Недействительно`, depending on context.

API terms may remain only in a technical integration block, and should have Russian explanation.

## 8. Seatmap rule

Do not create a new seatmap implementation.

Use current seatmap flow for seated events.

Capacity-only / open-air events must not pretend to have a detailed seated hall. If the current B2C component cannot fully support general admission safely, show a clear capacity/general admission card instead of opening a misleading seatmap.

## 9. Control dashboard rule

Control events must be business-meaningful.

Allowed examples:

- repeated redemption of the same ticket;
- ticket redeemed at wrong venue;
- issued tickets exceed approved capacity;
- sale by operator without access;
- mismatch between issued tickets and approved quota;
- suspicious refund series;
- invalid QR/barcode.

Do not show random technical failures as violations.

## 10. Delivery rule

Do not stop at local build or PR.

For this package, the result is complete only after GitHub Pages deploy and live smoke-check.

If repository permissions prevent merge/deploy, report this as a hard blocker with exact evidence.
