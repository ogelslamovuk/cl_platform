import HelpTooltip from "@/components/ui/help-tooltip";
import type { SeatTariffConfigurationSummary } from "@/lib/store";

type Variant = "dark" | "admin" | "light";

type Props = {
  summary: SeatTariffConfigurationSummary;
  venueName?: string;
  hallName?: string;
  capacity?: number | null;
  variant?: Variant;
  readOnly?: boolean;
  className?: string;
};

function palette(variant: Variant) {
  if (variant === "dark") {
    return {
      root: { borderColor: "rgba(255,255,255,0.12)", background: "#111A24", color: "#F5F7FA" },
      item: { borderColor: "rgba(255,255,255,0.12)", background: "#0F1620", color: "#F5F7FA" },
      muted: "rgba(245,247,250,0.72)",
    };
  }
  if (variant === "admin") {
    return {
      root: { borderColor: "rgba(148,163,184,0.28)", background: "rgba(15,23,42,0.55)", color: "#E5E7EB" },
      item: { borderColor: "rgba(148,163,184,0.22)", background: "rgba(2,6,23,0.45)", color: "#F8FAFC" },
      muted: "#94A3B8",
    };
  }
  return {
    root: { borderColor: "rgba(15,23,42,0.12)", background: "#FFFFFF", color: "#0F172A" },
    item: { borderColor: "rgba(15,23,42,0.10)", background: "#F8FAFC", color: "#0F172A" },
    muted: "#64748B",
  };
}

export default function SeatTariffSummary({
  summary,
  venueName,
  hallName,
  capacity,
  variant = "dark",
  readOnly = false,
  className = "",
}: Props) {
  const colors = palette(variant);
  const visibleExceptions = summary.exceptionSeats.slice(0, 6);

  return (
    <section data-seat-tariff-summary className={`rounded-xl border p-3 ${className}`} style={colors.root}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-1 text-sm font-semibold">
            Сводка билетной конфигурации
            <HelpTooltip text="Показывает назначенные тарифы, льготные места, индивидуальные исключения и ориентировочную максимальную выручку." />
          </div>
          {readOnly && <div className="mt-1 text-xs" style={{ color: colors.muted }}>Режим: только просмотр</div>}
        </div>
        <div className="text-xs" style={{ color: colors.muted }}>
          {summary.hasSeatMap ? "Схема с местами" : "Без схемы мест"}
        </div>
      </div>

      <div className="mt-3 grid gap-2 md:grid-cols-3">
        {venueName && <SummaryMetric label="Площадка" value={venueName} colors={colors} />}
        {hallName && <SummaryMetric label="Зал" value={hallName} colors={colors} />}
        <SummaryMetric label="Вместимость" value={String(capacity || summary.totalSeats || "—")} colors={colors} />
        <SummaryMetric label="Всего мест в схеме" value={String(summary.totalSeats)} colors={colors} />
        <SummaryMetric label="Мест с назначенным тарифом" value={String(summary.assignedSeats)} colors={colors} />
        <SummaryMetric label="Мест без тарифа" value={String(summary.unassignedSeats)} colors={colors} />
        <SummaryMetric label="Льготные места" value={String(summary.benefitSeats)} colors={colors} />
        <SummaryMetric label="Индивидуальные исключения" value={String(summary.individualExceptions)} colors={colors} />
        <SummaryMetric label="Максимальная расчётная выручка" value={`${summary.maxRevenue.toFixed(2)} BYN`} colors={colors} />
      </div>

      <div className="mt-3 rounded-lg border p-3" style={colors.item}>
        <div className="text-xs font-semibold" style={{ color: colors.muted }}>Места по тарифам</div>
        <div className="mt-2 grid gap-2">
          {summary.byTariff.map((tier) => (
            <div key={tier.name} className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="inline-flex items-center gap-2">
                <i className="h-3 w-3 rounded-sm" style={{ background: tier.color || "#2563EB" }} />
                {tier.name}{tier.isBenefit ? " · льготный пример" : ""}
              </span>
              <span>{tier.quantity} мест · {tier.price} BYN</span>
            </div>
          ))}
          {!summary.byTariff.length && <div className="text-sm" style={{ color: colors.muted }}>Тарифы пока не назначены.</div>}
        </div>
      </div>

      <div className="mt-3 rounded-lg border p-3" style={colors.item}>
        <div className="text-xs font-semibold" style={{ color: colors.muted }}>Индивидуальные исключения</div>
        <div className="mt-2 space-y-1 text-sm">
          {visibleExceptions.map((seat) => (
            <div key={seat.seatId}>
              {seat.label}: {seat.baseTariffName} → {seat.tariffName} · {seat.price} BYN
            </div>
          ))}
          {summary.exceptionSeats.length > visibleExceptions.length && (
            <div style={{ color: colors.muted }}>Ещё исключений: {summary.exceptionSeats.length - visibleExceptions.length}</div>
          )}
          {!summary.exceptionSeats.length && <div style={{ color: colors.muted }}>Индивидуальных исключений нет.</div>}
        </div>
      </div>
    </section>
  );
}

function SummaryMetric({ label, value, colors }: { label: string; value: string; colors: ReturnType<typeof palette> }) {
  return (
    <div className="rounded-lg border px-3 py-2 text-sm" style={colors.item}>
      <div className="text-xs" style={{ color: colors.muted }}>{label}</div>
      <div className="mt-1 font-semibold">{value}</div>
    </div>
  );
}
