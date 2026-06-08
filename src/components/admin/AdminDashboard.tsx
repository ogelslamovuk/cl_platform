import React, { useMemo } from "react";
import type { AppState } from "@/lib/store";
import { A, appStatusChip, opResultChip } from "./adminStyles";
import {
  FileText, Calendar, Ticket, Activity, BadgeCheck, Send,
} from "lucide-react";
import HelpTooltip from "@/components/ui/help-tooltip";
import { getEventRegionCity, isInAdminScope, normalizeRegion, resolveRegionCity, type AdminRegionScope } from "./adminScope";
import { getCompliancePaymentStatus, isResellerAuthorizedForSales } from "@/lib/store";
import { formatPublicId } from "@/lib/display";

interface Props { state: AppState; onNavigate: (tab: AdminDashboardTab) => void; regionScope?: AdminRegionScope; }

const statusLabel: Record<string, string> = {
  draft: "Черновик", submitted: "На проверке", approved: "Одобрено", rejected: "Отклонено", needs_rework: "Вернуть на доработку",
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
type AttentionItem = {
  type: string;
  title: string;
  region: string;
  status: string;
  deadline: string;
  action: string;
  tab: AdminDashboardTab;
};
type DashboardDecisionRow = {
  id: string;
  object: string;
  decision: string;
  region: string;
  date: string;
  status: string;
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
    const activeEvents = visibleEvents.filter(e => e.status === "approved" || e.status === "published").length;
    const visibleEventIds = new Set(visibleEvents.map((event) => event.eventId));
    const totalTickets = state.tickets.filter((ticket) => visibleEventIds.has(ticket.eventId)).length;
    const controlEvents = visibleOps.filter((op) => op.result === "error").length;
    const connectedOperators = state.resellers.filter((reseller) => isResellerAuthorizedForSales(reseller)).length;
    return { newApps, reviewing, activeEvents, totalTickets, controlEvents, connectedOperators };
  }, [state.resellers, state.tickets, visibleEventApplications, visibleEvents, visibleOps, visibleOrganizerApplications]);

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
  const recentOps = useMemo(() => [...visibleOps].reverse().slice(0, 4), [visibleOps]);
  const operationSummary = useMemo(() => ({
    sales: visibleOps.filter((op) => op.type === "sell" && op.result === "ok").length,
    refunds: visibleOps.filter((op) => op.type === "refund" && op.result === "ok").length,
    redemptions: visibleOps.filter((op) => op.type === "redeem" && op.result === "ok").length,
    controlFlags: visibleOps.filter((op) => op.result === "error").length,
  }), [visibleOps]);
  const todayEvents = useMemo(() => {
    const today = localDateKey();
    return visibleEvents.filter(e => e.dateTime?.startsWith(today));
  }, [visibleEvents]);
  const attentionItems = useMemo<AttentionItem[]>(() => {
    const rows: AttentionItem[] = [];
    visibleOrganizerApplications.filter((app) => app.status === "submitted").slice(0, 2).forEach((app) => {
      rows.push({
        type: "Организатор",
        title: app.data.legalName || "Заявка организатора",
        region: normalizeRegion(app.data.region || app.data.locality),
        status: "На проверке",
        deadline: "первичное решение",
        action: "Открыть заявку",
        tab: "organizerApplications",
      });
    });
    visibleEventApplications.filter((app) => app.status === "submitted").slice(0, 2).forEach((app) => {
      const regionCity = resolveRegionCity(state, { venueId: app.data.venueId, venueName: app.data.venueName, venueAddress: app.data.venueAddress });
      rows.push({
        type: "Мероприятие",
        title: app.data.title || "Заявка мероприятия",
        region: regionCity.region,
        status: getCompliancePaymentStatus(app),
        deadline: "до решения",
        action: "Проверить пошлину",
        tab: "eventComplianceApplications",
      });
    });
    visibleEvents.filter((event) => {
      const eventTickets = state.tickets.filter((ticket) => ticket.eventId === event.eventId);
      if (eventTickets.length === 0) return false;
      const remaining = eventTickets.filter((ticket) => ticket.status === "issued").length;
      const soldRatio = (eventTickets.length - remaining) / eventTickets.length;
      return remaining > 0 && soldRatio >= 0.9 && soldRatio <= 0.98;
    }).slice(0, 1).forEach((event) => {
      rows.push({
        type: "Продажи",
        title: event.title,
        region: getEventRegionCity(state, event).region,
        status: "Почти распродано",
        deadline: "до начала мероприятия",
        action: "Проверить остатки",
        tab: "registryEvents",
      });
    });
    visibleOps.filter((op) => op.result === "error").slice(-2).forEach((op) => {
      const event = state.events.find((row) => row.eventId === op.eventId);
      rows.push({
        type: "Контроль",
        title: event?.title || "Операция с билетом",
        region: event ? getEventRegionCity(state, event).region : "—",
        status: op.reason || "Отказ операции",
        deadline: "оперативно",
        action: "Открыть журнал",
        tab: "operations",
      });
    });
    return rows.slice(0, 6);
  }, [state, visibleEventApplications, visibleEvents, visibleOps, visibleOrganizerApplications]);

  const recentDecisions = useMemo<DashboardDecisionRow[]>(() => {
    const rows: DashboardDecisionRow[] = [];
    visibleOrganizerApplications.forEach((app) => {
      if (!app.reviewedAt) return;
      rows.push({
        id: app.organizerApplicationId,
        object: app.data.legalName || "Организатор",
        decision: app.status === "approved" ? "Включить в реестр" : app.status === "needs_rework" ? "Вернуть на доработку" : "Отклонить заявку",
        region: normalizeRegion(app.data.region || app.data.locality),
        date: app.reviewedAt,
        status: statusLabel[app.status] || app.status,
      });
    });
    visibleEventApplications.forEach((app) => {
      if (!app.reviewedAt) return;
      const regionCity = resolveRegionCity(state, { venueId: app.data.venueId, venueName: app.data.venueName, venueAddress: app.data.venueAddress });
      rows.push({
        id: app.eventComplianceApplicationId,
        object: app.data.title || "Мероприятие",
        decision: app.status === "approved" ? "Одобрить мероприятие" : app.status === "needs_rework" ? "Вернуть на доработку" : "Отклонить заявку",
        region: regionCity.region,
        date: app.reviewedAt,
        status: statusLabel[app.status] || app.status,
      });
    });
    return rows.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  }, [state, visibleEventApplications, visibleOrganizerApplications]);

  const kpiCards = [
    { label: "Заявки на рассмотрении", value: kpi.newApps, icon: FileText, accent: A.cyan, tooltip: "Заявки организаторов и мероприятий, ожидающие решения.", tab: "eventComplianceApplications" as const },
    { label: "Мероприятия на проверке", value: kpi.reviewing, icon: Activity, accent: A.blue, tooltip: "Заявки на мероприятия, находящиеся на проверке.", tab: "eventComplianceApplications" as const },
    { label: "Одобренные мероприятия", value: kpi.activeEvents, icon: Calendar, accent: A.violet, tooltip: "Одобренные и опубликованные мероприятия в реестре.", tab: "registryEvents" as const },
    { label: "Билеты выпущены", value: kpi.totalTickets, icon: Ticket, accent: A.gold, tooltip: "Количество выпущенных билетов по мероприятиям в выбранном scope.", tab: "tickets" as const },
    { label: "Контрольные события", value: kpi.controlEvents, icon: BadgeCheck, accent: A.statusOk, tooltip: "Операции и события, требующие контрольной реакции.", tab: "control" as const },
    { label: "Операторы подключены", value: kpi.connectedOperators, icon: Send, accent: A.statusWarn, tooltip: "Билетные операторы с действующим доступом к продажам.", tab: "operations" as const },
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
        <h3 style={{ color: A.textPrimary }} className="text-sm font-semibold tracking-tight mb-4">Требует решения</h3>
        {attentionItems.length === 0 ? (
          <p style={{ color: A.textMuted }} className="text-sm">Критических задач нет.</p>
        ) : (
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {attentionItems.map((item) => (
              <button
                key={`${item.type}-${item.title}-${item.status}`}
                type="button"
                onClick={() => onNavigate(item.tab)}
                className="rounded-lg px-3 py-3 text-left transition-colors"
                style={{ background: A.surfaceBg, border: `1px solid ${A.border}`, color: A.textPrimary }}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold" style={{ color: A.cyan }}>{item.type}</span>
                  <span className="text-xs" style={{ color: A.textMuted }}>{item.deadline}</span>
                </div>
                <div className="mt-1 truncate text-sm font-semibold">{item.title}</div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  <span style={{ color: A.textMuted }}>{item.region}</span>
                  <span style={{ color: A.textSecondary }}>{item.status}</span>
                </div>
                <div className="mt-2 text-xs" style={{ color: A.cyan }}>{item.action}</div>
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
                      <span style={{ color: A.textMuted }} className="text-xs mr-2">{formatPublicId(a.id)}</span>
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

        {/* Recent Decisions */}
        <div style={{ background: A.cardBg, border: `1px solid ${A.border}`, borderRadius: 16, boxShadow: A.cardShadow }} className="relative p-5">
          <CardHelp text="Последние решения по заявкам организаторов и мероприятий." />
          <div className="flex items-center justify-between mb-4">
            <h3 style={{ color: A.textPrimary }} className="text-sm font-semibold tracking-tight">Последние решения</h3>
            <div className="inline-flex items-center gap-1">
              <button onClick={() => onNavigate("eventComplianceApplications")} style={{ color: A.cyan }} className="text-xs hover:underline">К заявкам →</button>
              <HelpTooltip text="Перейти к заявкам мероприятий." />
            </div>
          </div>
          {recentDecisions.length === 0 ? (
            <p style={{ color: A.textMuted }} className="text-sm py-6 text-center">Решений пока нет</p>
          ) : (
            <div className="space-y-2">
              {recentDecisions.map((decision) => {
                const chip = appStatusChip(decision.status === "Одобрена" || decision.status === "Одобрено" ? "approved" : decision.status === "Отклонена" || decision.status === "Отклонено" ? "rejected" : "needs_rework");
                return (
                  <div key={`${decision.id}-${decision.date}`} className="flex items-center justify-between gap-3 py-2 px-3 rounded-lg transition-colors"
                    style={{ background: 'transparent' }}
                    onMouseEnter={e => (e.currentTarget.style.background = A.rowHover)}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span style={{ color: A.textMuted }} className="text-xs">{formatPublicId(decision.id)}</span>
                        <span style={{ color: A.textMuted }} className="text-xs">{decision.region}</span>
                      </div>
                      <div style={{ color: A.textPrimary }} className="mt-1 truncate text-sm">{decision.object}</div>
                      <div style={{ color: A.textSecondary }} className="mt-1 text-xs">{decision.decision}</div>
                    </div>
                    <span style={{ background: chip.bg, color: chip.color, borderRadius: 999 }} className="text-xs px-2.5 py-0.5 font-medium">
                      {decision.status}
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
        {/* Operational summary */}
        <div style={{ background: A.cardBg, border: `1px solid ${A.border}`, borderRadius: 16, boxShadow: A.cardShadow }} className="relative p-5">
          <CardHelp text="Сводка продаж, возвратов, погашений и контрольных сигналов по выбранному scope." />
          <div className="flex items-center justify-between mb-4">
            <h3 style={{ color: A.textPrimary }} className="text-sm font-semibold tracking-tight">Операционная сводка</h3>
            <div className="inline-flex items-center gap-1">
              <button onClick={() => onNavigate("operations")} style={{ color: A.cyan }} className="text-xs hover:underline">Журнал →</button>
              <HelpTooltip text="Перейти к журналу операций." />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              ["Продажи", operationSummary.sales],
              ["Возвраты", operationSummary.refunds],
              ["Погашения", operationSummary.redemptions],
              ["Контрольные флаги", operationSummary.controlFlags],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border px-3 py-2" style={{ borderColor: A.border, background: A.surfaceBg }}>
                <div className="text-xs" style={{ color: A.textMuted }}>{label}</div>
                <div className="mt-1 text-lg font-semibold" style={{ color: A.textPrimary }}>{value}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 space-y-2">
            {recentOps.length === 0 ? (
              <p style={{ color: A.textMuted }} className="text-sm py-3 text-center">Нет операций</p>
            ) : recentOps.map((operation) => {
              const chip = opResultChip(operation.result);
              return (
                <div key={operation.opId} className="flex items-center justify-between gap-3 rounded-lg px-3 py-2" style={{ background: A.surfaceBg, border: `1px solid ${A.border}` }}>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span style={{ color: A.textMuted }} className="text-xs">{formatPublicId(operation.opId)}</span>
                      {operation.ticketId && <span style={{ color: A.textMuted }} className="text-xs">{formatPublicId(operation.ticketId)}</span>}
                    </div>
                    <div style={{ color: A.textPrimary }} className="mt-1 text-sm">{opTypeLabel[operation.type] || operation.type}</div>
                    {operation.reason && <div style={{ color: A.textMuted }} className="mt-1 truncate text-xs">{operation.reason}</div>}
                  </div>
                  <span style={{ background: chip.bg, color: chip.color, borderRadius: 999 }} className="text-xs px-2.5 py-0.5 font-medium">
                    {operation.result === "ok" ? "Успешно" : "Отказ"}
                  </span>
                </div>
              );
            })}
          </div>
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
