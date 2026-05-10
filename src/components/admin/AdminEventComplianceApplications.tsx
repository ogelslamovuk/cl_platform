import React, { useMemo, useState } from "react";
import type { AppState } from "@/lib/store";
import { calculateComplianceFee, setEventComplianceReview } from "@/lib/store";
import { A } from "./adminStyles";
import HelpTooltip from "@/components/ui/help-tooltip";
import { toast } from "sonner";

interface Props { state: AppState; onUpdate: (s: AppState) => void; }

function CardHelp({ text }: { text: string }) {
  return (
    <div className="absolute right-4 top-4 z-10">
      <HelpTooltip text={text} />
    </div>
  );
}

const statusLabel: Record<string, string> = {
  draft: "Черновик",
  submitted: "Отправлена",
  approved: "Одобрена",
  rejected: "Отклонена",
  needs_rework: "На доработке",
};

const approvalModeLabel: Record<string, string> = {
  certificate_required: "Требуется удостоверение",
  notice_only: "Требуется только уведомление",
  certificate_not_required: "Удостоверение не требуется",
};

function getApplicationFeatures(row: AppState["eventComplianceApplications"][number]): string[] {
  const features: string[] = [];
  if (row.data.approvalMode === "notice_only") features.push("уведомление");
  if (row.data.approvalMode === "certificate_not_required") features.push("без удостоверения");
  if (row.data.hasForeignPerformers) features.push("иностранные исполнители");
  if (row.data.feeExempt) features.push("освобождение от пошлины");
  if (row.data.posterPath) features.push("постер выбран");
  return features;
}

export default function AdminEventComplianceApplications({ state, onUpdate }: Props) {
  const [comment, setComment] = useState<Record<string, string>>({});
  const [confirmFee, setConfirmFee] = useState<Record<string, boolean>>({});

  const rows = useMemo(() => state.eventComplianceApplications.slice().reverse(), [state.eventComplianceApplications]);

  const applyDecision = (id: string, decision: "approved" | "rejected" | "needs_rework") => {
    const text = (comment[id] || "").trim();
    if ((decision === "rejected" || decision === "needs_rework") && !text) {
      toast.error("Укажите комментарий для отклонения или возврата на доработку.");
      return;
    }
    const ok = setEventComplianceReview(state, id, {
      decision,
      comment: text,
      confirmFeePayment: !!confirmFee[id],
    });
    if (!ok) {
      toast.error("Недопустимый переход статуса.");
      return;
    }
    if (decision === "approved") toast.success("Заявка одобрена, удостоверение присвоено автоматически.");
    if (decision === "needs_rework") toast.success("Заявка возвращена на доработку.");
    if (decision === "rejected") toast.success("Заявка отклонена.");
    onUpdate({ ...state });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold" style={{ color: A.textPrimary }}>Заявки на проведение мероприятий</h2>
          <p className="mt-1 text-xs" style={{ color: A.textSecondary }}>Согласование, госпошлина и выдача удостоверения.</p>
        </div>
        <HelpTooltip text="Заявки проходят рассмотрение в Центре Управления; после одобрения создаётся мероприятие и присваивается удостоверение, если оно требуется." />
      </div>
      <div style={{ background: A.cardBg, border: `1px solid ${A.border}`, borderRadius: 12 }} className="relative overflow-hidden">
        <CardHelp text="Список заявок на проведение конкретных мероприятий. При одобрении удостоверение присваивается автоматически, если оно требуется." />
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: A.tableHeaderBg }}>
              {[
                "ID",
                "Организатор",
                "Название",
                "Дата",
                "Площадка",
                "Режим",
                "Особенности",
                "Пошлина",
                "Статус",
                "Действия",
              ].map((h) => (
                <th key={h} className="text-left py-2 px-3 text-xs" style={{ color: A.textSecondary }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const organizerName = state.organizers.find((o) => o.organizerId === r.organizerId)?.name || r.organizerId;
              const totalTickets = (r.data.ticketTiers || []).reduce((acc, tier) => acc + (tier.quantity || 0), 0);
              const fee = r.data.approvalMode === "certificate_required"
                ? `${calculateComplianceFee(r.data.projectedCapacity, r.data.plannedTicketsForSale, r.data.ticketTiers)} БВ`
                : "—";
              const features = getApplicationFeatures(r);
              return (
                <tr key={r.eventComplianceApplicationId} style={{ borderTop: `1px solid ${A.border}` }}>
                  <td className="py-2 px-3 font-mono text-xs">{r.eventComplianceApplicationId}</td>
                  <td className="py-2 px-3">{organizerName}</td>
                  <td className="py-2 px-3">{r.data.title}</td>
                  <td className="py-2 px-3">{r.data.dateSlots[0]?.replace("T", " ") || "—"}</td>
                  <td className="py-2 px-3">{r.data.venueName}</td>
                  <td className="py-2 px-3">{approvalModeLabel[r.data.approvalMode] || r.data.approvalMode}</td>
                  <td className="py-2 px-3 text-xs" style={{ color: A.textSecondary }}>{features.length ? features.join(", ") : "—"}</td>
                  <td className="py-2 px-3">{fee}</td>
                  <td className="py-2 px-3">{statusLabel[r.status] || r.status}</td>
                  <td className="py-2 px-3 space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="h-8 rounded px-2 flex items-center" style={{ background: A.surfaceBg, border: `1px solid ${A.border}`, color: A.textPrimary }}>
                        №: {r.certificateNumber || "—"}
                      </div>
                      <div className="h-8 rounded px-2 flex items-center" style={{ background: A.surfaceBg, border: `1px solid ${A.border}`, color: A.textPrimary }}>
                        Дата: {r.certificateDate || "—"}
                      </div>
                    </div>
                    <label className="flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={!!confirmFee[r.eventComplianceApplicationId]}
                        onChange={(e) => setConfirmFee((p) => ({ ...p, [r.eventComplianceApplicationId]: e.target.checked }))}
                      />
                      Подтвердить оплату
                      <HelpTooltip text="Отметьте, если оплата пошлины проверена перед одобрением заявки." />
                    </label>
                    <div className="relative">
                      <textarea
                      className="w-full min-h-14 rounded px-2 py-1 pr-9 text-xs"
                      placeholder="Комментарий (обязателен при отклонении и возврате на доработку)"
                      value={comment[r.eventComplianceApplicationId] || ""}
                      onChange={(e) => setComment((p) => ({ ...p, [r.eventComplianceApplicationId]: e.target.value }))}
                      style={{ background: A.surfaceBg, border: `1px solid ${A.border}`, color: A.textPrimary }}
                    />
                      <div className="absolute right-2 top-3">
                        <HelpTooltip text="Комментарий обязателен при отклонении заявки или возврате на доработку." />
                      </div>
                    </div>
                    <div className="relative rounded border p-2 text-xs space-y-1" style={{ borderColor: A.border, background: A.surfaceBg, color: A.textPrimary }}>
                      <CardHelp text="Показывает заявленные тарифы, количество билетов и цену по каждому тарифу." />
                      <div style={{ color: A.textSecondary }}>Тарифы билетов</div>
                      {(r.data.ticketTiers || []).map((tier, index) => (
                        <div key={`${tier.name}-${index}`} className="flex items-center justify-between gap-2">
                          <span>{tier.name || "—"}</span>
                          <span>{tier.quantity || 0} × {tier.price || 0}</span>
                        </div>
                      ))}
                      <div className="pt-1" style={{ color: A.textSecondary }}>Итого билетов: {totalTickets}</div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1">
                        <button disabled={r.status !== "submitted"} className="px-2 py-1 rounded text-xs disabled:opacity-50 disabled:cursor-not-allowed" style={{ background: A.statusOkBg, color: A.statusOk }} onClick={() => applyDecision(r.eventComplianceApplicationId, "approved")}>Одобрить заявку</button>
                        <HelpTooltip text="Одобрить мероприятие и автоматически присвоить удостоверение." />
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <button disabled={r.status !== "submitted"} className="px-2 py-1 rounded text-xs disabled:opacity-50 disabled:cursor-not-allowed" style={{ background: A.statusWarnBg, color: A.statusWarn }} onClick={() => applyDecision(r.eventComplianceApplicationId, "needs_rework")}>Вернуть на доработку</button>
                        <HelpTooltip text="Вернуть заявку организатору на доработку с комментарием." />
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <button disabled={r.status !== "submitted"} className="px-2 py-1 rounded text-xs disabled:opacity-50 disabled:cursor-not-allowed" style={{ background: A.statusErrorBg, color: A.statusError }} onClick={() => applyDecision(r.eventComplianceApplicationId, "rejected")}>Отклонить</button>
                        <HelpTooltip text="Отклонить заявку на проведение мероприятия с указанием причины." />
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td className="py-6 px-3 text-center" colSpan={10} style={{ color: A.textMuted }}>Пока нет заявок на проведение мероприятий</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
