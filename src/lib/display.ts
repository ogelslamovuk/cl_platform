import type { EventStatus, OpType, TicketStatus } from "@/lib/store";

export function formatDisplayId(value?: string | null): string {
  const id = String(value || "").trim();
  if (!id) return "—";
  if (id.length <= 12) return id;

  const parts = id.split("-").filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]}-${parts[parts.length - 1]}`;
  }

  return `${id.slice(0, 4)}…${id.slice(-5)}`;
}

const eventStatusLabels: Record<EventStatus, string> = {
  approved: "Одобрено",
  published: "Опубликовано",
};

const ticketStatusLabels: Record<TicketStatus, string> = {
  issued: "Выпущен",
  sold: "Продан",
  refunded: "Возврат",
  redeemed: "Погашен",
};

const operationTypeLabels: Record<OpType, string> = {
  sell: "Продажа",
  refund: "Возврат",
  redeem: "Погашение",
  verify: "Проверка",
};

export function getEventStatusLabel(status?: string): string {
  return eventStatusLabels[status as EventStatus] || status || "—";
}

export function getTicketStatusLabel(status?: string): string {
  return ticketStatusLabels[status as TicketStatus] || status || "—";
}

export function getOperationTypeLabel(type?: string): string {
  return operationTypeLabels[type as OpType] || type || "—";
}
