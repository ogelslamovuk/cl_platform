# CODEX_ACCEPTANCE_CHECKLIST_ITERATION_02.md

Codex must check every item before final answer.

## Scope

- [ ] Implementation matches Iteration 2 only.
- [ ] No unrelated pages changed.
- [ ] Iteration 1 wizard is not broken.
- [ ] Existing candidate -> organizer -> application -> admin -> event flow remains connected.
- [ ] No real payment/bank/backend integration added.
- [ ] No post-event settlement added.

## Organizer dashboard

- [ ] “К оплате платформе” or equivalent old card is replaced by “Баланс”.
- [ ] Balance value is visible.
- [ ] Balance card is clickable.
- [ ] Click opens “Финансовый счёт”.

## Financial account

- [ ] Financial account section/screen exists.
- [ ] Current balance visible.
- [ ] Available amount visible.
- [ ] Operation history visible.
- [ ] Mock top-up action works.
- [ ] Top-up changes balance.
- [ ] Top-up adds history operation.
- [ ] Mock receipts/vouchers visible.

## Event application payment stage

- [ ] “Пошлины и платежи” shows fees.
- [ ] Current balance visible.
- [ ] Payment status visible.
- [ ] “Оплатить с баланса” works.
- [ ] If balance is enough, payment status becomes “Оплачено”.
- [ ] If balance is not enough, feedback says “Недостаточно средств”.
- [ ] Payment creates operation history record.
- [ ] Payment creates/shows mock receipt/voucher.

## Control Center

- [ ] Submitted application shows payment status.
- [ ] Fees amount visible.
- [ ] Paid application shows receipt/payment fact.
- [ ] Unpaid application is visually highlighted as “Ожидает оплаты”.
- [ ] Unpaid application cannot be approved.
- [ ] Blocked approval explains: “Одобрение доступно после оплаты обязательных пошлин.”
- [ ] Paid application can be approved.
- [ ] Admin does not manage organizer balance.

## Forbidden wording

- [ ] New UI does not use “долг”.
- [ ] New UI does not use “задолженность”.
- [ ] New UI does not use “просрочка”.
- [ ] New model/types do not introduce a new debt/overdue concept unless pre-existing code already had it and it is not exposed by this task.

## UI/text/design

- [ ] All new visible UI text is Russian.
- [ ] No new English labels/buttons/tooltips/headings.
- [ ] Existing visual style preserved.
- [ ] New non-obvious fields/actions have HelpTooltip or existing help pattern.
- [ ] No HTML title tooltip used as main help.
- [ ] No HelpTooltip inside button.
- [ ] No duplicate JSX blocks/buttons/cards/tables.

## Technical

- [ ] npm run build passes.
- [ ] git diff checked.
- [ ] Changed files limited to necessary files.
- [ ] No new dependencies unless strictly necessary.
- [ ] No temporary scripts left.
- [ ] Public deployed URL opened and checked.

## Quality threshold

If any checklist item fails, Codex must continue another fix iteration before final answer.
