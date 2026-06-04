import React, { useMemo } from "react";
import type { AppState } from "@/lib/store";
import { A, appStatusChip, opResultChip } from "./adminStyles";
import {
  FileText, Calendar, Ticket, AlertTriangle, Activity, BadgeCheck, Send,
} from "lucide-react";
import HelpTooltip from "@/components/ui/help-tooltip";
import { getEventRegionCity, isInAdminScope, normalizeRegion, resolveRegionCity, type AdminRegionScope } from "./adminScope";
import { getCompliancePaymentStatus } from "@/lib/store";

interface Props { state: AppState; onNavigate: (tab: AdminDashboardTab) => void; regionScope?: AdminRegionScope; }

const statusLabel: Record<string, string> = {
  draft: "Черновик", submitted: "Отправлена", approved: "Одобрена", rejected: "Отклонена", needs_rework: "На доработке",
};
const opTypeLabel: Record<string, string> = { sell: "Продажа", refund: "Возврат", redeem: "Погашение", verify: "Проверка" };

type AdminDashboardTab =
  | "organizerApplications"
  | "eventComplianceApplications"
  | "registryEvents"
  | "tickets"
  | "control"
  | "operations";
type DashboardApplicationRow = {
  id: string;
  title: string;
  status: string;
  kind: string;
  sortAt: string;
};

function localDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function CardHelp({ text }: { text: string }) {
  return (
    <div className="absolute right-4 top-4 z-10">
      <HelpTooltip text={text} />
    </div>
  );
}

function isSyntheticNoTicketError(reason?: string): boolean {
  return /нет доступных билетов/i.test(reason || "");
}

function organizerApplicationRegion(app: AppState["organizerApplications"][number]): string {
  return normalizeRegion(app.data.region || app.data.locality);
}

export default function AdminDashboard({ state, onNavigate, regionScope = "all" }: Props) {
  const visibleOrganizerApplications = useMemo(
    () => state.organizerApplications.filter((app) => isInAdminScope(organizerApplicationRegion(app), regionScope)),
    [regionScope, state.organizerApplications]
  );
  const visibleEventApplications = useMemo(
    () => state.eventComplianceApplications.filter((app) => {
      const regionCity = resolveRegionCity(state, {
        venueId: app.data.venueId,
        venueName: app.data.venueName,
        venueAddress: app.data.venueAddress,
      });
      return isInAdminScope(regionCity.region, regionScope);
    }),
    [regionScope, state]
  );
  const visibleEvents = useMemo(
    () => state.events.filter((event) => isInAdminScope(getEventRegionCity(state, event).region, regionScope)),
    [regionScope, state]
  );
  const visibleOps = useMemo(() => {
    const eventIds = new Set(visibleEvents.map((event) => event.eventId));
    return state.ops.filter((op) => eventIds.has(op.eventId) && !(op.type === "sell" && op.result === "error" && isSyntheticNoTicketError(op.reason)));
  }, [state.ops, visibleEvents]);

  const kpi = useMemo(() => {
    const newApps = visibleOrganizerApplications.filter((a) => a.status === "submitted").length
      + visibleEventApplications.filter((a) => a.status === "submitted").length;
    const reviewing = visibleEventApplications.filter((a) => a.status === "submitted").length;
    const activeEvents = visibleEvents.filter(e => e.status === "published").length;
    const visibleEventIds = new Set(visibleEvents.map((event) => event.eventId));
    const totalTickets = state.tickets.filter((ticket) => visibleEventIds.has(ticket.eventId)).length;
    const readyForCertificate = visibleEventApplications.filter((app) =>
      app.status === "submitted" &&
      app.data.approvalMode === "certificate_required" &&
      getCompliancePaymentStatus(app) === "Оплачено"
    ).length;
    const waitingPublication = visibleEvents.filter((event) => event.status === "approved").length;
    return { newApps, reviewing, activeEvents, totalTickets, readyForCertificate, waitingPublication };
  }, [state.tickets, visibleEventApplications, visibleEvents, visibleOrganizerApplications]);

  const recentApps = useMemo<DashboardApplicationRow[]>(() => {
    const legacyRows = visibleOrganizerApplications.map((a) => ({
      id: a.organizerApplicationId,
      title: a.data.legalName || "Заявка организатора",
      status: a.status,
      kind: "Организатор",
      sortAt: a.updatedAt || a.createdAt,
    }));
    const eventRows = visibleEventApplications.map((a) => ({
      id: a.eventComplianceApplicationId,
      title: a.data.title || "Без названия",
      status: a.status,
      kind: "Мероприятие",
      sortAt: a.submittedAt || a.updatedAt || a.createdAt,
    }));
    return [...legacyRows, ...eventRows]
      .sort((a, b) => b.sortAt.localeCompare(a.sortAt))
      .slice(0, 5);
  }, [visibleEventApplications, visibleOrganizerApplications]);
  const recentOps = useMemo(() => [...visibleOps].reverse().slice(0, 6), [visibleOps]);
  const criticalFlags = useMemo(() => {
    const flags: { id: string; text: string; type: 'error' | 'warn' }[] = [];
    visibleOps.filter(o => o.result === "error").slice(-4).forEach(o => {
      flags.push({ id: o.opId, text: `${opTypeLabel[o.type] || o.type} отказ: ${o.reason || "неизвестно"}`, type: 'error' });
    });
    const refundCount = visibleOps.filter(o => o.type === "refund").length;
    const soldCount = visibleOps.filter(o => o.type === "sell" && o.result === "ok").length;
    if (soldCount > 0 && refundCount / soldCount > 0.3) {
      flags.push({ id: 'refund_rate', text: `Высокий уровень возвратов: ${Math.round(refundCount / soldCount * 100)}%`, type: 'warn' });
    }
    return flags;
  }, [visibleOps]);

  const todayEvents = useMemo(() => {
    const today = localDateKey();
    return visibleEvents.filter(e => e.dateTime?.startsWith(today));
  }, [visibleEvents]);
  const attentionItems = useMemo(() => {
    const organizerPending = visibleOrganizerApplications.filter((app) => app.status === "submitted").length;
    const eventPending = visibleEventApplications.filter((app) => app.status === "submitted").length;
    const needsRework =
      visibleOrganizerApplications.filter((app) => app.status === "needs_rework").length +
      visibleEventApplications.filter((app) => app.status === "needs_rework").length;
    const todayCount = todayEvents.length;
    const almostSoldOut = visibleEvents.filter((event) => {
      const eventTickets = state.tickets.filter((ticket) => ticket.eventId === event.eventId);
      if (eventTickets.length === 0) return false;
      const remaining = eventTickets.filter((ticket) => ticket.status === "issued").length;
      const soldRatio = (eventTickets.length - remaining) / eventTickets.length;
      return remaining > 0 && soldRatio >= 0.9 && soldRatio <= 0.98;
    }).length;
    const operationsToCheck = state.ops.filter((op) => op.result === "error").length;

    return [
      { label: "заявки организаторов на рассмотрении", count: organizerPending, tab: "organizerApplications" as const },
      { label: "заявки мероприятий на рассмотрении", count: eventPending, tab: "eventComplianceApplications" as const },
      { label: "заявки на доработке", count: needsRework, tab: "eventComplianceApplications" as const },
      { label: "события сегодня", count: todayCount, tab: "registryEvents" as const },
      { label: "события почти распроданы", count: almostSoldOut, tab: "registryEvents" as const },
      { label: "операции требуют проверки", count: operationsToCheck, tab: "operations" as const },
    ];
  }, [state.tickets, state.ops, todayEvents, visibleEventApplications, visibleEvents, visibleOrganizerApplications]);

  const kpiCards = [
    { label: "Новые заявки", value: kpi.newApps, icon: FileText, accent: A.cyan, tooltip: "Количество новых заявок, ожидающих первичного рассмотрения.", tab: "eventComplianceApplications" as const },
    { label: "На проверке", value: kpi.reviewing, icon: Activity, accent: A.blue, tooltip: "Количество заявок, находящихся на проверке.", tab: "eventComplianceApplications" as const },
    { label: "Активные события", value: kpi.activeEvents, icon: Calendar, accent: A.violet, tooltip: "Количество опубликованных событий, доступных в системе.", tab: "registryEvents" as const },
    { label: "Билеты выпущено", value: kpi.totalTickets, icon: Ticket, accent: A.gold, tooltip: "Общее количество выпущенных билетов по всем событиям.", tab: "tickets" as const },
    { label: "К выдаче удостоверений", value: kpi.readyForCertificate, icon: BadgeCheck, accent: A.statusOk, tooltip: "Заявки с оплаченной пошлиной, готовые к решению Центра Управления.", tab: "eventComplianceApplications" as const },
    { label: "Ожидают публикации", value: kpi.waitingPublication, icon: Send, accent: A.statusWarn, tooltip: "Одобренные мероприятия, ещё не опубликованные в витрине и каналах.", tab: "registryEvents" as const },
  ];

  return (
    <div className="space-y-5">
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpiCards.map((k, i) => (
          <button key={i} type="button" onClick={() => onNavigate(k.tab)} style={{
            background: A.glassGradient + ', ' + A.cardBg,
            border: `1px solid ${A.border}`,
            boxShadow: A.glassShadow,
            borderRadius: 16,
          }} className="relative p-5 text-left transition-all duration-200 hover:-translate-y-0.5"
            onMouseEnter={e => (e.currentTarget.style.borderColor = k.accent + '40')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = A.border)}>
            <CardHelp text={k.tooltip} />
            <div className="flex items-center gap-3 mb-3">
              <div style={{ background: k.accent + '18', borderRadius: 10 }} className="w-9 h-9 flex items-center justify-center">
                <k.icon size={18} style={{ color: k.accent }} />
              </div>
            </div>
            <div style={{ color: A.textPrimary }} className="text-2xl font-bold tracking-tight">{k.value}</div>
            <div style={{ color: A.textSecondary }} className="text-xs mt-1">{k.label}</div>
          </button>
        ))}
      </div>

      <div style={{ background: A.cardBg, border: `1px solid ${A.border}`, borderRadius: 16, boxShadow: A.cardShadow }} className="relative p-5">
        <CardHelp text="Краткая сводка задач, которые требуют решения оператора Центра Управления." />
        <h3 style={{ color: A.textPrimary }} className="text-sm font-semibold tracking-tight mb-4">Требует внимания</h3>
        {attentionItems.every((item) => item.count === 0) ? (
          <p style={{ color: A.textMuted }} className="text-sm">Критических задач нет.</p>
        ) : (
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {attentionItems.filter((item) => item.count > 0).map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => onNavigate(item.tab)}
                className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-left transition-colors"
                style={{ background: A.surfaceBg, border: `1px solid ${A.border}`, color: A.textPrimary }}
              >
                <span className="text-sm">{item.count} {item.label}</span>
                <span className="text-xs" style={{ color: A.cyan }}>Открыть</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Mid row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Applications */}
        <div style={{ background: A.cardBg, border: `1px solid ${A.border}`, borderRadius: 16, boxShadow: A.cardShadow }} className="relative p-5">
          <CardHelp text="Последние заявки, поступившие в центр управления." />
          <div className="flex items-center justify-between mb-4">
            <h3 style={{ color: A.textPrimary }} className="text-sm font-semibold tracking-tight">Последние заявки</h3>
            <div className="inline-flex items-center gap-1">
              <button onClick={() => onNavigate("eventComplianceApplications")} style={{ color: A.cyan }} className="text-xs hover:underline">Все заявки →</button>
              <HelpTooltip text="Перейти к разделу всех заявок." />
            </div>
          </div>
          {recentApps.length === 0 ? (
            <p style={{ color: A.textMuted }} className="text-sm py-6 text-center">Нет заявок</p>
          ) : (
            <div className="space-y-2">
              {recentApps.map(a => {
                const chip = appStatusChip(a.status);
                return (
                  <div key={a.id} className="flex items-center justify-between py-2 px-3 rounded-lg transition-colors"
                    style={{ background: 'transparent' }}
                    onMouseEnter={e => (e.currentTarget.style.background = A.rowHover)}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <div>
                      <span style={{ color: A.textMuted }} className="text-xs font-mono mr-2">{a.id}</span>
                      <span style={{ color: A.textMuted }} className="text-xs mr-2">{a.kind}</span>
                      <span style={{ color: A.textPrimary }} className="text-sm">{a.title}</span>
                    </div>
                    <span style={{ background: chip.bg, color: chip.color, borderRadius: 999 }} className="text-xs px-2.5 py-0.5 font-medium">
                      {statusLabel[a.status]}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Operations */}
        <div style={{ background: A.cardBg, border: `1px solid ${A.border}`, borderRadius: 16, boxShadow: A.cardShadow }} className="relative p-5">
          <CardHelp text="Последние операции с билетами и событиями." />
          <div className="flex items-center justify-between mb-4">
            <h3 style={{ color: A.textPrimary }} className="text-sm font-semibold tracking-tight">Последние операции</h3>
            <div className="inline-flex items-center gap-1">
              <button onClick={() => onNavigate("operations")} style={{ color: A.cyan }} className="text-xs hover:underline">Все операции →</button>
              <HelpTooltip text="Перейти к журналу операций." />
            </div>
          </div>
          {recentOps.length === 0 ? (
            <p style={{ color: A.textMuted }} className="text-sm py-6 text-center">Нет операций</p>
          ) : (
            <div className="space-y-2">
              {recentOps.map(o => {
                const chip = opResultChip(o.result);
                return (
                  <div key={o.opId} className="flex items-center justify-between py-2 px-3 rounded-lg transition-colors"
                    style={{ background: 'transparent' }}
                    onMouseEnter={e => (e.currentTarget.style.background = A.rowHover)}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <div className="flex items-center gap-2">
                      <span style={{ color: A.textMuted }} className="text-xs font-mono">{o.opId}</span>
                      <span style={{ color: A.textPrimary }} className="text-sm">{opTypeLabel[o.type] || o.type}</span>
                      {o.ticketId && <span style={{ color: A.textMuted }} className="text-xs">{o.ticketId}</span>}
                    </div>
                    <span style={{ background: chip.bg, color: chip.color, borderRadius: 999 }} className="text-xs px-2.5 py-0.5 font-medium">
                      {o.result === "ok" ? "OK" : "ОТКАЗ"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Critical flags */}
        <div style={{ background: A.cardBg, border: `1px solid ${A.border}`, borderRadius: 16, boxShadow: A.cardShadow }} className="relative p-5">
          <CardHelp text="Критические ошибки, нарушения и аномалии, найденные системой." />
          <h3 style={{ color: A.textPrimary }} className="text-sm font-semibold tracking-tight mb-4">Критические флаги</h3>
          {criticalFlags.length === 0 ? (
            <div className="flex flex-col items-center py-6">
              <AlertTriangle size={24} style={{ color: A.textMuted }} className="mb-2" />
              <p style={{ color: A.textMuted }} className="text-sm">Нарушений не обнаружено</p>
            </div>
          ) : (
            <div className="space-y-2">
              {criticalFlags.map((f, i) => (
                <div key={i} className="flex items-center gap-3 py-2 px-3 rounded-lg"
                  style={{ background: f.type === 'error' ? A.statusErrorBg : A.statusWarnBg }}>
                  <AlertTriangle size={14} style={{ color: f.type === 'error' ? A.statusError : A.statusWarn }} />
                  <span style={{ color: f.type === 'error' ? A.statusError : A.statusWarn }} className="text-sm">{f.text}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Today events */}
        <div style={{ background: A.cardBg, border: `1px solid ${A.border}`, borderRadius: 16, boxShadow: A.cardShadow }} className="relative p-5">
          <CardHelp text="Мероприятия, запланированные на текущую дату." />
          <h3 style={{ color: A.textPrimary }} className="text-sm font-semibold tracking-tight mb-4">События сегодня</h3>
          {todayEvents.length === 0 ? (
            <div className="flex flex-col items-center py-6">
              <Calendar size={24} style={{ color: A.textMuted }} className="mb-2" />
              <p style={{ color: A.textMuted }} className="text-sm">Нет событий на сегодня</p>
            </div>
          ) : (
            <div className="space-y-2">
              {todayEvents.map(e => (
                <div key={e.eventId} className="py-2 px-3 rounded-lg" style={{ background: A.rowHover }}>
                  <div className="flex items-center justify-between">
                    <span style={{ color: A.textPrimary }} className="text-sm">{e.title}</span>
                    <span style={{ color: A.textMuted }} className="text-xs">{e.venue}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
