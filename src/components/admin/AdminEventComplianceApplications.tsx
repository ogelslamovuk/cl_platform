import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { AppState } from "@/lib/store";
import { calculateComplianceFeeAmount, getCompliancePaymentStatus } from "@/lib/store";
import { A, appStatusChip } from "./adminStyles";
import HelpTooltip from "@/components/ui/help-tooltip";
import { getScopedRegionFilterOptions, resolveRegionCity, isInAdminScope, type AdminRegionScope } from "./adminScope";
import { formatPublicId } from "@/lib/display";

interface Props { state: AppState; onUpdate: (s: AppState) => void; regionScope?: AdminRegionScope; }

type StatusFilter = "all" | "submitted" | "approved" | "needs_rework" | "rejected";

const statusLabel: Record<string, string> = {
  draft: "Черновик",
  submitted: "На проверке",
  approved: "Одобрено",
  rejected: "Отклонено",
  needs_rework: "Вернуть на доработку",
};

const statusFilterOptions: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Все" },
  { value: "submitted", label: "На проверке" },
  { value: "approved", label: "Одобрено" },
  { value: "needs_rework", label: "Вернуть на доработку" },
  { value: "rejected", label: "Отклонено" },
];

function formatDate(value?: string): string {
  return value ? value.replace("T", " ").slice(0, 16) : "—";
}

export default function AdminEventComplianceApplications({ state, regionScope = "all" }: Props) {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("submitted");
  const [regionFilter, setRegionFilter] = useState("");
  const regionOptions = useMemo(() => getScopedRegionFilterOptions(state, regionScope), [regionScope, state]);
  const organizerNameById = useMemo(
    () => new Map(state.organizers.map((organizer) => [organizer.organizerId, organizer.name])),
    [state.organizers]
  );

  const allRows = useMemo(() => state.eventComplianceApplications
    .filter((row) => row.status !== "draft")
    .filter((row) => {
      const regionCity = resolveRegionCity(state, {
        venueId: row.data.venueId,
        venueName: row.data.venueName,
        venueAddress: row.data.venueAddress,
      });
      if (!isInAdminScope(regionCity.region, regionScope)) return false;
      if (regionFilter && regionCity.region !== regionFilter) return false;
      return true;
    })
    .slice()
    .sort((a, b) => (b.submittedAt || b.updatedAt).localeCompare(a.submittedAt || a.updatedAt)), [regionFilter, regionScope, state]);

  const rows = useMemo(
    () => statusFilter === "all" ? allRows : allRows.filter((row) => row.status === statusFilter),
    [allRows, statusFilter]
  );

  useEffect(() => {
    if (regionFilter && !regionOptions.includes(regionFilter)) setRegionFilter("");
  }, [regionFilter, regionOptions]);

  const openApplication = (id: string) => {
    navigate(`/organizer/compliance?mode=admin&edit=${encodeURIComponent(id)}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold" style={{ color: A.textPrimary }}>Заявки мероприятий</h2>
          <p className="mt-1 text-xs" style={{ color: A.textSecondary }}>
            Список заявок. Просмотр и решение открываются в едином 9-этапном compliance-интерфейсе.
          </p>
        </div>
        <HelpTooltip text="Клик по строке открывает ту же заявку, которую видит организатор, но с действиями Центра Управления." />
      </div>

      <div className="flex flex-wrap gap-3 rounded-xl border p-3" style={{ background: A.surfaceBg, borderColor: A.border }}>
        <label className="block min-w-[220px] max-w-sm" htmlFor="event-compliance-status-filter">
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
        <label className="block min-w-[220px] max-w-sm" htmlFor="event-compliance-region-filter">
          <span className="mb-2 block text-xs font-semibold" style={{ color: A.textSecondary }}>Регион</span>
          <select
            id="event-compliance-region-filter"
            value={regionFilter}
            onChange={(event) => setRegionFilter(event.target.value)}
            className="h-10 w-full rounded-lg border px-3 text-sm outline-none"
            style={{ background: A.cardBg, borderColor: A.border, color: A.textPrimary }}
          >
            <option value="">{regionScope === "all" ? "Все регионы" : "Регион сотрудника"}</option>
            {regionOptions.map((region) => <option key={region} value={region}>{region}</option>)}
          </select>
        </label>
      </div>

      <div className="overflow-x-auto rounded-xl border" style={{ background: A.cardBg, borderColor: A.border, boxShadow: A.cardShadow }}>
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead style={{ background: A.surfaceBg, color: A.textSecondary }}>
            <tr>
              <th className="px-4 py-3 font-semibold">Номер заявки</th>
              <th className="px-4 py-3 font-semibold">Мероприятие</th>
              <th className="px-4 py-3 font-semibold">Организатор</th>
              <th className="px-4 py-3 font-semibold">Регион / город</th>
              <th className="px-4 py-3 font-semibold">Дата</th>
              <th className="px-4 py-3 font-semibold">Статус</th>
              <th className="px-4 py-3 font-semibold">Оплата</th>
              <th className="px-4 py-3 font-semibold">Документы</th>
              <th className="px-4 py-3 font-semibold">Действие</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const chip = appStatusChip(row.status);
              const regionCity = resolveRegionCity(state, {
                venueId: row.data.venueId,
                venueName: row.data.venueName,
                venueAddress: row.data.venueAddress,
              });
              const paymentStatus = getCompliancePaymentStatus(row);
              const feeAmount = calculateComplianceFeeAmount(row.data, state);
              const documentsCount =
                (row.data.eventDocuments?.length || 0) +
                (row.data.paymentAttachments?.length || 0) +
                (row.data.notificationsAttachment?.length || 0) +
                (row.data.venueContractStatus === "приложен" ? 1 : 0);
              return (
                <tr
                  key={row.eventComplianceApplicationId}
                  role="button"
                  tabIndex={0}
                  onClick={() => openApplication(row.eventComplianceApplicationId)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      openApplication(row.eventComplianceApplicationId);
                    }
                  }}
                  className="cursor-pointer border-t transition-colors hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/40"
                  style={{ borderColor: A.border }}
                >
                  <td className="px-4 py-3 text-xs" style={{ color: A.textMuted }}>{formatPublicId(row.eventComplianceApplicationId)}</td>
                  <td className="px-4 py-3">
                    <div className="font-semibold" style={{ color: A.textPrimary }}>{row.data.title || "Без названия"}</div>
                    <div className="mt-1 text-xs" style={{ color: A.textSecondary }}>{row.data.venueName || "Площадка не указана"}</div>
                  </td>
                  <td className="px-4 py-3" style={{ color: A.textSecondary }}>{organizerNameById.get(row.organizerId) || row.organizerId}</td>
                  <td className="px-4 py-3" style={{ color: A.textSecondary }}>{regionCity.region} · {regionCity.city}</td>
                  <td className="px-4 py-3" style={{ color: A.textSecondary }}>{formatDate(row.data.dateSlots?.[0])}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="inline-flex items-center justify-center whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold leading-none" style={{ background: chip.bg, color: chip.color }}>
                      {statusLabel[row.status] || row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3" style={{ color: paymentStatus === "Оплачено" ? A.statusOk : A.statusWarn }}>
                    {paymentStatus}
                    <div className="mt-1 text-xs" style={{ color: A.textMuted }}>{feeAmount.toFixed(2)} BYN</div>
                  </td>
                  <td className="px-4 py-3" style={{ color: A.textSecondary }}>{documentsCount}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        openApplication(row.eventComplianceApplicationId);
                      }}
                      className="h-8 whitespace-nowrap rounded-lg px-3 text-xs font-semibold"
                      style={{ background: A.selectedBg, color: A.textPrimary }}
                    >
                      Открыть
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {rows.length === 0 && (
          <div className="py-8 text-center text-sm" style={{ color: A.textMuted }}>
            Заявок с выбранными условиями нет.
          </div>
        )}
      </div>
    </div>
  );
}
