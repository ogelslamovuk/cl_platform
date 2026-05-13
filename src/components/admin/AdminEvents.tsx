import React, { useState } from "react";
import type { AppState, EventRecord } from "@/lib/store";
import { getEventSalesChannels, getSalesChannelLabel, publishEvent, issueMarks } from "@/lib/store";
import { toast } from "sonner";
import { A, statusChip } from "./adminStyles";
import { Calendar, Search, X, Ticket, Globe } from "lucide-react";
import HelpTooltip from "@/components/ui/help-tooltip";

interface Props { state: AppState; onUpdate: (s: AppState) => void; }

const evtStatusLabel: Record<string, string> = { approved: "Одобрено", published: "Опубликовано" };

export default function AdminEvents({ state, onUpdate }: Props) {
  const [search, setSearch] = useState("");
  const [drawer, setDrawer] = useState<EventRecord | null>(null);
  const [confirmIssue, setConfirmIssue] = useState<string | null>(null);

  const filtered = state.events.filter(e => {
    if (!search) return true;
    const s = search.toLowerCase();
    return e.eventId.toLowerCase().includes(s) || e.title.toLowerCase().includes(s) || e.venue.toLowerCase().includes(s);
  });

  const handlePublish = (eventId: string) => {
    const ok = publishEvent(state, eventId);
    if (!ok) {
      toast.error("Публикация доступна только для approved события");
      return;
    }
    toast.success(`Событие ${eventId} опубликовано`);
    onUpdate({ ...state });
  };

  const handleIssue = () => {
    if (!confirmIssue) return;
    const count = issueMarks(state, confirmIssue);
    if (count > 0) toast.success(`Выпущено ${count} марок для ${confirmIssue}`);
    else toast.error("Марки уже выпущены");
    setConfirmIssue(null);
    onUpdate({ ...state });
  };

  const hasTickets = (eid: string) => state.tickets.some(t => t.eventId === eid);
  const getComplianceByEvent = (eid: string) =>
    state.eventComplianceApplications.find((app) => app.linkedEventId === eid);
  const getTierStats = (eventId: string, tierName: string) => {
    const tierTickets = state.tickets.filter((ticket) => ticket.eventId === eventId && ticket.tier === tierName);
    const issued = tierTickets.length;
    const sold = tierTickets.filter((ticket) => ticket.status === "sold" || ticket.status === "redeemed").length;
    const remaining = tierTickets.filter((ticket) => ticket.status === "issued").length;
    return { issued, sold, remaining };
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} style={{ color: A.textMuted }} className="absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск событий..."
            className="w-full h-9 pl-9 pr-3 rounded-lg text-sm outline-none"
            style={{ background: A.surfaceBg, border: `1px solid ${A.border}`, color: A.textPrimary }} />
        </div>
        <HelpTooltip text="Поиск работает по EventID, названию и площадке мероприятия." />
      </div>

      <div style={{ background: A.cardBg, border: `1px solid ${A.border}`, borderRadius: 16, boxShadow: A.cardShadow }} className="overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center py-12">
            <Calendar size={28} style={{ color: A.textMuted }} className="mb-2" />
            <p style={{ color: A.textMuted }} className="text-sm">Нет событий</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: A.tableHeaderBg }}>
                  {["EventID", "LicenseID", "Название", "Площадка", "Дата", "Возраст", "Вместимость", "Остаток", "Статус", "Действия"].map((h, i) => (
                    <th key={i} className="text-left py-3 px-4 font-medium text-xs" style={{ color: A.textSecondary, borderBottom: `1px solid ${A.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(e => {
                  const chip = e.status === "published" ? statusChip('ok') : statusChip('info');
                  const compliance = getComplianceByEvent(e.eventId);
                  return (
                    <tr key={e.eventId} className="transition-colors cursor-pointer"
                      style={{ borderBottom: `1px solid ${A.border}` }}
                      onClick={() => setDrawer(e)}
                      onMouseEnter={ev => (ev.currentTarget.style.background = A.rowHover)}
                      onMouseLeave={ev => (ev.currentTarget.style.background = 'transparent')}>
                      <td className="py-3 px-4 font-mono text-xs" style={{ color: A.cyan }}>{e.eventId}</td>
                      <td className="py-3 px-4 font-mono text-xs" style={{ color: A.textMuted }}>{e.licenseId}</td>
                      <td className="py-3 px-4" style={{ color: A.textPrimary }}>{e.title}</td>
                      <td className="py-3 px-4" style={{ color: A.textSecondary }}>{e.venue}</td>
                      <td className="py-3 px-4" style={{ color: A.textSecondary }}>{e.dateTime?.replace("T", " ").slice(0, 16)}</td>
                      <td className="py-3 px-4" style={{ color: A.textSecondary }}>{compliance?.data.ageCategory || "—"}</td>
                      <td className="py-3 px-4" style={{ color: A.textPrimary }}>{e.capacity}</td>
                      <td className="py-3 px-4" style={{ color: A.textPrimary }}>{e.remaining}</td>
                      <td className="py-3 px-4">
                        <span style={{ background: chip.bg, color: chip.color, borderRadius: 999 }} className="text-xs px-2.5 py-0.5 font-medium">
                          {evtStatusLabel[e.status]}
                        </span>
                      </td>
                      <td className="py-3 px-4 space-x-2" onClick={ev => ev.stopPropagation()}>
                        {e.status === "approved" && (
                          <button onClick={() => handlePublish(e.eventId)} className="text-xs font-medium px-2.5 py-1 rounded-lg transition-colors"
                            style={{ background: A.statusInfoBg, color: A.statusInfo }}>
                            <Globe size={12} className="inline mr-1" />Опубликовать мероприятие
                          </button>
                        )}
                        {e.status === "published" && !hasTickets(e.eventId) && (
                          <button onClick={() => setConfirmIssue(e.eventId)} className="text-xs font-medium px-2.5 py-1 rounded-lg transition-colors"
                            style={{ background: A.statusOkBg, color: A.statusOk }}>
                            <Ticket size={12} className="inline mr-1" />Выпустить марки / TicketID
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Event Drawer */}
      {drawer && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setDrawer(null)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative w-full max-w-md h-full overflow-y-auto animate-in slide-in-from-right duration-300"
            style={{ background: A.glassGradient + ', ' + A.sidebarBg, borderLeft: `1px solid ${A.borderGlass}` }}
            onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 z-10 flex items-center justify-between p-5" style={{ background: A.topbarBg, backdropFilter: 'blur(16px)', borderBottom: `1px solid ${A.border}` }}>
              <h3 style={{ color: A.textPrimary }} className="text-base font-semibold">Событие {drawer.eventId}</h3>
              <button onClick={() => setDrawer(null)} style={{ color: A.textMuted }}><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              {([["Название", drawer.title], ["Площадка", drawer.venue], ["Дата", drawer.dateTime?.replace("T", " ")], ["Возрастная категория", getComplianceByEvent(drawer.eventId)?.data.ageCategory || "—"], ["Вместимость", String(drawer.capacity)], ["Остаток", String(drawer.remaining)], ["LicenseID", drawer.licenseId], ["Заявка", drawer.complianceApplicationId || drawer.appId || "—"]] as [string, string][]).map(([k, v]) => (
                <div key={k}>
                  <div style={{ color: A.textMuted }} className="text-xs font-medium mb-1">{k}</div>
                  <div style={{ color: A.textPrimary }} className="text-sm font-mono">{v}</div>
                </div>
              ))}
              {(() => {
                const compliance = getComplianceByEvent(drawer.eventId);
                const salesChannels = getEventSalesChannels(state, drawer).map((code) => getSalesChannelLabel(state, code));
                return (
                  <>
                    <div>
                      <div style={{ color: A.textMuted }} className="text-xs font-medium mb-1">Номер удостоверения</div>
                      <div style={{ color: A.textPrimary }} className="text-sm font-mono">{compliance?.certificateNumber || "—"}</div>
                    </div>
                    <div>
                      <div style={{ color: A.textMuted }} className="text-xs font-medium mb-1">Дата удостоверения</div>
                      <div style={{ color: A.textPrimary }} className="text-sm font-mono">{compliance?.certificateDate || "—"}</div>
                    </div>
                    <div>
                      <div style={{ color: A.textMuted }} className="text-xs font-medium mb-1">Каналы продаж</div>
                      <div style={{ color: A.textPrimary }} className="text-sm">{salesChannels.join(", ")}</div>
                    </div>
                  </>
                );
              })()}
              <div>
                <div style={{ color: A.textMuted }} className="text-xs font-medium mb-1">Категории</div>
                {drawer.tiers.map((t, index) => {
                  const stats = getTierStats(drawer.eventId, t.name);
                  return (
                    <div key={`${t.name}-${index}`} className="rounded px-2 py-1.5 mb-1 text-xs" style={{ color: A.textPrimary, background: A.surfaceBg }}>
                      <div className="flex justify-between"><span>{t.name}</span><span>{t.price.toLocaleString()} BYN</span></div>
                      <div style={{ color: A.textSecondary }}>Количество: {t.quantity} · Выпущено: {stats.issued} · Продано: {stats.sold} · Остаток: {stats.remaining}</div>
                    </div>
                  );
                })}
              </div>
              <div>
                <div style={{ color: A.textMuted }} className="text-xs font-medium mb-2">Билеты по статусу</div>
                {(() => {
                  const evtTickets = state.tickets.filter(t => t.eventId === drawer.eventId);
                  const counts = { issued: 0, sold: 0, redeemed: 0, refunded: 0 };
                  evtTickets.forEach(t => { if (counts[t.status] !== undefined) counts[t.status]++; });
                  return (
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(counts).map(([k, v]) => (
                        <div key={k} className="text-xs py-1.5 px-2 rounded-lg" style={{ background: A.surfaceBg, color: A.textSecondary }}>
                          <span style={{ color: A.textPrimary }} className="font-semibold mr-1">{v}</span>{k}
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm issue */}
      {confirmIssue && (() => {
        const evt = state.events.find(e => e.eventId === confirmIssue);
        return (
          <div className="fixed inset-0 z-[60] flex items-center justify-center" onClick={() => setConfirmIssue(null)}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div className="relative max-w-sm w-full p-6 rounded-2xl" onClick={e => e.stopPropagation()}
              style={{ background: A.glassGradient + ', ' + A.cardBg, border: `1px solid ${A.borderGlass}`, boxShadow: A.cardShadow }}>
              <h3 style={{ color: A.textPrimary }} className="font-semibold mb-3">Выпустить марки?</h3>
              <p style={{ color: A.textSecondary }} className="text-sm mb-5">Будет создано {evt?.capacity} TicketID для {confirmIssue}</p>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setConfirmIssue(null)} className="px-4 h-9 rounded-xl text-sm font-medium"
                  style={{ border: `1px solid ${A.borderLight}`, color: A.textPrimary }}>Отмена</button>
                <button onClick={handleIssue} className="px-4 h-9 rounded-xl text-sm font-semibold"
                  style={{ background: A.statusOk, color: '#000' }}>Выпустить</button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
