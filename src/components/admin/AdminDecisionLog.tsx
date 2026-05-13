import React, { useMemo } from "react";
import type { AppState } from "@/lib/store";
import { A, statusChip } from "./adminStyles";
import { BookOpen } from "lucide-react";
import HelpTooltip from "@/components/ui/help-tooltip";

interface Decision {
  ts: string;
  objectType: string;
  objectId: string;
  decision: string;
  actor: string;
  comment: string;
}

interface Props { state: AppState; }

function CardHelp({ text }: { text: string }) {
  return (
    <div className="absolute right-4 top-4 z-10">
      <HelpTooltip text={text} />
    </div>
  );
}

export default function AdminDecisionLog({ state }: Props) {
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
      });
    });
    state.eventComplianceApplications.forEach((application) => {
      if (!application.reviewedAt || !["approved", "rejected", "needs_rework"].includes(application.status)) return;
      result.push({
        ts: application.reviewedAt,
        objectType: "Мероприятие",
        objectId: application.eventComplianceApplicationId,
        decision: application.status === "approved" ? "Одобрено" : application.status === "rejected" ? "Отклонено" : "На доработке",
        actor: "Оператор Центра Управления",
        comment: application.adminComment || "—",
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
        });
      }
    });
    return result.sort((a, b) => b.ts.localeCompare(a.ts));
  }, [state]);

  const decisionChip = (d: string) => {
    if (d === "Одобрено") return statusChip('ok');
    if (d === "Отклонено") return statusChip('error');
    if (d === "На доработке") return statusChip('warn');
    return statusChip('neutral');
  };

  return (
    <div className="space-y-5">
      <div style={{ background: A.cardBg, border: `1px solid ${A.border}`, borderRadius: 16, boxShadow: A.cardShadow }} className="relative overflow-hidden">
        <CardHelp text="Журнал решений фиксирует действия по заявкам и событиям: одобрения, отклонения и автоматические публикации." />
        {decisions.length === 0 ? (
          <div className="flex flex-col items-center py-12">
            <BookOpen size={28} style={{ color: A.textMuted }} className="mb-2" />
            <p style={{ color: A.textMuted }} className="text-sm">Нет решений</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: A.tableHeaderBg }}>
                  {["Дата/время", "Тип", "ID объекта", "Решение", "Оператор", "Комментарий"].map((h, i) => (
                    <th key={i} className="text-left py-3 px-4 font-medium text-xs" style={{ color: A.textSecondary, borderBottom: `1px solid ${A.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {decisions.map((d, i) => {
                  const chip = decisionChip(d.decision);
                  return (
                    <tr key={i} className="transition-colors"
                      style={{ borderBottom: `1px solid ${A.border}` }}
                      onMouseEnter={e => (e.currentTarget.style.background = A.rowHover)}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <td className="py-3 px-4 text-xs" style={{ color: A.textMuted }}>{d.ts?.replace("T", " ").slice(0, 19)}</td>
                      <td className="py-3 px-4" style={{ color: A.textSecondary }}>{d.objectType}</td>
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
