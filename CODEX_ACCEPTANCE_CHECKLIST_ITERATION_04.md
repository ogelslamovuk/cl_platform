# CODEX_ACCEPTANCE_CHECKLIST_ITERATION_04.md

Codex must check every item before final answer.

## Scope

- [ ] Implementation matches Iteration 4 v2 only.
- [ ] No new sales flow was created.
- [ ] No new refund flow was created.
- [ ] No new sales/refund report was created if existing AdminReports already covers it.
- [ ] No full reseller onboarding wizard was created.
- [ ] No real API/webhooks were implemented.
- [ ] No reseller settlement was implemented.
- [ ] No real contract document flow was implemented.
- [ ] No unrelated pages changed.
- [ ] Iteration 1 wizard is not broken.
- [ ] Iteration 2 payment/balance approval gate is not broken.
- [ ] Iteration 3 tariff constructor/summary is not broken.
- [ ] Existing Channel/Seller sale/refund flow is not broken.
- [ ] Existing AdminReports are not broken.

## Existing flow reuse

- [ ] Existing Channel/Seller component/view was found and reused.
- [ ] Existing mock sale mechanism was found and not duplicated.
- [ ] Existing mock refund mechanism was found and not duplicated.
- [ ] Existing reports for channels/resellers were found and not duplicated.
- [ ] New reseller control layer connects to existing reseller/channel data where possible.

## Control Center: operators

- [ ] Control Center shows ticket operator/reseller registry.
- [ ] Registry contains mock operators.
- [ ] Registry shows operator admission status.
- [ ] Registry shows connection type.
- [ ] Registry shows agreement status.
- [ ] Registry shows integration status.
- [ ] Registry shows contact/responsible person.
- [ ] Registry shows available/connected events or equivalent relation.

## Operator applications

- [ ] Control Center shows mock operator connection applications.
- [ ] Applications show operator name.
- [ ] Applications show request date.
- [ ] Applications show connection type.
- [ ] Applications show status.
- [ ] Applications show contact.
- [ ] Mock actions or visible statuses demonstrate state control.

## Status rules

- [ ] Operator statuses use Russian labels.
- [ ] Required statuses exist: На рассмотрении, Авторизован, Требует доработки, Приостановлен.
- [ ] Only “Авторизован” operators can be selected in organizer application.
- [ ] Non-authorized/suspended operators are visible but disabled/unselectable.
- [ ] UI explains why unavailable operator cannot be selected.

## Organizer application

- [ ] “Каналы продаж” stage shows available operators/channels.
- [ ] Operator admission status is visible.
- [ ] Connection type is visible.
- [ ] Agreement status is visible.
- [ ] Organizer can select authorized operators.
- [ ] Organizer cannot select non-authorized/suspended operators.
- [ ] Selected channels summary is visible.
- [ ] Warning about authorized channels is visible.

## Control Center: submitted application

- [ ] Submitted application shows selected sales channels read-only.
- [ ] Selected operators are visible.
- [ ] Operator statuses are visible.
- [ ] Connection types are visible.
- [ ] Agreement statuses are visible.
- [ ] Mock integration status is visible.
- [ ] Admin does not manually configure sales channels inside the application.

## Channel/Seller

- [ ] After approval, selected authorized operator sees available event in existing Channel/Seller.
- [ ] Event card/status indicates sale access is open.
- [ ] Channel/Seller shows operator/channel context.
- [ ] Existing mock sale still works.
- [ ] Existing mock refund still works.
- [ ] Existing Channel/Seller flow is not duplicated.

## Reports

- [ ] Existing channel/reseller reports still work.
- [ ] Sales through reseller/channel remain visible in existing reports.
- [ ] Refunds through reseller/channel remain visible in existing reports if already supported.
- [ ] If added, operator admission status appears as read-only badge/field in existing report, not as a new report.

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
