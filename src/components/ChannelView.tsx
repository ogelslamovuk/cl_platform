import React, { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { AppState } from "@/lib/store";
import { getEventSalesChannels, getSalesChannelLabel, getTicketRefundBlockReason, isSalesChannelAllowedForEvent, refundTicketByReseller, sellTicketsByReseller } from "@/lib/store";
import PartnerModuleDrawer, { ModuleDrawerContent } from "@/components/channel/PartnerModuleDrawer";
import SeatMapModal from "@/components/seatmap/SeatMapModal";

interface Props {
  state: AppState;
  onUpdate: (s: AppState) => void;
}

type EventStatusFilter = "all" | "published" | "approved";
type WebhookStatus = "Доставлено" | "Ошибка" | "В очереди";

interface PartnerModule {
  key: string;
  title: string;
  group: string;
}

const defaultResellerCode = "ByCard";

function formatDate(value?: string) {
  if (!value) return "—";
  return new Date(value).toLocaleString("ru-RU", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function channelId(channel: string) {
  return `CH-${channel.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8)}`;
}

function buildModuleContent(module: PartnerModule, updatedAt: string): ModuleDrawerContent {
  const base = {
    key: module.key,
    title: module.title,
    status: "Доступен",
    badges: [module.group, "B2B"],
    updatedAt,
    footer: "Предварительный модуль: часть данных пока работает в MOC-режиме.",
  };

  const tableByModule: Record<string, ModuleDrawerContent> = {
    commissions: {
      ...base,
      summary: [
        { label: "Ставка", value: "8%" },
        { label: "Начислено", value: "142 800 ₽" },
        { label: "К выплате", value: "24 600 ₽" },
        { label: "Период", value: "Апрель 2026" },
      ],
      rows: [
        { left: "01–07 апреля", right: "37 200 ₽", status: "ok" },
        { left: "08–14 апреля", right: "52 400 ₽", status: "ok" },
        { left: "Корректировки", right: "0", status: "info" },
      ],
      actions: [{ label: "Экспорт сверки" }, { label: "Открыть отчёт", kind: "primary" }],
    },
    payouts: {
      ...base,
      summary: [
        { label: "Следующая выплата", value: "18.04.2026" },
        { label: "Статус", value: "Подтверждена" },
        { label: "Сумма", value: "24 600 ₽" },
        { label: "Последняя выплата", value: "04.04.2026" },
      ],
      rows: [
        { left: "Платёж #P-9201", right: "Исполнен", status: "ok" },
        { left: "Платёж #P-9188", right: "Исполнен", status: "ok" },
        { left: "Платёж #P-9176", right: "Проверка", status: "warn" },
      ],
      actions: [{ label: "Скачать ведомость" }, { label: "Запросить детализацию", kind: "primary" }],
    },
    reconciliation: {
      ...base,
      summary: [
        { label: "Последняя сверка", value: "14.04.2026 09:40" },
        { label: "Записей", value: "1 248" },
        { label: "Расхождения", value: "3" },
        { label: "Критичных", value: "0" },
      ],
      rows: [
        { left: "Продажи", right: "Совпадает", status: "ok" },
        { left: "Возвраты", right: "2 расхождения", status: "warn" },
        { left: "Комиссии", right: "1 расхождение", status: "warn" },
      ],
      actions: [{ label: "Сформировать акт" }, { label: "Запустить повторную сверку", kind: "primary" }],
    },
    default: {
      ...base,
      summary: [
        { label: "Статус", value: "Активен" },
        { label: "Доступ", value: "Разрешён" },
        { label: "Обновлено", value: updatedAt },
        { label: "Среда", value: "Sandbox" },
      ],
      rows: [
        { left: "Рабочий профиль", right: "Готов", status: "ok" },
        { left: "Данные", right: "Синхронизированы", status: "ok" },
        { left: "Примечание", right: "MOC контент", status: "info" },
      ],
      actions: [{ label: "Открыть журнал" }, { label: "Перейти к настройке", kind: "primary" }],
    },
  };

  return tableByModule[module.key] || tableByModule.default;
}

const partnerModules: PartnerModule[] = [
  { key: "commerce", title: "Коммерция", group: "Коммерция" },
  { key: "commissions", title: "Комиссии", group: "Коммерция" },
  { key: "payouts", title: "Выплаты", group: "Коммерция" },
  { key: "reconciliation", title: "Сверка", group: "Коммерция" },
  { key: "tariff", title: "Тарифный план", group: "Коммерция" },
  { key: "documents", title: "Документы", group: "Коммерция" },
  { key: "ops-audit", title: "Операции и аудит", group: "Операции" },
  { key: "api-history", title: "История API-запросов", group: "Операции" },
  { key: "ops-history", title: "История операций", group: "Операции" },
  { key: "tickets", title: "Реестр билетов", group: "Операции" },
  { key: "incidents", title: "Инциденты", group: "Операции" },
  { key: "integration-errors", title: "Ошибки интеграции", group: "Операции" },
  { key: "integration", title: "Интеграция", group: "Интеграция" },
  { key: "mapping", title: "Сопоставление данных", group: "Интеграция" },
  { key: "stock-sync", title: "Синхронизация остатков", group: "Интеграция" },
  { key: "credentials", title: "Учетные данные", group: "Интеграция" },
  { key: "security", title: "Безопасность", group: "Интеграция" },
  { key: "sandbox-tools", title: "Инструменты Sandbox", group: "Интеграция" },
  { key: "partnership", title: "Партнёрство", group: "Партнёрство" },
  { key: "contract", title: "Условия договора", group: "Партнёрство" },
  { key: "organizers", title: "Подключенные организаторы", group: "Партнёрство" },
  { key: "operations", title: "Доступные операции", group: "Партнёрство" },
  { key: "limits", title: "Лимиты канала", group: "Партнёрство" },
  { key: "manager", title: "Менеджер партнёра", group: "Партнёрство" },
  { key: "analytics", title: "Аналитика", group: "Аналитика" },
  { key: "sales-analytics", title: "Аналитика продаж", group: "Аналитика" },
  { key: "refund-analytics", title: "Аналитика возвратов", group: "Аналитика" },
  { key: "organizer-summary", title: "Сводка по организаторам", group: "Аналитика" },
  { key: "event-summary", title: "Сводка по событиям", group: "Аналитика" },
  { key: "finance-summary", title: "Финансовая сводка", group: "Аналитика" },
];

export default function ChannelView({ state, onUpdate }: Props) {
  const [selectedEventId, setSelectedEventId] = useState("");
  const [schemeOpen, setSchemeOpen] = useState(false);
  const [sandboxEventId, setSandboxEventId] = useState("");
  const [sandboxTier, setSandboxTier] = useState("");
  const [sandboxQuantity, setSandboxQuantity] = useState(1);
  const [refundTicketId, setRefundTicketId] = useState("");
  const [buyerName, setBuyerName] = useState("Demo Buyer");
  const [selectedResellerCode, setSelectedResellerCode] = useState(defaultResellerCode);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<EventStatusFilter>("all");
  const [dateFilter, setDateFilter] = useState("");
  const [organizerFilter, setOrganizerFilter] = useState("all");
  const [activeModule, setActiveModule] = useState<PartnerModule | null>(null);

  const organizerMap = useMemo(() => new Map(state.organizers.map((org) => [org.organizerId, org.name])), [state.organizers]);
  const selectedReseller = useMemo(
    () => state.resellers.find((reseller) => reseller.code === selectedResellerCode) || state.resellers[0] || null,
    [selectedResellerCode, state.resellers],
  );
  const activeResellerCode = selectedReseller?.code || defaultResellerCode;
  const channelOps = useMemo(
    () => state.ops.filter((op) => op.channel === activeResellerCode).sort((a, b) => b.ts.localeCompare(a.ts)),
    [activeResellerCode, state.ops],
  );
  const issuedEventIds = useMemo(
    () => new Set(state.tickets.filter((ticket) => ticket.status === "issued").map((ticket) => ticket.eventId)),
    [state.tickets],
  );

  const channelAvailableEvents = useMemo(() => {
    return state.events
      .filter((e) => e.status === "published" && issuedEventIds.has(e.eventId))
      .filter((e) => selectedReseller ? isSalesChannelAllowedForEvent(state, e, selectedReseller.code) : false)
      .sort((a, b) => a.dateTime.localeCompare(b.dateTime));
  }, [issuedEventIds, selectedReseller, state]);

  const events = useMemo(() => {
    return channelAvailableEvents
      .filter((e) => (statusFilter === "all" ? true : e.status === statusFilter))
      .filter((e) => (dateFilter ? e.dateTime.startsWith(dateFilter) : true))
      .filter((e) => {
        if (organizerFilter === "all") return true;
        const organizer = organizerMap.get(e.organizerId) || `Организатор ${e.organizerId}`;
        return organizer === organizerFilter;
      })
      .filter((e) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return [e.eventId, e.title, e.venue, organizerMap.get(e.organizerId) || ""].some((value) => value.toLowerCase().includes(q));
      })
      .sort((a, b) => a.dateTime.localeCompare(b.dateTime));
  }, [channelAvailableEvents, dateFilter, organizerFilter, organizerMap, search, statusFilter]);

  const sandboxEvents = useMemo(() => {
    return channelAvailableEvents
      .filter((event) => state.tickets.some((ticket) => ticket.eventId === event.eventId && ticket.status === "issued"))
      .sort((a, b) => a.dateTime.localeCompare(b.dateTime));
  }, [channelAvailableEvents, state.tickets]);

  const organizerOptions = useMemo(() => {
    const set = new Set<string>();
    events.forEach((event) => set.add(organizerMap.get(event.organizerId) || `Организатор ${event.organizerId}`));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [events, organizerMap]);

  const selectedEvent = useMemo(
    () => events.find((e) => e.eventId === selectedEventId) || null,
    [events, selectedEventId],
  );
  const sandboxEvent = useMemo(
    () => sandboxEvents.find((event) => event.eventId === sandboxEventId) || null,
    [sandboxEventId, sandboxEvents],
  );
  const tierRemaining = useCallback(
    (eventId: string, tierName: string) =>
      state.tickets.filter((ticket) => ticket.eventId === eventId && ticket.tier === tierName && ticket.status === "issued").length,
    [state.tickets],
  );

  const sandboxTiers = useMemo(() => {
    if (!sandboxEvent) return [];
    return sandboxEvent.tiers.filter((tier) => tierRemaining(sandboxEvent.eventId, tier.name) > 0);
  }, [sandboxEvent, tierRemaining]);

  const refundableTickets = useMemo(() => {
    const eventById = new Map(state.events.map((event) => [event.eventId, event]));
    return state.tickets
      .filter((ticket) => ticket.soldByChannel === activeResellerCode && ticket.status === "sold")
      .map((ticket) => {
        const event = eventById.get(ticket.eventId);
        const reason = getTicketRefundBlockReason(state, ticket.ticketId);
        return {
          ticket,
          event,
          reason,
          label: `${ticket.ticketId} · ${event?.title || ticket.eventId} · ${ticket.tier}`,
        };
      })
      .filter((row) => !row.reason)
      .sort((a, b) => (a.event?.dateTime || "").localeCompare(b.event?.dateTime || ""));
  }, [activeResellerCode, state]);

  useEffect(() => {
    if (selectedReseller || state.resellers.length === 0) return;
    setSelectedResellerCode(state.resellers[0].code);
  }, [selectedReseller, state.resellers]);

  useEffect(() => {
    if (sandboxEvents.length === 0) {
      setSandboxEventId("");
      return;
    }
    if (!sandboxEvents.some((event) => event.eventId === sandboxEventId)) {
      setSandboxEventId(sandboxEvents[0].eventId);
    }
  }, [sandboxEventId, sandboxEvents]);

  useEffect(() => {
    if (sandboxTiers.length === 0) {
      setSandboxTier("");
      return;
    }
    if (!sandboxTiers.some((tier) => tier.name === sandboxTier)) {
      setSandboxTier(sandboxTiers[0].name);
    }
  }, [sandboxTier, sandboxTiers]);

  useEffect(() => {
    if (refundableTickets.length === 0) {
      setRefundTicketId("");
      return;
    }
    if (!refundableTickets.some((row) => row.ticket.ticketId === refundTicketId)) {
      setRefundTicketId(refundableTickets[0].ticket.ticketId);
    }
  }, [refundTicketId, refundableTickets]);

  const today = new Date().toISOString().slice(0, 10);
  const todayOps = channelOps.filter((op) => op.ts.startsWith(today));
  const activeEvents = channelAvailableEvents;
  const ticketsAvailable = activeEvents.reduce((acc, event) => acc + event.remaining, 0);
  const failedRequests = todayOps.filter((op) => op.result === "error").length;
  const webhookDeliveries = todayOps.length;

  const commissionAccrued = state.tickets
    .filter((ticket) => ticket.soldByChannel === activeResellerCode && (ticket.status === "sold" || ticket.status === "redeemed"))
    .reduce((acc, ticket) => {
      const event = state.events.find((e) => e.eventId === ticket.eventId);
      const tier = event?.tiers.find((item) => item.name === ticket.tier);
      return acc + (tier?.price || 0) * ((selectedReseller?.commissionPercent || 0) / 100);
    }, 0);

  const webhookRows = useMemo(() => {
    const statuses: WebhookStatus[] = ["Доставлено", "Ошибка", "В очереди"];
    const eventsFeed = ["sale.created", "ticket.refunded", "inventory.updated", "ticket.redeemed"];

    return channelOps.slice(0, 12).map((op, idx) => {
      const webhookStatus = op.result === "error" ? "Ошибка" : idx % 5 === 0 ? "В очереди" : statuses[0];
      return {
        id: op.opId,
        time: formatDate(op.ts),
        event: eventsFeed[idx % eventsFeed.length],
        endpoint: `https://api.${activeResellerCode.toLowerCase()}.example/webhooks/${idx % 2 === 0 ? "events" : "tickets"}`,
        status: webhookStatus,
        code: webhookStatus === "Доставлено" ? "200" : webhookStatus === "В очереди" ? "202" : "500",
        retries: webhookStatus === "Ошибка" ? "2" : "0",
      };
    });
  }, [activeResellerCode, channelOps]);

  const kpi = [
    { label: "Активные события", value: activeEvents.length.toString(), hint: "в публикации" },
    { label: "Доступно билетов", value: ticketsAvailable.toString(), hint: "активный остаток" },
    { label: "API-запросы сегодня", value: todayOps.length.toString(), hint: `по каналу ${activeResellerCode}` },
    { label: "Ошибки запросов", value: failedRequests.toString(), hint: "требуют проверки" },
    { label: "Доставки webhook", value: webhookDeliveries.toString(), hint: "за сегодня" },
    { label: "Начислено комиссии", value: `${Math.round(commissionAccrued).toLocaleString("ru-RU")} BYN`, hint: `ставка ${selectedReseller?.commissionPercent || 0}%` },
    { label: "Последняя синхронизация", value: formatDate(state.meta.updatedAt), hint: "состояние TicketHub" },
  ];

  const apiCardRows = [
    { left: "Среда", right: "Sandbox" },
    { left: "Тип авторизации", right: "API Key" },
    { left: "Статус API key", right: selectedReseller?.apiConnected ? "Активен" : "Отключён" },
    { left: "Версия API", right: "v2.1" },
    { left: "Проверка подписи", right: "Включена" },
    { left: "Лимит запросов", right: "1200 req/мин" },
    { left: "Доступные операции", right: "sell, refund, redeem, verify" },
    { left: "Последний успешный запрос", right: formatDate(todayOps.find((op) => op.result === "ok")?.ts || state.meta.updatedAt) },
    { left: "Последняя синхронизация", right: formatDate(state.meta.updatedAt) },
  ];

  const recentResellerSales = useMemo(() => {
    const eventById = new Map(state.events.map((event) => [event.eventId, event]));
    const ticketById = new Map(state.tickets.map((ticket) => [ticket.ticketId, ticket]));
    return state.ops
      .filter((op) => op.type === "sell" && op.result === "ok" && op.channel === activeResellerCode && op.ticketId)
      .sort((a, b) => b.ts.localeCompare(a.ts))
      .slice(0, 8)
      .map((op) => {
        const ticket = op.ticketId ? ticketById.get(op.ticketId) : undefined;
        const event = eventById.get(op.eventId);
        const tier = event?.tiers.find((item) => item.name === ticket?.tier);
        return {
          opId: op.opId,
          time: formatDate(op.ts),
          eventTitle: event?.title || op.eventId,
          tier: ticket?.tier || "—",
          ticketId: op.ticketId || "—",
          buyer: ticket?.soldToUserId || "—",
          amount: tier?.price || 0,
          status: ticket?.status === "sold" ? "Продан" : ticket?.status === "redeemed" ? "Погашен" : ticket?.status === "refunded" ? "Возврат" : "—",
        };
      });
  }, [activeResellerCode, state.events, state.ops, state.tickets]);

  const handleSandboxSale = () => {
    if (!selectedReseller) {
      toast.error("Реселлер не найден");
      return;
    }
    if (selectedReseller.status === "disabled") {
      toast.error("Реселлер отключён в Центре Управления. Demo-продажа недоступна.");
      return;
    }
    if (!selectedReseller.apiConnected || selectedReseller.contractStatus !== "Active") {
      toast.error("API или договор реселлера не активны.");
      return;
    }
    if (!sandboxEventId || !sandboxTier) {
      toast.error("Выберите мероприятие и тариф");
      return;
    }
    const event = state.events.find((item) => item.eventId === sandboxEventId);
    if (!event || !isSalesChannelAllowedForEvent(state, event, selectedReseller.code)) {
      toast.error("Реселлер не выбран в каналах продаж этого мероприятия.");
      return;
    }
    const available = tierRemaining(sandboxEventId, sandboxTier);
    if (available < sandboxQuantity) {
      toast.error("Недостаточно билетов по выбранному тарифу.");
      return;
    }
    const outcome = sellTicketsByReseller(state, {
      resellerCode: selectedReseller.code,
      eventId: sandboxEventId,
      tierName: sandboxTier,
      quantity: sandboxQuantity,
      buyerName,
    });
    if (!outcome.ok) {
      toast.error(outcome.reason || "Demo-продажа не выполнена");
      return;
    }
    onUpdate({ ...state });
    toast.success(`Продано demo-билетов: ${outcome.ticketIds.length}`);
  };

  const handleSandboxRefund = () => {
    if (!selectedReseller) {
      toast.error("Реселлер не найден");
      return;
    }
    if (!refundTicketId) {
      toast.error("Нет билетов этого реселлера, доступных для возврата");
      return;
    }
    const outcome = refundTicketByReseller(state, {
      resellerCode: selectedReseller.code,
      ticketId: refundTicketId,
    });
    if (!outcome.ok) {
      toast.error(outcome.reason || "Demo-возврат не выполнен");
      return;
    }
    onUpdate({ ...state });
    toast.success("Демо-билет возвращён через реселлера");
  };

  const activeModuleContent = activeModule ? buildModuleContent(activeModule, formatDate(state.meta.updatedAt)) : null;

  return (
    <div className="relative space-y-5 pb-6">
      <section className="rounded-2xl border border-white/15 bg-slate-900/85 p-5 shadow-[0_18px_46px_rgba(2,8,23,0.5)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Канал продаж / {activeResellerCode}</p>
            <h1 className="mt-2 text-2xl font-semibold text-white">Партнёрская консоль продаж</h1>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className={`rounded-full border px-2 py-1 ${selectedReseller?.status === "active" ? "border-emerald-300/40 bg-emerald-500/10 text-emerald-200" : "border-rose-300/40 bg-rose-500/10 text-rose-200"}`}>
                {selectedReseller?.status === "active" ? "Активен" : "Отключён"}
              </span>
              <span className="rounded-full border border-cyan-300/40 bg-cyan-500/10 px-2 py-1 text-cyan-100">Sandbox</span>
              <span className="rounded-full border border-indigo-300/40 bg-indigo-500/10 px-2 py-1 text-indigo-100">Connected to TicketHub: {selectedReseller?.apiConnected ? "Да" : "Нет"}</span>
              <span className="rounded-full border border-violet-300/40 bg-violet-500/10 px-2 py-1 text-violet-100">Договор: {selectedReseller?.contractStatus || "—"}</span>
            </div>
          </div>

          <div className="grid w-full gap-2 text-sm text-slate-200 lg:w-auto lg:min-w-[420px] lg:grid-cols-2">
            <div className="rounded-lg border border-white/10 bg-slate-950/75 px-3 py-2"><p className="text-xs text-slate-400">ID канала</p><p className="mt-1 font-mono">{channelId(activeResellerCode)}</p></div>
            <div className="rounded-lg border border-white/10 bg-slate-950/75 px-3 py-2"><p className="text-xs text-slate-400">Статус API key</p><p className="mt-1">{selectedReseller?.apiConnected ? "Активен" : "Отключён"}</p></div>
            <div className="rounded-lg border border-white/10 bg-slate-950/75 px-3 py-2"><p className="text-xs text-slate-400">Комиссия</p><p className="mt-1">{selectedReseller?.commissionPercent || 0}%</p></div>
            <div className="rounded-lg border border-white/10 bg-slate-950/75 px-3 py-2"><p className="text-xs text-slate-400">Следующая выплата</p><p className="mt-1">18.04.2026</p></div>
            <div className="rounded-lg border border-white/10 bg-slate-950/75 px-3 py-2 lg:col-span-2"><p className="text-xs text-slate-400">Менеджер партнёра</p><p className="mt-1">Ирина Ковалева · partner@tickethub.example</p></div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-7">
        {kpi.map((item) => (
          <article key={item.label} className="rounded-xl border border-white/10 bg-slate-900/80 px-3 py-3">
            <p className="text-[11px] text-slate-400">{item.label}</p>
            <p className="mt-1 text-xl font-semibold text-white">{item.value}</p>
            <p className="mt-1 text-[11px] text-slate-500">{item.hint}</p>
          </article>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <article className="xl:col-span-7 rounded-xl border border-white/10 bg-slate-950/85 p-4">
          <div className="mb-3 flex flex-wrap gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по EventID, событию, площадке"
              className="h-10 min-w-[200px] flex-1 rounded-lg border border-white/15 bg-slate-900 px-3 text-sm text-slate-100 outline-none ring-cyan-400/40 focus:ring-2"
            />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as EventStatusFilter)} className="h-10 rounded-lg border border-white/15 bg-slate-900 px-3 text-sm">
              <option value="all">Все статусы</option>
              <option value="published">published</option>
              <option value="approved">approved</option>
            </select>
            <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="h-10 rounded-lg border border-white/15 bg-slate-900 px-3 text-sm" />
            <select value={organizerFilter} onChange={(e) => setOrganizerFilter(e.target.value)} className="h-10 rounded-lg border border-white/15 bg-slate-900 px-3 text-sm">
              <option value="all">Все организаторы</option>
              {organizerOptions.map((organizer) => (
                <option key={organizer} value={organizer}>{organizer}</option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-400">
                <tr className="border-b border-white/10">
                  <th className="px-2 py-2">EventID</th><th className="px-2 py-2">Событие</th><th className="px-2 py-2">Организатор</th><th className="px-2 py-2">Дата/время</th><th className="px-2 py-2">Площадка</th><th className="px-2 py-2">Остаток</th><th className="px-2 py-2">Статус синхронизации</th>
                </tr>
              </thead>
              <tbody>
                {events.length === 0 && (
                  <tr><td className="px-2 py-8 text-center text-slate-500" colSpan={7}>События не найдены по выбранным фильтрам.</td></tr>
                )}
                {events.map((event) => {
                  const isSelected = selectedEventId === event.eventId;
                  const organizer = organizerMap.get(event.organizerId) || `Организатор ${event.organizerId}`;
                  return (
                    <tr key={event.eventId} onClick={() => setSelectedEventId(event.eventId)} className={`cursor-pointer border-b border-white/5 transition-colors ${isSelected ? "bg-cyan-500/15" : "hover:bg-slate-800/55"}`}>
                      <td className="px-2 py-2 font-mono text-xs text-slate-200">{event.eventId}</td>
                      <td className="px-2 py-2 text-slate-100">{event.title}</td>
                      <td className="px-2 py-2 text-xs text-slate-300">{organizer}</td>
                      <td className="px-2 py-2 text-xs text-slate-300">{formatDate(event.dateTime)}</td>
                      <td className="px-2 py-2 text-xs text-slate-300">{event.venue}</td>
                      <td className="px-2 py-2 font-semibold text-white">{event.remaining}</td>
                      <td className="px-2 py-2"><span className={`rounded-md border px-2 py-1 text-xs ${event.status === "published" ? "border-emerald-300/40 bg-emerald-500/10 text-emerald-100" : "border-amber-300/40 bg-amber-500/10 text-amber-100"}`}>{event.status === "published" ? "Синхронизировано" : "Ожидает публикации"}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {selectedEvent && (
            <div className="mt-3 rounded-lg border border-cyan-300/20 bg-cyan-500/5 p-3 text-xs text-slate-200">
              Выбрано событие: <span className="font-semibold">{selectedEvent.title}</span> · EventID: {selectedEvent.eventId}
              <div className="mt-1 text-slate-400">
                Каналы продаж: {getEventSalesChannels(state, selectedEvent).map((code) => getSalesChannelLabel(state, code)).join(", ")}
              </div>
              <div className="mt-2 space-y-1">
                {selectedEvent.tiers.map((tier, index) => (
                  <div key={`${tier.name}-${index}`} className="flex items-center justify-between rounded border border-cyan-200/20 bg-slate-900/55 px-2 py-1">
                    <span>{tier.name} · {tier.price} BYN</span>
                    <span>Остаток: {tierRemaining(selectedEvent.eventId, tier.name)}</span>
                  </div>
                ))}
              </div>
              {selectedEvent.eventSeats?.length ? (
                <div className="mt-3 rounded-lg border border-cyan-200/20 bg-slate-900/55 p-3">
                  <div className="font-semibold text-slate-100">Схема мероприятия</div>
                  <div className="mt-1 text-slate-400">Доступно: {selectedEvent.eventSeats.filter((seat) => seat.status === "available").length} · Продано: {selectedEvent.eventSeats.filter((seat) => seat.status === "sold").length} · Блок: {selectedEvent.eventSeats.filter((seat) => seat.status === "blocked").length}</div>
                  <button onClick={() => setSchemeOpen(true)} className="mt-2 rounded bg-cyan-400 px-3 py-1.5 text-xs font-semibold text-slate-950">Открыть схему</button>
                </div>
              ) : null}
            </div>
          )}
        </article>

        <div className="xl:col-span-5 space-y-4">
          <article className="rounded-xl border border-white/10 bg-slate-900/85 p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-200">API интеграция</h2>
            <div className="mt-3 space-y-2 text-sm">
              {apiCardRows.map((row) => (
                <div key={row.left} className="flex items-center justify-between rounded-lg border border-white/10 bg-slate-950/75 px-3 py-2">
                  <span className="text-slate-400">{row.left}</span>
                  <span className="text-slate-100">{row.right}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <button onClick={() => toast.info("API-ключ тестовой среды: ********")} className="h-10 rounded-lg border border-white/15 bg-slate-900 text-slate-100 hover:bg-slate-800">Показать ключ</button>
              <button onClick={() => toast.info("Открываем документацию партнёра")} className="h-10 rounded-lg border border-white/15 bg-slate-900 text-slate-100 hover:bg-slate-800">Документация</button>
              <button onClick={() => toast.info("Открываем OpenAPI")} className="h-10 rounded-lg border border-white/15 bg-slate-900 text-slate-100 hover:bg-slate-800">OpenAPI</button>
              <button onClick={() => toast.info("Настройки webhook")} className="h-10 rounded-lg border border-white/15 bg-slate-900 text-slate-100 hover:bg-slate-800">Webhook</button>
              <button onClick={() => toast.info("Учётные данные обновлены")} className="col-span-2 h-10 rounded-lg bg-cyan-400 font-medium text-slate-950 hover:bg-cyan-300">Учётные данные</button>
            </div>
          </article>

          <article className="rounded-xl border border-cyan-300/20 bg-slate-900/85 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-200">API Sandbox / Тестовая продажа</h2>
                <p className="mt-1 text-xs text-slate-400">Demo-продажа меняет статусы билетов и создаёт операцию sell.</p>
              </div>
              <select
                value={activeResellerCode}
                onChange={(event) => setSelectedResellerCode(event.target.value)}
                className="h-9 rounded-lg border border-white/15 bg-slate-950 px-3 text-xs text-slate-100 outline-none"
              >
                {state.resellers.map((reseller) => (
                  <option key={reseller.resellerId} value={reseller.code}>{reseller.name}</option>
                ))}
              </select>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg border border-white/10 bg-slate-950/75 px-3 py-2"><span className="text-slate-400">Connected to TicketHub</span><div className="mt-1 text-slate-100">{selectedReseller?.apiConnected ? "Да" : "Нет"}</div></div>
              <div className="rounded-lg border border-white/10 bg-slate-950/75 px-3 py-2"><span className="text-slate-400">Договор</span><div className="mt-1 text-slate-100">{selectedReseller?.contractStatus || "—"}</div></div>
              <div className="rounded-lg border border-white/10 bg-slate-950/75 px-3 py-2"><span className="text-slate-400">Комиссия</span><div className="mt-1 text-slate-100">{selectedReseller?.commissionPercent || 0}%</div></div>
              <div className="rounded-lg border border-white/10 bg-slate-950/75 px-3 py-2"><span className="text-slate-400">Статус</span><div className={selectedReseller?.status === "active" ? "mt-1 text-emerald-200" : "mt-1 text-rose-200"}>{selectedReseller?.status === "active" ? "Активен" : "Отключён"}</div></div>
            </div>

            {selectedReseller?.status === "disabled" && (
              <div className="mt-3 rounded-lg border border-rose-300/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
                Реселлер отключён в Центре Управления. Demo-продажа недоступна.
              </div>
            )}
            {selectedReseller?.status !== "disabled" && selectedReseller && (!selectedReseller.apiConnected || selectedReseller.contractStatus !== "Active") && (
              <div className="mt-3 rounded-lg border border-amber-300/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
                API или договор реселлера не активны.
              </div>
            )}
            {selectedReseller && sandboxEvents.length === 0 && selectedReseller.status === "active" && selectedReseller.apiConnected && selectedReseller.contractStatus === "Active" && (
              <div className="mt-3 rounded-lg border border-cyan-300/25 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-100">
                Нет опубликованных мероприятий с TicketID, где этот реселлер выбран в каналах продаж.
              </div>
            )}

            <div className="mt-4 grid gap-3">
              <label className="block">
                <span className="mb-1 block text-xs text-slate-400">Мероприятие</span>
                <select
                  value={sandboxEventId}
                  onChange={(event) => setSandboxEventId(event.target.value)}
                  className="h-10 w-full rounded-lg border border-white/15 bg-slate-950 px-3 text-sm text-slate-100 outline-none"
                >
                  {sandboxEvents.length === 0 && <option value="">Нет событий с доступными билетами</option>}
                  {sandboxEvents.map((event) => (
                    <option key={event.eventId} value={event.eventId}>{event.title}</option>
                  ))}
                </select>
              </label>

              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_110px]">
                <label className="block">
                  <span className="mb-1 block text-xs text-slate-400">Тариф</span>
                  <select
                    value={sandboxTier}
                    onChange={(event) => setSandboxTier(event.target.value)}
                    className="h-10 w-full rounded-lg border border-white/15 bg-slate-950 px-3 text-sm text-slate-100 outline-none"
                  >
                    {sandboxTiers.length === 0 && <option value="">Нет доступных тарифов</option>}
                    {sandboxTiers.map((tier) => (
                      <option key={tier.name} value={tier.name}>{tier.name} · {tier.price} BYN · {tierRemaining(sandboxEventId, tier.name)} шт.</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs text-slate-400">Количество</span>
                  <input
                    type="number"
                    min={1}
                    value={sandboxQuantity}
                    onChange={(event) => setSandboxQuantity(Math.max(1, Math.floor(Number(event.target.value) || 1)))}
                    className="h-10 w-full rounded-lg border border-white/15 bg-slate-950 px-3 text-sm text-slate-100 outline-none"
                  />
                </label>
              </div>

              <label className="block">
                <span className="mb-1 block text-xs text-slate-400">Покупатель</span>
                <input
                  value={buyerName}
                  onChange={(event) => setBuyerName(event.target.value)}
                  className="h-10 w-full rounded-lg border border-white/15 bg-slate-950 px-3 text-sm text-slate-100 outline-none"
                />
              </label>

              <button
                type="button"
                onClick={handleSandboxSale}
                disabled={!selectedReseller || selectedReseller.status === "disabled" || !selectedReseller.apiConnected || selectedReseller.contractStatus !== "Active" || !sandboxEventId || !sandboxTier}
                className="h-11 rounded-lg bg-cyan-400 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
              >
                Продать demo-билет через реселлера
              </button>

              <div className="rounded-lg border border-white/10 bg-slate-950/70 p-3">
                <label className="block">
                  <span className="mb-1 block text-xs text-slate-400">Билет для возврата</span>
                  <select
                    value={refundTicketId}
                    onChange={(event) => setRefundTicketId(event.target.value)}
                    className="h-10 w-full rounded-lg border border-white/15 bg-slate-950 px-3 text-sm text-slate-100 outline-none"
                  >
                    {refundableTickets.length === 0 && <option value="">Нет билетов этого реселлера, доступных для возврата</option>}
                    {refundableTickets.map((row) => (
                      <option key={row.ticket.ticketId} value={row.ticket.ticketId}>{row.label}</option>
                    ))}
                  </select>
                </label>
                {refundableTickets.length === 0 && (
                  <p className="mt-2 text-xs text-amber-200">Нет билетов этого реселлера, доступных для возврата</p>
                )}
                <button
                  type="button"
                  onClick={handleSandboxRefund}
                  disabled={!selectedReseller || selectedReseller.status === "disabled" || !selectedReseller.apiConnected || selectedReseller.contractStatus !== "Active" || !refundTicketId}
                  className="mt-3 h-11 w-full rounded-lg bg-rose-400 font-semibold text-slate-950 transition hover:bg-rose-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
                >
                  Вернуть демо-билет через реселлера
                </button>
              </div>
            </div>
          </article>

          <article className="rounded-xl border border-white/10 bg-slate-950/85 p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-200">Последние demo-продажи реселлера</h2>
            {recentResellerSales.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">Продаж через выбранного реселлера пока нет.</p>
            ) : (
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-xs">
                  <thead className="uppercase tracking-wide text-slate-500">
                    <tr className="border-b border-white/10"><th className="px-2 py-2">Время</th><th className="px-2 py-2">Мероприятие</th><th className="px-2 py-2">Тариф</th><th className="px-2 py-2">TicketID</th><th className="px-2 py-2">Покупатель</th><th className="px-2 py-2">Сумма</th><th className="px-2 py-2">Статус</th></tr>
                  </thead>
                  <tbody>
                    {recentResellerSales.map((sale) => (
                      <tr key={sale.opId} className="border-b border-white/5">
                        <td className="px-2 py-2 text-slate-300">{sale.time}</td>
                        <td className="px-2 py-2 text-slate-100">{sale.eventTitle}</td>
                        <td className="px-2 py-2 text-slate-300">{sale.tier}</td>
                        <td className="px-2 py-2 font-mono text-cyan-100">{sale.ticketId}</td>
                        <td className="px-2 py-2 text-slate-300">{sale.buyer}</td>
                        <td className="px-2 py-2 text-slate-100">{sale.amount} BYN</td>
                        <td className="px-2 py-2 text-emerald-200">{sale.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </article>
        </div>
      </section>

      <section className="rounded-xl border border-white/10 bg-slate-950/85 p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-200">Доставки webhook</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-400">
              <tr className="border-b border-white/10"><th className="px-2 py-2">Время</th><th className="px-2 py-2">Событие API</th><th className="px-2 py-2">Endpoint</th><th className="px-2 py-2">Статус</th><th className="px-2 py-2">Код</th><th className="px-2 py-2">Повторы</th></tr>
            </thead>
            <tbody>
              {webhookRows.map((row) => (
                <tr key={row.id} className="border-b border-white/5 text-xs">
                  <td className="px-2 py-2 text-slate-200">{row.time}</td>
                  <td className="px-2 py-2 font-mono text-cyan-100">{row.event}</td>
                  <td className="px-2 py-2 text-slate-300">{row.endpoint}</td>
                  <td className="px-2 py-2"><span className={`rounded px-1.5 py-0.5 ${row.status === "Доставлено" ? "bg-emerald-500/15 text-emerald-200" : row.status === "Ошибка" ? "bg-rose-500/15 text-rose-200" : "bg-amber-500/15 text-amber-200"}`}>{row.status}</span></td>
                  <td className="px-2 py-2 text-slate-200">{row.code}</td>
                  <td className="px-2 py-2 text-slate-200">{row.retries}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border border-white/10 bg-slate-900/85 p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-200">Модули партнёра</h2>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-5">
          {partnerModules.map((module) => (
            <button key={module.key} onClick={() => setActiveModule(module)} className="rounded-lg border border-white/10 bg-slate-950/80 p-3 text-left transition hover:border-cyan-300/30 hover:bg-slate-900">
              <p className="text-sm font-medium text-white">{module.title}</p>
              <p className="mt-1 text-xs text-slate-400">{module.group}</p>
            </button>
          ))}
        </div>
      </section>

      <PartnerModuleDrawer
        module={activeModuleContent}
        onClose={() => setActiveModule(null)}
        onAction={(_, actionLabel) => toast.info(`Действие: ${actionLabel}`)}
      />
      {selectedEvent && (
        <SeatMapModal open={schemeOpen} title="Схема мероприятия" subtitle={selectedEvent.title} mode="viewer" eventSeats={selectedEvent.eventSeats || []} tiers={selectedEvent.tiers} onClose={() => setSchemeOpen(false)} />
      )}
    </div>
  );
}
