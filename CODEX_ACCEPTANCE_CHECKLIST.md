# CODEX_ACCEPTANCE_CHECKLIST.md

Codex must check every item before final answer.

## Scope

- [ ] Implementation matches Iteration 1 only.
- [ ] No unrelated pages changed.
- [ ] No DTCM/Dubai/NEN entities created.
- [ ] Existing application/event flow remains connected.
- [ ] Drafts are organizer-only and not visible in Control Center.

## Organizer wizard

- [ ] Organizer application is a 9-stage wizard.
- [ ] Stage order matches task exactly.
- [ ] Free stage navigation works.
- [ ] Save works.
- [ ] Сохранить и продолжить позже works.
- [ ] Заполнить демо-данными works.
- [ ] Progress/stage statuses visible for organizer.
- [ ] Submission possible only after required minimum data is present.

## Stage-specific

- [ ] Event type catalog has 3 levels.
- [ ] Selected event type path is visible.
- [ ] Participants manual limit is 10.
- [ ] Mock participant documents are visible.
- [ ] Multiple date/show slots are visible.
- [ ] Venue is selected only from existing registry.
- [ ] No venue creation added to wizard.
- [ ] Venue contract mock requirement visible.
- [ ] Existing seat map/tariff constructor reused.
- [ ] No new seat map constructor created.
- [ ] Mock interagency checks visible.
- [ ] Payment stage does not implement full balance system.

## Admin

- [ ] Control Center sees only submitted applications.
- [ ] Submitted application details readable.
- [ ] Admin can leave one general comment.
- [ ] Admin can return for rework.
- [ ] Organizer clearly sees returned comment.
- [ ] Approve/reject flow still works.

## UI/text/design

- [ ] All new visible UI text is Russian.
- [ ] No new English labels/buttons/tooltips/headings.
- [ ] Existing visual style preserved.
- [ ] All new non-obvious fields/actions have HelpTooltip or existing help pattern.
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

If any checklist item fails, Codex must continue another fix iteration before final answer.
