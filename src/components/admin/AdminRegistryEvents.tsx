import React, { useMemo, useState } from "react";
import type { AppState, EventRecord } from "@/lib/store";
import { getEventSalesChannels, getSalesChannelLabel, getEventSeatSummary, issueMarks, publishEvent } from "@/lib/store";
import { formatDisplayId, getEventStatusLabel, getTicketStatusLabel } from "@/lib/display";
import { A, statusChip } from "./adminStyles";
import { Calendar, Globe, Search, Ticket, X } from "lucide-react";
import HelpTooltip from "@/components/ui/help-tooltip";
import { toast } from "sonner";
import SeatMapModal from "@/components/seatmap/SeatMapModal";
import SeatMapPreview from "@/components/seatmap/SeatMapPreview";

interface Props {
  state: AppState;
  onUpdate: (s: AppState) => void;
}

function CardHelp({ text }: { text: string }) {
  return (
    <div className="absolute right-4 top-4 z-10">
      <HelpTooltip text={text} />
    </div>
  );
}

export default function AdminRegistryEvents({ state, onUpdate }: Props) {
  const [search, setSearch] = useState("");
  const [drawer, setDrawer] = useState<EventRecord | null>(null);
  const [schemeEvent, setSchemeEvent] = useState<EventRecord | null>(null);
  const [confirmIssue, setConfirmIssue] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return state.events.filter((event) => {
      if (!search) return true;
      const s = search.toLowerCase();
      return (
        event.eventId.toLowerCase().includes(s) ||
        event.title.toLowerCase().includes(s) ||
        event.venue.toLowerCase().includes(s)
      );
    });
  }, [search, state.events]);

  const organizerNameById = useMemo(
    () => new Map(state.organizers.map((organizer) => [organizer.organizerId, organizer.name])),
    [state.organizers]
  );

  const complianceByEventId = useMemo(
    () =>
      new Map(
        state.eventComplianceApplications
          .filter((app) => app.linkedEventId)
          .map((app) => [app.linkedEventId as string, app])
      ),
    [state.eventComplianceApplications]
  );
  const getTierStats = (eventId: string, tierName: string) => {
    const tierTickets = state.tickets.filter((ticket) => ticket.eventId === eventId && ticket.tier === tierName);
    const issued = tierTickets.length;
    const sold = tierTickets.filter((ticket) => ticket.status === "sold" || ticket.status === "redeemed").length;
    const remaining = tierTickets.filter((ticket) => ticket.status === "issued").length;
    return { issued, sold, remaining };
  };
  const hasTickets = (eventId: string) => state.tickets.some((ticket) => ticket.eventId === eventId);
  const handlePublish = (eventId: string) => {
    const ok = publishEvent(state, eventId);
    if (!ok) {
      toast.error("Публикация доступна только для одобренного мероприятия");
      return;
    }
    toast.success(`Мероприятие ${eventId} опубликовано`);
    onUpdate({ ...state });
  };
  const handleIssue = () => {
    if (!confirmIssue) return;
    const count = issueMarks(state, confirmIssue);
    if (count > 0) toast.success(`Выпущено ${count} марок / TicketID`);
    else toast.error("Марки уже выпущены");
    setConfirmIssue(null);
    onUpdate({ ...state });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} style={{ color: A.textMuted }} className="absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск мероприятий..."
            className="w-full h-9 pl-9 pr-9 rounded-lg text-sm outline-none"
            style={{ background: A.surfaceBg, border: `1px solid ${A.border}`, color: A.textPrimary }}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <HelpTooltip text="Поиск работает по EventID, названию мероприятия и площадке." />
          </div>
        </div>
      </div>

      <div style={{ background: A.cardBg, border: `1px solid ${A.border}`, borderRadius: 16, boxShadow: A.cardShadow }} className="relative overflow-hidden">
        <CardHelp text="Реестр показывает мероприятия, допущенные к продаже или опубликованные в системе." />
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center py-12">
            <Calendar size={28} style={{ color: A.textMuted }} className="mb-2" />
            <p style={{ color: A.textMuted }} className="text-sm">Нет мероприятий в реестре</p>
          </div>
        ) : (
          <div className="overflow-hidden">
            <table className="w-full table-fixed text-sm">
              <colgroup>
                <col style={{ width: "8%" }} />
                <col style={{ width: "24%" }} />
                <col style={{ width: "14%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "15%" }} />
                <col style={{ width: "7%" }} />
                <col style={{ width: "9%" }} />
                <col style={{ width: "11%" }} />
              </colgroup>
              <thead>
                <tr style={{ background: A.tableHeaderBg }}>
                  {[
                    "ID",
                    "Название",
                    "Организатор",
                    "Дата",
                    "Площадка",
                    "Остаток",
                    "Статус",
                    "Действия",
                  ].map((h) => (
                    <th key={h} className="text-left py-3 px-4 font-medium text-xs" style={{ color: A.textSecondary, borderBottom: `1px solid ${A.border}` }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((event) => {
                  const chip = event.status === "published" ? statusChip("ok") : statusChip("info");
                  return (
                    <tr
                      key={event.eventId}
                      className="transition-colors cursor-pointer"
                      style={{ borderBottom: `1px solid ${A.border}` }}
                      onClick={() => setDrawer(event)}
                      onMouseEnter={(ev) => (ev.currentTarget.style.background = A.rowHover)}
                      onMouseLeave={(ev) => (ev.currentTarget.style.background = "transparent")}
                    >
                      <td className="py-3 px-3 align-top font-mono text-xs" style={{ color: A.cyan }}>{formatDisplayId(event.eventId)}</td>
                      <td className="py-3 px-3 align-top leading-5" style={{ color: A.textPrimary }}><div className="break-words">{event.title}</div></td>
                      <td className="py-3 px-3 align-top leading-5" style={{ color: A.textSecondary }}>{organizerNameById.get(event.organizerId) || formatDisplayId(event.organizerId)}</td>
                      <td className="py-3 px-3 align-top text-xs" style={{ color: A.textSecondary }}>{event.dateTime?.replace("T", " ").slice(0, 16) || "—"}</td>
                      <td className="py-3 px-3 align-top leading-5" style={{ color: A.textSecondary }}>{event.venue}</td>
                      <td className="py-3 px-3 align-top" style={{ color: A.textPrimary }}>{event.remaining}</td>
                      <td className="py-3 px-3 align-top">
                        <span style={{ background: chip.bg, color: chip.color, borderRadius: 999 }} className="text-xs px-2.5 py-0.5 font-medium">
                          {getEventStatusLabel(event.status)}
                        </span>
                      </td>
                      <td className="space-y-2 py-3 px-3 align-top" onClick={(ev) => ev.stopPropagation()}>
                        {event.status === "approved" && (
                          <button type="button" onClick={() => handlePublish(event.eventId)} className="rounded-lg px-2.5 py-1 text-xs font-medium" style={{ background: A.statusInfoBg, color: A.statusInfo }}>
                            <Globe size={12} className="inline mr-1" />Опубликовать мероприятие
                          </button>
                        )}
                        {event.status === "published" && !hasTickets(event.eventId) && (
                          <button type="button" onClick={() => setConfirmIssue(event.eventId)} className="rounded-lg px-2.5 py-1 text-xs font-medium" style={{ background: A.statusOkBg, color: A.statusOk }}>
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

      {drawer && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setDrawer(null)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            className="relative h-full w-full max-w-xl overflow-y-auto animate-in slide-in-from-right duration-300"
            style={{ background: A.glassGradient + ", " + A.sidebarBg, borderLeft: `1px solid ${A.borderGlass}` }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between p-5" style={{ background: A.topbarBg, backdropFilter: "blur(16px)", borderBottom: `1px solid ${A.border}` }}>
              <h3 style={{ color: A.textPrimary }} className="text-base font-semibold">Мероприятие {formatDisplayId(drawer.eventId)}</h3>
              <button onClick={() => setDrawer(null)} style={{ color: A.textMuted }}><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              {getEventSeatSummary(drawer).hasSeatMap && (
                <div className="space-y-3 rounded-lg border p-3" style={{ borderColor: A.border, background: A.surfaceBg }}>
                  <SeatMapPreview eventSeats={drawer.eventSeats || []} tiers={drawer.tiers} title="Схема зала" />
                  <button onClick={() => setSchemeEvent(drawer)} className="rounded px-3 py-2 text-sm font-semibold" style={{ background: A.statusInfoBg, color: A.statusInfo }}>Открыть схему</button>
                </div>
              )}
              {(() => {
                const compliance = complianceByEventId.get(drawer.eventId);
                const salesChannels = getEventSalesChannels(state, drawer).map((code) => getSalesChannelLabel(state, code));
                return (
                  <>
                    {([
                      ["Название", drawer.title],
                      ["Организатор", organizerNameById.get(drawer.organizerId) || formatDisplayId(drawer.organizerId)],
                      ["Площадка", drawer.venue],
                      ["Дата", drawer.dateTime?.replace("T", " ") || "—"],
                      ["Возрастная категория", compliance?.data.ageCategory || "—"],
                      ["Вместимость", String(drawer.capacity)],
                      ["Остаток", String(drawer.remaining)],
                      ["Статус", getEventStatusLabel(drawer.status)],
                      ["Номер удостоверения", compliance?.certificateNumber || "—"],
                      ["Дата удостоверения", compliance?.certificateDate || "—"],
                      ["Каналы продаж", salesChannels.join(", ")],
                      ["Заявка на согласование", formatDisplayId(drawer.complianceApplicationId || compliance?.eventComplianceApplicationId)],
                    ] as [string, string][]).map(([k, v]) => (
                      <div key={k}>
                        <div style={{ color: A.textMuted }} className="text-xs font-medium mb-1">{k}</div>
                        <div style={{ color: A.textPrimary }} className="text-sm font-mono">{v}</div>
                      </div>
                    ))}
                    <div>
                      <div style={{ color: A.textMuted }} className="text-xs font-medium mb-1">Тарифы</div>
                      <div className="space-y-1">
                        {drawer.tiers.map((tier, index) => {
                          const stats = getTierStats(drawer.eventId, tier.name);
                          return (
                            <div key={`${tier.name}-${index}`} className="rounded px-2 py-1.5 text-xs" style={{ background: A.surfaceBg, color: A.textPrimary }}>
                              <div className="flex justify-between"><span>{tier.name}</span><span>{tier.price} BYN</span></div>
                              <div style={{ color: A.textSecondary }}>Количество: {tier.quantity} · Выпущено: {stats.issued} · Продано: {stats.sold} · Остаток: {stats.remaining}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: A.textMuted }} className="text-xs font-medium mb-2">Билеты по статусу</div>
                      {(() => {
                        const counts = state.tickets
                          .filter((ticket) => ticket.eventId === drawer.eventId)
                          .reduce<Record<string, number>>((acc, ticket) => {
                            acc[ticket.status] = (acc[ticket.status] || 0) + 1;
                            return acc;
                          }, {});
                        const entries = ["issued", "sold", "redeemed", "refunded"].map((status) => [status, counts[status] || 0] as const);
                        return (
                          <div className="grid grid-cols-2 gap-2">
                            {entries.map(([status, count]) => (
                              <div key={status} className="rounded-lg px-2 py-1.5 text-xs" style={{ background: A.surfaceBg, color: A.textSecondary }}>
                                <span style={{ color: A.textPrimary }} className="mr-1 font-semibold">{count}</span>{getTicketStatusLabel(status)}
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {confirmIssue && (() => {
        const event = state.events.find((item) => item.eventId === confirmIssue);
        return (
          <div className="fixed inset-0 z-[60] flex items-center justify-center" onClick={() => setConfirmIssue(null)}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div
              className="relative w-full max-w-sm rounded-2xl p-6"
              onClick={(e) => e.stopPropagation()}
              style={{ background: A.glassGradient + ", " + A.cardBg, border: `1px solid ${A.borderGlass}`, boxShadow: A.cardShadow }}
            >
              <h3 style={{ color: A.textPrimary }} className="mb-3 font-semibold">Выпустить марки / TicketID?</h3>
              <p style={{ color: A.textSecondary }} className="mb-5 text-sm">Будет создано {event?.capacity || 0} TicketID для {confirmIssue}</p>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setConfirmIssue(null)} className="h-9 rounded-xl px-4 text-sm" style={{ border: `1px solid ${A.borderLight}`, color: A.textPrimary }}>
                  Отмена
                </button>
                <button type="button" onClick={handleIssue} className="h-9 rounded-xl px-4 text-sm font-semibold" style={{ background: A.statusOk, color: "#000" }}>
                  Выпустить
                </button>
              </div>
            </div>
          </div>
        );
      })()}
      <SeatMapModal
        open={Boolean(schemeEvent)}
        title="Схема зала"
        subtitle={schemeEvent?.title}
        mode="viewer"
        eventSeats={schemeEvent?.eventSeats || []}
        tiers={schemeEvent?.tiers || []}
        onClose={() => setSchemeEvent(null)}
      />
    </div>
  );
}
