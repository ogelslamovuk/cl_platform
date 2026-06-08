# Acceptance Checklist — polish round 3

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
- [ ] Event application includes `Госпошлина` block.
- [ ] Fee block is mock-only and does not implement real payment.

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
