import type { AppState, EventRecord, Ticket } from "@/lib/store";

export const DEFAULT_PLATFORM_COMMISSION_PERCENT = 5;

export function normalizePlatformCommissionPercent(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return DEFAULT_PLATFORM_COMMISSION_PERCENT;
  return Number(Math.max(0, Math.min(100, parsed)).toFixed(2));
}

export function getPlatformCommissionPercent(state: Pick<AppState, "finance">): number {
  return normalizePlatformCommissionPercent(state.finance?.platformCommissionPercent ?? DEFAULT_PLATFORM_COMMISSION_PERCENT);
}

export function isActiveSoldTicket(ticket: Ticket): boolean {
  return ticket.status === "sold" || ticket.status === "redeemed";
}

export function isOpenEvent(event: EventRecord, now = new Date()): boolean {
  if (event.status !== "published") return false;
  const eventStart = new Date(event.dateTime).getTime();
  if (!Number.isFinite(eventStart)) return false;
  return eventStart >= now.getTime();
}

export function getTicketPrice(ticket: Ticket, event: EventRecord | undefined): number {
  const tier = event?.tiers.find((item) => item.name === ticket.tier);
  const price = Number(tier?.price);
  return Number.isFinite(price) && price > 0 ? price : 0;
}

export interface OrganizerFinanceTotals {
  currentRevenue: number;
  soldTickets: number;
  amountDue: number;
  openEvents: number;
  commissionPercent: number;
}

export function calculateOrganizerFinance(state: AppState, organizerId: string, now = new Date()): OrganizerFinanceTotals {
  const commissionPercent = getPlatformCommissionPercent(state);
  const openEvents = state.events.filter((event) => event.organizerId === organizerId && isOpenEvent(event, now));
  const openEventIds = new Set(openEvents.map((event) => event.eventId));
  const eventById = new Map(openEvents.map((event) => [event.eventId, event]));
  const activeTickets = state.tickets.filter((ticket) => openEventIds.has(ticket.eventId) && isActiveSoldTicket(ticket));
  const currentRevenue = activeTickets.reduce((sum, ticket) => sum + getTicketPrice(ticket, eventById.get(ticket.eventId)), 0);
  return {
    currentRevenue,
    soldTickets: activeTickets.length,
    amountDue: Number((currentRevenue * commissionPercent / 100).toFixed(2)),
    openEvents: openEvents.length,
    commissionPercent,
  };
}
