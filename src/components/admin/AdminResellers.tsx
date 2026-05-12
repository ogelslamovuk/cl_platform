import React, { useMemo, useState } from "react";
import type { AppState, EventRecord, Reseller, ResellerContractStatus, ResellerStatus, Ticket } from "@/lib/store";
import { createReseller, setResellerCommission, setResellerStatus } from "@/lib/store";
import { A, statusChip } from "./adminStyles";
import { Network, Plus, Store, X } from "lucide-react";
import HelpTooltip from "@/components/ui/help-tooltip";
import { toast } from "sonner";

interface Props {
  state: AppState;
  onUpdate: (s: AppState) => void;
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
  contactPerson: string;
  email: string;
  phone: string;
  legalAddress: string;
  registrationNumber: string;
};

const emptyForm: ResellerFormState = {
  name: "",
  code: "",
  commissionPercent: 8,
  apiConnected: true,
  contractStatus: "Active",
  status: "active",
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

function ContractBadge({ status }: { status: Reseller["contractStatus"] }) {
  const chip = status === "Active" ? statusChip("ok") : status === "Suspended" ? statusChip("error") : statusChip("warn");
  return (
    <span className="rounded-full px-2.5 py-1 text-xs font-medium" style={{ background: chip.bg, color: chip.color }}>
      {status}
    </span>
  );
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
  const contractNumber = reseller.contractNumber || `TH-${codePart}-MOCK`;
  const endpoint = reseller.apiEndpoint || `https://sandbox.api.${reseller.code.toLowerCase()}.example/v2/tickethub`;
  const webhook = reseller.webhookEndpoint || `https://sandbox.${reseller.code.toLowerCase()}.example/webhooks/tickethub`;
  const sync = reseller.lastSync || metrics.lastOperation || reseller.updatedAt;

  return {
    registration: [
      ["Полное наименование", reseller.fullName || `ООО «${reseller.name}»`],
      ["УНП / рег. номер", reseller.registrationNumber || String(190000000 + (hashCode(reseller.code) % 9000000))],
      ["Юридический адрес", reseller.legalAddress || "220000, г. Минск, demo-адрес партнёра"],
      ["Контактное лицо", reseller.contactPerson || "Demo Partner Manager"],
      ["Email", reseller.email || `partner@${reseller.code.toLowerCase()}.example`],
      ["Телефон", reseller.phone || "+375 (29) 000-00-00"],
    ],
    contract: [
      ["Статус договора", reseller.contractStatus],
      ["Номер договора", contractNumber],
      ["Дата договора", contractDate],
      ["Комиссия", `${reseller.commissionPercent}%`],
    ],
    api: [
      ["API подключён", reseller.apiConnected ? "Да" : "Нет"],
      ["Environment", "Sandbox"],
      ["API version", "v2.1"],
      ["Endpoint", endpoint],
      ["Webhook endpoint", webhook],
      ["Signature validation", reseller.signatureValidation === false ? "Отключена" : "Включена"],
      ["Last sync", formatDateTime(sync)],
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

export default function AdminResellers({ state, onUpdate }: Props) {
  const metrics = useMemo(() => buildMetrics(state), [state]);
  const [drawer, setDrawer] = useState<Reseller | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<ResellerFormState>(emptyForm);

  const toggleStatus = (reseller: Reseller) => {
    const nextStatus = reseller.status === "active" ? "disabled" : "active";
    if (setResellerStatus(state, reseller.resellerId, nextStatus)) onUpdate({ ...state });
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
      toast.error(result.reason || "Не удалось добавить реселлера.");
      return;
    }
    onUpdate({ ...state });
    setFormOpen(false);
    resetForm();
    toast.success("Реселлер добавлен.");
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
          <HelpTooltip text="Реселлеры используют demo API Sandbox. Отключённый реселлер не может выполнить продажу на странице канала." />
        </div>
        <div className="flex flex-col gap-4 pr-9 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: A.cyan + "18", color: A.cyan }}>
              <Network size={20} />
            </div>
            <div>
              <h2 className="text-base font-semibold" style={{ color: A.textPrimary }}>Реселлеры</h2>
              <p className="mt-1 max-w-3xl text-sm" style={{ color: A.textSecondary }}>
                Управление demo-партнёрами продаж: статус, API-подключение, договор и комиссия, которая используется в отчётах.
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
              Добавить реселлера
            </button>
            <HelpTooltip text="Добавить нового demo-реселлера в localStorage." />
          </div>
        </div>
      </div>

      <div style={{ background: A.cardBg, border: `1px solid ${A.border}`, borderRadius: 16, boxShadow: A.cardShadow }} className="overflow-hidden">
        {state.resellers.length === 0 ? (
          <div className="flex flex-col items-center py-12">
            <Store size={28} style={{ color: A.textMuted }} className="mb-2" />
            <p style={{ color: A.textMuted }} className="text-sm">Реселлеры не настроены</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1120px] text-sm">
              <thead>
                <tr style={{ background: A.tableHeaderBg }}>
                  {["Реселлер", "Код", "Статус", "API", "Договор", "Комиссия", "Оборот продаж", "Продано билетов", "Последняя операция", "Действия"].map((header) => (
                    <th key={header} className="px-4 py-3 text-left text-xs font-medium" style={{ color: A.textSecondary, borderBottom: `1px solid ${A.border}` }}>
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {state.resellers.map((reseller) => {
                  const row = metrics.get(reseller.code) || { salesTurnover: 0, soldTickets: 0, refunds: 0, redeems: 0, lastOperation: "—" };
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
                <h3 className="text-base font-semibold" style={{ color: A.textPrimary }}>Добавить реселлера</h3>
                <p className="mt-1 text-xs" style={{ color: A.textSecondary }}>Новый партнёр сохраняется в localStorage и сразу появляется в таблице.</p>
              </div>
              <button type="button" onClick={() => setFormOpen(false)} style={{ color: A.textMuted }}><X size={18} /></button>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <FormInput label="Название реселлера" value={form.name} onChange={(value) => setForm((prev) => ({ ...prev, name: value }))} />
              <FormInput label="Код канала" value={form.code} onChange={(value) => setForm((prev) => ({ ...prev, code: value }))} />
              <FormInput label="Комиссия %" type="number" value={String(form.commissionPercent)} onChange={(value) => setForm((prev) => ({ ...prev, commissionPercent: Number(value) }))} />
              <label className="flex h-10 items-center gap-2 rounded-lg px-3 text-sm" style={{ background: A.surfaceBg, border: `1px solid ${A.border}`, color: A.textPrimary }}>
                <input type="checkbox" checked={form.apiConnected} onChange={(event) => setForm((prev) => ({ ...prev, apiConnected: event.target.checked }))} />
                API подключён
              </label>
              <FormSelect label="Статус договора" value={form.contractStatus} options={["Active", "Suspended", "Draft"]} onChange={(value) => setForm((prev) => ({ ...prev, contractStatus: value as ResellerContractStatus }))} />
              <FormSelect label="Статус" value={form.status} options={["active", "disabled"]} onChange={(value) => setForm((prev) => ({ ...prev, status: value as ResellerStatus }))} />
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
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}
