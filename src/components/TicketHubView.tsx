import React, { useState, useMemo, useEffect } from "react";
import type { AppState } from "@/lib/store";
import { publishEvent, issueMarks } from "@/lib/store";
import { toast } from "sonner";
import { formatDisplayId, getOperationTypeLabel } from "@/lib/display";

interface Props {
  state: AppState;
  onUpdate: (s: AppState) => void;
  initialTab?: "events" | "tickets" | "ops";
}

const evtStatusLabel: Record<string, string> = { approved: "Одобрено", published: "Опубликовано" };
const evtStatusBadge: Record<string, string> = { approved: "bg-role-organizer", published: "bg-role-channel" };
const tktStatusLabel: Record<string, string> = { issued: "Выпущен", sold: "Продан", refunded: "Возврат", redeemed: "Погашен" };
const tktStatusBadge: Record<string, string> = { issued: "bg-role-tickethub", sold: "bg-role-channel", refunded: "bg-role-regulator", redeemed: "bg-role-b2c" };
const opResultBadge: Record<string, string> = { ok: "bg-role-channel", error: "bg-role-regulator" };

export default function TicketHubView({ state, onUpdate, initialTab }: Props) {
  const [tab, setTab] = useState<"events" | "tickets" | "ops">(initialTab || "events");
  const [confirmIssue, setConfirmIssue] = useState<string | null>(null);

  useEffect(() => {
    if (initialTab) setTab(initialTab);
  }, [initialTab]);
  const [tktFilter, setTktFilter] = useState({ event: "", status: "", tier: "" });
  const [opFilter, setOpFilter] = useState({ channel: "", type: "", result: "" });

  const handlePublish = (eventId: string) => {
    publishEvent(state, eventId);
    toast.success(`Мероприятие ${formatDisplayId(eventId)} опубликовано`);
    onUpdate({ ...state });
  };

  const handleIssue = () => {
    if (!confirmIssue) return;
    const count = issueMarks(state, confirmIssue);
    if (count > 0) toast.success(`Выпущено ${count} контрольных марок для ${formatDisplayId(confirmIssue)}`);
    else toast.error("Марки уже выпущены или мероприятие не найдено");
    setConfirmIssue(null);
    onUpdate({ ...state });
  };

  const hasTickets = (eventId: string) => state.tickets.some((t) => t.eventId === eventId);

  const filteredTickets = useMemo(() => {
    return state.tickets.filter((t) =>
      (!tktFilter.event || t.eventId === tktFilter.event) &&
      (!tktFilter.status || t.status === tktFilter.status) &&
      (!tktFilter.tier || t.tier === tktFilter.tier)
    );
  }, [state.tickets, tktFilter]);

  const filteredOps = useMemo(() => {
    return state.ops.filter((o) =>
      (!opFilter.channel || o.channel === opFilter.channel) &&
      (!opFilter.type || o.type === opFilter.type) &&
      (!opFilter.result || o.result === opFilter.result)
    );
  }, [state.ops, opFilter]);

  const uniqueEvents = [...new Set(state.tickets.map((t) => t.eventId))];
  const uniqueTiers = [...new Set(state.tickets.map((t) => t.tier))];

  const tabs = [
    { key: "events" as const, label: "Мероприятия" },
    { key: "tickets" as const, label: "Билеты" },
    { key: "ops" as const, label: "Операции" },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-lg p-6 shadow-card border border-border">
        {!initialTab && (
          <div className="flex gap-1 mb-4 bg-muted rounded-lg p-1 w-fit">
            {tabs.map((t) => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === t.key ? "bg-card shadow-sm" : "hover:bg-card/50"}`}>
                {t.label}
              </button>
            ))}
          </div>
        )}

        {tab === "events" && (
          <>
            {state.events.length === 0 ? (
              <p className="text-center py-8 opacity-60">Нет мероприятий</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="py-2 px-2 font-medium">Номер мероприятия</th>
                      <th className="py-2 px-2 font-medium">Номер удостоверения</th>
                      <th className="py-2 px-2 font-medium">Название</th>
                      <th className="py-2 px-2 font-medium">Дата/время</th>
                      <th className="py-2 px-2 font-medium">Статус</th>
                      <th className="py-2 px-2 font-medium">Вместимость</th>
                      <th className="py-2 px-2 font-medium">Остаток</th>
                      <th className="py-2 px-2 font-medium">Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {state.events.map((e) => (
                      <tr key={e.eventId} className="border-b border-border/50">
                        <td className="py-2 px-2 text-xs font-semibold">{formatDisplayId(e.eventId)}</td>
                        <td className="py-2 px-2 text-xs">{formatDisplayId(e.licenseId)}</td>
                        <td className="py-2 px-2">{e.title}</td>
                        <td className="py-2 px-2">{e.dateTime?.replace("T", " ")}</td>
                        <td className="py-2 px-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${evtStatusBadge[e.status]}`}>
                            {evtStatusLabel[e.status]}
                          </span>
                        </td>
                        <td className="py-2 px-2">{e.capacity}</td>
                        <td className="py-2 px-2">{e.remaining}</td>
                        <td className="py-2 px-2 space-x-2">
                          {e.status === "approved" && (
                            <button onClick={() => handlePublish(e.eventId)} className="underline text-xs">Опубликовать</button>
                          )}
                          {!hasTickets(e.eventId) && (
                            <button onClick={() => setConfirmIssue(e.eventId)} className="underline text-xs">Выпустить марки</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {tab === "tickets" && (
          <>
            <div className="flex gap-3 mb-4 flex-wrap">
              <select className="border border-border rounded-md px-3 py-2 text-sm bg-card"
                value={tktFilter.event} onChange={(e) => setTktFilter({ ...tktFilter, event: e.target.value })}>
                <option value="">Все мероприятия</option>
                {uniqueEvents.map((ev) => <option key={ev} value={ev}>{formatDisplayId(ev)}</option>)}
              </select>
              <select className="border border-border rounded-md px-3 py-2 text-sm bg-card"
                value={tktFilter.status} onChange={(e) => setTktFilter({ ...tktFilter, status: e.target.value })}>
                <option value="">Все статусы</option>
                {["issued", "sold", "refunded", "redeemed"].map((s) => <option key={s} value={s}>{tktStatusLabel[s]}</option>)}
              </select>
              <select className="border border-border rounded-md px-3 py-2 text-sm bg-card"
                value={tktFilter.tier} onChange={(e) => setTktFilter({ ...tktFilter, tier: e.target.value })}>
                <option value="">Все категории</option>
                {uniqueTiers.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            {filteredTickets.length === 0 ? (
              <p className="text-center py-8 opacity-60">Нет билетов</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="py-2 px-2 font-medium">Номер билета</th>
                      <th className="py-2 px-2 font-medium">Номер мероприятия</th>
                      <th className="py-2 px-2 font-medium">Категория</th>
                      <th className="py-2 px-2 font-medium">Статус</th>
                      <th className="py-2 px-2 font-medium">Канал</th>
                      <th className="py-2 px-2 font-medium">Покупатель</th>
                      <th className="py-2 px-2 font-medium">Обновлён</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTickets.map((t) => (
                      <tr key={t.ticketId} className="border-b border-border/50">
                        <td className="py-2 px-2 text-xs font-semibold">{formatDisplayId(t.ticketId)}</td>
                        <td className="py-2 px-2 text-xs">{formatDisplayId(t.eventId)}</td>
                        <td className="py-2 px-2">{t.tier}</td>
                        <td className="py-2 px-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${tktStatusBadge[t.status]}`}>
                            {tktStatusLabel[t.status]}
                          </span>
                        </td>
                        <td className="py-2 px-2">{t.soldByChannel || "—"}</td>
                        <td className="py-2 px-2">{t.soldToUserId || "—"}</td>
                        <td className="py-2 px-2 text-xs">{t.updatedAt?.replace("T", " ").slice(0, 19)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {tab === "ops" && (
          <>
            <div className="flex gap-3 mb-4 flex-wrap">
              <select className="border border-border rounded-md px-3 py-2 text-sm bg-card"
                value={opFilter.channel} onChange={(e) => setOpFilter({ ...opFilter, channel: e.target.value })}>
                <option value="">Все каналы</option>
                {["ByCard", "TicketPro", "SellerPOS"].map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <select className="border border-border rounded-md px-3 py-2 text-sm bg-card"
                value={opFilter.type} onChange={(e) => setOpFilter({ ...opFilter, type: e.target.value })}>
                <option value="">Все типы</option>
                {["sell", "refund", "redeem", "verify"].map((t) => <option key={t} value={t}>{getOperationTypeLabel(t)}</option>)}
              </select>
              <select className="border border-border rounded-md px-3 py-2 text-sm bg-card"
                value={opFilter.result} onChange={(e) => setOpFilter({ ...opFilter, result: e.target.value })}>
                <option value="">Все результаты</option>
                <option value="ok">Успешно</option>
                <option value="error">Ошибка</option>
              </select>
            </div>
            {filteredOps.length === 0 ? (
              <p className="text-center py-8 opacity-60">Нет операций</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="py-2 px-2 font-medium">Время</th>
                      <th className="py-2 px-2 font-medium">Номер операции</th>
                      <th className="py-2 px-2 font-medium">Тип</th>
                      <th className="py-2 px-2 font-medium">Номер билета</th>
                      <th className="py-2 px-2 font-medium">Номер мероприятия</th>
                      <th className="py-2 px-2 font-medium">Канал</th>
                      <th className="py-2 px-2 font-medium">Результат</th>
                      <th className="py-2 px-2 font-medium">Причина</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOps.map((o) => (
                      <tr key={o.opId} className="border-b border-border/50">
                        <td className="py-2 px-2 text-xs">{o.ts?.replace("T", " ").slice(0, 19)}</td>
                        <td className="py-2 px-2 text-xs font-semibold">{formatDisplayId(o.opId)}</td>
                        <td className="py-2 px-2">{getOperationTypeLabel(o.type)}</td>
                        <td className="py-2 px-2 text-xs">{formatDisplayId(o.ticketId)}</td>
                        <td className="py-2 px-2 text-xs">{formatDisplayId(o.eventId)}</td>
                        <td className="py-2 px-2">{o.channel}</td>
                        <td className="py-2 px-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${opResultBadge[o.result]}`}>
                            {o.result === "ok" ? "Успешно" : "Отказ"}
                          </span>
                        </td>
                        <td className="py-2 px-2 text-xs">{o.reason || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {/* Confirm issue modal */}
      {confirmIssue && (() => {
        const evt = state.events.find((e) => e.eventId === confirmIssue);
        return (
          <div className="fixed inset-0 z-[60] flex items-center justify-center" onClick={() => setConfirmIssue(null)}>
            <div className="absolute inset-0 bg-foreground/30" />
            <div className="relative bg-card rounded-lg p-6 shadow-xl max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
              <h3 className="font-semibold mb-3">Выпустить марки?</h3>
              <p className="text-sm opacity-70 mb-4">
                Будет создано {evt?.capacity} контрольных марок по вместимости для {formatDisplayId(confirmIssue)}. Продолжить?
              </p>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setConfirmIssue(null)}
                  className="px-4 h-10 rounded-xl border border-border text-sm font-medium">Отмена</button>
                <button onClick={handleIssue}
                  className="px-4 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-semibold">
                  Выпустить
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
