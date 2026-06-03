import React, { useMemo, useState } from "react";
import type { AppState } from "@/lib/store";
import { A, statusChip } from "./adminStyles";
import { BookOpen } from "lucide-react";
import HelpTooltip from "@/components/ui/help-tooltip";
import { getRegionFilterOptions, isInAdminScope, normalizeRegion, resolveRegionCity, type AdminRegionScope } from "./adminScope";

interface Decision {
  ts: string;
  objectType: string;
  objectId: string;
  decision: string;
  actor: string;
  comment: string;
  region: string;
}

interface Props { state: AppState; regionScope?: AdminRegionScope; }

function CardHelp({ text }: { text: string }) {
  return (
    <div className="absolute right-4 top-4 z-10">
      <HelpTooltip text={text} />
    </div>
  );
}

export default function AdminDecisionLog({ state, regionScope = "all" }: Props) {
  const [typeFilter, setTypeFilter] = useState("");
  const [decisionFilter, setDecisionFilter] = useState("");
  const [regionFilter, setRegionFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [objectSearch, setObjectSearch] = useState("");
  const [actorFilter, setActorFilter] = useState("");
  const decisions = useMemo<Decision[]>(() => {
    const result: Decision[] = [];
    state.organizerApplications.forEach((application) => {
      if (!application.reviewedAt || !["approved", "rejected", "needs_rework"].includes(application.status)) return;
      result.push({
        ts: application.reviewedAt,
        objectType: "Организатор",
        objectId: application.organizerApplicationId,
        decision: application.status === "approved" ? "Одобрено" : application.status === "rejected" ? "Отклонено" : "На доработке",
        actor: "Оператор Центра Управления",
        comment: application.adminComment || "—",
        region: normalizeRegion(application.data.region),
      });
    });
    state.eventComplianceApplications.forEach((application) => {
      if (!application.reviewedAt || !["approved", "rejected", "needs_rework"].includes(application.status)) return;
      const regionCity = resolveRegionCity(state, { venueId: application.data.venueId, venueName: application.data.venueName, venueAddress: application.data.venueAddress });
      result.push({
        ts: application.reviewedAt,
        objectType: "Мероприятие",
        objectId: application.eventComplianceApplicationId,
        decision: application.status === "approved" ? "Одобрено" : application.status === "rejected" ? "Отклонено" : "На доработке",
        actor: "Оператор Центра Управления",
        comment: application.adminComment || "—",
        region: regionCity.region,
      });
    });
    state.applications.forEach((application) => {
      if (application.status === "approved") {
        result.push({
          ts: application.updatedAt,
          objectType: "Мероприятие",
          objectId: application.appId,
          decision: "Одобрено",
          actor: "Оператор Центра Управления",
          comment: "Legacy-заявка: УНП проверен, пошлина оплачена",
          region: resolveRegionCity(state, { city: application.city, venueName: application.venue }).region,
        });
      }
      if (application.status === "rejected") {
        result.push({
          ts: application.updatedAt,
          objectType: "Мероприятие",
          objectId: application.appId,
          decision: "Отклонено",
          actor: "Оператор Центра Управления",
          comment: "Legacy-заявка: ручное решение",
          region: resolveRegionCity(state, { city: application.city, venueName: application.venue }).region,
        });
      }
    });
    return result.sort((a, b) => b.ts.localeCompare(a.ts));
  }, [state]);
  const regionOptions = useMemo(() => getRegionFilterOptions(state), [state]);
  const filteredDecisions = useMemo(() => {
    const query = objectSearch.trim().toLowerCase();
    return decisions.filter((decision) => {
      if (!isInAdminScope(decision.region, regionScope)) return false;
      if (typeFilter && decision.objectType !== typeFilter) return false;
      if (decisionFilter && decision.decision !== decisionFilter) return false;
      if (regionFilter && decision.region !== regionFilter) return false;
      if (dateFilter && !decision.ts.startsWith(dateFilter)) return false;
      if (actorFilter && decision.actor !== actorFilter) return false;
      if (!query) return true;
      return [decision.objectId, decision.comment, decision.objectType].join(" ").toLowerCase().includes(query);
    });
  }, [actorFilter, dateFilter, decisionFilter, decisions, objectSearch, regionFilter, regionScope, typeFilter]);

  const decisionChip = (d: string) => {
    if (d === "Одобрено") return statusChip('ok');
    if (d === "Отклонено") return statusChip('error');
    if (d === "На доработке") return statusChip('warn');
    return statusChip('neutral');
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2 rounded-xl border p-3" style={{ background: A.surfaceBg, borderColor: A.border }}>
        <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className="h-9 rounded-lg px-3 text-sm outline-none" style={{ background: A.cardBg, border: `1px solid ${A.border}`, color: A.textPrimary }}>
          <option value="">Все типы</option>
          <option value="Организатор">Организатор</option>
          <option value="Мероприятие">Мероприятие</option>
        </select>
        <select value={decisionFilter} onChange={(event) => setDecisionFilter(event.target.value)} className="h-9 rounded-lg px-3 text-sm outline-none" style={{ background: A.cardBg, border: `1px solid ${A.border}`, color: A.textPrimary }}>
          <option value="">Все решения</option>
          <option value="Одобрено">Одобрено</option>
          <option value="Отклонено">Отклонено</option>
          <option value="На доработке">На доработке</option>
        </select>
        <select value={regionFilter} onChange={(event) => setRegionFilter(event.target.value)} className="h-9 rounded-lg px-3 text-sm outline-none" style={{ background: A.cardBg, border: `1px solid ${A.border}`, color: A.textPrimary }}>
          <option value="">Все регионы</option>
          {regionOptions.map((region) => <option key={region} value={region}>{region}</option>)}
        </select>
        <input type="date" value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} className="h-9 rounded-lg px-3 text-sm outline-none" style={{ background: A.cardBg, border: `1px solid ${A.border}`, color: A.textPrimary }} />
        <input value={objectSearch} onChange={(event) => setObjectSearch(event.target.value)} placeholder="Объект / комментарий" className="h-9 min-w-[220px] rounded-lg px-3 text-sm outline-none" style={{ background: A.cardBg, border: `1px solid ${A.border}`, color: A.textPrimary }} />
        <select value={actorFilter} onChange={(event) => setActorFilter(event.target.value)} className="h-9 rounded-lg px-3 text-sm outline-none" style={{ background: A.cardBg, border: `1px solid ${A.border}`, color: A.textPrimary }}>
          <option value="">Все ответственные</option>
          <option value="Оператор Центра Управления">Оператор Центра Управления</option>
        </select>
      </div>
      <div style={{ background: A.cardBg, border: `1px solid ${A.border}`, borderRadius: 16, boxShadow: A.cardShadow }} className="relative overflow-hidden">
        <CardHelp text="Журнал решений фиксирует действия по заявкам и событиям: одобрения, отклонения и автоматические публикации." />
        {filteredDecisions.length === 0 ? (
          <div className="flex flex-col items-center py-12">
            <BookOpen size={28} style={{ color: A.textMuted }} className="mb-2" />
            <p style={{ color: A.textMuted }} className="text-sm">Нет решений</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: A.tableHeaderBg }}>
                  {["Дата/время", "Тип", "Регион", "ID объекта", "Решение", "Оператор", "Комментарий"].map((h, i) => (
                    <th key={i} className="text-left py-3 px-4 font-medium text-xs" style={{ color: A.textSecondary, borderBottom: `1px solid ${A.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredDecisions.map((d, i) => {
                  const chip = decisionChip(d.decision);
                  return (
                    <tr key={i} className="transition-colors"
                      style={{ borderBottom: `1px solid ${A.border}` }}
                      onMouseEnter={e => (e.currentTarget.style.background = A.rowHover)}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <td className="py-3 px-4 text-xs" style={{ color: A.textMuted }}>{d.ts?.replace("T", " ").slice(0, 19)}</td>
                      <td className="py-3 px-4" style={{ color: A.textSecondary }}>{d.objectType}</td>
                      <td className="py-3 px-4" style={{ color: A.textSecondary }}>{d.region}</td>
                      <td className="py-3 px-4 font-mono text-xs" style={{ color: A.cyan }}>{d.objectId}</td>
                      <td className="py-3 px-4">
                        <span style={{ background: chip.bg, color: chip.color, borderRadius: 999 }} className="text-xs px-2.5 py-0.5 font-medium">{d.decision}</span>
                      </td>
                      <td className="py-3 px-4" style={{ color: A.textSecondary }}>{d.actor}</td>
                      <td className="py-3 px-4" style={{ color: A.textSecondary }}>{d.comment}</td>
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
