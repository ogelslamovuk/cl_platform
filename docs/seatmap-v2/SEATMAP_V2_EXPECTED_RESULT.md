# SeatMap V2 — expected result

## Goal

Create a demo-grade visual seat map constructor for `cl_platform`.

The target is not an enterprise clone of seats.io. The target is a visually strong demo that can convincingly show complex halls, arenas and theater-style layouts.

## Visual expectation

The new seat map experience must look substantially stronger than the current rectangular grid MVP.

It must support visual layouts with:

- sectors;
- sector groups;
- blocks of seats;
- rotated / diagonal blocks;
- balconies;
- lodges / box seats;
- theater-style parterre + balcony + side boxes;
- arena-style sectors around a central stage / ice area;
- tariff colors;
- sold / available / blocked / selected states;
- hover tooltip with seat, row, tariff and price.

The demo should not feel like a table of square seats. It should feel like a real interactive venue map.

## Required demo capabilities

The demo must show at least one complex sample layout with:

- central parterre or arena field;
- left and right side sectors;
- balcony sector;
- several lodges / boxes;
- multiple tariffs;
- visible status changes after purchase.

## Realtime requirement

Realtime booking is required for the demo.

For MVP/demo purposes, realtime can be implemented through the existing localStorage + storage event synchronization model if it works across browser tabs/windows.

Expected demo behavior:

1. Open buyer/demo view in two tabs.
2. Select and buy a seat in tab A.
3. Tab B updates and shows the seat as sold without manual state editing.

This is not required to be production backend locking. It must be good enough for demo.

## Constraints

- Desktop-first only.
- Mobile responsiveness is not a priority for this epic.
- Complex rendered seat maps are capped at 500 rendered seats.
- Open-air / capacity-only events may have larger capacity, but must not render thousands of seats.
- Fit-to-view / zoom / pan are mandatory so the scheme is not clipped or hidden by borders, modal containers or overflow.
- Existing events without seat map must keep working.
- Existing organizer, admin, B2C and channel flows must keep working.

## Non-goals

Not required for this demo epic:

- enterprise-grade backend locking;
- CAD import;
- SVG import as full authoring flow;
- mobile-first redesign;
- optimization for 10,000+ rendered seats;
- full manual editing of every seat shape in Phase 1;
- replacing all existing SeatMap v1 flows in one PR.

## Acceptance at epic level

The epic is successful when:

1. A complex demo venue can be viewed visually in the admin or demo flow.
2. The layout contains multiple sectors, rotated blocks, balcony and lodges.
3. Buyer can select an available seat and purchase it.
4. The purchased seat becomes sold.
5. Another open tab reflects the sold status through the demo realtime mechanism.
6. Existing capacity-only events still work.
7. Existing simple seat map events still work through adapter or fallback.
8. The scheme is not clipped and has usable zoom / pan / fit-to-view.
