# CODEX_ACCEPTANCE_CHECKLIST_ITERATION_03.md

Codex must check every item before final answer.

## Scope

- [ ] Implementation matches Iteration 3 only.
- [ ] No performances/sessions/showtimes were added.
- [ ] No unrelated pages changed.
- [ ] No new sector/group model was created if it did not already exist.
- [ ] Iteration 1 wizard is not broken.
- [ ] Iteration 2 payment/balance flow is not broken.
- [ ] Existing application -> admin -> event flow remains connected.

## Constructor

- [ ] Existing seat map/tariff constructor is reused.
- [ ] No new parallel constructor created.
- [ ] No Excel import/export created.
- [ ] No DTCM-style manual tariff table created.
- [ ] Bulk tariff assignment exists.
- [ ] Bulk assignment works using existing sector/group/row model or multi-seat selection fallback.
- [ ] Individual seat tariff override exists.
- [ ] Individual override is visible on the scheme or in seat details.
- [ ] Individual override is counted in summary.

## Tariffs and benefits

- [ ] Several demo tariffs exist.
- [ ] Tariffs have Russian names.
- [ ] Tariff price is visible.
- [ ] Count of seats by tariff is visible.
- [ ] Untariffed seats count is visible if applicable.
- [ ] Approximate maximum revenue is visible.
- [ ] One demo benefit tariff exists: “Льготный (пример)” or equivalent.
- [ ] Benefit tariff can be assigned to at least one seat.
- [ ] Summary shows “Льготные места” count.
- [ ] No benefit eligibility verification was implemented.
- [ ] No benefit documents/certificates were added.

## Persistence

- [ ] Tariff assignments persist after save.
- [ ] Tariff assignments persist after reload/return to application.
- [ ] Individual exceptions persist after save/reload.
- [ ] Benefit tariff assignments persist after save/reload.
- [ ] Submitted application includes tariff data/summary.
- [ ] Control Center read-only summary shows submitted tariff data.

## Organizer application

- [ ] “Билеты и тарифы” stage shows constructor and tariff summary.
- [ ] Save preserves tariff assignments.
- [ ] Demo-fill does not break constructor.
- [ ] Submitted application includes tariff data/summary.

## Control Center

- [ ] Submitted application shows read-only ticket/tariff configuration summary.
- [ ] Admin cannot edit tariff scheme in this iteration.
- [ ] Venue/hall/capacity/tariff summary are understandable.
- [ ] Benefit seats are visible in read-only summary.
- [ ] Individual exceptions are visible in read-only summary.
- [ ] Approval flow still works.

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
- [ ] Tests pass if present.
- [ ] git diff checked.
- [ ] Changed files limited to necessary files.
- [ ] No new dependencies unless strictly necessary.
- [ ] No temporary scripts left.
- [ ] Public deployed URL opened and checked.

## Quality threshold

If any checklist item fails, Codex must continue another fix iteration before final answer.
