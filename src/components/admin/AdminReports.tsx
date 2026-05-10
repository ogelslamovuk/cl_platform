import React, { useMemo, useState } from "react";
import type { AppState, EventRecord, OpRecord, Ticket } from "@/lib/store";
import { A } from "./adminStyles";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  ChevronRight,
  CircleDollarSign,
  Handshake,
  Landmark,
  Percent,
  RotateCcw,
  Ticket as TicketIcon,
  Trophy,
  Users,
} from "lucide-react";
import HelpTooltip from "@/components/ui/help-tooltip";

interface Props {
  state: AppState;
}

type EventReportRow = {
  eventId: string;
  organizerId: string;
  title: string;
  organizerName: string;
  capacity: number;
  issued: number;
  sold: number;
  refunded: number;
  redeemed: number;
  remaining: number;
  realization: number;
  revenue: number;
};

type OrganizerReportRow = {
  organizerId: string;
  name: string;
  eventCount: number;
  totalTickets: number;
  soldTickets: number;
  revenue: number;
  refunds: number;
  averageRealization: number;
};

type ChannelReportRow = {
  channel: string;
  sales: number;
  salesAmount: number;
  refunds: number;
  redeems: number;
  errors: number;
  share: number;
};

type ResellerReportRow = {
  resellerId: string;
  name: string;
  code: string;
  status: string;
  commissionPercent: number;
  salesTurnover: number;
  commissionAmount: number;
  ministryShare: number;
  platformShare: number;
  resellerNetShare: number;
  soldTickets: number;
  refunds: number;
  redeems: number;
  errors: number;
};

type FinancialSummary = {
  totalEvents: number;
  totalIssued: number;
  sold: number;
  refunded: number;
  redeemed: number;
  remaining: number;
  revenue: number;
  problemOps: number;
  topEvent: EventReportRow | null;
};

type ReportKey = "events" | "organizers" | "channels" | "resellers" | "finance";

type ReportChoice = {
  key: ReportKey;
  heading: string;
  description: string;
  metric: string;
  icon: React.ElementType;
  accent: string;
};

const channelLabels: Record<string, string> = {
  B2C: "B2C-витрина",
  ByCard: "ByCard",
  TicketPro: "TicketPro",
  SellerPOS: "SellerPOS",
  "Не указан": "Не указан",
};

const SALES_TURNOVER_TOOLTIP = "GMV — общая сумма продаж билетов до вычета комиссий, возвратов и выплат организаторам.";

function CardHelp({ text }: { text: string }) {
  return (
    <div className="absolute right-4 top-4 z-10">
      <HelpTooltip text={text} />
    </div>
  );
}

function safeCount(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.floor(parsed);
}

function safeMoney(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return parsed;
}

function formatNumber(value: number): string {
  return Math.round(value).toLocaleString("ru-RU");
}

function formatMoney(value: number): string {
  return `${Math.round(value).toLocaleString("ru-RU")} BYN`;
}

function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

function channelKey(value?: string): string {
  const key = value?.trim();
  return key || "Не указан";
}

function channelLabel(value: string): string {
  return channelLabels[value] || value;
}

function isSoldTicket(ticket: Ticket): boolean {
  return ticket.status === "sold" || ticket.status === "redeemed";
}

function buildOrganizerNameMap(state: AppState): Map<string, string> {
  const names = new Map<string, string>();

  state.organizers.forEach((organizer) => {
    const name = organizer.name || organizer.fullName || organizer.organizerId;
    names.set(organizer.organizerId, name);
  });

  state.organizerApplications.forEach((application) => {
    if (!names.has(application.organizerId)) {
      const name = application.data.legalName || application.organizerId;
      names.set(application.organizerId, name);
    }
  });

  return names;
}

function getOrganizerName(organizerNames: Map<string, string>, organizerId: string): string {
  return organizerNames.get(organizerId) || `Организатор ${organizerId || "не указан"}`;
}

function getTicketPrice(ticket: Ticket | undefined, event: EventRecord | undefined): number {
  if (!ticket || !event) return 0;
  const tier = event.tiers.find((item) => item.name === ticket.tier);
  return safeMoney(tier?.price);
}

function getOpTicketPrice(op: OpRecord, ticketById: Map<string, Ticket>, eventById: Map<string, EventRecord>): number {
  const ticket = op.ticketId ? ticketById.get(op.ticketId) : undefined;
  const event = eventById.get(ticket?.eventId || op.eventId);
  return getTicketPrice(ticket, event);
}

function buildEventRows(state: AppState): EventReportRow[] {
  const organizerNames = buildOrganizerNameMap(state);
  const ticketsByEvent = new Map<string, Ticket[]>();
  const complianceByEventId = new Map(
    state.eventComplianceApplications
      .filter((application) => application.linkedEventId)
      .map((application) => [application.linkedEventId as string, application])
  );

  state.tickets.forEach((ticket) => {
    const list = ticketsByEvent.get(ticket.eventId) || [];
    list.push(ticket);
    ticketsByEvent.set(ticket.eventId, list);
  });

  return state.events
    .map((event) => {
      const tickets = ticketsByEvent.get(event.eventId) || [];
      const compliance = complianceByEventId.get(event.eventId);
      const capacity = safeCount(event.capacity || compliance?.data.plannedTicketsForSale || compliance?.data.projectedCapacity || tickets.length);
      const issued = tickets.length;
      const soldTickets = tickets.filter(isSoldTicket);
      const sold = soldTickets.length;
      const refunded = tickets.filter((ticket) => ticket.status === "refunded").length;
      const redeemed = tickets.filter((ticket) => ticket.status === "redeemed").length;
      const remaining = tickets.filter((ticket) => ticket.status === "issued").length;
      const basis = issued || capacity;
      const realization = basis > 0 ? (sold / basis) * 100 : 0;
      const revenue = soldTickets.reduce((acc, ticket) => acc + getTicketPrice(ticket, event), 0);

      return {
        eventId: event.eventId,
        organizerId: event.organizerId,
        title: event.title || compliance?.data.title || "Без названия",
        organizerName: getOrganizerName(organizerNames, event.organizerId),
        capacity,
        issued,
        sold,
        refunded,
        redeemed,
        remaining,
        realization,
        revenue,
      };
    })
    .sort((a, b) => b.revenue - a.revenue || b.sold - a.sold || a.title.localeCompare(b.title, "ru"));
}

function buildOrganizerRows(state: AppState, eventRows: EventReportRow[]): OrganizerReportRow[] {
  const organizerNames = buildOrganizerNameMap(state);
  const rows = new Map<string, OrganizerReportRow & { realizationTotal: number }>();

  const ensureRow = (organizerId: string) => {
    const key = organizerId || "unknown";
    const existing = rows.get(key);
    if (existing) return existing;
    const row = {
      organizerId: key,
      name: getOrganizerName(organizerNames, organizerId),
      eventCount: 0,
      totalTickets: 0,
      soldTickets: 0,
      revenue: 0,
      refunds: 0,
      averageRealization: 0,
      realizationTotal: 0,
    };
    rows.set(key, row);
    return row;
  };

  state.organizers.forEach((organizer) => ensureRow(organizer.organizerId));
  state.organizerApplications.forEach((application) => ensureRow(application.organizerId));

  eventRows.forEach((event) => {
    const row = ensureRow(event.organizerId);
    row.eventCount += 1;
    row.totalTickets += event.issued;
    row.soldTickets += event.sold;
    row.revenue += event.revenue;
    row.refunds += event.refunded;
    row.realizationTotal += event.realization;
  });

  return Array.from(rows.values())
    .map(({ realizationTotal, ...row }) => ({
      ...row,
      averageRealization: row.eventCount > 0 ? realizationTotal / row.eventCount : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue || b.soldTickets - a.soldTickets || a.name.localeCompare(b.name, "ru"));
}

function buildChannelRows(state: AppState): ChannelReportRow[] {
  const eventById = new Map(state.events.map((event) => [event.eventId, event]));
  const ticketById = new Map(state.tickets.map((ticket) => [ticket.ticketId, ticket]));
  const rows = new Map<string, ChannelReportRow>();
  const sellOpTickets = new Set<string>();
  const refundOpTickets = new Set<string>();
  const redeemOpTickets = new Set<string>();

  const ensureRow = (rawChannel?: string) => {
    const key = channelKey(rawChannel);
    const existing = rows.get(key);
    if (existing) return existing;
    const row = {
      channel: channelLabel(key),
      sales: 0,
      salesAmount: 0,
      refunds: 0,
      redeems: 0,
      errors: 0,
      share: 0,
    };
    rows.set(key, row);
    return row;
  };

  state.ops.forEach((op) => {
    const row = ensureRow(op.channel);

    if (op.result === "error") {
      row.errors += 1;
      return;
    }

    if (op.type === "sell") {
      row.sales += 1;
      row.salesAmount += getOpTicketPrice(op, ticketById, eventById);
      if (op.ticketId) sellOpTickets.add(op.ticketId);
      return;
    }

    if (op.type === "refund") {
      row.refunds += 1;
      if (op.ticketId) refundOpTickets.add(op.ticketId);
      return;
    }

    if (op.type === "redeem") {
      row.redeems += 1;
      if (op.ticketId) redeemOpTickets.add(op.ticketId);
    }
  });

  state.tickets.forEach((ticket) => {
    if (!ticket.soldByChannel) return;
    const row = ensureRow(ticket.soldByChannel);
    const event = eventById.get(ticket.eventId);

    if ((ticket.status === "sold" || ticket.status === "redeemed" || ticket.status === "refunded") && !sellOpTickets.has(ticket.ticketId)) {
      row.sales += 1;
      row.salesAmount += getTicketPrice(ticket, event);
    }

    if (ticket.status === "refunded" && !refundOpTickets.has(ticket.ticketId)) {
      row.refunds += 1;
    }

    if (ticket.status === "redeemed" && !redeemOpTickets.has(ticket.ticketId)) {
      row.redeems += 1;
    }
  });

  state.demoPurchases.forEach((purchase) => {
    const row = ensureRow("B2C");
    if (purchase.ticketId && ticketById.has(purchase.ticketId)) return;
    const event = eventById.get(purchase.eventId);
    const tier = event?.tiers.find((item) => item.name === purchase.selectedPriceCategory);
    const quantity = safeCount(purchase.quantity);
    row.sales += quantity;
    row.salesAmount += safeMoney(tier?.price) * quantity;
  });

  const totalSales = Array.from(rows.values()).reduce((acc, row) => acc + row.sales, 0);
  return Array.from(rows.values())
    .map((row) => ({
      ...row,
      share: totalSales > 0 ? (row.sales / totalSales) * 100 : 0,
    }))
    .sort((a, b) => b.salesAmount - a.salesAmount || b.sales - a.sales || a.channel.localeCompare(b.channel, "ru"));
}

function buildResellerRows(state: AppState): ResellerReportRow[] {
  const eventById = new Map(state.events.map((event) => [event.eventId, event]));

  return state.resellers
    .map((reseller) => {
      const tickets = state.tickets.filter((ticket) => ticket.soldByChannel === reseller.code && ticket.status !== "issued");
      const salesTurnover = tickets.reduce((acc, ticket) => acc + getTicketPrice(ticket, eventById.get(ticket.eventId)), 0);
      const commissionAmount = salesTurnover * reseller.commissionPercent / 100;
      const ministryShare = commissionAmount * 0.25;
      const platformShare = commissionAmount * 0.125;
      const resellerNetShare = commissionAmount - ministryShare - platformShare;
      return {
        resellerId: reseller.resellerId,
        name: reseller.name,
        code: reseller.code,
        status: reseller.status,
        commissionPercent: reseller.commissionPercent,
        salesTurnover,
        commissionAmount,
        ministryShare,
        platformShare,
        resellerNetShare,
        soldTickets: tickets.length,
        refunds: tickets.filter((ticket) => ticket.status === "refunded").length,
        redeems: tickets.filter((ticket) => ticket.status === "redeemed").length,
        errors: state.ops.filter((op) => op.channel === reseller.code && op.result === "error").length,
      };
    })
    .sort((a, b) => b.salesTurnover - a.salesTurnover || b.soldTickets - a.soldTickets || a.name.localeCompare(b.name, "ru"));
}

function buildFinancialSummary(state: AppState, eventRows: EventReportRow[]): FinancialSummary {
  const topEvent = [...eventRows].sort((a, b) => b.sold - a.sold || b.revenue - a.revenue)[0] || null;

  return {
    totalEvents: state.events.length,
    totalIssued: state.tickets.length,
    sold: eventRows.reduce((acc, row) => acc + row.sold, 0),
    refunded: eventRows.reduce((acc, row) => acc + row.refunded, 0),
    redeemed: eventRows.reduce((acc, row) => acc + row.redeemed, 0),
    remaining: eventRows.reduce((acc, row) => acc + row.remaining, 0),
    revenue: eventRows.reduce((acc, row) => acc + row.revenue, 0),
    problemOps: state.ops.filter((op) => op.result === "error").length,
    topEvent,
  };
}

function ProgressBar({ value, accent }: { value: number; accent: string }) {
  return (
    <div className="h-1.5 w-24 overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
      <div className="h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: accent }} />
    </div>
  );
}

function ReportSection({
  heading,
  description,
  icon: Icon,
  accent,
  tooltip,
  children,
}: {
  heading: string;
  description: string;
  icon: React.ElementType;
  accent: string;
  tooltip: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className="relative overflow-hidden p-5"
      style={{ background: A.glassGradient + ", " + A.cardBg, border: `1px solid ${A.border}`, borderRadius: 16, boxShadow: A.cardShadow }}
    >
      <CardHelp text={tooltip} />
      <div className="mb-4 flex items-start gap-3 pr-9">
        <div style={{ background: accent + "18", borderRadius: 10 }} className="flex h-10 w-10 shrink-0 items-center justify-center">
          <Icon size={20} style={{ color: accent }} />
        </div>
        <div>
          <h2 className="text-sm font-semibold tracking-tight" style={{ color: A.textPrimary }}>
            {heading}
          </h2>
          <p className="mt-1 text-xs leading-relaxed" style={{ color: A.textSecondary }}>
            {description}
          </p>
        </div>
      </div>
      {children}
    </section>
  );
}

function EmptyState({ text, icon: Icon }: { text: string; icon: React.ElementType }) {
  return (
    <div className="flex flex-col items-center py-10 text-center">
      <Icon size={28} style={{ color: A.textMuted }} className="mb-2" />
      <p className="max-w-md text-sm" style={{ color: A.textMuted }}>
        {text}
      </p>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  hint,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  hint: string;
  icon: React.ElementType;
  accent: string;
}) {
  return (
    <div
      className="relative min-h-[116px] p-4"
      style={{ background: A.surfaceBg, border: `1px solid ${A.border}`, borderRadius: 14 }}
    >
      <CardHelp text={hint} />
      <div className="mb-4 flex h-8 w-8 items-center justify-center" style={{ background: accent + "18", borderRadius: 10 }}>
        <Icon size={16} style={{ color: accent }} />
      </div>
      <div className="break-words pr-6 text-xl font-bold leading-tight" style={{ color: A.textPrimary }}>
        {value}
      </div>
      <div className="mt-1 text-xs" style={{ color: A.textSecondary }}>
        {label}
      </div>
    </div>
  );
}

function TopEventSpotlight({ topEvent }: { topEvent: EventReportRow | null }) {
  return (
    <div
      className="relative min-h-[156px] p-5"
      style={{ background: A.glassGradient + ", " + A.cardBg, border: `1px solid ${A.border}`, borderRadius: 16, boxShadow: A.cardShadow }}
    >
      <CardHelp text="Мероприятие с максимальным количеством реализованных билетов." />
      <div className="mb-5 flex h-10 w-10 items-center justify-center" style={{ background: A.cyan + "18", borderRadius: 12 }}>
        <Trophy size={18} style={{ color: A.cyan }} />
      </div>
      <div className="pr-8">
        <div className="text-2xl font-bold leading-tight" style={{ color: A.textPrimary }}>
          {topEvent ? topEvent.title : "Данных по продажам пока нет"}
        </div>
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm" style={{ color: A.textSecondary }}>
          <span>Топ-мероприятие по продажам</span>
          {topEvent ? (
            <>
              <span>Продано: {formatNumber(topEvent.sold)}</span>
              <span>Оборот продаж: {formatMoney(topEvent.revenue)}</span>
              <span>Реализация: {formatPercent(topEvent.realization)}</span>
            </>
          ) : (
            <span>После первых продаж здесь появится главный ориентир по спросу.</span>
          )}
        </div>
      </div>
    </div>
  );
}

function ReportNavButton({ item, onSelect }: { item: ReportChoice; onSelect: (key: ReportKey) => void }) {
  const Icon = item.icon;

  return (
    <button
      type="button"
      onClick={() => onSelect(item.key)}
      className="group flex min-h-[136px] w-full items-start gap-4 p-5 text-left transition-all duration-200 hover:-translate-y-0.5"
      style={{ background: A.surfaceBg, border: `1px solid ${A.border}`, borderRadius: 16, boxShadow: A.glassShadow, color: A.textPrimary }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = `${item.accent}55`)}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = A.border)}
    >
      <div style={{ background: item.accent + "18", borderRadius: 12 }} className="flex h-11 w-11 shrink-0 items-center justify-center">
        <Icon size={20} style={{ color: item.accent }} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="text-sm font-semibold" style={{ color: A.textPrimary }}>
            {item.heading}
          </div>
          <ChevronRight size={18} style={{ color: item.accent }} className="mt-0.5 shrink-0 transition-transform group-hover:translate-x-0.5" />
        </div>
        <p className="mt-2 text-xs leading-relaxed" style={{ color: A.textSecondary }}>
          {item.description}
        </p>
        <div className="mt-4 text-xs font-semibold" style={{ color: item.accent }}>
          {item.metric}
        </div>
      </div>
    </button>
  );
}

function ReportDetailHeader({ report, onBack }: { report: ReportChoice; onBack: () => void }) {
  const Icon = report.icon;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-start gap-3">
        <div style={{ background: report.accent + "18", borderRadius: 12 }} className="flex h-11 w-11 shrink-0 items-center justify-center">
          <Icon size={20} style={{ color: report.accent }} />
        </div>
        <div>
          <div className="text-xs" style={{ color: A.textMuted }}>
            Отчёты
          </div>
          <h2 className="mt-1 text-xl font-bold leading-tight" style={{ color: A.textPrimary }}>
            {report.heading}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed" style={{ color: A.textSecondary }}>
            {report.description}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onBack}
        className="inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors"
        style={{ background: A.surfaceBg, border: `1px solid ${A.border}`, color: A.textPrimary }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = `${report.accent}55`)}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = A.border)}
      >
        <ArrowLeft size={16} />
        Все отчёты
      </button>
    </div>
  );
}

export default function AdminReports({ state }: Props) {
  const [selectedReport, setSelectedReport] = useState<ReportKey | null>(null);
  const eventRows = useMemo(() => buildEventRows(state), [state]);
  const organizerRows = useMemo(() => buildOrganizerRows(state, eventRows), [state, eventRows]);
  const channelRows = useMemo(() => buildChannelRows(state), [state]);
  const resellerRows = useMemo(() => buildResellerRows(state), [state]);
  const summary = useMemo(() => buildFinancialSummary(state, eventRows), [state, eventRows]);

  const hasAnalyticsData =
    state.events.length > 0 ||
    state.tickets.length > 0 ||
    state.ops.length > 0 ||
    state.resellers.length > 0 ||
    state.organizers.length > 0 ||
    state.organizerApplications.length > 0 ||
    state.demoPurchases.length > 0;
  const summaryCards = [
    {
      label: "Всего мероприятий",
      value: formatNumber(summary.totalEvents),
      hint: "Количество мероприятий, созданных или одобренных в Центре Управления.",
      icon: BarChart3,
      accent: A.cyan,
    },
    {
      label: "Всего выпущено билетов",
      value: formatNumber(summary.totalIssued),
      hint: "Общее количество идентификаторов билетов, созданных выпуском по мероприятиям.",
      icon: TicketIcon,
      accent: A.gold,
    },
    {
      label: "Продано",
      value: formatNumber(summary.sold),
      hint: "Билеты в статусах «Продан» и «Погашен»: они считаются реализованными.",
      icon: Percent,
      accent: A.statusOk,
    },
    {
      label: "Возвращено",
      value: formatNumber(summary.refunded),
      hint: "Билеты, переведённые в статус возврата.",
      icon: RotateCcw,
      accent: A.statusWarn,
    },
    {
      label: "Погашено",
      value: formatNumber(summary.redeemed),
      hint: "Проданные билеты, которые уже были погашены на входе или контроле.",
      icon: Activity,
      accent: A.violet,
    },
    {
      label: "Остаток",
      value: formatNumber(summary.remaining),
      hint: "Билеты в статусе «Выпущен», доступные для продажи.",
      icon: TicketIcon,
      accent: A.blue,
    },
    {
      label: "Оборот продаж",
      value: formatMoney(summary.revenue),
      hint: SALES_TURNOVER_TOOLTIP,
      icon: CircleDollarSign,
      accent: A.statusOk,
    },
    {
      label: "Проблемные операции",
      value: formatNumber(summary.problemOps),
      hint: "Операции с результатом «Ошибка», требующие внимания администратора.",
      icon: AlertTriangle,
      accent: A.statusError,
    },
  ];
  const reportChoices: ReportChoice[] = [
    {
      key: "events",
      heading: "Продажи по мероприятиям",
      description: "Вместимость, выпуск, продажи, возвраты, погашения и оборот продаж по каждому мероприятию.",
      metric: `${formatNumber(eventRows.length)} мероприятий`,
      icon: BarChart3,
      accent: A.cyan,
    },
    {
      key: "organizers",
      heading: "Эффективность организаторов",
      description: "Сравнение организаторов по количеству мероприятий, продажам, обороту продаж и средней реализации.",
      metric: `${formatNumber(organizerRows.length)} организаторов`,
      icon: Users,
      accent: A.blue,
    },
    {
      key: "channels",
      heading: "Каналы продаж",
      description: "Продажи, сумма, возвраты, погашения, ошибки операций и доля каждого канала.",
      metric: `${formatNumber(channelRows.length)} каналов`,
      icon: Activity,
      accent: A.gold,
    },
    {
      key: "resellers",
      heading: "Реселлеры",
      description: "Оборот продаж, комиссия реселлера, доли Минкульта и платформы, возвраты, погашения и ошибки.",
      metric: `${formatNumber(resellerRows.length)} реселлеров`,
      icon: Handshake,
      accent: A.statusOk,
    },
    {
      key: "finance",
      heading: "Финансово-операционная сводка",
      description: "Единый срез по выпуску, реализации, остаткам, обороту продаж, проблемным операциям и лидеру продаж.",
      metric: formatMoney(summary.revenue),
      icon: Landmark,
      accent: A.violet,
    },
  ];
  const selectedReportMeta = reportChoices.find((item) => item.key === selectedReport) || reportChoices[0];

  return (
    <div className="space-y-5">
      {!selectedReport && !hasAnalyticsData && (
        <div
          className="relative p-5"
          style={{ background: A.surfaceBg, border: `1px solid ${A.border}`, borderRadius: 16, boxShadow: A.glassShadow }}
        >
          <CardHelp text="Отчёты появятся после создания мероприятий, выпуска билетов или выполнения операций." />
          <div className="pr-8">
            <h2 className="text-sm font-semibold" style={{ color: A.textPrimary }}>
              Данных для аналитики пока нет
            </h2>
            <p className="mt-1 text-xs leading-relaxed" style={{ color: A.textSecondary }}>
              Экран готов к пустому состоянию: после загрузки демонстрационных данных, выпуска билетов или первых операций здесь появятся сводные показатели.
            </p>
          </div>
        </div>
      )}

      {!selectedReport && (
        <>
          <TopEventSpotlight topEvent={summary.topEvent} />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {reportChoices.map((item) => (
              <ReportNavButton key={item.key} item={item} onSelect={setSelectedReport} />
            ))}
          </div>
        </>
      )}

      {selectedReport && (
        <ReportDetailHeader report={selectedReportMeta} onBack={() => setSelectedReport(null)} />
      )}

      {selectedReport === "events" && (
        <ReportSection
        heading="Продажи по мероприятиям"
        description="Сводит вместимость, выпуск, продажи, возвраты, погашения и оборот продаж по каждому мероприятию."
        icon={BarChart3}
        accent={A.cyan}
        tooltip="Процент реализации считается от выпущенных билетов, а если выпуска ещё не было — от вместимости мероприятия."
      >
        {eventRows.length === 0 ? (
          <EmptyState icon={BarChart3} text="Нет мероприятий для отчёта. После одобрения события и выпуска билетов здесь появится аналитика продаж." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: A.tableHeaderBg }}>
                  {["Мероприятие", "Организатор", "Вместимость / выпущено", "Продано", "Возвращено", "Погашено", "Остаток", "Реализация", "Оборот продаж"].map((header) => (
                    <th key={header} className="px-4 py-3 text-left text-xs font-medium" style={{ color: A.textSecondary, borderBottom: `1px solid ${A.border}` }}>
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {eventRows.map((row) => (
                  <tr key={row.eventId} className="transition-colors" style={{ borderBottom: `1px solid ${A.border}` }}>
                    <td className="px-4 py-3">
                      <div className="font-medium" style={{ color: A.textPrimary }}>{row.title}</div>
                      <div className="mt-1 font-mono text-xs" style={{ color: A.textMuted }}>{row.eventId}</div>
                    </td>
                    <td className="px-4 py-3" style={{ color: A.textSecondary }}>{row.organizerName}</td>
                    <td className="px-4 py-3" style={{ color: A.textPrimary }}>{formatNumber(row.capacity)} / {formatNumber(row.issued)}</td>
                    <td className="px-4 py-3" style={{ color: A.textPrimary }}>{formatNumber(row.sold)}</td>
                    <td className="px-4 py-3" style={{ color: A.statusWarn }}>{formatNumber(row.refunded)}</td>
                    <td className="px-4 py-3" style={{ color: A.violet }}>{formatNumber(row.redeemed)}</td>
                    <td className="px-4 py-3" style={{ color: A.textPrimary }}>{formatNumber(row.remaining)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <ProgressBar value={row.realization} accent={A.cyan} />
                        <span style={{ color: A.textPrimary }}>{formatPercent(row.realization)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold" style={{ color: A.statusOk }}>{formatMoney(row.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ReportSection>
      )}

      {selectedReport === "organizers" && (
        <ReportSection
        heading="Эффективность организаторов"
        description="Показывает, как организаторы конвертируют выпущенные билеты в продажи и оборот."
        icon={Users}
        accent={A.blue}
        tooltip="Средний процент реализации считается как среднее значение реализации по мероприятиям организатора."
      >
        {organizerRows.length === 0 ? (
          <EmptyState icon={Users} text="Нет организаторов для отчёта. После регистрации организатора или создания мероприятия появится аналитическая строка." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: A.tableHeaderBg }}>
                  {["Организатор", "Мероприятий", "Всего билетов", "Продано билетов", "Оборот продаж", "Возвраты", "Средняя реализация"].map((header) => (
                    <th key={header} className="px-4 py-3 text-left text-xs font-medium" style={{ color: A.textSecondary, borderBottom: `1px solid ${A.border}` }}>
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {organizerRows.map((row) => (
                  <tr key={row.organizerId} className="transition-colors" style={{ borderBottom: `1px solid ${A.border}` }}>
                    <td className="px-4 py-3">
                      <div className="font-medium" style={{ color: A.textPrimary }}>{row.name}</div>
                      <div className="mt-1 font-mono text-xs" style={{ color: A.textMuted }}>{row.organizerId}</div>
                    </td>
                    <td className="px-4 py-3" style={{ color: A.textPrimary }}>{formatNumber(row.eventCount)}</td>
                    <td className="px-4 py-3" style={{ color: A.textPrimary }}>{formatNumber(row.totalTickets)}</td>
                    <td className="px-4 py-3" style={{ color: A.statusOk }}>{formatNumber(row.soldTickets)}</td>
                    <td className="px-4 py-3 font-semibold" style={{ color: A.statusOk }}>{formatMoney(row.revenue)}</td>
                    <td className="px-4 py-3" style={{ color: A.statusWarn }}>{formatNumber(row.refunds)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <ProgressBar value={row.averageRealization} accent={A.blue} />
                        <span style={{ color: A.textPrimary }}>{formatPercent(row.averageRealization)}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ReportSection>
      )}

      {selectedReport === "channels" && (
        <ReportSection
        heading="Каналы продаж"
        description="Агрегирует продажи, возвраты, погашения и ошибки по каналам операций."
        icon={Activity}
        accent={A.gold}
        tooltip="Доля канала считается от количества успешных продаж по всем каналам."
      >
        {channelRows.length === 0 ? (
          <EmptyState icon={Activity} text="Нет операций по каналам. После покупки, возврата, проверки или погашения билетов здесь появится каналовая аналитика." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: A.tableHeaderBg }}>
                  {["Канал", "Количество продаж", "Оборот продаж", "Возвраты", "Погашения", "Ошибки операций", "Доля в продажах"].map((header) => (
                    <th key={header} className="px-4 py-3 text-left text-xs font-medium" style={{ color: A.textSecondary, borderBottom: `1px solid ${A.border}` }}>
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {channelRows.map((row) => (
                  <tr key={row.channel} className="transition-colors" style={{ borderBottom: `1px solid ${A.border}` }}>
                    <td className="px-4 py-3 font-medium" style={{ color: A.textPrimary }}>{row.channel}</td>
                    <td className="px-4 py-3" style={{ color: A.textPrimary }}>{formatNumber(row.sales)}</td>
                    <td className="px-4 py-3 font-semibold" style={{ color: A.statusOk }}>{formatMoney(row.salesAmount)}</td>
                    <td className="px-4 py-3" style={{ color: A.statusWarn }}>{formatNumber(row.refunds)}</td>
                    <td className="px-4 py-3" style={{ color: A.violet }}>{formatNumber(row.redeems)}</td>
                    <td className="px-4 py-3" style={{ color: row.errors > 0 ? A.statusError : A.textSecondary }}>{formatNumber(row.errors)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <ProgressBar value={row.share} accent={A.gold} />
                        <span style={{ color: A.textPrimary }}>{formatPercent(row.share)}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ReportSection>
      )}

      {selectedReport === "resellers" && (
        <ReportSection
        heading="Реселлеры"
        description="Показывает комиссионную модель по каждому demo-реселлеру без расчёта налогов и выплат."
        icon={Handshake}
        accent={A.statusOk}
        tooltip={SALES_TURNOVER_TOOLTIP}
      >
        {resellerRows.length === 0 ? (
          <EmptyState icon={Handshake} text="Нет реселлеров для отчёта. После инициализации demo-данных здесь появится комиссионная аналитика." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1120px] text-sm">
              <thead>
                <tr style={{ background: A.tableHeaderBg }}>
                  {["Реселлер", "Код", "Статус", "Оборот продаж", "Комиссия реселлера", "Доля Минкульта", "Доля платформы", "Остаток комиссии реселлера", "Продано билетов", "Возвраты", "Погашения", "Ошибки"].map((header) => (
                    <th key={header} className="px-4 py-3 text-left text-xs font-medium" style={{ color: A.textSecondary, borderBottom: `1px solid ${A.border}` }}>
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {resellerRows.map((row) => (
                  <tr key={row.resellerId} className="transition-colors" style={{ borderBottom: `1px solid ${A.border}` }}>
                    <td className="px-4 py-3 font-medium" style={{ color: A.textPrimary }}>{row.name}</td>
                    <td className="px-4 py-3 font-mono text-xs" style={{ color: A.cyan }}>{row.code}</td>
                    <td className="px-4 py-3" style={{ color: row.status === "active" ? A.statusOk : A.statusError }}>{row.status === "active" ? "Активен" : "Отключён"}</td>
                    <td className="px-4 py-3 font-semibold" style={{ color: A.statusOk }}>{formatMoney(row.salesTurnover)}</td>
                    <td className="px-4 py-3" style={{ color: A.textPrimary }}>{formatMoney(row.commissionAmount)} · {row.commissionPercent}%</td>
                    <td className="px-4 py-3" style={{ color: A.textSecondary }}>{formatMoney(row.ministryShare)}</td>
                    <td className="px-4 py-3" style={{ color: A.textSecondary }}>{formatMoney(row.platformShare)}</td>
                    <td className="px-4 py-3 font-semibold" style={{ color: A.gold }}>{formatMoney(row.resellerNetShare)}</td>
                    <td className="px-4 py-3" style={{ color: A.textPrimary }}>{formatNumber(row.soldTickets)}</td>
                    <td className="px-4 py-3" style={{ color: A.statusWarn }}>{formatNumber(row.refunds)}</td>
                    <td className="px-4 py-3" style={{ color: A.violet }}>{formatNumber(row.redeems)}</td>
                    <td className="px-4 py-3" style={{ color: row.errors > 0 ? A.statusError : A.textSecondary }}>{formatNumber(row.errors)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ReportSection>
      )}

      {selectedReport === "finance" && (
        <ReportSection
        heading="Финансово-операционная сводка"
        description="Ключевые показатели по всему Центру Управления: выпуск, реализация, возвраты, остаток, оборот продаж и проблемные операции."
        icon={Landmark}
        accent={A.violet}
        tooltip="Сводка построена из текущих мероприятий, билетов и операций без изменения бизнес-логики продажи или возврата."
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <SummaryCard key={card.label} {...card} />
          ))}
          <div className="relative min-h-[116px] p-4 sm:col-span-2 xl:col-span-4" style={{ background: A.surfaceBg, border: `1px solid ${A.border}`, borderRadius: 14 }}>
            <CardHelp text="Мероприятие с максимальным количеством реализованных билетов." />
            <div className="mb-3 flex h-8 w-8 items-center justify-center" style={{ background: A.cyan + "18", borderRadius: 10 }}>
              <Trophy size={16} style={{ color: A.cyan }} />
            </div>
            <div className="pr-8">
              <div className="text-xl font-bold leading-tight" style={{ color: A.textPrimary }}>
                {summary.topEvent ? summary.topEvent.title : "—"}
              </div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs" style={{ color: A.textSecondary }}>
                <span>Топ-мероприятие по продажам</span>
                {summary.topEvent && (
                  <>
                    <span>Продано: {formatNumber(summary.topEvent.sold)}</span>
                    <span>Оборот продаж: {formatMoney(summary.topEvent.revenue)}</span>
                    <span>Реализация: {formatPercent(summary.topEvent.realization)}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </ReportSection>
      )}
    </div>
  );
}
