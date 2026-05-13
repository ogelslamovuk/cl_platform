import React, { useMemo, useState } from "react";
import type { AppState } from "@/lib/store";
import { calculateComplianceFee, getSalesChannelLabel, setEventComplianceReview } from "@/lib/store";
import { A } from "./adminStyles";
import HelpTooltip from "@/components/ui/help-tooltip";
import { toast } from "sonner";

interface Props { state: AppState; onUpdate: (s: AppState) => void; }

type StatusFilter = "all" | "submitted" | "approved" | "needs_rework" | "rejected";

function CardHelp({ text }: { text: string }) {
  return (
    <div className="absolute right-4 top-4 z-10">
      <HelpTooltip text={text} />
    </div>
  );
}

const statusLabel: Record<string, string> = {
  draft: "Черновик",
  submitted: "Новые / на рассмотрении",
  approved: "Одобрена",
  rejected: "Отклонена",
  needs_rework: "Возвращена на доработку",
};

const statusFilterOptions: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Все" },
  { value: "submitted", label: "Новые / на рассмотрении" },
  { value: "approved", label: "Одобрена" },
  { value: "needs_rework", label: "Возвращена на доработку" },
  { value: "rejected", label: "Отклонена" },
];

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
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("submitted");

  const allRows = useMemo(() => state.eventComplianceApplications.slice().reverse(), [state.eventComplianceApplications]);
  const rows = useMemo(
    () => statusFilter === "all" ? allRows : allRows.filter((row) => row.status === statusFilter),
    [allRows, statusFilter]
  );

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
    if (decision === "approved") toast.success("Заявка одобрена. Мероприятие создано в статусе «Одобрено», публикация и выпуск TicketID выполняются вручную.");
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
      <div className="rounded-xl border p-3" style={{ background: A.surfaceBg, borderColor: A.border }}>
        <label className="block max-w-sm" htmlFor="event-compliance-status-filter">
          <span className="mb-2 block text-xs font-semibold" style={{ color: A.textSecondary }}>Статус заявки</span>
          <select
            id="event-compliance-status-filter"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
            className="h-10 w-full rounded-lg border px-3 text-sm outline-none"
            style={{ background: A.cardBg, borderColor: A.border, color: A.textPrimary }}
          >
            {statusFilterOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="space-y-3">
        {rows.map((r) => {
          const organizerName = state.organizers.find((o) => o.organizerId === r.organizerId)?.name || r.organizerId;
          const totalTickets = (r.data.ticketTiers || []).reduce((acc, tier) => acc + (tier.quantity || 0), 0);
          const fee = r.data.approvalMode === "certificate_required"
            ? `${calculateComplianceFee(r.data.projectedCapacity, r.data.plannedTicketsForSale, r.data.ticketTiers)} БВ`
            : "—";
          const features = getApplicationFeatures(r);
          const salesChannels = (r.data.salesChannels?.length ? r.data.salesChannels : ["OWN"]).map((code) => getSalesChannelLabel(state, code));

          return (
            <article
              key={r.eventComplianceApplicationId}
              className="relative rounded-xl border p-4"
              style={{ background: A.cardBg, borderColor: A.border, boxShadow: A.cardShadow }}
            >
              <CardHelp text="Список заявок на проведение конкретных мероприятий. При одобрении удостоверение присваивается автоматически, если оно требуется." />
              <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)]">
                <div className="space-y-3 pr-8">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="font-mono text-xs" style={{ color: A.textMuted }}>{r.eventComplianceApplicationId}</div>
                      <h3 className="mt-1 text-base font-semibold" style={{ color: A.textPrimary }}>{r.data.title || "Без названия"}</h3>
                      <div className="mt-1 text-sm" style={{ color: A.textSecondary }}>{organizerName}</div>
                    </div>
                    <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{ background: A.statusInfoBg, color: A.statusInfo }}>
                      {statusLabel[r.status] || r.status}
                    </span>
                  </div>

                  <div className="grid gap-2 md:grid-cols-2">
                    <div className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: A.border, background: A.surfaceBg }}>
                      <div className="text-xs" style={{ color: A.textMuted }}>Дата</div>
                      <div style={{ color: A.textPrimary }}>{r.data.dateSlots[0]?.replace("T", " ") || "—"}</div>
                    </div>
                    <div className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: A.border, background: A.surfaceBg }}>
                      <div className="text-xs" style={{ color: A.textMuted }}>Площадка</div>
                      <div style={{ color: A.textPrimary }}>{r.data.venueName || "—"}</div>
                    </div>
                    <div className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: A.border, background: A.surfaceBg }}>
                      <div className="text-xs" style={{ color: A.textMuted }}>Возрастная категория</div>
                      <div style={{ color: A.textPrimary }}>{r.data.ageCategory || "—"}</div>
                    </div>
                    <div className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: A.border, background: A.surfaceBg }}>
                      <div className="text-xs" style={{ color: A.textMuted }}>Режим</div>
                      <div style={{ color: A.textPrimary }}>{approvalModeLabel[r.data.approvalMode] || r.data.approvalMode}</div>
                    </div>
                    <div className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: A.border, background: A.surfaceBg }}>
                      <div className="text-xs" style={{ color: A.textMuted }}>Пошлина</div>
                      <div style={{ color: A.textPrimary }}>{fee}</div>
                    </div>
                  </div>

                  <div className="grid gap-2 md:grid-cols-2">
                    <div className="rounded-lg border px-3 py-2 text-xs" style={{ borderColor: A.border, background: A.surfaceBg, color: A.textSecondary }}>
                      <div className="mb-1" style={{ color: A.textMuted }}>Особенности</div>
                      {features.length ? features.join(", ") : "—"}
                    </div>
                    <div className="rounded-lg border px-3 py-2 text-xs" style={{ borderColor: A.border, background: A.surfaceBg, color: A.textSecondary }}>
                      <div className="mb-1" style={{ color: A.textMuted }}>Каналы продаж</div>
                      {salesChannels.join(", ")}
                    </div>
                  </div>
                </div>

                <div className="space-y-3 rounded-lg border p-3" style={{ borderColor: A.border, background: A.surfaceBg }}>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="h-8 rounded px-2 flex items-center" style={{ background: A.cardBg, border: `1px solid ${A.border}`, color: A.textPrimary }}>
                      №: {r.certificateNumber || "—"}
                    </div>
                    <div className="h-8 rounded px-2 flex items-center" style={{ background: A.cardBg, border: `1px solid ${A.border}`, color: A.textPrimary }}>
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
                      style={{ background: A.cardBg, border: `1px solid ${A.border}`, color: A.textPrimary }}
                    />
                    <div className="absolute right-2 top-3">
                      <HelpTooltip text="Комментарий обязателен при отклонении заявки или возврате на доработку." />
                    </div>
                  </div>

                  <div className="rounded border p-2 text-xs space-y-1" style={{ borderColor: A.border, background: A.cardBg, color: A.textPrimary }}>
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
                </div>
              </div>
            </article>
          );
        })}
        {rows.length === 0 && (
          <div className="rounded-xl border py-6 px-3 text-center" style={{ background: A.cardBg, borderColor: A.border, color: A.textMuted }}>
            Заявок с выбранным статусом нет.
          </div>
        )}
      </div>
    </div>
  );
}
