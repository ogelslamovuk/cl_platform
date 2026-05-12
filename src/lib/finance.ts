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

export interface OrganizerSettlementEventRow {
  eventId: string;
  title: string;
  dateTime: string;
  revenue: number;
  soldTickets: number;
  amountDue: number;
}

export interface OrganizerSettlementSummary {
  revenue: number;
  soldTickets: number;
  amountDue: number;
}

export interface OrganizerSettlementReport {
  openEvents: OrganizerSettlementEventRow[];
  closedEvents: OrganizerSettlementEventRow[];
  openSummary: OrganizerSettlementSummary;
  closedSummary: OrganizerSettlementSummary;
  totalRevenue: number;
  totalSoldTickets: number;
  totalAmountDue: number;
  paidAmount: number;
  remainingDue: number;
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

function isClosedEvent(event: EventRecord, now = new Date()): boolean {
  const eventStart = new Date(event.dateTime).getTime();
  if (!Number.isFinite(eventStart)) return false;
  return eventStart < now.getTime();
}

function calculateSettlementEventRow(state: AppState, event: EventRecord, commissionPercent: number): OrganizerSettlementEventRow {
  const activeTickets = state.tickets.filter((ticket) => ticket.eventId === event.eventId && isActiveSoldTicket(ticket));
  const revenue = activeTickets.reduce((sum, ticket) => sum + getTicketPrice(ticket, event), 0);
  const amountDue = Number((revenue * commissionPercent / 100).toFixed(2));
  return {
    eventId: event.eventId,
    title: event.title,
    dateTime: event.dateTime,
    revenue,
    soldTickets: activeTickets.length,
    amountDue,
  };
}

function summarizeSettlementRows(rows: OrganizerSettlementEventRow[]): OrganizerSettlementSummary {
  return rows.reduce<OrganizerSettlementSummary>(
    (summary, row) => ({
      revenue: summary.revenue + row.revenue,
      soldTickets: summary.soldTickets + row.soldTickets,
      amountDue: Number((summary.amountDue + row.amountDue).toFixed(2)),
    }),
    { revenue: 0, soldTickets: 0, amountDue: 0 }
  );
}

export function calculateOrganizerSettlementReport(state: AppState, organizerId: string, now = new Date()): OrganizerSettlementReport {
  const commissionPercent = getPlatformCommissionPercent(state);
  const organizerEvents = state.events.filter((event) => event.organizerId === organizerId);
  const openEvents = organizerEvents
    .filter((event) => isOpenEvent(event, now))
    .map((event) => calculateSettlementEventRow(state, event, commissionPercent));
  const closedEvents = organizerEvents
    .filter((event) => !isOpenEvent(event, now) && isClosedEvent(event, now))
    .map((event) => calculateSettlementEventRow(state, event, commissionPercent));
  const openSummary = summarizeSettlementRows(openEvents);
  const closedSummary = summarizeSettlementRows(closedEvents);
  const totalRevenue = openSummary.revenue + closedSummary.revenue;
  const totalSoldTickets = openSummary.soldTickets + closedSummary.soldTickets;
  const totalAmountDue = Number((openSummary.amountDue + closedSummary.amountDue).toFixed(2));
  const paidAmount = 0;
  return {
    openEvents,
    closedEvents,
    openSummary,
    closedSummary,
    totalRevenue,
    totalSoldTickets,
    totalAmountDue,
    paidAmount,
    remainingDue: Number(Math.max(0, totalAmountDue - paidAmount).toFixed(2)),
    commissionPercent,
  };
}
