import type { EventStatus, OpType, TicketStatus } from "@/lib/store";

export function formatDisplayId(value?: string | null): string {
  const id = String(value || "").trim();
  if (!id) return "—";
  const publicId = formatPublicId(id);
  if (publicId !== id) return publicId;
  if (id.length <= 12) return id;

  const parts = id.split("-").filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]}-${parts[parts.length - 1]}`;
  }

  return `${id.slice(0, 4)}…${id.slice(-5)}`;
}

function hashToNumber(value: string, modulo = 9999): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) % modulo;
  }
  return hash + 1;
}

function numericPart(value: string, fallbackModulo = 9999): number {
  const groups = value.match(/\d+/g);
  if (groups?.length) {
    const parsed = Number(groups[groups.length - 1]);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return hashToNumber(value, fallbackModulo);
}

export function formatPublicId(value?: string | null): string {
  const id = String(value || "").trim();
  if (!id) return "—";
  const normalized = id.toUpperCase();
  const number4 = String(numericPart(id, 9999)).padStart(4, "0").slice(-4);
  const number6 = String(numericPart(id, 999999)).padStart(6, "0").slice(-6);

  if (normalized.startsWith("ORGAPP-") || normalized.startsWith("ORGANIZERAPPLICATION")) return `РО-2026-${number4}`;
  if (normalized.startsWith("EVAPP-") || normalized.startsWith("EVENTAPPLICATION") || normalized.startsWith("MOCK-CERT") || normalized.startsWith("APP-") || normalized.startsWith("DEMO_APP")) return `ЗМ-2026-${number4}`;
  if (normalized.startsWith("ORGREG-") || normalized.startsWith("DEMO-ORGREG") || normalized.startsWith("DEMO-REG")) return `РЕЕСТР-ОРГ-2026-${number4}`;
  if (normalized.startsWith("TCK-") || normalized.includes("_TICKET_") || normalized.startsWith("DEMO_TICKET")) return `БИЛ-2026-${number6}`;
  if (normalized.startsWith("EVT-") || normalized.startsWith("DEMO_EVENT")) return `МР-2026-${number4}`;
  if (normalized.startsWith("FLG-")) return `КН-2026-${number4}`;
  if (normalized.startsWith("OP-") || normalized.startsWith("DEMO_OP") || normalized.includes("_SELL_") || normalized.includes("_REFUND_") || normalized.includes("_REDEEM_")) return `ОП-2026-${number6}`;
  if (normalized.startsWith("RESELLER") || normalized.includes("RESELLER_")) return `ОПЕР-2026-${number4}`;
  if (normalized.startsWith("LIC-")) return `УД-2026-${number4}`;

  return id;
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
