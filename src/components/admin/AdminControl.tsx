import React, { useMemo, useState } from "react";
import type { AppState } from "@/lib/store";
import { A, statusChip } from "./adminStyles";
import { ShieldAlert, X } from "lucide-react";
import HelpTooltip from "@/components/ui/help-tooltip";
import { getEventRegionCity, isInAdminScope, type AdminRegionScope } from "./adminScope";

interface Flag {
  id: string;
  objectType: string;
  objectName: string;
  objectId: string;
  region: string;
  city: string;
  eventType: string;
  type: string;
  priority: 'high' | 'medium' | 'low';
  status: string;
  reason: string;
  ts: string;
}

interface Props { state: AppState; regionScope?: AdminRegionScope; }

function CardHelp({ text }: { text: string }) {
  return (
    <div className="absolute right-4 top-4 z-10">
      <HelpTooltip text={text} />
    </div>
  );
}

const priorityChip = (p: string) => {
  switch (p) {
    case 'high': return statusChip('error');
    case 'medium': return statusChip('warn');
    default: return statusChip('neutral');
  }
};

const priorityLabel: Record<Flag['priority'], string> = {
  high: "Высокий",
  medium: "Средний",
  low: "Низкий",
};

function isSyntheticNoTicketError(reason?: string): boolean {
  return /нет доступных билетов/i.test(reason || "");
}

export default function AdminControl({ state, regionScope = "all" }: Props) {
  const [drawer, setDrawer] = useState<Flag | null>(null);

  const flags = useMemo<Flag[]>(() => {
    const result: Flag[] = [];
    const eventById = new Map(state.events.map((event) => [event.eventId, event]));
    state.ops
      .filter((op) => op.result === "error" && !(op.type === "sell" && isSyntheticNoTicketError(op.reason)))
      .forEach((op) => {
      const event = eventById.get(op.eventId);
      const regionCity = event ? getEventRegionCity(state, event) : { region: "—", city: "—" };
      if (!isInAdminScope(regionCity.region, regionScope)) return;
      let flagType = "Операция требует проверки";
      if (op.reason?.includes("погашен")) flagType = "Повторное погашение TicketID";
      else if (op.reason?.includes("возвращён")) flagType = "Операция над возвращённым билетом";
      result.push({
        id: `FLG-${op.opId}`,
        objectType: op.ticketId ? "TicketID" : "Операция",
        objectName: event?.title || "Операция билета",
        objectId: op.ticketId || op.eventId,
        region: regionCity.region,
        city: regionCity.city,
        eventType: event?.category || "—",
        type: flagType,
        priority: flagType.includes("Повторное") ? 'high' : 'medium',
        status: "Открыт",
        reason: op.reason || "",
        ts: op.ts,
      });
    });
    state.events.forEach((event) => {
      const regionCity = getEventRegionCity(state, event);
      if (!isInAdminScope(regionCity.region, regionScope)) return;
      const tickets = state.tickets.filter((ticket) => ticket.eventId === event.eventId);
      if (tickets.length > event.capacity) {
        result.push({
          id: `FLG-CAP-${event.eventId}`,
          objectType: "Мероприятие",
          objectName: event.title,
          objectId: event.eventId,
          region: regionCity.region,
          city: regionCity.city,
          eventType: event.category,
          type: "Выпущено больше вместимости",
          priority: "high",
          status: "Открыт",
          reason: `TicketID: ${tickets.length}, утверждённая вместимость: ${event.capacity}`,
          ts: event.updatedAt,
        });
      }
      const channels = new Set(event.salesChannels || []);
      const unauthorizedOps = state.ops.filter((op) => op.eventId === event.eventId && op.result === "ok" && op.type === "sell" && !channels.has(op.channel));
      if (unauthorizedOps.length) {
        result.push({
          id: `FLG-CHANNEL-${event.eventId}`,
          objectType: "Оператор",
          objectName: event.title,
          objectId: unauthorizedOps[0].channel,
          region: regionCity.region,
          city: regionCity.city,
          eventType: event.category,
          type: "Продажа неавторизованным каналом",
          priority: "high",
          status: "Открыт",
          reason: `Канал ${unauthorizedOps[0].channel} отсутствует в согласованных каналах события`,
          ts: unauthorizedOps[0].ts,
        });
      }
    });
    const refunds = state.ops.filter(o => o.type === "refund" && o.result === "ok").length;
    const sells = state.ops.filter(o => o.type === "sell" && o.result === "ok").length;
    if (sells > 0 && refunds / sells > 0.3) {
      const event = state.events[0];
      const regionCity = event ? getEventRegionCity(state, event) : { region: "Минск", city: "Минск" };
      if (!isInAdminScope(regionCity.region, regionScope)) return result;
      result.push({
        id: "FLG-REFUND-RATE",
        objectType: "Система",
        objectName: "Возвраты по платформе",
        objectId: "—",
        region: regionCity.region,
        city: regionCity.city,
        eventType: "операции",
        type: "Возвраты выше нормы",
        priority: 'high',
        status: "Мониторинг",
        reason: `Уровень возвратов ${Math.round(refunds / sells * 100)}% (порог 30%)`,
        ts: new Date().toISOString(),
      });
    }
    return result;
  }, [regionScope, state]);

  return (
    <div className="space-y-5">
      <div style={{ background: A.cardBg, border: `1px solid ${A.border}`, borderRadius: 16, boxShadow: A.cardShadow }} className="relative overflow-hidden">
        <CardHelp text="Контроль автоматически показывает подозрительные операции и системные флаги по данным демо-состояния." />
        {flags.length === 0 ? (
          <div className="flex flex-col items-center py-12">
            <ShieldAlert size={28} style={{ color: A.textMuted }} className="mb-2" />
            <p style={{ color: A.textMuted }} className="text-sm">Нарушений не обнаружено</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: A.tableHeaderBg }}>
                  {["ID", "Объект", "Регион / город", "Тип события", "Тип нарушения", "Приоритет", "Статус", "Основание", "Действие"].map((h, i) => (
                    <th key={i} className="text-left py-3 px-4 font-medium text-xs" style={{ color: A.textSecondary, borderBottom: `1px solid ${A.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {flags.map(f => {
                  const pChip = priorityChip(f.priority);
                  return (
                    <tr key={f.id} className="transition-colors cursor-pointer"
                      style={{ borderBottom: `1px solid ${A.border}` }}
                      onClick={() => setDrawer(f)}
                      onMouseEnter={e => (e.currentTarget.style.background = A.rowHover)}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <td className="py-3 px-4 font-mono text-xs" style={{ color: A.cyan }}>{f.id}</td>
                      <td className="py-3 px-4" style={{ color: A.textSecondary }}><div>{f.objectType}</div><div className="text-xs">{f.objectName}</div><div className="font-mono text-xs">{f.objectId}</div></td>
                      <td className="py-3 px-4" style={{ color: A.textSecondary }}>{f.region}<br /><span className="text-xs">{f.city}</span></td>
                      <td className="py-3 px-4" style={{ color: A.textSecondary }}>{f.eventType}</td>
                      <td className="py-3 px-4" style={{ color: A.textPrimary }}>{f.type}</td>
                      <td className="py-3 px-4">
                        <span style={{ background: pChip.bg, color: pChip.color, borderRadius: 999 }} className="text-xs px-2.5 py-0.5 font-medium">{priorityLabel[f.priority]}</span>
                      </td>
                      <td className="py-3 px-4" style={{ color: A.textSecondary }}>{f.status}</td>
                      <td className="py-3 px-4 text-xs max-w-[220px] truncate" style={{ color: A.textMuted }}>{f.reason}</td>
                      <td className="py-3 px-4 text-xs" style={{ color: A.cyan }}>Открыть</td>
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
          <div className="relative w-full max-w-md h-full overflow-y-auto animate-in slide-in-from-right duration-300"
            style={{ background: A.glassGradient + ', ' + A.sidebarBg, borderLeft: `1px solid ${A.borderGlass}` }}
            onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 z-10 flex items-center justify-between p-5" style={{ background: A.topbarBg, backdropFilter: 'blur(16px)', borderBottom: `1px solid ${A.border}` }}>
              <h3 style={{ color: A.textPrimary }} className="text-base font-semibold">{drawer.id}</h3>
              <span className="inline-flex items-center gap-1">
  <button onClick={() => setDrawer(null)} style={{ color: A.textMuted }}><X size={18} /></button>
  <HelpTooltip text="Закрыть карточку нарушения и вернуться к списку контрольных флагов." />
</span>
            </div>
            <div className="p-5 space-y-4">
              {([["Тип", drawer.type], ["Объект", `${drawer.objectType}: ${drawer.objectName}`], ["ID объекта", drawer.objectId], ["Регион", drawer.region], ["Город", drawer.city], ["Тип события", drawer.eventType], ["Приоритет", priorityLabel[drawer.priority]], ["Статус", drawer.status], ["Основание", drawer.reason], ["Время", drawer.ts?.replace("T", " ").slice(0, 19)]] as [string, string][]).map(([k, v]) => (
                <div key={k}>
                  <div style={{ color: A.textMuted }} className="text-xs font-medium mb-1">{k}</div>
                  <div style={{ color: A.textPrimary }} className="text-sm">{v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
