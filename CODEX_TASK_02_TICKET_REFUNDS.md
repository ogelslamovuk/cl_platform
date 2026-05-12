# CODEX_TASK_02_TICKET_REFUNDS.md

## Stage 2

Add ticket refund flow for B2C demo portal and reseller console.

## Autonomous execution rule

Do not ask the user questions. If a preferred verification method is unavailable, use fallback verification from `CODEX_AUTONOMOUS_UI_UX_SKILL.md` and continue.

## Scope

This stage covers only ticket refund lifecycle:

1. B2C demo portal → `Мои билеты` → refund ticket.
2. Reseller console → demo tool for refunding a ticket sold by that reseller.
3. State/statistics/report recalculation after refund.

Do not change organizer finance model, B2C branding, mock-data seeding, or Admin Dashboard layout in this stage except where strictly needed for ticket lifecycle consistency.

## Stage-plan required before code changes

Codex must do this autonomously and must not ask the user questions.

Before changing code, identify and report:

1. exact source of tickets in state/localStorage;
2. exact source of sales/operations in state/localStorage;
3. exact existing sale function/handler for B2C;
4. exact existing sale function/handler for reseller;
5. exact fields identifying ticket status, eventId, price, channel/reseller;
6. exact screens/components for B2C `Мои билеты` and reseller demo tools;
7. exact calculations/components that show sold count, available quota, revenue and reports.

Do not implement refund with separate fake counters.

## Functional requirements

### 1. B2C demo portal → My tickets refund

Add refund action in B2C demo portal section `Мои билеты`.

Required behavior:

- Each refundable ticket must have visible action button: `Вернуть билет`.
- Refund is allowed only if there are more than 24 hours before event start.
- Refund is forbidden if event starts in less than or equal to 24 hours.
- Refund is forbidden after event start.
- Refund is forbidden if ticket is already refunded/cancelled.
- When refund is not allowed, UI must show a clear reason in Russian.

Suggested Russian copy:

- Button: `Вернуть билет`
- Success: `Билет возвращён`
- Too late: `Возврат невозможен менее чем за 24 часа до начала мероприятия`
- Already refunded: `Билет уже возвращён`

No real payment refund is required.
This is demo state refund only.

### 2. Ticket lifecycle after refund

Refund must be real inside demo state, not only UI.

After refund:

- ticket status changes to refunded/cancelled according to existing state model;
- ticket remains visible in ticket registry/history as refunded/cancelled if registry exists;
- ticket is not counted as sold/active;
- available quota increases by 1;
- sold count decreases by 1;
- revenue decreases by the ticket price;
- related operations/logs/history are updated if project already has such structures;
- reports/statistics that rely on sold tickets/revenue reflect refund;
- refunded ticket cannot be refunded again.

If the app has existing operation log/status model, add a refund operation using existing pattern. Do not create unrelated operation structure.

### 3. Reseller console refund demo tool

Current reseller console has a tool to sell a demo ticket through reseller.

Add symmetric tool to refund a demo ticket through reseller.

Required behavior:

- Tool label: `Вернуть демо-билет через реселлера`.
- It must only allow refunding tickets sold by selected/current reseller.
- It must not allow refunding tickets sold by another reseller.
- It must not allow refunding tickets sold through own organizer channel unless current reseller is actually seller/channel owner.
- It must not allow refunding unsold tickets.
- It must not allow refunding already refunded tickets.
- It must apply same 24-hour rule as B2C.

Suggested Russian copy:

- No eligible tickets: `Нет билетов этого реселлера, доступных для возврата`
- Success: `Демо-билет возвращён через реселлера`
- Wrong reseller: `Нельзя вернуть билет, проданный другим каналом`

### 4. Consistency requirements

Refund flow must be consistent across:

- B2C `Мои билеты`;
- reseller console;
- admin ticket registry if present;
- event sold/available counts;
- revenue statistics;
- operations/reports if present.

Do not create separate fake refund counters that are not connected to tickets/sales.

### 5. Demo scenario requirements

For positive refund test, use an event with start time more than 24 hours in the future.

Do not use the Stage 1 today near-sold-out event as the only positive refund test if it starts in less than or equal to 24 hours.

## Acceptance

1. B2C `Мои билеты` shows `Вернуть билет` for eligible tickets.
2. Ticket more than 24 hours before event can be refunded.
3. Ticket less than or equal to 24 hours before event cannot be refunded.
4. Refunded ticket cannot be refunded again.
5. Refunded ticket returns one seat/ticket to availability.
6. Revenue/sold count/statistics decrease after refund.
7. Reseller can refund only tickets sold by that reseller.
8. Reseller cannot refund unsold tickets.
9. Reseller cannot refund tickets sold by another channel.
10. `npm run build` passes.

## Required checks

Run all required checks from `CODEX_AUTONOMOUS_UI_UX_SKILL.md`.

Additionally verify a full demo scenario:

1. Load mock data.
2. Sell a ticket through B2C or reseller for future event more than 24 hours away.
3. Confirm sold count/revenue increased.
4. Refund the ticket.
5. Confirm sold count/revenue decreased.
6. Confirm available quota increased.
7. Confirm second refund is blocked.
8. Confirm wrong reseller refund is blocked.
9. Confirm ticket registry/history still shows refunded ticket if registry exists.

## Commit

Commit message:

```text
stage 2: add ticket refund flows for b2c and reseller
```
