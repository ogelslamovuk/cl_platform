import React, { useMemo } from "react";
import type { AppState, EventRecord, Reseller, Ticket } from "@/lib/store";
import { setResellerCommission, setResellerStatus } from "@/lib/store";
import { A, statusChip } from "./adminStyles";
import { Network, Store } from "lucide-react";
import HelpTooltip from "@/components/ui/help-tooltip";

interface Props {
  state: AppState;
  onUpdate: (s: AppState) => void;
}

type ResellerMetrics = {
  salesTurnover: number;
  soldTickets: number;
  lastOperation: string;
};

function formatMoney(value: number): string {
  return `${Math.round(value).toLocaleString("ru-RU")} BYN`;
}

function formatDateTime(value?: string): string {
  if (!value) return "—";
  return value.replace("T", " ").slice(0, 16);
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
    const row = { salesTurnover: 0, soldTickets: 0, lastOperation: "—" };
    metrics.set(code, row);
    return row;
  };

  state.resellers.forEach((reseller) => ensure(reseller.code));

  state.tickets.forEach((ticket) => {
    if (!ticket.soldByChannel || ticket.status === "issued") return;
    const row = ensure(ticket.soldByChannel);
    row.soldTickets += 1;
    row.salesTurnover += getTicketPrice(ticket, eventById.get(ticket.eventId));
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

export default function AdminResellers({ state, onUpdate }: Props) {
  const metrics = useMemo(() => buildMetrics(state), [state]);

  const toggleStatus = (reseller: Reseller) => {
    const nextStatus = reseller.status === "active" ? "disabled" : "active";
    if (setResellerStatus(state, reseller.resellerId, nextStatus)) onUpdate({ ...state });
  };

  const updateCommission = (reseller: Reseller, value: number) => {
    if (setResellerCommission(state, reseller.resellerId, value)) onUpdate({ ...state });
  };

  return (
    <div className="space-y-5">
      <div
        className="relative overflow-hidden p-5"
        style={{ background: A.glassGradient + ", " + A.cardBg, border: `1px solid ${A.border}`, borderRadius: 16, boxShadow: A.cardShadow }}
      >
        <div className="absolute right-4 top-4">
          <HelpTooltip text="Реселлеры используют demo API Sandbox. Отключённый реселлер не может выполнить продажу на странице канала." />
        </div>
        <div className="flex items-start gap-3 pr-9">
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
                  const row = metrics.get(reseller.code) || { salesTurnover: 0, soldTickets: 0, lastOperation: "—" };
                  return (
                    <tr key={reseller.resellerId} className="transition-colors" style={{ borderBottom: `1px solid ${A.border}` }}>
                      <td className="px-4 py-3 font-medium" style={{ color: A.textPrimary }}>{reseller.name}</td>
                      <td className="px-4 py-3 font-mono text-xs" style={{ color: A.cyan }}>{reseller.code}</td>
                      <td className="px-4 py-3"><StatusBadge active={reseller.status === "active"} /></td>
                      <td className="px-4 py-3" style={{ color: reseller.apiConnected ? A.statusOk : A.statusError }}>{reseller.apiConnected ? "Да" : "Нет"}</td>
                      <td className="px-4 py-3"><ContractBadge status={reseller.contractStatus} /></td>
                      <td className="px-4 py-3">
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
                      <td className="px-4 py-3">
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
    </div>
  );
}
