import React, { useMemo, useState } from "react";
import type { AppState, EventRecord, Reseller, ResellerAdmissionStatus, ResellerAgreementStatus, ResellerConnectionType, ResellerContractStatus, ResellerIntegrationStatus, ResellerStatus, Ticket } from "@/lib/store";
import {
  createReseller,
  getResellerAdmissionStatus,
  getResellerAgreementStatus,
  getResellerConnectionType,
  getResellerIntegrationStatus,
  RESELLER_ADMISSION_STATUSES,
  RESELLER_AGREEMENT_STATUSES,
  RESELLER_CONNECTION_TYPES,
  setResellerCommission,
  setResellerStatus,
  updateReseller,
} from "@/lib/store";
import { A, statusChip } from "./adminStyles";
import { Network, Plus, Store, X } from "lucide-react";
import HelpTooltip from "@/components/ui/help-tooltip";
import { toast } from "sonner";
import { getEventRegionCity, isInAdminScope, type AdminRegionScope } from "./adminScope";

interface Props {
  state: AppState;
  onUpdate: (s: AppState) => void;
  regionScope?: AdminRegionScope;
}

type ResellerMetrics = {
  salesTurnover: number;
  soldTickets: number;
  refunds: number;
  redeems: number;
  lastOperation: string;
};

type ResellerFormState = {
  name: string;
  code: string;
  commissionPercent: number;
  apiConnected: boolean;
  contractStatus: ResellerContractStatus;
  status: ResellerStatus;
  admissionStatus: ResellerAdmissionStatus;
  connectionType: ResellerConnectionType;
  agreementStatus: ResellerAgreementStatus;
  integrationStatus: ResellerIntegrationStatus;
  contactPerson: string;
  email: string;
  phone: string;
  legalAddress: string;
  registrationNumber: string;
};
type ResellerSort = "name" | "status" | "events" | "sales" | "tickets" | "region";

const emptyForm: ResellerFormState = {
  name: "",
  code: "",
  commissionPercent: 8,
  apiConnected: true,
  contractStatus: "Active",
  status: "active",
  admissionStatus: "Авторизован",
  connectionType: "API",
  agreementStatus: "Соглашение подписано",
  integrationStatus: "Интеграция активна",
  contactPerson: "",
  email: "",
  phone: "",
  legalAddress: "",
  registrationNumber: "",
};

function formatMoney(value: number): string {
  return `${Math.round(value).toLocaleString("ru-RU")} BYN`;
}

function formatDateTime(value?: string): string {
  if (!value || value === "—") return "—";
  return value.replace("T", " ").slice(0, 16);
}

function hashCode(value: string): number {
  return value.split("").reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) >>> 0, 7);
}

function mockDate(reseller: Reseller): string {
  const hash = hashCode(reseller.resellerId || reseller.code);
  const month = String((hash % 9) + 1).padStart(2, "0");
  const day = String((hash % 24) + 1).padStart(2, "0");
  return `2026-${month}-${day}`;
}

function getTicketPrice(ticket: Ticket, event: EventRecord | undefined): number {
  const tier = event?.tiers.find((item) => item.name === ticket.tier);
  const price = Number(tier?.price);
  return Number.isFinite(price) ? price : 0;
}

function buildMetrics(state: AppState): Map<string, ResellerMetrics> {
  const eventById = new Map(state.events.map((event) => [event.eventId, event]));
  const metrics = new Map<string, ResellerMetrics>();

  const ensure = (code: string) => {
    const existing = metrics.get(code);
    if (existing) return existing;
    const row = { salesTurnover: 0, soldTickets: 0, refunds: 0, redeems: 0, lastOperation: "—" };
    metrics.set(code, row);
    return row;
  };

  state.resellers.forEach((reseller) => ensure(reseller.code));

  state.tickets.forEach((ticket) => {
    if (!ticket.soldByChannel || ticket.status === "issued") return;
    const row = ensure(ticket.soldByChannel);
    if (ticket.status === "sold" || ticket.status === "redeemed") {
      row.soldTickets += 1;
      row.salesTurnover += getTicketPrice(ticket, eventById.get(ticket.eventId));
    }
    if (ticket.status === "refunded") row.refunds += 1;
    if (ticket.status === "redeemed") row.redeems += 1;
  });

  state.ops.forEach((op) => {
    const row = ensure(op.channel);
    if (row.lastOperation === "—" || op.ts > row.lastOperation) row.lastOperation = op.ts;
  });

  return metrics;
}

function StatusBadge({ active }: { active: boolean }) {
  const chip = active ? statusChip("ok") : statusChip("neutral");
  return (
    <span className="rounded-full px-2.5 py-1 text-xs font-medium" style={{ background: chip.bg, color: chip.color }}>
      {active ? "Активен" : "Отключён"}
    </span>
  );
}

function contractStatusLabel(status: Reseller["contractStatus"]): string {
  if (status === "Active") return "Активен";
  if (status === "Suspended") return "Приостановлен";
  return "Черновик";
}

function resellerStatusLabel(status: ResellerStatus): string {
  return status === "active" ? "Активен" : "Отключён";
}

function ContractBadge({ status }: { status: Reseller["contractStatus"] }) {
  const chip = status === "Active" ? statusChip("ok") : status === "Suspended" ? statusChip("error") : statusChip("warn");
  return (
    <span className="rounded-full px-2.5 py-1 text-xs font-medium" style={{ background: chip.bg, color: chip.color }}>
      {contractStatusLabel(status)}
    </span>
  );
}

function TextBadge({ value, tone = "neutral" }: { value: string; tone?: "ok" | "warn" | "error" | "neutral" | "info" }) {
  const chip = statusChip(tone);
  return (
    <span className="inline-flex rounded-full px-2.5 py-1 text-xs font-medium" style={{ background: chip.bg, color: chip.color }}>
      {value}
    </span>
  );
}

function admissionTone(status: ResellerAdmissionStatus): "ok" | "warn" | "error" | "info" {
  if (status === "Авторизован") return "ok";
  if (status === "Приостановлен") return "error";
  if (status === "На рассмотрении") return "info";
  return "warn";
}

function agreementTone(status: ResellerAgreementStatus): "ok" | "warn" {
  return status === "Соглашение подписано" ? "ok" : "warn";
}

function integrationTone(status: ResellerIntegrationStatus): "ok" | "warn" | "error" {
  if (status === "Интеграция активна") return "ok";
  if (status === "Доступ приостановлен") return "error";
  return "warn";
}

function DetailBlock({ title, rows }: { title: string; rows: [string, string][] }) {
  return (
    <section className="rounded-xl border p-4" style={{ borderColor: A.border, background: A.surfaceBg }}>
      <h4 className="mb-3 text-sm font-semibold" style={{ color: A.textPrimary }}>{title}</h4>
      <div className="space-y-2">
        {rows.map(([label, value]) => (
          <div key={label} className="grid grid-cols-[150px_minmax(0,1fr)] gap-3 text-xs">
            <div style={{ color: A.textMuted }}>{label}</div>
            <div className="break-words font-medium" style={{ color: A.textPrimary }}>{value || "—"}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function buildResellerRows(reseller: Reseller, metrics: ResellerMetrics): Record<string, [string, string][]> {
  const codePart = reseller.code.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8) || "RSL";
  const contractDate = reseller.contractDate || mockDate(reseller);
  const contractNumber = reseller.contractNumber || `TH-${codePart}-${new Date().getFullYear()}`;
  const endpoint = reseller.apiEndpoint || `https://sandbox.api.${reseller.code.toLowerCase()}.example/v2/tickethub`;
  const webhook = reseller.webhookEndpoint || `https://sandbox.${reseller.code.toLowerCase()}.example/webhooks/tickethub`;
  const sync = reseller.lastSync || metrics.lastOperation || reseller.updatedAt;
  const admissionStatus = getResellerAdmissionStatus(reseller);
  const connectionType = getResellerConnectionType(reseller);
  const agreementStatus = getResellerAgreementStatus(reseller);
  const integrationStatus = getResellerIntegrationStatus(reseller);

  return {
    admission: [
      ["Статус допуска", admissionStatus],
      ["Тип подключения", connectionType],
      ["Статус соглашения", agreementStatus],
      ["Интеграция", integrationStatus],
      ["Дата заявки", reseller.applicationDate || mockDate(reseller)],
      ["Дата допуска", reseller.admissionDate || "—"],
      ["Ответственный контакт", reseller.responsibleContact || reseller.contactPerson || "—"],
      ["Комментарий", reseller.applicationComment || "—"],
    ],
    registration: [
      ["Полное наименование", reseller.fullName || `ООО «${reseller.name}»`],
      ["УНП / рег. номер", reseller.registrationNumber || String(190000000 + (hashCode(reseller.code) % 9000000))],
      ["Юридический адрес", reseller.legalAddress || "220000, г. Минск, ул. Культурная, 12"],
      ["Контактное лицо", reseller.contactPerson || "Менеджер оператора"],
      ["Email", reseller.email || `partner@${reseller.code.toLowerCase()}.example`],
      ["Телефон", reseller.phone || "+375 (29) 000-00-00"],
    ],
    contract: [
      ["Статус договора", contractStatusLabel(reseller.contractStatus)],
      ["Номер договора", contractNumber],
      ["Дата договора", contractDate],
      ["Комиссия", `${reseller.commissionPercent}%`],
    ],
    api: [
      ["API подключён", reseller.apiConnected ? "Да" : "Нет"],
      ["Среда", "Учебный контур"],
      ["Версия API", "v2.1"],
      ["Адрес API", endpoint],
      ["Адрес webhook", webhook],
      ["Проверка подписи", reseller.signatureValidation === false ? "Отключена" : "Включена"],
      ["Последняя синхронизация", formatDateTime(sync)],
    ],
    movement: [
      ["Оборот продаж", formatMoney(metrics.salesTurnover)],
      ["Продано билетов", metrics.soldTickets.toLocaleString("ru-RU")],
      ["Возвраты", metrics.refunds.toLocaleString("ru-RU")],
      ["Погашения", metrics.redeems.toLocaleString("ru-RU")],
      ["Последняя операция", formatDateTime(metrics.lastOperation)],
    ],
  };
}

function getCoverageLabel(state: AppState, events: EventRecord[]): string {
  if (!events.length) return "Республика Беларусь";
  return Array.from(new Set(events.map((event) => getEventRegionCity(state, event).region))).sort((a, b) => a.localeCompare(b, "ru")).join(", ");
}

export default function AdminResellers({ state, onUpdate, regionScope = "all" }: Props) {
  const metrics = useMemo(() => buildMetrics(state), [state]);
  const [drawer, setDrawer] = useState<Reseller | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<ResellerFormState>(emptyForm);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [admissionFilter, setAdmissionFilter] = useState("");
  const [connectionFilter, setConnectionFilter] = useState("");
  const [sortBy, setSortBy] = useState<ResellerSort>("name");
  const connectedEventsByCode = useMemo(() => {
    const map = new Map<string, EventRecord[]>();
    state.resellers.forEach((reseller) => map.set(reseller.code, []));
    state.events.forEach((event) => {
      (event.salesChannels || []).forEach((code) => {
        const list = map.get(code);
        if (list) list.push(event);
      });
    });
    return map;
  }, [state.events, state.resellers]);
  const visibleResellers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return state.resellers
      .filter((reseller) => {
        const connectedEvents = connectedEventsByCode.get(reseller.code) || [];
        const regions = connectedEvents.map((event) => getEventRegionCity(state, event).region);
        if (regionScope !== "all" && regions.length && !regions.some((region) => isInAdminScope(region, regionScope))) return false;
        if (statusFilter && reseller.status !== statusFilter) return false;
        if (admissionFilter && getResellerAdmissionStatus(reseller) !== admissionFilter) return false;
        if (connectionFilter && getResellerConnectionType(reseller) !== connectionFilter) return false;
        if (!query) return true;
        return [reseller.name, reseller.code, reseller.contactPerson, reseller.responsibleContact, getCoverageLabel(state, connectedEvents)].join(" ").toLowerCase().includes(query);
      })
      .sort((a, b) => {
        const aMetrics = metrics.get(a.code) || { salesTurnover: 0, soldTickets: 0, refunds: 0, redeems: 0, lastOperation: "—" };
        const bMetrics = metrics.get(b.code) || { salesTurnover: 0, soldTickets: 0, refunds: 0, redeems: 0, lastOperation: "—" };
        if (sortBy === "status") return resellerStatusLabel(a.status).localeCompare(resellerStatusLabel(b.status), "ru");
        if (sortBy === "events") return (connectedEventsByCode.get(b.code)?.length || 0) - (connectedEventsByCode.get(a.code)?.length || 0);
        if (sortBy === "sales") return bMetrics.salesTurnover - aMetrics.salesTurnover;
        if (sortBy === "tickets") return bMetrics.soldTickets - aMetrics.soldTickets;
        if (sortBy === "region") return getCoverageLabel(state, connectedEventsByCode.get(a.code) || []).localeCompare(getCoverageLabel(state, connectedEventsByCode.get(b.code) || []), "ru");
        return a.name.localeCompare(b.name, "ru");
      });
  }, [admissionFilter, connectedEventsByCode, connectionFilter, metrics, regionScope, search, sortBy, state, statusFilter]);

  const toggleStatus = (reseller: Reseller) => {
    const nextStatus = reseller.status === "active" ? "disabled" : "active";
    if (setResellerStatus(state, reseller.resellerId, nextStatus)) onUpdate({ ...state });
  };

  const updateAdmission = (reseller: Reseller, admissionStatus: ResellerAdmissionStatus) => {
    const now = new Date().toISOString();
    const patch: Partial<Omit<Reseller, "resellerId">> = {
      admissionStatus,
      applicationComment: admissionStatus === "Авторизован"
        ? "Допуск подтверждён Центром Управления."
        : admissionStatus === "Требует доработки"
          ? "Заявка возвращена на доработку: требуется уточнить интеграцию и ответственное лицо."
          : "Доступ оператора приостановлен решением Центра Управления.",
    };
    if (admissionStatus === "Авторизован") {
      Object.assign(patch, {
        status: "active" as ResellerStatus,
        apiConnected: true,
        contractStatus: "Active" as ResellerContractStatus,
        agreementStatus: "Соглашение подписано" as ResellerAgreementStatus,
        integrationStatus: "Интеграция активна" as ResellerIntegrationStatus,
        admissionDate: now.slice(0, 10),
        lastSync: now,
      });
    }
    if (admissionStatus === "Требует доработки") {
      Object.assign(patch, {
        status: "active" as ResellerStatus,
        apiConnected: false,
        contractStatus: "Draft" as ResellerContractStatus,
        agreementStatus: "Ожидает подписания" as ResellerAgreementStatus,
        integrationStatus: "Ожидает настройки" as ResellerIntegrationStatus,
      });
    }
    if (admissionStatus === "Приостановлен") {
      Object.assign(patch, {
        status: "disabled" as ResellerStatus,
        apiConnected: false,
        contractStatus: "Suspended" as ResellerContractStatus,
        agreementStatus: "Требует обновления" as ResellerAgreementStatus,
        integrationStatus: "Доступ приостановлен" as ResellerIntegrationStatus,
      });
    }
    if (updateReseller(state, reseller.resellerId, patch)) onUpdate({ ...state });
  };

  const updateCommission = (reseller: Reseller, value: number) => {
    if (setResellerCommission(state, reseller.resellerId, value)) onUpdate({ ...state });
  };

  const resetForm = () => setForm({ ...emptyForm });

  const openForm = () => {
    resetForm();
    setFormOpen(true);
  };

  const saveReseller = () => {
    const result = createReseller(state, form);
    if (!result.ok) {
      toast.error(result.reason || "Не удалось добавить оператора.");
      return;
    }
    onUpdate({ ...state });
    setFormOpen(false);
    resetForm();
    toast.success("Оператор добавлен.");
  };

  const drawerMetrics = drawer ? metrics.get(drawer.code) || { salesTurnover: 0, soldTickets: 0, refunds: 0, redeems: 0, lastOperation: "—" } : null;
  const drawerRows = drawer && drawerMetrics ? buildResellerRows(drawer, drawerMetrics) : null;

  return (
    <div className="space-y-5">
      <div
        className="relative overflow-hidden p-5"
        style={{ background: A.glassGradient + ", " + A.cardBg, border: `1px solid ${A.border}`, borderRadius: 16, boxShadow: A.cardShadow }}
      >
        <div className="absolute right-4 top-4">
          <HelpTooltip text="Билетные операторы используют текущий кабинет продаж. Продажа доступна только операторам со статусом допуска «Авторизован»." />
        </div>
        <div className="flex flex-col gap-4 pr-9 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: A.cyan + "18", color: A.cyan }}>
              <Network size={20} />
            </div>
            <div>
              <h2 className="text-base font-semibold" style={{ color: A.textPrimary }}>Реестр билетных операторов</h2>
              <p className="mt-1 max-w-3xl text-sm" style={{ color: A.textSecondary }}>
                Центр Управления контролирует допуск операторов, тип подключения, соглашение и доступ к существующему каналу продаж.
              </p>
            </div>
          </div>
          <div className="inline-flex items-center gap-1">
            <button
              type="button"
              onClick={openForm}
              className="inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold"
              style={{ background: A.statusInfoBg, color: A.statusInfo, border: `1px solid ${A.borderLight}` }}
            >
              <Plus size={16} />
              Добавить оператора
            </button>
            <HelpTooltip text="Добавить нового оператора в существующий реестр локального хранилища." />
          </div>
        </div>
      </div>

      <div className="rounded-xl border px-4 py-3 text-sm" style={{ background: A.statusInfoBg, borderColor: A.borderLight, color: A.textPrimary }}>
        Продажа билетов допускается только через авторизованные каналы, связанные с платформой соглашением.
      </div>

      <div className="flex flex-wrap gap-2 rounded-xl border p-3" style={{ background: A.surfaceBg, borderColor: A.border }}>
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Поиск оператора..." className="h-9 min-w-[220px] rounded-lg px-3 text-sm outline-none" style={{ background: A.cardBg, border: `1px solid ${A.border}`, color: A.textPrimary }} />
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-9 rounded-lg px-3 text-sm outline-none" style={{ background: A.cardBg, border: `1px solid ${A.border}`, color: A.textPrimary }}>
          <option value="">Все статусы</option>
          <option value="active">Активен</option>
          <option value="disabled">Отключён</option>
        </select>
        <select value={admissionFilter} onChange={(event) => setAdmissionFilter(event.target.value)} className="h-9 rounded-lg px-3 text-sm outline-none" style={{ background: A.cardBg, border: `1px solid ${A.border}`, color: A.textPrimary }}>
          <option value="">Все допуски</option>
          {RESELLER_ADMISSION_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
        </select>
        <select value={connectionFilter} onChange={(event) => setConnectionFilter(event.target.value)} className="h-9 rounded-lg px-3 text-sm outline-none" style={{ background: A.cardBg, border: `1px solid ${A.border}`, color: A.textPrimary }}>
          <option value="">Все подключения</option>
          {RESELLER_CONNECTION_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
        </select>
        <select value={sortBy} onChange={(event) => setSortBy(event.target.value as ResellerSort)} className="h-9 rounded-lg px-3 text-sm outline-none" style={{ background: A.cardBg, border: `1px solid ${A.border}`, color: A.textPrimary }}>
          <option value="name">Сортировка: название</option>
          <option value="status">Сортировка: статус</option>
          <option value="events">Сортировка: события</option>
          <option value="sales">Сортировка: оборот</option>
          <option value="tickets">Сортировка: билеты</option>
          <option value="region">Сортировка: регион</option>
        </select>
      </div>

      <div style={{ background: A.cardBg, border: `1px solid ${A.border}`, borderRadius: 16, boxShadow: A.cardShadow }} className="overflow-hidden">
        {visibleResellers.length === 0 ? (
          <div className="flex flex-col items-center py-12">
            <Store size={28} style={{ color: A.textMuted }} className="mb-2" />
            <p style={{ color: A.textMuted }} className="text-sm">Операторы не настроены</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1520px] text-sm">
              <thead>
                <tr style={{ background: A.tableHeaderBg }}>
                  {["Оператор", "Код", "Допуск", "Тип подключения", "Соглашение", "Интеграция", "Контакт", "Регион покрытия", "События", "Статус", "API", "Договор", "Комиссия", "Оборот продаж", "Продано билетов", "Последняя операция", "Действия"].map((header) => (
                    <th key={header} className="px-4 py-3 text-left text-xs font-medium" style={{ color: A.textSecondary, borderBottom: `1px solid ${A.border}` }}>
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleResellers.map((reseller) => {
                  const row = metrics.get(reseller.code) || { salesTurnover: 0, soldTickets: 0, refunds: 0, redeems: 0, lastOperation: "—" };
                  const admissionStatus = getResellerAdmissionStatus(reseller);
                  const connectionType = getResellerConnectionType(reseller);
                  const agreementStatus = getResellerAgreementStatus(reseller);
                  const integrationStatus = getResellerIntegrationStatus(reseller);
                  const connectedEvents = connectedEventsByCode.get(reseller.code) || [];
                  return (
                    <tr
                      key={reseller.resellerId}
                      className="cursor-pointer transition-colors"
                      style={{ borderBottom: `1px solid ${A.border}` }}
                      onClick={() => setDrawer(reseller)}
                      onMouseEnter={(event) => (event.currentTarget.style.background = A.rowHover)}
                      onMouseLeave={(event) => (event.currentTarget.style.background = "transparent")}
                    >
                      <td className="px-4 py-3 font-medium" style={{ color: A.textPrimary }}>{reseller.name}</td>
                      <td className="px-4 py-3 font-mono text-xs" style={{ color: A.cyan }}>{reseller.code}</td>
                      <td className="px-4 py-3"><TextBadge value={admissionStatus} tone={admissionTone(admissionStatus)} /></td>
                      <td className="px-4 py-3" style={{ color: A.textSecondary }}>{connectionType}</td>
                      <td className="px-4 py-3"><TextBadge value={agreementStatus} tone={agreementTone(agreementStatus)} /></td>
                      <td className="px-4 py-3"><TextBadge value={integrationStatus} tone={integrationTone(integrationStatus)} /></td>
                      <td className="px-4 py-3" style={{ color: A.textSecondary }}>{reseller.responsibleContact || reseller.contactPerson || "—"}</td>
                      <td className="px-4 py-3" style={{ color: A.textSecondary }}>{getCoverageLabel(state, connectedEvents)}</td>
                      <td className="px-4 py-3" style={{ color: A.textSecondary }}>
                        {connectedEvents.length ? `${connectedEvents.length} · ${connectedEvents.slice(0, 2).map((event) => event.title).join(", ")}` : "—"}
                      </td>
                      <td className="px-4 py-3"><StatusBadge active={reseller.status === "active"} /></td>
                      <td className="px-4 py-3" style={{ color: reseller.apiConnected ? A.statusOk : A.statusError }}>{reseller.apiConnected ? "Да" : "Нет"}</td>
                      <td className="px-4 py-3"><ContractBadge status={reseller.contractStatus} /></td>
                      <td className="px-4 py-3" onClick={(event) => event.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            step={0.1}
                            value={reseller.commissionPercent}
                            onChange={(event) => updateCommission(reseller, Number(event.target.value))}
                            className="h-8 w-20 rounded-lg px-2 text-sm outline-none"
                            style={{ background: A.surfaceBg, border: `1px solid ${A.border}`, color: A.textPrimary }}
                          />
                          <span style={{ color: A.textSecondary }}>%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-semibold" style={{ color: A.statusOk }}>{formatMoney(row.salesTurnover)}</td>
                      <td className="px-4 py-3" style={{ color: A.textPrimary }}>{row.soldTickets.toLocaleString("ru-RU")}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: A.textMuted }}>{formatDateTime(row.lastOperation)}</td>
                      <td className="px-4 py-3" onClick={(event) => event.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => toggleStatus(reseller)}
                          className="h-8 rounded-lg px-3 text-xs font-semibold transition-colors"
                          style={{
                            background: reseller.status === "active" ? A.statusErrorBg : A.statusOkBg,
                            color: reseller.status === "active" ? A.statusError : A.statusOk,
                          }}
                        >
                          {reseller.status === "active" ? "Отключить" : "Включить"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {drawer && drawerRows && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setDrawer(null)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            className="relative h-full w-full max-w-xl overflow-y-auto"
            style={{ background: A.glassGradient + ", " + A.sidebarBg, borderLeft: `1px solid ${A.borderGlass}` }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between p-5" style={{ background: A.topbarBg, backdropFilter: "blur(16px)", borderBottom: `1px solid ${A.border}` }}>
              <div>
                <h3 className="text-base font-semibold" style={{ color: A.textPrimary }}>{drawer.name}</h3>
                <div className="mt-1 font-mono text-xs" style={{ color: A.textMuted }}>{drawer.code}</div>
              </div>
              <button type="button" onClick={() => setDrawer(null)} style={{ color: A.textMuted }}><X size={18} /></button>
            </div>
            <div className="space-y-4 p-5">
              <DetailBlock title="Допуск оператора" rows={drawerRows.admission} />
              <DetailBlock title="Регистрационные данные" rows={drawerRows.registration} />
              <DetailBlock title="Договор" rows={drawerRows.contract} />
              <DetailBlock title="API-настройки" rows={drawerRows.api} />
              <DetailBlock title="Движение" rows={drawerRows.movement} />
            </div>
          </div>
        </div>
      )}

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setFormOpen(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-3xl rounded-2xl p-5"
            style={{ background: A.glassGradient + ", " + A.cardBg, border: `1px solid ${A.borderGlass}`, boxShadow: A.cardShadow }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold" style={{ color: A.textPrimary }}>Добавить оператора</h3>
                <p className="mt-1 text-xs" style={{ color: A.textSecondary }}>Новый партнёр сохраняется в локальном хранилище и сразу появляется в таблице.</p>
              </div>
              <button type="button" onClick={() => setFormOpen(false)} style={{ color: A.textMuted }}><X size={18} /></button>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <FormInput label="Название оператора" value={form.name} onChange={(value) => setForm((prev) => ({ ...prev, name: value }))} />
              <FormInput label="Код канала" value={form.code} onChange={(value) => setForm((prev) => ({ ...prev, code: value }))} />
              <FormInput label="Комиссия %" type="number" value={String(form.commissionPercent)} onChange={(value) => setForm((prev) => ({ ...prev, commissionPercent: Number(value) }))} />
              <label className="flex h-10 items-center gap-2 rounded-lg px-3 text-sm" style={{ background: A.surfaceBg, border: `1px solid ${A.border}`, color: A.textPrimary }}>
                <input type="checkbox" checked={form.apiConnected} onChange={(event) => setForm((prev) => ({ ...prev, apiConnected: event.target.checked }))} />
                API подключён
              </label>
              <FormSelect label="Статус договора" value={form.contractStatus} options={["Active", "Suspended", "Draft"]} onChange={(value) => setForm((prev) => ({ ...prev, contractStatus: value as ResellerContractStatus }))} />
              <FormSelect label="Статус" value={form.status} options={["active", "disabled"]} onChange={(value) => setForm((prev) => ({ ...prev, status: value as ResellerStatus }))} />
              <FormSelect label="Статус допуска" value={form.admissionStatus} options={RESELLER_ADMISSION_STATUSES} onChange={(value) => setForm((prev) => ({ ...prev, admissionStatus: value as ResellerAdmissionStatus }))} />
              <FormSelect label="Тип подключения" value={form.connectionType} options={RESELLER_CONNECTION_TYPES} onChange={(value) => setForm((prev) => ({ ...prev, connectionType: value as ResellerConnectionType }))} />
              <FormSelect label="Статус соглашения" value={form.agreementStatus} options={RESELLER_AGREEMENT_STATUSES} onChange={(value) => setForm((prev) => ({ ...prev, agreementStatus: value as ResellerAgreementStatus }))} />
              <FormSelect label="Интеграция" value={form.integrationStatus} options={["Интеграция активна", "Ожидает настройки", "Доступ приостановлен"]} onChange={(value) => setForm((prev) => ({ ...prev, integrationStatus: value as ResellerIntegrationStatus }))} />
              <FormInput label="Контактное лицо" value={form.contactPerson} onChange={(value) => setForm((prev) => ({ ...prev, contactPerson: value }))} />
              <FormInput label="Email" value={form.email} onChange={(value) => setForm((prev) => ({ ...prev, email: value }))} />
              <FormInput label="Телефон" value={form.phone} onChange={(value) => setForm((prev) => ({ ...prev, phone: value }))} />
              <FormInput label="УНП / регистрационный номер" value={form.registrationNumber} onChange={(value) => setForm((prev) => ({ ...prev, registrationNumber: value }))} />
              <div className="md:col-span-2">
                <FormInput label="Юридический адрес" value={form.legalAddress} onChange={(value) => setForm((prev) => ({ ...prev, legalAddress: value }))} />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button type="button" onClick={() => setFormOpen(false)} className="h-10 rounded-lg px-4 text-sm" style={{ border: `1px solid ${A.borderLight}`, color: A.textPrimary }}>
                Отмена
              </button>
              <button type="button" onClick={saveReseller} className="h-10 rounded-lg px-4 text-sm font-semibold" style={{ background: A.statusOk, color: "#04110B" }}>
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function AdminResellerApplications({ state, onUpdate, regionScope = "all" }: Props) {
  const [statusFilter, setStatusFilter] = useState("");
  const connectedEventsByCode = useMemo(() => {
    const map = new Map<string, EventRecord[]>();
    state.resellers.forEach((reseller) => map.set(reseller.code, []));
    state.events.forEach((event) => {
      (event.salesChannels || []).forEach((code) => {
        const list = map.get(code);
        if (list) list.push(event);
      });
    });
    return map;
  }, [state.events, state.resellers]);

  const rows = useMemo(() => state.resellers
    .filter((reseller) => {
      const admissionStatus = getResellerAdmissionStatus(reseller);
      if (statusFilter && admissionStatus !== statusFilter) return false;
      const regions = (connectedEventsByCode.get(reseller.code) || []).map((event) => getEventRegionCity(state, event).region);
      return regionScope === "all" || !regions.length || regions.some((region) => isInAdminScope(region, regionScope));
    })
    .sort((a, b) => (a.applicationDate || "").localeCompare(b.applicationDate || "") || a.name.localeCompare(b.name, "ru")), [connectedEventsByCode, regionScope, state, statusFilter]);

  const updateAdmission = (reseller: Reseller, admissionStatus: ResellerAdmissionStatus) => {
    const now = new Date().toISOString();
    const patch: Partial<Omit<Reseller, "resellerId">> = {
      admissionStatus,
      applicationComment: admissionStatus === "Авторизован"
        ? "Допуск подтверждён Центром Управления."
        : admissionStatus === "Требует доработки"
          ? "Заявка возвращена на доработку: требуется уточнить интеграцию и ответственное лицо."
          : "Доступ оператора приостановлен решением Центра Управления.",
    };
    if (admissionStatus === "Авторизован") {
      Object.assign(patch, {
        status: "active" as ResellerStatus,
        apiConnected: true,
        contractStatus: "Active" as ResellerContractStatus,
        agreementStatus: "Соглашение подписано" as ResellerAgreementStatus,
        integrationStatus: "Интеграция активна" as ResellerIntegrationStatus,
        admissionDate: now.slice(0, 10),
        lastSync: now,
      });
    }
    if (admissionStatus === "Требует доработки") {
      Object.assign(patch, {
        status: "active" as ResellerStatus,
        apiConnected: false,
        contractStatus: "Draft" as ResellerContractStatus,
        agreementStatus: "Ожидает подписания" as ResellerAgreementStatus,
        integrationStatus: "Ожидает настройки" as ResellerIntegrationStatus,
      });
    }
    if (admissionStatus === "Приостановлен") {
      Object.assign(patch, {
        status: "disabled" as ResellerStatus,
        apiConnected: false,
        contractStatus: "Suspended" as ResellerContractStatus,
        agreementStatus: "Требует обновления" as ResellerAgreementStatus,
        integrationStatus: "Доступ приостановлен" as ResellerIntegrationStatus,
      });
    }
    if (updateReseller(state, reseller.resellerId, patch)) onUpdate({ ...state });
  };

  return (
    <section className="relative overflow-hidden p-5" style={{ background: A.glassGradient + ", " + A.cardBg, border: `1px solid ${A.border}`, borderRadius: 16, boxShadow: A.cardShadow }}>
      <div className="absolute right-4 top-4">
        <HelpTooltip text="Демонстрационный контроль заявок операторов без отдельного onboarding wizard и без реального документооборота." />
      </div>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3 pr-9">
        <div>
          <h3 className="text-sm font-semibold" style={{ color: A.textPrimary }}>Заявки на подключение операторов</h3>
          <p className="mt-1 text-xs" style={{ color: A.textSecondary }}>
            Действия меняют демонстрационные статусы допуска и сразу влияют на доступность канала для организатора и кабинета продаж.
          </p>
        </div>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-9 rounded-lg px-3 text-sm outline-none" style={{ background: A.surfaceBg, border: `1px solid ${A.border}`, color: A.textPrimary }}>
          <option value="">Все статусы</option>
          {RESELLER_ADMISSION_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
        </select>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1260px] text-sm">
          <thead>
            <tr style={{ background: A.tableHeaderBg }}>
              {["Оператор", "Дата заявки", "Тип подключения", "Регион покрытия", "Статус заявки", "Контакт", "Комментарий", "Действия"].map((header) => (
                <th key={header} className="px-4 py-3 text-left text-xs font-medium" style={{ color: A.textSecondary, borderBottom: `1px solid ${A.border}` }}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((reseller) => {
              const admissionStatus = getResellerAdmissionStatus(reseller);
              const connectionType = getResellerConnectionType(reseller);
              const connectedEvents = connectedEventsByCode.get(reseller.code) || [];
              return (
                <tr key={`application-${reseller.resellerId}`} style={{ borderBottom: `1px solid ${A.border}` }}>
                  <td className="px-4 py-3 font-medium" style={{ color: A.textPrimary }}>{reseller.name}</td>
                  <td className="px-4 py-3" style={{ color: A.textSecondary }}>{reseller.applicationDate || "—"}</td>
                  <td className="px-4 py-3" style={{ color: A.textSecondary }}>{connectionType}</td>
                  <td className="px-4 py-3" style={{ color: A.textSecondary }}>{getCoverageLabel(state, connectedEvents)}</td>
                  <td className="px-4 py-3"><TextBadge value={admissionStatus} tone={admissionTone(admissionStatus)} /></td>
                  <td className="px-4 py-3" style={{ color: A.textSecondary }}>{reseller.responsibleContact || reseller.contactPerson || "—"}</td>
                  <td className="px-4 py-3" style={{ color: A.textSecondary }}>{reseller.applicationComment || "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <button type="button" onClick={() => updateAdmission(reseller, "Авторизован")} className="h-8 rounded-lg px-3 text-xs font-semibold" style={{ background: A.statusOkBg, color: A.statusOk }}>
                        Одобрить
                      </button>
                      <button type="button" onClick={() => updateAdmission(reseller, "Требует доработки")} className="h-8 rounded-lg px-3 text-xs font-semibold" style={{ background: A.statusWarnBg, color: A.statusWarn }}>
                        Вернуть на доработку
                      </button>
                      <button type="button" onClick={() => updateAdmission(reseller, "Приостановлен")} className="h-8 rounded-lg px-3 text-xs font-semibold" style={{ background: A.statusErrorBg, color: A.statusError }}>
                        Приостановить
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-sm" style={{ color: A.textMuted }}>Заявок операторов с выбранными параметрами нет.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function FormInput({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <label className="block text-xs" style={{ color: A.textSecondary }}>
      <span className="mb-1 block">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-lg px-3 text-sm outline-none"
        style={{ background: A.surfaceBg, border: `1px solid ${A.border}`, color: A.textPrimary }}
      />
    </label>
  );
}

function formOptionLabel(option: string): string {
  if (option === "Active") return "Активен";
  if (option === "Suspended") return "Приостановлен";
  if (option === "Draft") return "Черновик";
  if (option === "active") return "Активен";
  if (option === "disabled") return "Отключён";
  return option;
}

function FormSelect({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <label className="block text-xs" style={{ color: A.textSecondary }}>
      <span className="mb-1 block">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-lg px-3 text-sm outline-none"
        style={{ background: A.surfaceBg, border: `1px solid ${A.border}`, color: A.textPrimary }}
      >
        {options.map((option) => (
          <option key={option} value={option}>{formOptionLabel(option)}</option>
        ))}
      </select>
    </label>
  );
}
