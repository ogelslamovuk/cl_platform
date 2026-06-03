import React, { useState, useMemo } from "react";
import type { AppState } from "@/lib/store";
import { A, opResultChip } from "./adminStyles";
import { Activity, Search } from "lucide-react";
import HelpTooltip from "@/components/ui/help-tooltip";

interface Props { state: AppState; }

const opTypeLabel: Record<string, string> = { sell: "Продажа", refund: "Возврат", redeem: "Погашение", verify: "Проверка" };
function isSyntheticNoTicketError(reason?: string): boolean {
  return /нет доступных билетов/i.test(reason || "");
}

export default function AdminOperations({ state }: Props) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [resultFilter, setResultFilter] = useState("");

  const filtered = useMemo(() => {
    return state.ops.filter(o => {
      if (o.type === "sell" && o.result === "error" && isSyntheticNoTicketError(o.reason)) return false;
      if (typeFilter && o.type !== typeFilter) return false;
      if (resultFilter && o.result !== resultFilter) return false;
      if (search) {
        const s = search.toLowerCase();
        return o.opId.toLowerCase().includes(s) || (o.ticketId || '').toLowerCase().includes(s) || o.eventId.toLowerCase().includes(s);
      }
      return true;
    });
  }, [state.ops, typeFilter, resultFilter, search]);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={14} style={{ color: A.textMuted }} className="absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск по op_id, TicketID..."
            className="w-full h-9 pl-9 pr-3 rounded-lg text-sm outline-none"
            style={{ background: A.surfaceBg, border: `1px solid ${A.border}`, color: A.textPrimary }} />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="h-9 px-3 rounded-lg text-sm outline-none cursor-pointer"
          style={{ background: A.surfaceBg, border: `1px solid ${A.border}`, color: A.textPrimary }}>
          <option value="">Все типы</option>
          {["sell", "refund", "redeem", "verify"].map(t => <option key={t} value={t}>{opTypeLabel[t]}</option>)}
        </select>
        <select value={resultFilter} onChange={e => setResultFilter(e.target.value)}
          className="h-9 px-3 rounded-lg text-sm outline-none cursor-pointer"
          style={{ background: A.surfaceBg, border: `1px solid ${A.border}`, color: A.textPrimary }}>
          <option value="">Все результаты</option>
          <option value="ok">OK</option>
          <option value="error">Ошибка</option>
        </select>
        <HelpTooltip text="Комбинируйте тип и результат операции, чтобы локализовать проблемные транзакции." />
      </div>

      <div style={{ background: A.cardBg, border: `1px solid ${A.border}`, borderRadius: 16, boxShadow: A.cardShadow }} className="overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center py-12">
            <Activity size={28} style={{ color: A.textMuted }} className="mb-2" />
            <p style={{ color: A.textMuted }} className="text-sm">Нет операций</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: A.tableHeaderBg }}>
                  {["Время", "op_id", "Тип", "TicketID", "EventID", "Канал", "Результат", "Причина"].map((h, i) => (
                    <th key={i} className="text-left py-3 px-4 font-medium text-xs" style={{ color: A.textSecondary, borderBottom: `1px solid ${A.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...filtered].reverse().map(o => {
                  const chip = opResultChip(o.result);
                  return (
                    <tr key={o.opId} className="transition-colors"
                      style={{ borderBottom: `1px solid ${A.border}` }}
                      onMouseEnter={e => (e.currentTarget.style.background = A.rowHover)}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <td className="py-3 px-4 text-xs" style={{ color: A.textMuted }}>{o.ts?.replace("T", " ").slice(0, 19)}</td>
                      <td className="py-3 px-4 font-mono text-xs" style={{ color: A.cyan }}>{o.opId}</td>
                      <td className="py-3 px-4" style={{ color: A.textPrimary }}>{opTypeLabel[o.type] || o.type}</td>
                      <td className="py-3 px-4 font-mono text-xs" style={{ color: A.textSecondary }}>{o.ticketId || "—"}</td>
                      <td className="py-3 px-4 font-mono text-xs" style={{ color: A.textSecondary }}>{o.eventId || "—"}</td>
                      <td className="py-3 px-4" style={{ color: A.textSecondary }}>{o.channel}</td>
                      <td className="py-3 px-4">
                        <span style={{ background: chip.bg, color: chip.color, borderRadius: 999 }} className="text-xs px-2.5 py-0.5 font-medium">
                          {o.result === "ok" ? "OK" : "ОТКАЗ"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs" style={{ color: A.textMuted }}>{o.reason || "—"}</td>
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
