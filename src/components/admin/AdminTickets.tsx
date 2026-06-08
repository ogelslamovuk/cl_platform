import React, { useState, useMemo } from "react";
import type { AppState, Ticket } from "@/lib/store";
import { A, tktStatusChip } from "./adminStyles";
import { Ticket as TicketIcon, Search, X } from "lucide-react";
import HelpTooltip from "@/components/ui/help-tooltip";
import { formatPublicId } from "@/lib/display";

interface Props { state: AppState; }

const tktStatusLabel: Record<string, string> = { issued: "Выпущен", sold: "Продан", refunded: "Возврат", redeemed: "Погашен" };
const opTypeLabel: Record<string, string> = { sell: "Продажа", refund: "Возврат", redeem: "Погашение", verify: "Проверка" };

export default function AdminTickets({ state }: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [eventFilter, setEventFilter] = useState("");
  const [drawer, setDrawer] = useState<Ticket | null>(null);

  const uniqueEvents = [...new Set(state.tickets.map(t => t.eventId))];
  const eventsById = useMemo(() => new Map(state.events.map(event => [event.eventId, event])), [state.events]);

  const filtered = useMemo(() => {
    return state.tickets.filter(t => {
      const event = eventsById.get(t.eventId);
      if (statusFilter && t.status !== statusFilter) return false;
      if (eventFilter && t.eventId !== eventFilter) return false;
      if (search) {
        const s = search.toLowerCase();
        return (
          t.ticketId.toLowerCase().includes(s) ||
          formatPublicId(t.ticketId).toLowerCase().includes(s) ||
          t.eventId.toLowerCase().includes(s) ||
          formatPublicId(t.eventId).toLowerCase().includes(s) ||
          (event?.title || "").toLowerCase().includes(s) ||
          (t.tier || "").toLowerCase().includes(s)
        );
      }
      return true;
    });
  }, [state.tickets, statusFilter, eventFilter, search, eventsById]);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={14} style={{ color: A.textMuted }} className="absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск по номеру билета..."
            className="w-full h-9 pl-9 pr-3 rounded-lg text-sm outline-none"
            style={{ background: A.surfaceBg, border: `1px solid ${A.border}`, color: A.textPrimary }} />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="h-9 px-3 rounded-lg text-sm outline-none cursor-pointer"
          style={{ background: A.surfaceBg, border: `1px solid ${A.border}`, color: A.textPrimary }}>
          <option value="">Все статусы</option>
          {["issued", "sold", "redeemed", "refunded"].map(s => <option key={s} value={s}>{tktStatusLabel[s]}</option>)}
        </select>
        <select value={eventFilter} onChange={e => setEventFilter(e.target.value)}
          className="h-9 px-3 rounded-lg text-sm outline-none cursor-pointer"
          style={{ background: A.surfaceBg, border: `1px solid ${A.border}`, color: A.textPrimary }}>
          <option value="">Все события</option>
          {uniqueEvents.map(eventId => {
            const event = eventsById.get(eventId);
            const label = event?.title ? `${event.title} · ${event.dateTime?.replace("T", " ").slice(0, 16)}` : formatPublicId(eventId);
            return <option key={eventId} value={eventId}>{label}</option>;
          })}
        </select>
        <HelpTooltip text="Используйте фильтры, чтобы быстро найти билеты по статусу или конкретному событию." />
      </div>

      <div style={{ background: A.cardBg, border: `1px solid ${A.border}`, borderRadius: 16, boxShadow: A.cardShadow }} className="overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center py-12">
            <TicketIcon size={28} style={{ color: A.textMuted }} className="mb-2" />
            <p style={{ color: A.textMuted }} className="text-sm">Нет билетов</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: A.tableHeaderBg }}>
                  {["Номер билета", "Мероприятие", "Номер мероприятия", "Тариф", "Стоимость", "Статус", "Канал", "Покупатель", "Обновлён"].map((h, i) => (
                    <th key={i} className="text-left py-3 px-4 font-medium text-xs" style={{ color: A.textSecondary, borderBottom: `1px solid ${A.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(t => {
                  const event = eventsById.get(t.eventId);
                  const tier = event?.tiers.find(tier => tier.name === t.tier);
                  const ticketPrice = Number.isFinite(tier?.price) ? `${tier?.price} BYN` : "—";
                  const chip = tktStatusChip(t.status);
                  return (
                    <tr key={t.ticketId} className="transition-colors cursor-pointer"
                      style={{ borderBottom: `1px solid ${A.border}` }}
                      onClick={() => setDrawer(t)}
                      onMouseEnter={e => (e.currentTarget.style.background = A.rowHover)}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <td className="py-3 px-4 text-xs" style={{ color: A.cyan }}>{formatPublicId(t.ticketId)}</td>
                      <td className="py-3 px-4" style={{ color: A.textPrimary }}>{event?.title || "—"}</td>
                      <td className="py-3 px-4 text-xs" style={{ color: A.textMuted }}>{formatPublicId(t.eventId)}</td>
                      <td className="py-3 px-4" style={{ color: A.textPrimary }}>{t.tier}</td>
                      <td className="py-3 px-4" style={{ color: A.textPrimary }}>{ticketPrice}</td>
                      <td className="py-3 px-4">
                        <span style={{ background: chip.bg, color: chip.color, borderRadius: 999 }} className="text-xs px-2.5 py-0.5 font-medium">
                          {tktStatusLabel[t.status]}
                        </span>
                      </td>
                      <td className="py-3 px-4" style={{ color: A.textSecondary }}>{t.soldByChannel || "—"}</td>
                      <td className="py-3 px-4" style={{ color: A.textSecondary }}>{t.soldToUserId || "—"}</td>
                      <td className="py-3 px-4 text-xs" style={{ color: A.textMuted }}>{t.updatedAt?.replace("T", " ").slice(0, 16)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Ticket Drawer */}
      {drawer && (
        (() => {
          const event = eventsById.get(drawer.eventId);
          const tier = event?.tiers.find(tier => tier.name === drawer.tier);
          const ticketPrice = Number.isFinite(tier?.price) ? `${tier?.price} BYN` : "—";
          return (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setDrawer(null)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative w-full max-w-md h-full overflow-y-auto animate-in slide-in-from-right duration-300"
            style={{ background: A.glassGradient + ', ' + A.sidebarBg, borderLeft: `1px solid ${A.borderGlass}` }}
            onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 z-10 flex items-center justify-between p-5" style={{ background: A.topbarBg, backdropFilter: 'blur(16px)', borderBottom: `1px solid ${A.border}` }}>
              <h3 style={{ color: A.textPrimary }} className="text-base font-semibold">{formatPublicId(drawer.ticketId)}</h3>
              <button onClick={() => setDrawer(null)} style={{ color: A.textMuted }}><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-2">
                {(() => { const c = tktStatusChip(drawer.status); return <span style={{ background: c.bg, color: c.color, borderRadius: 999 }} className="text-xs px-3 py-1 font-semibold">{tktStatusLabel[drawer.status]}</span>; })()}
              </div>
              {([["Мероприятие", event?.title || "—"], ["Номер мероприятия", formatPublicId(drawer.eventId)], ["Тариф", drawer.tier], ["Стоимость", ticketPrice], ["Канал", drawer.soldByChannel || "—"], ["Покупатель", drawer.soldToUserId || "—"], ["Создан", drawer.createdAt?.replace("T", " ").slice(0, 16)], ["Обновлён", drawer.updatedAt?.replace("T", " ").slice(0, 16)]] as [string, string][]).map(([k, v]) => (
                <div key={k}>
                  <div style={{ color: A.textMuted }} className="text-xs font-medium mb-1">{k}</div>
                  <div style={{ color: A.textPrimary }} className="text-sm">{v}</div>
                </div>
              ))}
              {/* Related ops */}
              <div>
                <div style={{ color: A.textMuted }} className="text-xs font-medium mb-2">История операций</div>
                {(() => {
                  const relOps = state.ops.filter(o => o.ticketId === drawer.ticketId);
                  if (relOps.length === 0) return <p style={{ color: A.textMuted }} className="text-xs">Нет операций</p>;
                  return (
                    <div className="space-y-1.5">
                      {relOps.map(o => (
                        <div key={o.opId} className="flex items-center justify-between text-xs py-1.5 px-2 rounded-lg" style={{ background: A.surfaceBg }}>
                          <span style={{ color: A.textPrimary }}>{opTypeLabel[o.type] || o.type}</span>
                          <span style={{ color: o.result === 'ok' ? A.statusOk : A.statusError }}>{o.result === 'ok' ? 'Успешно' : 'Отказ'}</span>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
          );
        })()
      )}
    </div>
  );
}
