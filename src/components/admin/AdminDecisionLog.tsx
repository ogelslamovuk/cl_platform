import React, { useEffect, useMemo, useState } from "react";
import type { AppState } from "@/lib/store";
import { A, statusChip } from "./adminStyles";
import { BookOpen } from "lucide-react";
import HelpTooltip from "@/components/ui/help-tooltip";
import { getScopedRegionFilterOptions, isInAdminScope, normalizeRegion, resolveRegionCity, type AdminRegionScope } from "./adminScope";
import { getCompliancePaymentStatus, getResellerAdmissionStatus, getResellerIntegrationStatus } from "@/lib/store";
import { formatPublicId } from "@/lib/display";

interface Decision {
  ts: string;
  objectType: string;
  objectId: string;
  objectName: string;
  decision: string;
  actor: string;
  comment: string;
  region: string;
  resultStatus: string;
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
        objectName: application.data.legalName || "Заявка организатора",
        decision: application.status === "approved" ? "Включить организатора в реестр" : application.status === "rejected" ? "Отклонить заявку" : "Вернуть заявку на доработку",
        actor: "Оператор Центра Управления",
        comment: application.adminComment || "Проверены регистрационные сведения и контактные данные.",
        region: normalizeRegion(application.data.region),
        resultStatus: application.status === "approved" ? "Включён в реестр" : application.status === "rejected" ? "Отклонено" : "Вернуть на доработку",
      });
    });
    state.eventComplianceApplications.forEach((application) => {
      const regionCity = resolveRegionCity(state, { venueId: application.data.venueId, venueName: application.data.venueName, venueAddress: application.data.venueAddress });
      if (application.reviewedAt && ["approved", "rejected", "needs_rework"].includes(application.status)) {
        result.push({
          ts: application.reviewedAt,
          objectType: "Мероприятие",
          objectId: application.eventComplianceApplicationId,
          objectName: application.data.title || "Заявка мероприятия",
          decision: application.status === "approved" ? "Одобрить проведение мероприятия" : application.status === "rejected" ? "Отклонить заявку" : "Вернуть заявку на доработку",
          actor: "Оператор Центра Управления",
          comment: application.adminComment || "Проверены площадка, программа, документы и статус оплаты пошлины.",
          region: regionCity.region,
          resultStatus: application.status === "approved" ? "Одобрено" : application.status === "rejected" ? "Отклонено" : "Вернуть на доработку",
        });
      }
      const paymentStatus = getCompliancePaymentStatus(application);
      if (paymentStatus === "Оплачено" && (application.data.feePaid || application.data.paymentAttachments.length || application.feePaymentConfirmedByAdmin)) {
        result.push({
          ts: application.updatedAt || application.submittedAt || application.createdAt,
          objectType: "Пошлина",
          objectId: application.eventComplianceApplicationId,
          objectName: application.data.title || "Заявка мероприятия",
          decision: "Подтвердить оплату пошлины",
          actor: "Финансовый модуль",
          comment: application.data.paymentComment || "Оплата по заявке подтверждена.",
          region: regionCity.region,
          resultStatus: "Оплата подтверждена",
        });
      }
    });
    state.applications.forEach((application) => {
      if (application.status === "approved") {
        result.push({
          ts: application.updatedAt,
          objectType: "Мероприятие",
          objectId: application.appId,
          objectName: application.title,
          decision: "Одобрить проведение мероприятия",
          actor: "Оператор Центра Управления",
          comment: "УНП проверен, пошлина оплачена, параметры мероприятия согласованы.",
          region: resolveRegionCity(state, { city: application.city, venueName: application.venue }).region,
          resultStatus: "Одобрено",
        });
      }
      if (application.status === "rejected") {
        result.push({
          ts: application.updatedAt,
          objectType: "Мероприятие",
          objectId: application.appId,
          objectName: application.title,
          decision: "Отклонить заявку",
          actor: "Оператор Центра Управления",
          comment: "Решение принято по результатам ручной проверки.",
          region: resolveRegionCity(state, { city: application.city, venueName: application.venue }).region,
          resultStatus: "Отклонено",
        });
      }
    });
    state.events.forEach((event) => {
      if (event.status !== "published") return;
      result.push({
        ts: event.updatedAt,
        objectType: "Мероприятие",
        objectId: event.eventId,
        objectName: event.title,
        decision: "Опубликовать мероприятие",
        actor: "Оператор Центра Управления",
        comment: "Мероприятие доступно в витрине и подключённых каналах продаж.",
        region: resolveRegionCity(state, { city: event.city, venueName: event.venue }).region,
        resultStatus: "Опубликовано",
      });
    });
    state.resellers.forEach((reseller) => {
      const admissionStatus = getResellerAdmissionStatus(reseller);
      const integrationStatus = getResellerIntegrationStatus(reseller);
      if (admissionStatus === "Авторизован") {
        result.push({
          ts: reseller.updatedAt || `${reseller.admissionDate || "2026-01-01"}T09:00:00.000Z`,
          objectType: "Билетный оператор",
          objectId: reseller.resellerId,
          objectName: reseller.name,
          decision: "Подключить билетного оператора",
          actor: "Оператор Центра Управления",
          comment: `${reseller.connectionType || "API"}; ${reseller.agreementStatus || "соглашение подписано"}.`,
          region: "Республиканский уровень",
          resultStatus: integrationStatus,
        });
      }
      if (admissionStatus === "Приостановлен" || integrationStatus === "Доступ приостановлен" || reseller.status === "disabled") {
        result.push({
          ts: reseller.updatedAt || `${reseller.admissionDate || "2026-01-01"}T09:00:00.000Z`,
          objectType: "Билетный оператор",
          objectId: reseller.resellerId,
          objectName: reseller.name,
          decision: "Ограничить доступ оператора к мероприятию",
          actor: "Оператор Центра Управления",
          comment: reseller.agreementStatus || "Доступ ограничен до обновления статуса.",
          region: "Республиканский уровень",
          resultStatus: integrationStatus,
        });
      }
    });
    return result.sort((a, b) => b.ts.localeCompare(a.ts));
  }, [state]);
  const regionOptions = useMemo(() => getScopedRegionFilterOptions(state, regionScope), [regionScope, state]);
  useEffect(() => {
    if (regionFilter && !regionOptions.includes(regionFilter)) setRegionFilter("");
  }, [regionFilter, regionOptions]);
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
      return [decision.objectId, decision.objectName, decision.comment, decision.objectType, decision.resultStatus].join(" ").toLowerCase().includes(query);
    });
  }, [actorFilter, dateFilter, decisionFilter, decisions, objectSearch, regionFilter, regionScope, typeFilter]);

  const decisionChip = (d: string) => {
    if (d.includes("Одобр") || d.includes("Включить") || d.includes("Подключить") || d.includes("Подтвердить") || d.includes("Опубликовать")) return statusChip('ok');
    if (d.includes("Отклон")) return statusChip('error');
    if (d.includes("доработ") || d.includes("Ограничить")) return statusChip('warn');
    return statusChip('neutral');
  };
  const decisionOptions = useMemo(() => Array.from(new Set(decisions.map((decision) => decision.decision))).sort(), [decisions]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2 rounded-xl border p-3" style={{ background: A.surfaceBg, borderColor: A.border }}>
        <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className="h-9 rounded-lg px-3 text-sm outline-none" style={{ background: A.cardBg, border: `1px solid ${A.border}`, color: A.textPrimary }}>
          <option value="">Все типы</option>
          <option value="Организатор">Организатор</option>
          <option value="Мероприятие">Мероприятие</option>
          <option value="Пошлина">Пошлина</option>
          <option value="Билетный оператор">Билетный оператор</option>
        </select>
        <select value={decisionFilter} onChange={(event) => setDecisionFilter(event.target.value)} className="h-9 rounded-lg px-3 text-sm outline-none" style={{ background: A.cardBg, border: `1px solid ${A.border}`, color: A.textPrimary }}>
          <option value="">Все решения</option>
          {decisionOptions.map((decision) => <option key={decision} value={decision}>{decision}</option>)}
        </select>
        <select value={regionFilter} onChange={(event) => setRegionFilter(event.target.value)} className="h-9 rounded-lg px-3 text-sm outline-none" style={{ background: A.cardBg, border: `1px solid ${A.border}`, color: A.textPrimary }}>
          <option value="">{regionScope === "all" ? "Республиканский уровень / все регионы" : "Регион сотрудника"}</option>
          {regionOptions.map((region) => <option key={region} value={region}>{region}</option>)}
        </select>
        <input type="date" value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} className="h-9 rounded-lg px-3 text-sm outline-none" style={{ background: A.cardBg, border: `1px solid ${A.border}`, color: A.textPrimary }} />
        <input value={objectSearch} onChange={(event) => setObjectSearch(event.target.value)} placeholder="Объект / комментарий" className="h-9 min-w-[220px] rounded-lg px-3 text-sm outline-none" style={{ background: A.cardBg, border: `1px solid ${A.border}`, color: A.textPrimary }} />
        <select value={actorFilter} onChange={(event) => setActorFilter(event.target.value)} className="h-9 rounded-lg px-3 text-sm outline-none" style={{ background: A.cardBg, border: `1px solid ${A.border}`, color: A.textPrimary }}>
          <option value="">Все ответственные</option>
          <option value="Оператор Центра Управления">Оператор Центра Управления</option>
          <option value="Финансовый модуль">Финансовый модуль</option>
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
                  {["Дата/время", "Тип объекта", "Номер объекта", "Объект", "Регион", "Решение", "Автор", "Основание / комментарий", "Итоговый статус"].map((h, i) => (
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
                      <td className="py-3 px-4 text-xs" style={{ color: A.cyan }}>{formatPublicId(d.objectId)}</td>
                      <td className="py-3 px-4" style={{ color: A.textPrimary }}>{d.objectName}</td>
                      <td className="py-3 px-4" style={{ color: A.textSecondary }}>{d.region}</td>
                      <td className="py-3 px-4">
                        <span style={{ background: chip.bg, color: chip.color, borderRadius: 999 }} className="text-xs px-2.5 py-0.5 font-medium">{d.decision}</span>
                      </td>
                      <td className="py-3 px-4" style={{ color: A.textSecondary }}>{d.actor}</td>
                      <td className="py-3 px-4" style={{ color: A.textSecondary }}>{d.comment}</td>
                      <td className="py-3 px-4" style={{ color: A.textSecondary }}>{d.resultStatus}</td>
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
