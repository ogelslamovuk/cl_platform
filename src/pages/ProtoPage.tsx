import { ArrowRight, Building2, ClipboardCheck, RefreshCcw, ShieldCheck, Store, Ticket } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Fragment, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { useStorageSync } from "@/hooks/useStorageSync";
import { generateDemoData, resetDemoData } from "@/lib/demoEngine";
import { getPlatformCommissionPercent } from "@/lib/finance";
import {
  getFeeBaseUnitAmount,
  getFeeCalculationMode,
  setFeeCalculationMode,
  setPlatformCommissionPercent,
  type FeeCalculationMode,
} from "@/lib/store";
import platformLogo from "../../logo.jpg";

type Accent = { border: string; glow: string; iconBg: string; iconColor: string; shadow: string };

type Card = { title: string; description: string; route: string; icon: LucideIcon; accent: Accent };
type Tool = { title: string; description: string; action: () => void; icon: LucideIcon; accent: Accent };

const accents = {
  violet: {
    border: "rgba(192, 132, 252, 0.38)", glow: "rgba(168, 85, 247, 0.28)", iconBg: "linear-gradient(180deg, rgba(168,85,247,0.22) 0%, rgba(91,33,182,0.16) 100%)", iconColor: "#E9D5FF", shadow: "0 12px 34px rgba(124, 58, 237, 0.22)",
  },
  blue: {
    border: "rgba(96, 165, 250, 0.38)", glow: "rgba(59, 130, 246, 0.26)", iconBg: "linear-gradient(180deg, rgba(59,130,246,0.22) 0%, rgba(29,78,216,0.14) 100%)", iconColor: "#DBEAFE", shadow: "0 12px 34px rgba(37, 99, 235, 0.2)",
  },
  emerald: {
    border: "rgba(52, 211, 153, 0.34)", glow: "rgba(16, 185, 129, 0.24)", iconBg: "linear-gradient(180deg, rgba(16,185,129,0.2) 0%, rgba(6,95,70,0.14) 100%)", iconColor: "#D1FAE5", shadow: "0 12px 34px rgba(5, 150, 105, 0.18)",
  },
} as const;

const shellBackground =
  "radial-gradient(circle at 18% 10%, rgba(59,130,246,0.16), transparent 24%), radial-gradient(circle at 42% 12%, rgba(168,85,247,0.18), transparent 20%), radial-gradient(circle at 84% 86%, rgba(59,130,246,0.14), transparent 20%), linear-gradient(180deg, #020611 0%, #040b18 48%, #020611 100%)";

const panelBase: React.CSSProperties = {
  background: "linear-gradient(180deg, rgba(8,15,28,0.96) 0%, rgba(5,11,22,0.94) 100%)",
  border: "1px solid rgba(255,255,255,0.08)",
  boxShadow: "0 24px 64px rgba(0,0,0,0.36)",
};

const currentRulesRows = [
  ["1-150", "3 БВ"],
  ["151-300", "10 БВ"],
  ["301-500", "30 БВ"],
  ["501-1000", "50 БВ"],
  ["1001-1500", "80 БВ"],
  ["1501-2000", "100 БВ"],
  ["2001-3000", "150 БВ"],
  ["свыше 3000", "200 БВ"],
  ["нет проектной вместимости, но реализуются билеты", "3 БВ"],
];

const expandedCalculationRows = [
  ["Вместимость", "по шкале госпошлины", "по действующей шкале"],
  ["Площадка", "открытая / нестандартная площадка", "+10% к базовому начислению"],
  ["Исполнители", "иностранные участники", "+2 БВ"],
  ["Состав участников", "более 20 участников", "+1 БВ за каждые 10 участников"],
  ["Билетные операторы", "больше одного оператора", "+1 БВ за оператора"],
  ["Схема зала", "закреплённые места / сложная схема", "+1 БВ"],
  ["Постсобытийная сверка", "включена", "+1 БВ"],
];

function AccentIcon({ icon: Icon, accent }: { icon: LucideIcon; accent: Accent }) {
  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-[14px] border" style={{ borderColor: accent.border, background: accent.iconBg, color: accent.iconColor, boxShadow: accent.shadow }}>
      <Icon size={18} />
    </div>
  );
}

function routeHref(route: string): string {
  const base = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
  return `${base || ""}/#${route}`;
}

function QuickCard({ card }: { card: Card }) {
  const Icon = card.icon;
  return (
    <a
      href={routeHref(card.route)}
      target="_blank"
      rel="noopener noreferrer"
      className="group rounded-[22px] border p-5 transition-all duration-200 hover:-translate-y-[1px]"
      style={{ background: `linear-gradient(180deg, rgba(9,17,31,0.96) 0%, rgba(6,12,25,0.94) 100%), radial-gradient(circle at 50% 0%, ${card.accent.glow}, transparent 50%)`, borderColor: "rgba(255,255,255,0.08)", boxShadow: "0 18px 44px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.04)" }}
    >
      <AccentIcon icon={Icon} accent={card.accent} />
      <h3 className="mt-4 text-[22px] font-semibold leading-7">{card.title}</h3>
      <p className="mt-2 text-[14px] leading-6 text-[rgba(203,213,225,0.78)]">{card.description}</p>
      <div className="mt-4 inline-flex h-9 w-9 items-center justify-center rounded-full border group-hover:translate-x-0.5" style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}>
        <ArrowRight size={16} className="text-[rgba(233,238,255,0.9)]" />
      </div>
    </a>
  );
}

function ToolCard({ tool }: { tool: Tool }) {
  const Icon = tool.icon;
  return (
    <button
      type="button"
      onClick={tool.action}
      className="rounded-[22px] border p-5 text-left transition-all duration-200 hover:-translate-y-[1px]"
      style={{ background: "linear-gradient(180deg, rgba(9,17,31,0.96) 0%, rgba(6,12,25,0.94) 100%)", borderColor: "rgba(255,255,255,0.08)", boxShadow: `0 18px 44px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.04), inset 0 0 0 1px ${tool.accent.glow}` }}
    >
      <AccentIcon icon={Icon} accent={tool.accent} />
      <h3 className="mt-4 text-[22px] font-semibold leading-7">{tool.title}</h3>
      <p className="mt-2 text-[14px] leading-7 text-[rgba(203,213,225,0.78)]">{tool.description}</p>
    </button>
  );
}

export default function ProtoPage() {
  const { state, update, setState } = useStorageSync();
  const commissionPercent = getPlatformCommissionPercent(state);
  const feeMode = getFeeCalculationMode(state);
  const baseUnitAmount = getFeeBaseUnitAmount(state);
  const [draftCommissionPercent, setDraftCommissionPercent] = useState(String(commissionPercent));

  useEffect(() => {
    setDraftCommissionPercent(String(commissionPercent));
  }, [commissionPercent]);

  const applyCommissionPercent = () => {
    setPlatformCommissionPercent(state, Number(draftCommissionPercent));
    update({ ...state });
  };

  const selectFeeMode = (mode: FeeCalculationMode) => {
    setFeeCalculationMode(state, mode);
    update({ ...state });
    toast.success("Порядок начисления платежей обновлён");
  };

  const quickCards: Card[] = [
    { title: "Кабинет организатора", description: "Управление мероприятиями, билетами и продажами", route: "/organizer", icon: Building2, accent: accents.violet },
    { title: "Центр управления", description: "Контроль мероприятий, лицензий, билетов, данных и процессов", route: "/admin", icon: ShieldCheck, accent: accents.blue },
    { title: "Кабинет оператора", description: "Работа с мероприятиями, билетами и каналами распространения", route: "/channel", icon: Store, accent: accents.emerald },
    { title: "B2C Афиша", description: "Публичная витрина мероприятий, поиск событий и покупка билетов", route: "/demo", icon: Ticket, accent: accents.violet },
  ];

  const tools: Tool[] = [
    { title: "Сбросить демо", description: "Очистить текущие данные и вернуть систему к базовому состоянию", icon: RefreshCcw, accent: accents.violet, action: () => { setState({ ...resetDemoData() }); toast.success("Демо сброшено"); } },
    { title: "Загрузить демо-данные", description: "Загрузить типовые данные по мероприятиям, билетам и пользователям", icon: ClipboardCheck, accent: accents.blue, action: () => { setState({ ...generateDemoData() }); toast.success("Демо-данные загружены"); } },
  ];

  return (
    <div className="min-h-screen bg-[#020611] text-white">
      <Sonner toastOptions={{ style: { background: "rgba(7, 13, 24, 0.96)", border: "1px solid rgba(255,255,255,0.08)", color: "#ffffff" } }} />
      <div className="pointer-events-none fixed inset-0" style={{ background: shellBackground }} />

      <div className="relative mx-auto max-w-[1440px] px-4 pb-10 pt-4 md:px-6 xl:px-8">
        <header className="rounded-[26px] px-5 py-4 md:px-7" style={{ ...panelBase, backdropFilter: "blur(18px)" }}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <img src={platformLogo} alt="CinemaLab" className="h-8 w-8 rounded-lg object-cover" />
              <div className="flex min-w-0 items-center gap-3">
                <span className="text-[17px] font-semibold">CinemaLab</span>
                <span className="text-[14px] text-[rgba(203,213,225,0.72)]">Прототип платформы</span>
              </div>
            </div>
            <Link to="/main" className="inline-flex items-center gap-2 rounded-[12px] px-4 py-2 text-[13px] font-semibold" style={{ background: "linear-gradient(90deg, #4F7BFF 0%, #B059FF 100%)", boxShadow: "0 14px 32px rgba(99,102,241,0.32)" }}>
              К описанию проекта
              <ArrowRight size={16} />
            </Link>
          </div>
        </header>

        <section className="mt-6 rounded-[34px] px-6 py-7 md:px-8 md:py-9" style={panelBase}>
          <h1 className="text-[34px] font-semibold leading-[1.04] tracking-[-0.04em] md:text-[52px]">Инструменты прототипа</h1>
          <p className="mt-5 text-[16px] leading-8 text-[rgba(213,223,246,0.82)] md:text-[18px]">Быстрый вход в основные роли и демо-инструменты платформы.</p>
          <div className="mt-6 flex flex-wrap gap-3">{["Демо-среда", "Быстрый вход", "Типовые данные"].map((chip) => <span key={chip} className="rounded-full border px-4 py-2 text-[13px]" style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}>{chip}</span>)}</div>
        </section>

        <section className="mt-5 rounded-[28px] px-5 py-5 md:px-6 md:py-6" style={panelBase}>
          <h2 className="text-[28px] font-semibold tracking-[-0.04em] md:text-[34px]">Быстрый вход</h2>
          <p className="mt-2 text-[15px] leading-6 text-[rgba(203,213,225,0.74)]">Откройте ключевые страницы платформы одним кликом</p>
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {quickCards.map((card) => (
              <QuickCard key={card.title} card={card} />
            ))}
          </div>
        </section>

        <section className="mt-5 rounded-[28px] px-5 py-5 md:px-6 md:py-6" style={panelBase}>
          <h2 className="text-[28px] font-semibold tracking-[-0.04em] md:text-[34px]">Демо-инструменты</h2>
          <p className="mt-2 text-[15px] leading-6 text-[rgba(203,213,225,0.74)]">Инструменты для управления демо-средой и загрузки типовых данных</p>
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            {tools.map((tool) => (
              <ToolCard key={tool.title} tool={tool} />
            ))}
          </div>
          <div className="mt-5 rounded-[22px] border p-5" style={{ background: "linear-gradient(180deg, rgba(9,17,31,0.96) 0%, rgba(6,12,25,0.94) 100%)", borderColor: "rgba(255,255,255,0.08)" }}>
            <h3 className="text-[22px] font-semibold leading-7">Настройки финансовой модели</h3>
            <div className="mt-4 flex max-w-lg flex-col gap-3 sm:flex-row sm:items-end">
              <label className="block flex-1">
                <span className="mb-2 block text-[14px] font-semibold text-[rgba(233,238,255,0.92)]">Процент платформы / Минкульта</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  value={draftCommissionPercent}
                  onChange={(event) => setDraftCommissionPercent(event.target.value)}
                  className="h-11 w-full rounded-[12px] border bg-[#020611] px-3 text-[15px] text-white outline-none focus:ring-2 focus:ring-blue-400/40"
                  style={{ borderColor: "rgba(255,255,255,0.12)" }}
                />
              </label>
              <button
                type="button"
                onClick={applyCommissionPercent}
                className="h-11 rounded-[12px] px-4 text-[14px] font-semibold transition hover:brightness-110"
                style={{ background: "linear-gradient(90deg, #4F7BFF 0%, #B059FF 100%)", color: "#FFFFFF" }}
              >
                Применить
              </button>
            </div>
            <p className="mt-3 text-[14px] leading-6 text-[rgba(203,213,225,0.78)]">
              Используется для расчёта начислений организатора по проданным билетам.
            </p>
            <div className="mt-6 border-t pt-5" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
              <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                  <h4 className="text-[18px] font-semibold leading-7">Порядок начисления платежей</h4>
                  <p className="mt-1 max-w-3xl text-[14px] leading-6 text-[rgba(203,213,225,0.74)]">
                    Выберите, как прототип рассчитывает начисления в заявках на мероприятия.
                  </p>
                </div>
                <div className="inline-grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {[
                    { value: "currentRules" as const, label: "По действующим правилам" },
                    { value: "expandedCalculation" as const, label: "Расширенный расчёт" },
                  ].map((option) => {
                    const active = feeMode === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => selectFeeMode(option.value)}
                        className="min-h-11 rounded-[12px] border px-4 text-[13px] font-semibold transition"
                        style={{
                          borderColor: active ? "rgba(242,201,76,0.62)" : "rgba(255,255,255,0.12)",
                          background: active ? "rgba(242,201,76,0.16)" : "rgba(255,255,255,0.03)",
                          color: active ? "#FDE68A" : "#E5E7EB",
                        }}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <p className="mt-3 text-[13px] leading-6 text-[rgba(203,213,225,0.68)]">
                Настройка влияет только на демонстрационные начисления в прототипе и не подключает реальные платежи.
              </p>

              <div className="mt-4 overflow-hidden rounded-[16px] border" style={{ borderColor: "rgba(255,255,255,0.10)", background: "#07101D" }}>
                {feeMode === "currentRules" ? (
                  <div>
                    <div className="flex flex-col gap-1 border-b px-4 py-3 md:flex-row md:items-center md:justify-between" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                      <div className="text-[15px] font-semibold">Шкала госпошлины</div>
                      <div className="text-[13px] text-[rgba(203,213,225,0.72)]">Базовая величина: {baseUnitAmount} BYN</div>
                    </div>
                    <div className="grid grid-cols-[minmax(0,1fr)_140px] text-[13px]">
                      <div className="border-b px-4 py-2 font-semibold text-[rgba(233,238,255,0.84)]" style={{ borderColor: "rgba(255,255,255,0.08)" }}>Проектная вместимость / билеты</div>
                      <div className="border-b px-4 py-2 font-semibold text-[rgba(233,238,255,0.84)]" style={{ borderColor: "rgba(255,255,255,0.08)" }}>Ставка</div>
                      {currentRulesRows.map(([range, rate]) => (
                        <Fragment key={range}>
                          <div className="border-b px-4 py-2 text-[rgba(203,213,225,0.78)]" style={{ borderColor: "rgba(255,255,255,0.06)" }}>{range}</div>
                          <div className="border-b px-4 py-2 font-semibold text-[#FDE68A]" style={{ borderColor: "rgba(255,255,255,0.06)" }}>{rate}</div>
                        </Fragment>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="border-b px-4 py-3" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                      <div className="text-[15px] font-semibold">Демо-тарифы расширенного расчёта</div>
                      <p className="mt-1 text-[13px] leading-5 text-[rgba(203,213,225,0.72)]">
                        Расширенный расчёт — демонстрационный сценарий для показа детализации начислений; он не является действующим правилом расчёта госпошлины.
                      </p>
                    </div>
                    <div className="grid grid-cols-[0.9fr_1.1fr_1fr] text-[13px]">
                      {["Параметр", "Условие", "Начисление"].map((header) => (
                        <div key={header} className="border-b px-4 py-2 font-semibold text-[rgba(233,238,255,0.84)]" style={{ borderColor: "rgba(255,255,255,0.08)" }}>{header}</div>
                      ))}
                      {expandedCalculationRows.map(([parameter, condition, charge]) => (
                        <Fragment key={parameter}>
                          <div className="border-b px-4 py-2 text-[rgba(203,213,225,0.78)]" style={{ borderColor: "rgba(255,255,255,0.06)" }}>{parameter}</div>
                          <div className="border-b px-4 py-2 text-[rgba(203,213,225,0.78)]" style={{ borderColor: "rgba(255,255,255,0.06)" }}>{condition}</div>
                          <div className="border-b px-4 py-2 font-semibold text-[#FDE68A]" style={{ borderColor: "rgba(255,255,255,0.06)" }}>{charge}</div>
                        </Fragment>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
