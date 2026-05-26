import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useStorageSync } from "@/hooks/useStorageSync";
import {
  buildEventSeatsFromLayout,
  createDemoPurchaseTicket,
  defaultState,
  getSeatMapLayout,
  issueMarks,
  type EventRecord,
  type PriceTier,
} from "@/lib/store";
import { countSeatMapLayoutV2Seats, createGrandTheatreLayoutV2 } from "@/lib/seatMapV2";

const STORAGE_KEY = "ticket_hub_state_v1";

describe("SeatMap V2 demo contract", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("keeps the complex theatre below the rendered-seat cap", () => {
    const layout = createGrandTheatreLayoutV2();
    expect(countSeatMapLayoutV2Seats(layout)).toBe(292);
    expect(countSeatMapLayoutV2Seats(layout)).toBeLessThanOrEqual(500);
    expect(layout.sectors.map((sector) => sector.type)).toEqual(expect.arrayContaining(["parterre", "balcony", "box"]));
    expect(layout.sectors.flatMap((sector) => sector.blocks).some((block) => block.type === "diagonal")).toBe(true);
  });

  it("keeps capacity-only venues free of rendered layouts", () => {
    const state = defaultState();
    const openAir = state.venueRegistry.find((venue) => venue.venueId === "venue_podnikolie_park");
    expect(openAir?.capacity).toBe(1500);
    expect(openAir?.halls[0].hasSeatMap).toBe(false);
    expect(openAir?.halls[0].layoutId).toBeUndefined();
  });

  it("persists a sold V2 seat through the existing purchase path", () => {
    const state = defaultState();
    const layout = getSeatMapLayout(state, "layout_grand_theatre_v2");
    expect(layout?.layoutV2).toBeDefined();
    const tiers: PriceTier[] = [
      { name: "VIP", price: 180, quantity: 0, color: "#F59E0B" },
      { name: "Партер", price: 110, quantity: 0, color: "#2563EB" },
      { name: "Балкон", price: 65, quantity: 0, color: "#7C3AED" },
      { name: "Ложа", price: 240, quantity: 0, color: "#EA580C" },
    ];
    const eventSeats = buildEventSeatsFromLayout(layout!, tiers);
    const event: EventRecord = {
      eventId: "EVT-V2-TEST",
      organizerId: "demo",
      licenseId: "LIC-V2-TEST",
      appId: "APP-V2-TEST",
      title: "V2 test",
      venue: "Grand Theatre",
      dateTime: "2026-08-20T19:00",
      capacity: eventSeats.length,
      tiers,
      city: "Минск",
      category: "Театр",
      description: "",
      poster: "",
      salesChannels: ["OWN"],
      status: "published",
      remaining: eventSeats.length,
      layoutId: layout!.layoutId,
      eventSeats,
      createdAt: "2026-05-26T00:00:00.000Z",
      updatedAt: "2026-05-26T00:00:00.000Z",
    };
    state.events.push(event);
    issueMarks(state, event.eventId);
    const seatId = eventSeats.find((seat) => seat.status === "available")!.seatId;
    const purchase = createDemoPurchaseTicket(state, {
      eventId: event.eventId,
      selectedPriceCategory: "VIP",
      quantity: 1,
      buyerName: "Demo buyer",
      seatId,
    });

    expect(purchase?.seatId).toBe(seatId);
    expect(event.eventSeats?.find((seat) => seat.seatId === seatId)?.status).toBe("sold");
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}").events[0].eventSeats.find((seat: { seatId: string }) => seat.seatId === seatId).status).toBe("sold");
    expect(createDemoPurchaseTicket(state, {
      eventId: event.eventId,
      selectedPriceCategory: "Партер",
      quantity: 1,
      buyerName: "Second buyer",
      seatId,
    })).toBeNull();
  });

  it("keeps capacity-only events on the original purchase path", () => {
    const state = defaultState();
    const event: EventRecord = {
      eventId: "EVT-CAPACITY-TEST",
      organizerId: "demo",
      licenseId: "LIC-CAPACITY-TEST",
      appId: "APP-CAPACITY-TEST",
      title: "Open air test",
      venue: "Парк Подниколье",
      dateTime: "2026-08-22T18:00",
      capacity: 3,
      tiers: [{ name: "Вход", price: 20, quantity: 3 }],
      city: "Могилёв",
      category: "Фестивали",
      description: "",
      poster: "",
      salesChannels: ["OWN"],
      status: "published",
      remaining: 3,
      createdAt: "2026-05-26T00:00:00.000Z",
      updatedAt: "2026-05-26T00:00:00.000Z",
    };
    state.events.push(event);
    issueMarks(state, event.eventId);

    const purchase = createDemoPurchaseTicket(state, {
      eventId: event.eventId,
      selectedPriceCategory: "Вход",
      quantity: 1,
      buyerName: "Open air buyer",
    });

    expect(purchase).not.toBeNull();
    expect(event.eventSeats).toBeUndefined();
    expect(state.tickets.filter((ticket) => ticket.eventId === event.eventId && ticket.status === "issued")).toHaveLength(2);
  });

  it("updates state after another tab writes the storage key", () => {
    const { result } = renderHook(() => useStorageSync());
    const remote = defaultState();
    remote.meta.updatedAt = "2026-05-26T12:00:00.000Z";
    remote.events.push({
      eventId: "EVT-REMOTE",
      organizerId: "demo",
      licenseId: "LIC-REMOTE",
      appId: "APP-REMOTE",
      title: "Remote sold seat",
      venue: "Demo",
      dateTime: "2026-08-20T19:00",
      capacity: 0,
      tiers: [],
      city: "Минск",
      category: "Театр",
      description: "",
      poster: "",
      salesChannels: ["OWN"],
      status: "published",
      remaining: 0,
      createdAt: remote.meta.updatedAt,
      updatedAt: remote.meta.updatedAt,
    });

    act(() => {
      window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY, newValue: JSON.stringify(remote) }));
    });

    expect(result.current.state.events.some((event) => event.eventId === "EVT-REMOTE")).toBe(true);
  });
});
