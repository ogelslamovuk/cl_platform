# CL_PLATFORM_CONTEXT.md

## Project

`cl_platform` is a demo prototype of a state-level platform for managing and controlling public cultural/event activity.

The prototype is prepared for ministry-level demonstration. The goal is to show a convincing end-to-end platform flow, not to build production backend logic.

Main product chain:

Candidate organizer -> Organizer -> Event application -> Control Center -> Approved event -> Sellers / retail / ticket flow

Do not break this chain.

## Product goal

The prototype must look like a serious digital platform for:

- organizer registration;
- event application submission and review;
- venue registry usage;
- ticket/category setup;
- authorized sales channels;
- mock interagency checks;
- fees/payments;
- approval and event creation;
- later seller/retail flows.

## Reference

The product is inspired by Dubai DTCM event licensing/e-ticketing platform.

Use DTCM only as a reference for mature product behavior:

- application is a long-living record, not a one-time form;
- application can be saved and resumed;
- application has multiple stages;
- documents, statuses, fees, checks and admin actions are connected;
- sellers and ticketing are controlled through the platform.

Do not create any Dubai/DTCM/NEN-specific entity or wording in the UI.

## Demo-first rule

Implementation must be believable and clickable, but not production-deep.

Show the process clearly. Do not overbuild hidden mechanics.

Examples:

- show mock interagency check status, but do not build real integrations;
- show participant documents, but use mock/sample documents;
- show venue contract requirement, but do not build real document generation;
- use current seat map / tariff constructor, do not build a new one;
- show fees/payment status, but do not implement real payment gateway.

## Existing entities must be reused

Before adding new models, inspect and reuse current project structures.

Expected existing concepts include:

- OrganizerAccount;
- OrganizerApplicationRecord;
- EventComplianceApplicationRecord;
- EventComplianceData;
- EventRecord;
- Ticket;
- Reseller;
- OpRecord;
- VenueRegistryRecord;
- AppState.

Do not duplicate these with parallel entities.

## Language and UI

All new visible UI text must be Russian.

No new English labels, buttons, badges, helper text, tooltips or headings.

Keep the current visual style. Do not redesign the product.
