import React, { useMemo, useState } from "react";
import type { AppState } from "@/lib/store";
import {
  calculateComplianceFee,
  calculateComplianceFeeAmount,
  getCompliancePaymentStatus,
  getResellerAdmissionStatus,
  getResellerAgreementStatus,
  getResellerConnectionType,
  getResellerIntegrationStatus,
  getResellerSalesBlockReason,
  getSalesChannelLabel,
  getSeatTariffConfigurationSummary,
  isResellerAuthorizedForSales,
  setEventComplianceReview,
} from "@/lib/store";
import { A } from "./adminStyles";
import HelpTooltip from "@/components/ui/help-tooltip";
import SeatTariffSummary from "@/components/seatmap/SeatTariffSummary";
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
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("submitted");

  const allRows = useMemo(() => state.eventComplianceApplications.filter((row) => row.status !== "draft").slice().reverse(), [state.eventComplianceApplications]);
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
          const feeAmount = calculateComplianceFeeAmount(r.data);
          const paymentStatus = getCompliancePaymentStatus(r);
          const isPaymentWaiting = paymentStatus === "Ожидает оплаты";
          const canApprove = r.status === "submitted" && paymentStatus === "Оплачено";
          const paidReceipt = state.finance.organizerReceipts.find((receipt) => receipt.eventComplianceApplicationId === r.eventComplianceApplicationId && receipt.status === "оплачена");
          const features = getApplicationFeatures(r);
          const selectedSalesChannelCodes = r.data.salesChannels?.length ? r.data.salesChannels : ["OWN"];
          const salesChannels = selectedSalesChannelCodes.map((code) => getSalesChannelLabel(state, code));
          const selectedOperatorRows = selectedSalesChannelCodes
            .filter((code) => code !== "OWN")
            .map((code) => state.resellers.find((reseller) => reseller.code === code))
            .filter((reseller): reseller is AppState["resellers"][number] => Boolean(reseller));
          const eventTypePath = r.data.eventTypePath?.length ? r.data.eventTypePath.join(" / ") : r.data.eventType || "—";
          const performers = r.data.performers || [];
          const checks = r.data.interagencyChecks || [];
          const contractStatus = r.data.venueContractStatus || "требуется";
          const venue = state.venueRegistry.find((item) => item.venueId === r.data.venueId);
          const hall = venue?.halls.find((item) => item.hallId === r.data.hallId);
          const tariffConfigurationSummary = getSeatTariffConfigurationSummary({
            eventSeats: r.data.eventSeats,
            ticketTiers: r.data.ticketTiers,
          });

          return (
            <article
              key={r.eventComplianceApplicationId}
              className="relative rounded-xl border p-4"
              style={{ background: isPaymentWaiting ? "rgba(251,191,36,0.10)" : A.cardBg, borderColor: isPaymentWaiting ? "rgba(251,191,36,0.45)" : A.border, boxShadow: A.cardShadow }}
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
                      <div style={{ color: A.textPrimary }}>{fee} · {feeAmount.toFixed(2)} BYN</div>
                    </div>
                    <div className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: A.border, background: A.surfaceBg }}>
                      <div className="text-xs" style={{ color: A.textMuted }}>Категория мероприятия</div>
                      <div style={{ color: A.textPrimary }}>{eventTypePath}</div>
                    </div>
                    <div className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: A.border, background: A.surfaceBg }}>
                      <div className="text-xs" style={{ color: A.textMuted }}>Договор с площадкой</div>
                      <div style={{ color: A.textPrimary }}>{contractStatus}</div>
                    </div>
                    <div className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: A.border, background: A.surfaceBg }}>
                      <div className="text-xs" style={{ color: A.textMuted }}>Оплата</div>
                      <div style={{ color: paymentStatus === "Оплачено" ? A.statusOk : paymentStatus === "Недостаточно средств" ? A.statusWarn : A.statusInfo }}>{paymentStatus}</div>
                    </div>
                    <div className="rounded-lg border px-3 py-2 text-sm md:col-span-2" style={{ borderColor: A.border, background: A.surfaceBg }}>
                      <div className="text-xs" style={{ color: A.textMuted }}>Факт оплаты</div>
                      <div style={{ color: A.textPrimary }}>{paymentStatus === "Оплачено" ? `Оплачено${paidReceipt ? `, квитанция ${paidReceipt.number}` : ""}` : "Ожидает оплаты обязательных пошлин"}</div>
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
                    <div className="rounded-lg border px-3 py-2 text-xs md:col-span-2" style={{ borderColor: A.border, background: A.surfaceBg, color: A.textSecondary }}>
                      <div className="mb-2 inline-flex items-center gap-1" style={{ color: A.textMuted }}>
                        Выбранные билетные операторы
                        <HelpTooltip text="Центр Управления видит выбранные организатором каналы в режиме просмотра и не настраивает продажи вручную внутри заявки." />
                      </div>
                      {selectedOperatorRows.length === 0 ? (
                        <div style={{ color: A.textPrimary }}>Выбран только собственный канал организатора.</div>
                      ) : (
                        <div className="grid gap-2">
                          {selectedOperatorRows.map((reseller) => {
                            const available = isResellerAuthorizedForSales(reseller);
                            const warning = available ? "" : getResellerSalesBlockReason(reseller);
                            return (
                              <div key={reseller.resellerId} className="rounded-lg border px-3 py-2" style={{ borderColor: available ? "rgba(52,211,153,0.35)" : "rgba(251,191,36,0.45)", background: A.cardBg }}>
                                <div className="font-semibold" style={{ color: A.textPrimary }}>{reseller.name}</div>
                                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
                                  <span>Допуск: {getResellerAdmissionStatus(reseller)}</span>
                                  <span>Тип: {getResellerConnectionType(reseller)}</span>
                                  <span>Соглашение: {getResellerAgreementStatus(reseller)}</span>
                                  <span>Интеграция: {getResellerIntegrationStatus(reseller)}</span>
                                </div>
                                {!available && <div className="mt-1" style={{ color: A.statusWarn }}>{warning}</div>}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    <div className="rounded-lg border px-3 py-2 text-xs" style={{ borderColor: A.border, background: A.surfaceBg, color: A.textSecondary }}>
                      <div className="mb-1" style={{ color: A.textMuted }}>Участники и документы</div>
                      {performers.length ? performers.map((performer) => `${performer.name || "—"} · ${performer.country || "—"} · ${performer.documentStatus || "макет документа"}`).join("; ") : "—"}
                    </div>
                    <div className="rounded-lg border px-3 py-2 text-xs" style={{ borderColor: A.border, background: A.surfaceBg, color: A.textSecondary }}>
                      <div className="mb-1" style={{ color: A.textMuted }}>Межведомственные проверки</div>
                      {checks.length ? checks.map((check) => `${check.agency}: ${check.status}`).join("; ") : "—"}
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

                  <div className="rounded border p-2 text-xs" style={{ borderColor: paymentStatus === "Оплачено" ? "rgba(52,211,153,0.35)" : "rgba(251,191,36,0.45)", background: A.cardBg, color: A.textPrimary }}>
                    <div className="inline-flex items-center gap-1">
                      Статус оплаты: <b>{paymentStatus}</b>
                      <HelpTooltip text="Центр Управления видит статус оплаты, но не управляет балансом организатора." />
                    </div>
                    {paymentStatus !== "Оплачено" && (
                      <div className="mt-2" style={{ color: A.statusWarn }}>Одобрение доступно после оплаты обязательных пошлин.</div>
                    )}
                    {paidReceipt && (
                      <div className="mt-2" style={{ color: A.textSecondary }}>Квитанция: {paidReceipt.number}, {paidReceipt.amount.toFixed(2)} BYN</div>
                    )}
                  </div>

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

                  {tariffConfigurationSummary.hasSeatMap && (
                    <SeatTariffSummary
                      summary={tariffConfigurationSummary}
                      venueName={r.data.venueName}
                      hallName={hall?.name}
                      capacity={r.data.projectedCapacity}
                      variant="admin"
                      readOnly
                    />
                  )}

                  <div className="flex gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1">
                      <button disabled={!canApprove} className="px-2 py-1 rounded text-xs disabled:opacity-50 disabled:cursor-not-allowed" style={{ background: A.statusOkBg, color: A.statusOk }} onClick={() => applyDecision(r.eventComplianceApplicationId, "approved")}>Одобрить заявку</button>
                      <HelpTooltip text={canApprove ? "Одобрить мероприятие и автоматически присвоить удостоверение." : "Одобрение доступно после оплаты обязательных пошлин."} />
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
