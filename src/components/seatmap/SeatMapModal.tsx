import React, { useMemo, useState } from "react";
import { Minus, Plus, Save, Trash2, X } from "lucide-react";
import type { EventSeat, PriceTier, SeatMapSeat, SeatStatus } from "@/lib/store";
import { SEAT_TARIFF_COLORS, createRectangularSeats } from "@/lib/store";

type Mode = "layout" | "assign" | "viewer" | "buyer";

type Props = {
  open: boolean;
  title: string;
  subtitle?: string;
  mode: Mode;
  baseSeats?: SeatMapSeat[];
  eventSeats?: EventSeat[];
  tiers?: PriceTier[];
  onClose: () => void;
  onSaveLayout?: (seats: SeatMapSeat[]) => void;
  onSaveEventSeats?: (seats: EventSeat[]) => void;
  onBuySeat?: (seat: EventSeat) => void;
};

const statusLabel: Record<SeatStatus, string> = {
  available: "доступно",
  sold: "продано",
  blocked: "блок",
};

function toEventSeats(baseSeats: SeatMapSeat[], eventSeats: EventSeat[], tiers: PriceTier[]): EventSeat[] {
  if (eventSeats.length > 0) return eventSeats.map((seat) => ({ ...seat }));
  return baseSeats.map((seat, index) => {
    const tier = tiers[index % Math.max(1, tiers.length)] || tiers[0];
    return {
      ...seat,
      tariffId: tier?.name,
      tariffName: tier?.name,
      price: tier?.price,
      color: tier?.color || SEAT_TARIFF_COLORS[index % SEAT_TARIFF_COLORS.length],
      status: "available",
    };
  });
}

function seatColor(seat: EventSeat, selected: boolean): string {
  if (selected) return "#16A34A";
  if (seat.status === "sold") return "#CBD5E1";
  if (seat.status === "blocked") return "#E2E8F0";
  return "#2563EB";
}

function seatTextColor(seat: EventSeat, selected: boolean): string {
  if (selected || seat.status === "available") return "#FFFFFF";
  return "#64748B";
}

function seatBorderColor(seat: EventSeat, selected: boolean): string {
  if (selected) return "#15803D";
  if (seat.status === "sold") return "#94A3B8";
  if (seat.status === "blocked") return "#CBD5E1";
  return "#1D4ED8";
}

function seatTooltip(seat: EventSeat): string {
  const tariff = seat.tariffName ? `${seat.tariffName} · ${seat.price || 0} BYN` : "Тариф не назначен";
  return `${seat.label} · ряд ${seat.row}, место ${seat.number}\n${tariff}`;
}

export default function SeatMapModal({
  open,
  title,
  subtitle,
  mode,
  baseSeats = [],
  eventSeats = [],
  tiers = [],
  onClose,
  onSaveLayout,
  onSaveEventSeats,
  onBuySeat,
}: Props) {
  const [layoutSeats, setLayoutSeats] = useState<SeatMapSeat[]>(baseSeats);
  const [workingSeats, setWorkingSeats] = useState<EventSeat[]>(() => toEventSeats(baseSeats, eventSeats, tiers));
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeTier, setActiveTier] = useState(tiers[0]?.name || "");
  const [rows, setRows] = useState(5);
  const [cols, setCols] = useState(8);
  const [zoom, setZoom] = useState(1);

  React.useEffect(() => {
    if (!open) return;
    setLayoutSeats(baseSeats);
    setWorkingSeats(toEventSeats(baseSeats, eventSeats, tiers));
    setSelectedIds([]);
    setActiveTier(tiers[0]?.name || "");
  }, [baseSeats, eventSeats, open, tiers]);

  const seats = mode === "layout" ? layoutSeats : workingSeats;
  const maxX = Math.max(1, ...seats.map((seat) => seat.x + seat.w));
  const maxY = Math.max(1, ...seats.map((seat) => seat.y + seat.h));
  const selectedEventSeat = useMemo(
    () => workingSeats.find((seat) => seat.seatId === selectedIds[0]) || null,
    [selectedIds, workingSeats],
  );

  if (!open) return null;

  const toggleSeat = (seatId: string) => {
    const seat = workingSeats.find((item) => item.seatId === seatId);
    if (mode === "viewer") return;
    if (mode === "buyer") {
      if (!seat || seat.status !== "available") return;
      setSelectedIds([seatId]);
      return;
    }
    setSelectedIds((prev) => prev.includes(seatId) ? prev.filter((id) => id !== seatId) : [...prev, seatId]);
  };

  const applyTier = () => {
    const tier = tiers.find((item) => item.name === activeTier);
    if (!tier || selectedIds.length === 0) return;
    setWorkingSeats((prev) => prev.map((seat) => selectedIds.includes(seat.seatId)
      ? { ...seat, tariffId: tier.name, tariffName: tier.name, price: tier.price, color: tier.color || SEAT_TARIFF_COLORS[tiers.indexOf(tier) % SEAT_TARIFF_COLORS.length], status: "available" }
      : seat));
    setSelectedIds([]);
  };

  const setStatus = (status: SeatStatus) => {
    if (selectedIds.length === 0) return;
    setWorkingSeats((prev) => prev.map((seat) => selectedIds.includes(seat.seatId) ? { ...seat, status } : seat));
    setSelectedIds([]);
  };

  const addSeat = () => {
    const number = layoutSeats.length + 1;
    setLayoutSeats((prev) => [...prev, {
      seatId: `manual-${Date.now()}`,
      label: `M${number}`,
      row: "M",
      number,
      x: prev.length % 10,
      y: Math.floor(prev.length / 10) + maxY,
      w: 1,
      h: 1,
    }]);
  };

  const deleteSelected = () => {
    if (selectedIds.length === 0) return;
    setLayoutSeats((prev) => prev.filter((seat) => !selectedIds.includes(seat.seatId)));
    setSelectedIds([]);
  };

  const generateGrid = () => {
    setLayoutSeats(createRectangularSeats(`layout-${Date.now()}`, rows, cols));
    setSelectedIds([]);
  };

  const counts = workingSeats.reduce(
    (acc, seat) => {
      acc[seat.status] += 1;
      return acc;
    },
    { available: 0, sold: 0, blocked: 0 } as Record<SeatStatus, number>,
  );

  return (
    <div className="fixed inset-0 z-[80] bg-slate-950/70 p-3 backdrop-blur-sm sm:p-5">
      <div className="mx-auto flex h-full max-w-7xl flex-col overflow-hidden rounded-xl border bg-white shadow-2xl" style={{ borderColor: "rgba(15,23,42,0.14)" }}>
        <header className="flex flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: "rgba(15,23,42,0.12)" }}>
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold text-slate-950">{title}</h2>
            {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-lg border text-slate-600 hover:bg-slate-50" style={{ borderColor: "rgba(15,23,42,0.16)" }}>
            <X size={18} />
          </button>
        </header>

        <div className="grid min-h-0 flex-1 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="space-y-4 overflow-y-auto border-b p-4 lg:border-b-0 lg:border-r" style={{ borderColor: "rgba(15,23,42,0.12)" }}>
            {mode === "layout" && (
              <div className="space-y-3">
                <div className="text-sm font-semibold text-slate-900">Базовая схема</div>
                <div className="grid grid-cols-2 gap-2">
                  <label className="text-xs text-slate-500">Ряды<input type="number" min={1} max={20} value={rows} onChange={(e) => setRows(Number(e.target.value) || 1)} className="mt-1 h-9 w-full rounded-lg border px-2 text-slate-900" /></label>
                  <label className="text-xs text-slate-500">Места<input type="number" min={1} max={30} value={cols} onChange={(e) => setCols(Number(e.target.value) || 1)} className="mt-1 h-9 w-full rounded-lg border px-2 text-slate-900" /></label>
                </div>
                <button onClick={generateGrid} className="w-full rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white">Сгенерировать прямоугольник</button>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={addSeat} className="inline-flex items-center justify-center gap-1 rounded-lg border px-3 py-2 text-sm font-semibold text-slate-700"><Plus size={15} /> Добавить</button>
                  <button onClick={deleteSelected} className="inline-flex items-center justify-center gap-1 rounded-lg border px-3 py-2 text-sm font-semibold text-slate-700"><Trash2 size={15} /> Удалить</button>
                </div>
                <button onClick={() => onSaveLayout?.(layoutSeats)} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white"><Save size={15} /> Сохранить схему</button>
              </div>
            )}

            {mode === "assign" && (
              <div className="space-y-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900">Назначение тарифов</div>
                  <p className="mt-1 text-xs leading-5 text-slate-500">Выберите места на схеме, затем назначьте тариф или заблокируйте их.</p>
                </div>
                <select value={activeTier} onChange={(e) => setActiveTier(e.target.value)} className="h-10 w-full rounded-lg border px-3 text-sm">
                  {tiers.map((tier) => <option key={tier.name} value={tier.name}>{tier.name} · {tier.price} BYN</option>)}
                </select>
                <button onClick={applyTier} className="w-full rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white">Назначить выбранным</button>
                <button onClick={() => setStatus("blocked")} className="w-full rounded-lg border px-3 py-2 text-sm font-semibold text-slate-700">Заблокировать выбранные</button>
                <button onClick={() => onSaveEventSeats?.(workingSeats)} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white"><Save size={15} /> Сохранить назначение</button>
              </div>
            )}

            {mode === "buyer" && (
              <div className="space-y-3">
                <div className="text-sm font-semibold text-slate-900">Выбор места</div>
                {selectedEventSeat ? (
                  <div className="rounded-lg border bg-slate-50 p-3 text-sm text-slate-700">
                    <div className="font-semibold text-slate-950">{selectedEventSeat.label}</div>
                    <div>Ряд {selectedEventSeat.row}, место {selectedEventSeat.number}</div>
                    <div>{selectedEventSeat.tariffName} · {selectedEventSeat.price || 0} BYN</div>
                  </div>
                ) : <p className="text-sm text-slate-500">Нажмите доступное место на схеме.</p>}
                <button disabled={!selectedEventSeat} onClick={() => selectedEventSeat && onBuySeat?.(selectedEventSeat)} className="w-full rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">Подтвердить место</button>
              </div>
            )}

            <div className="space-y-2 border-t pt-4" style={{ borderColor: "rgba(15,23,42,0.12)" }}>
              <div className="text-sm font-semibold text-slate-900">Легенда</div>
              <div className="grid gap-2 text-sm text-slate-600">
                <span><i className="mr-2 inline-block h-3 w-3 rounded-sm bg-blue-600" /> Свободно: {counts.available}</span>
                <span><i className="mr-2 inline-block h-3 w-3 rounded-sm bg-slate-300 ring-1 ring-slate-400" /> Выкуплено: {counts.sold}</span>
                <span><i className="mr-2 inline-block h-3 w-3 rounded-sm bg-emerald-600" /> Выбрано</span>
                {counts.blocked > 0 && <span><i className="mr-2 inline-block h-3 w-3 rounded-sm bg-slate-200 ring-1 ring-slate-300" /> Не в продаже: {counts.blocked}</span>}
              </div>
              {tiers.length > 0 && (
                <div className="space-y-1 pt-2 text-xs text-slate-500">
                  {tiers.map((tier) => (
                    <div key={tier.name} className="flex items-center justify-between gap-2">
                      <span><i className="mr-2 inline-block h-3 w-3 rounded-sm border border-slate-300 bg-white" />{tier.name}</span>
                      <span>{tier.price} BYN</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>

          <main className="min-h-0 overflow-auto bg-slate-50 p-4">
            <div className="mb-3 flex items-center justify-end gap-2">
              <button onClick={() => setZoom((value) => Math.max(0.7, value - 0.1))} className="flex h-9 w-9 items-center justify-center rounded-lg border bg-white"><Minus size={16} /></button>
              <span className="w-14 text-center text-sm text-slate-600">{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom((value) => Math.min(1.8, value + 0.1))} className="flex h-9 w-9 items-center justify-center rounded-lg border bg-white"><Plus size={16} /></button>
            </div>
            <div className="min-w-max rounded-xl border bg-white px-6 pb-7 pt-5" style={{ transform: `scale(${zoom})`, transformOrigin: "top left", borderColor: "rgba(15,23,42,0.12)" }}>
              <div className="mx-auto mb-7 h-8 max-w-[72%] rounded-b-[48px] border border-slate-300 bg-slate-100 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 shadow-inner">
                <span className="relative top-2">Сцена</span>
              </div>
              <div className="grid gap-x-2 gap-y-3" style={{ gridTemplateColumns: `repeat(${maxX}, minmax(42px, 1fr))`, gridTemplateRows: `repeat(${maxY}, 42px)` }}>
                {seats.map((seat) => {
                  const eventSeat = workingSeats.find((item) => item.seatId === seat.seatId) || seat as EventSeat;
                  const selected = selectedIds.includes(seat.seatId);
                  const disabled = mode === "buyer" && eventSeat.status !== "available";
                  const rowOffset = Math.abs((seat.x + (seat.w || 1) / 2) - maxX / 2) * Math.min(7, 18 / Math.max(maxX, 1));
                  return (
                    <button
                      key={seat.seatId}
                      type="button"
                      disabled={disabled}
                      onClick={() => toggleSeat(seat.seatId)}
                      title={seatTooltip(eventSeat)}
                      className="flex h-9 min-w-10 items-center justify-center rounded-t-xl rounded-b-md border text-[11px] font-semibold shadow-sm outline-none ring-offset-2 transition hover:-translate-y-0.5 hover:border-amber-400 hover:ring-2 hover:ring-amber-200 focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-70"
                      style={{
                        gridColumn: `${seat.x + 1} / span ${seat.w || 1}`,
                        gridRow: `${seat.y + 1} / span ${seat.h || 1}`,
                        background: mode === "layout" ? (selected ? "#111827" : "#2563EB") : seatColor(eventSeat, selected),
                        borderColor: mode === "layout" ? (selected ? "#FACC15" : "rgba(15,23,42,0.18)") : seatBorderColor(eventSeat, selected),
                        color: mode === "layout" ? "#FFFFFF" : seatTextColor(eventSeat, selected),
                        transform: `translateY(${rowOffset}px)`,
                      }}
                    >
                      <span className="sr-only">{eventSeat.label}, {statusLabel[eventSeat.status || "available"]}</span>
                      {eventSeat.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
