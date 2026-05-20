import React, { useMemo } from "react";
import type { EventSeat, PriceTier, SeatStatus } from "@/lib/store";

type Variant = "light" | "dark";

type Props = {
  eventSeats?: EventSeat[];
  tiers?: PriceTier[];
  title?: string;
  variant?: Variant;
  className?: string;
};

const statusLabel: Record<SeatStatus, string> = {
  available: "свободно",
  sold: "продано",
  blocked: "блок",
};

function getCounts(seats: EventSeat[]): Record<SeatStatus, number> {
  return seats.reduce(
    (acc, seat) => {
      acc[seat.status || "available"] += 1;
      return acc;
    },
    { available: 0, sold: 0, blocked: 0 } as Record<SeatStatus, number>,
  );
}

function seatFill(seat: EventSeat): string {
  if (seat.status === "sold") return "#CBD5E1";
  if (seat.status === "blocked") return "#E2E8F0";
  return seat.color || "#2563EB";
}

function seatBorder(seat: EventSeat): string {
  if (seat.status === "sold") return "#94A3B8";
  if (seat.status === "blocked") return "#CBD5E1";
  return seat.color || "#1D4ED8";
}

function seatText(seat: EventSeat): string {
  if (seat.status === "available") return "#FFFFFF";
  return "#64748B";
}

function seatTooltip(seat: EventSeat): string {
  const tariff = seat.tariffName ? `${seat.tariffName} · ${seat.price || 0} BYN` : "Тариф не назначен";
  return `Место ${seat.label} · ряд ${seat.row}, место ${seat.number} · ${tariff}`;
}

export default function SeatMapPreview({ eventSeats = [], tiers = [], title = "Схема зала", variant = "light", className = "" }: Props) {
  const seats = useMemo(() => eventSeats.filter(Boolean), [eventSeats]);
  const counts = useMemo(() => getCounts(seats), [seats]);
  const maxX = Math.max(1, ...seats.map((seat) => seat.x + (seat.w || 1)));
  const maxY = Math.max(1, ...seats.map((seat) => seat.y + (seat.h || 1)));
  const isDark = variant === "dark";

  if (seats.length === 0) return null;

  const rootStyle = isDark
    ? { borderColor: "rgba(125, 211, 252, 0.22)", background: "rgba(15, 23, 42, 0.78)", color: "#E2E8F0" }
    : { borderColor: "rgba(15, 23, 42, 0.12)", background: "#FFFFFF", color: "#0F172A" };
  const panelStyle = isDark
    ? { borderColor: "rgba(148, 163, 184, 0.22)", background: "rgba(2, 6, 23, 0.55)" }
    : { borderColor: "rgba(15, 23, 42, 0.10)", background: "#F8FAFC" };
  const mutedColor = isDark ? "#94A3B8" : "#64748B";

  return (
    <section data-seat-map-preview={title} className={`rounded-xl border p-3 ${className}`} style={rootStyle}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="text-sm font-semibold">{title}</div>
          <div className="mt-1 text-xs" style={{ color: mutedColor }}>
            Всего: {seats.length} · Доступно: {counts.available} · Продано: {counts.sold} · Блок: {counts.blocked}
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 text-[11px]" style={{ color: mutedColor }}>
          <span className="inline-flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-sm bg-blue-600" />Доступно</span>
          <span className="inline-flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-sm bg-slate-300 ring-1 ring-slate-400" />Продано</span>
          {counts.blocked > 0 && <span className="inline-flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-sm bg-slate-200 ring-1 ring-slate-300" />Блок</span>}
        </div>
      </div>

      <div className="mt-3 overflow-x-auto rounded-lg border px-3 pb-4 pt-3" style={panelStyle}>
        <div className="mx-auto mb-4 h-6 max-w-[72%] rounded-b-[36px] border border-slate-300 bg-slate-100 text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500 shadow-inner">
          <span className="relative top-1.5">Сцена</span>
        </div>
        <div
          className="grid justify-center gap-x-1.5 gap-y-2"
          style={{
            gridTemplateColumns: `repeat(${maxX}, 28px)`,
            gridTemplateRows: `repeat(${maxY}, 30px)`,
            minWidth: `${maxX * 28 + Math.max(0, maxX - 1) * 6}px`,
          }}
        >
          {seats.map((seat) => {
            const tooltip = seatTooltip(seat);
            return (
              <button
                key={seat.seatId}
                type="button"
                title={tooltip}
                aria-label={`${tooltip} · ${statusLabel[seat.status || "available"]}`}
                data-seat-map-preview-seat={seat.seatId}
                data-seat-status={seat.status || "available"}
                className="group/seat relative flex h-7 w-7 items-center justify-center rounded-b-md rounded-t-[14px] border text-[8px] font-semibold shadow-sm outline-none transition hover:-translate-y-0.5 hover:border-amber-400 hover:ring-2 hover:ring-amber-200 focus-visible:ring-2"
                style={{
                  gridColumn: `${seat.x + 1} / span ${seat.w || 1}`,
                  gridRow: `${seat.y + 1} / span ${seat.h || 1}`,
                  background: seatFill(seat),
                  borderColor: seatBorder(seat),
                  color: seatText(seat),
                }}
              >
                <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden w-max max-w-[220px] -translate-x-1/2 rounded-lg bg-slate-950 px-2 py-1 text-[11px] font-medium leading-4 text-white shadow-lg group-hover/seat:block group-focus-visible/seat:block">
                  {tooltip}
                </span>
                {seat.label}
              </button>
            );
          })}
        </div>
      </div>

      {tiers.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2 text-[11px]" style={{ color: mutedColor }}>
          {tiers.map((tier, index) => (
            <span key={`${tier.name}-${index}`} className="inline-flex items-center gap-1.5">
              <i className="h-2.5 w-2.5 rounded-sm border border-slate-300" style={{ background: tier.color || "#2563EB" }} />
              {tier.name} · {tier.price} BYN
            </span>
          ))}
        </div>
      )}
    </section>
  );
}
