# Acceptance Checklist — polish round 4

Use this checklist before final report.

## A. Nothing worse

- [ ] Existing demo-flow is not broken.
- [ ] No auth/login/route changes were made.
- [ ] No current working screen became empty or less informative.
- [ ] No current working button/action was removed without replacement.
- [ ] No duplicate module or competing flow was created.

## B. Mock content and posters

- [ ] At least 8 visible events exist.
- [ ] At least 8 distinct vertical posters exist and are used.
- [ ] No same poster clone is used for all events.
- [ ] Posters do not contain `Demo`, `Mock`, `Центр управления · Demo`.
- [ ] Event names are realistic.
- [ ] Organization names are realistic.
- [ ] Documents have Russian business labels.
- [ ] Chamber event is not assigned to a giant venue.
- [ ] Open-air event is not rendered as detailed seatmap.

## C. Russian visible UI

- [ ] Main target routes do not show obvious English/dev labels.
- [ ] Buttons use Russian action labels.
- [ ] Tables use Russian headers.
- [ ] Statuses use Russian business terms.
- [ ] API terms remain only in integration context and have Russian framing.

## D. Applications, decisions and statuses

- [ ] Organizer application has visible status context.
- [ ] Event application has visible status context.
- [ ] Application history is visible.
- [ ] Decision log exists or existing decision log is enriched.
- [ ] Decision log has at least 8 meaningful records.
- [ ] Records show actor, date, object, decision and resulting status.

## E. Admin/control polish

- [ ] Admin dashboard has KPI summary.
- [ ] Admin dashboard has `Требует решения`.
- [ ] Admin dashboard has `Последние решения`.
- [ ] Control section has at least 5 business control events.
- [ ] Control events explain why they matter.
- [ ] Tables have status badges.
- [ ] Main actions are visually distinguishable.
- [ ] Long names do not destroy table layout.

## F. Forms and fees

- [ ] Organizer form is grouped into sections.
- [ ] Event application form is grouped into sections.
- [ ] Save/submit behavior is preserved.
- [ ] `/proto` includes selector `Порядок начисления платежей`: `По действующим правилам` / `Расширенный расчёт`.
- [ ] `/proto` shows tariff/pricing visualization for the selected option.
- [ ] Event application includes strengthened `Пошлинные платежи` / `Госпошлина` block.
- [ ] Fee block explains calculation basis, capacity/ticket range, BV rate, base unit amount and formula.
- [ ] The `420 BYN · 10 базовых величин` case is explained as `10 × 42 BYN = 420 BYN` where applicable.
- [ ] `Расширенный расчёт` shows expanded demo line items and surcharge/coefficient table on `/proto`.
- [ ] Step 8 does not prominently show the selector option name; it shows amount, basis and calculation.
- [ ] Fee block is mock-only and does not implement real payment.
- [ ] No Dubai/DTCM/ePermit/NEN terms appear in visible UI.

## G. Operator cabinet

- [ ] `/channel` is business-like and readable.
- [ ] Raw API details do not dominate the main screen.
- [ ] Operator summary is visible.
- [ ] Available events show quota/sold/status/action context.
- [ ] Operations/reporting/integration sections are present or clearly separated.

## H. Build and live

- [ ] `npm run build` passed.
- [ ] Local smoke routes passed.
- [ ] PR merged.
- [ ] GitHub Pages deployed.
- [ ] Live smoke routes passed.


## I. Round 4 fee-model smoke

- [ ] `/proto`: fee calculation selector is visible near financial settings.
- [ ] Switching model changes Step 8 fee explanation in demo data.
- [ ] Step 8 `Пошлинные платежи`: `Показать расчёт` opens or expands detailed calculation.
- [ ] Current-rules calculation shows BV capacity table logic.
- [ ] Expanded calculation is clearly framed as demo model, not current legislation.
