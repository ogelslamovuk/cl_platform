import React, { useMemo, useState } from "react";
import type { AppState, EventRecord } from "@/lib/store";
import { createDemoPurchaseTicket, getTicketRefundBlockReason, refund } from "@/lib/store";
import { toast } from "sonner";
import { Search, MapPin, Tag, Ticket, X, ChevronRight, Sparkles, TrendingUp, Star, User, Calendar, CheckCircle2 } from "lucide-react";

interface Props {
  state: AppState;
  onUpdate: (s: AppState) => void;
}

const CITY_WHITELIST = ["Минск", "Брест", "Витебск", "Гомель", "Гродно", "Могилёв", "Слуцк", "Несвиж"] as const;
const CATEGORY_WHITELIST = ["Концерты", "Театр", "Шоу", "Детям", "Фестивали", "Выставки", "Конкурсы"] as const;
const POSTER_PLACEHOLDER = "/placeholder.svg";

type DemoEvent = EventRecord & { city: string; category: string; description: string; poster: string };
type AgeCategory = "0+" | "6+" | "12+" | "16+" | "18+";

function resolvePublicAsset(path: string): string {
  const assetPath = path || POSTER_PLACEHOLDER;
  if (/^(https?:|data:|blob:)/.test(assetPath)) return assetPath;
  const base = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
  return `${base}${assetPath.startsWith("/") ? assetPath : `/${assetPath}`}`;
}

function getPriceFrom(event: DemoEvent): number | null {
  const prices = event.tiers.map((tier) => tier.price).filter((price) => Number.isFinite(price) && price > 0);
  if (prices.length === 0) return null;
  return Math.min(...prices);
}

function getAvailability(state: AppState, event: DemoEvent): "Available" | "Sold out" {
  if (!event.tiers.length) return "Available";
  const soldOut = event.tiers.every((tier) => {
    return getTierIssuedCount(state, event.eventId, tier.name) === 0;
  });
  return soldOut ? "Sold out" : "Available";
}

function getTierIssuedCount(state: AppState, eventId: string, tierName: string): number {
  return state.tickets.filter((ticket) => ticket.eventId === eventId && ticket.tier === tierName && ticket.status === "issued").length;
}

function getEventIssuedCount(state: AppState, eventId: string): number {
  return state.tickets.filter((ticket) => ticket.eventId === eventId && ticket.status === "issued").length;
}

function getEventAgeCategory(state: AppState, event: EventRecord): AgeCategory | null {
  const compliance = state.eventComplianceApplications.find((app) =>
    app.eventComplianceApplicationId === event.complianceApplicationId ||
    app.linkedEventId === event.eventId ||
    (app.organizerId === event.organizerId && app.data.title === event.title)
  );
  return compliance?.data.ageCategory || null;
}

function formatDateTime(dateTime: string): { date: string; time: string } {
  const [date = "", timeRaw = ""] = (dateTime || "").split("T");
  return { date: date || "Дата уточняется", time: timeRaw ? timeRaw.slice(0, 5) : "Время уточняется" };
}

function formatDateShort(dateTime: string): string {
  const [date = ""] = (dateTime || "").split("T");
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

function formatDateLong(dateTime: string): string {
  const [date = ""] = (dateTime || "").split("T");
  if (!date) return "Дата уточняется";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
}

function formatTicketWord(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return "билет";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "билета";
  return "билетов";
}

const D = {
  page: "#F5F7FB",
  card: "#FFFFFF",
  panel: "#F8FAFC",
  panelStrong: "#EEF4FA",
  text: "#111827",
  textSoft: "#334155",
  textMuted: "#64748B",
  textFaint: "#94A3B8",
  border: "#D9E2EC",
  borderSoft: "#E6EDF5",
  accent: "#2563EB",
  accentDark: "#1D4ED8",
  accentSoft: "#EAF1FF",
  accentText: "#1E40AF",
  success: "#047857",
  successSoft: "#ECFDF5",
  warning: "#B45309",
  warningSoft: "#FFF7ED",
  danger: "#BE123C",
  dangerSoft: "#FFF1F2",
  shadow: "0 18px 45px rgba(15, 23, 42, 0.08)",
  shadowSmall: "0 10px 28px rgba(15, 23, 42, 0.07)",
  radius: "12px",
};

export default function B2CView({ state, onUpdate }: Props) {
  const [search, setSearch] = useState("");
  const [city, setCity] = useState<"" | (typeof CITY_WHITELIST)[number]>("");
  const [category, setCategory] = useState<"" | (typeof CATEGORY_WHITELIST)[number]>("");
  const [detailsEventId, setDetailsEventId] = useState<string | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [ticketsOpen, setTicketsOpen] = useState(false);
  const [successTicketId, setSuccessTicketId] = useState<string | null>(null);
  const [selectedTier, setSelectedTier] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [buyerName, setBuyerName] = useState("");

  const publishedEvents = useMemo<DemoEvent[]>(() => {
    return state.events
      .filter((event) => event.status === "published")
      .filter((event) => state.tickets.some((ticket) => ticket.eventId === event.eventId))
      .map((event) => ({
        ...event,
        city: CITY_WHITELIST.includes(event.city as (typeof CITY_WHITELIST)[number]) ? event.city : "Минск",
        category: CATEGORY_WHITELIST.includes(event.category as (typeof CATEGORY_WHITELIST)[number]) ? event.category : "Концерты",
        description: event.description || "Описание события появится позже.",
        poster: event.poster || "",
      }));
  }, [state.events, state.tickets]);

  const filteredEvents = useMemo(() => {
    const q = search.trim().toLowerCase();
    return publishedEvents.filter((event) => {
      if (city && event.city !== city) return false;
      if (category && event.category !== category) return false;
      if (!q) return true;
      return [event.title, event.venue, event.city, event.category, event.description].join(" ").toLowerCase().includes(q);
    });
  }, [publishedEvents, city, category, search]);

  const detailsEvent = detailsEventId ? filteredEvents.find((event) => event.eventId === detailsEventId) || null : null;
  const selectedTierPrice = detailsEvent?.tiers.find((tier) => tier.name === selectedTier)?.price || 0;
  const totalPrice = selectedTierPrice * quantity;
  const hasActiveFilters = Boolean(search.trim() || city || category);
  const availableTicketCount = useMemo(() => {
    return publishedEvents.reduce((sum, event) => sum + getEventIssuedCount(state, event.eventId), 0);
  }, [publishedEvents, state]);

  const myTickets = useMemo(() => {
    return [...state.demoPurchases].reverse();
  }, [state.demoPurchases]);

  const resetFilters = () => {
    setSearch("");
    setCity("");
    setCategory("");
  };

  const openDetails = (event: DemoEvent) => {
    const firstAvailableTier = event.tiers.find((tier) => getTierIssuedCount(state, event.eventId, tier.name) > 0)?.name || event.tiers[0]?.name || "";
    setDetailsEventId(event.eventId);
    setSelectedTier(firstAvailableTier);
    setQuantity(1);
    setBuyerName("");
    setCheckoutOpen(false);
    setSuccessTicketId(null);
  };

  const openCheckout = () => {
    if (!detailsEvent || !selectedTier) {
      toast.error("Выберите ценовую категорию");
      return;
    }
    if (getTierIssuedCount(state, detailsEvent.eventId, selectedTier) < quantity) {
      toast.error("По выбранному тарифу нет доступных билетов");
      return;
    }
    setCheckoutOpen(true);
  };

  const confirmPurchase = () => {
    if (!detailsEvent || !selectedTier) return;
    if (!buyerName.trim()) {
      toast.error("Введите имя покупателя");
      return;
    }
    const rec = createDemoPurchaseTicket(state, {
      eventId: detailsEvent.eventId,
      selectedPriceCategory: selectedTier,
      quantity,
      buyerName,
    });
    if (!rec) {
      toast.error("Не удалось завершить покупку");
      return;
    }
    onUpdate({ ...state });
    setCheckoutOpen(false);
    setSuccessTicketId(rec.ticketId);
    toast.success(`Покупка подтверждена: ${rec.ticketId}`);
  };

  const handleRefundTicket = (ticketId: string) => {
    const outcome = refund(state, ticketId, "B2C");
    if (!outcome.ok) {
      toast.error(outcome.reason || "Не удалось вернуть билет");
      return;
    }
    onUpdate({ ...state });
    toast.success("Билет возвращён");
  };

  const EventCard = ({ event }: { event: DemoEvent }) => {
    const dt = formatDateTime(event.dateTime);
    const priceFrom = getPriceFrom(event);
    const isSoldOut = getAvailability(state, event) === "Sold out";
    const remaining = getEventIssuedCount(state, event.eventId);
    const ageCategory = getEventAgeCategory(state, event);

    return (
      <article
        role="button"
        tabIndex={0}
        className="group flex h-full min-h-[420px] cursor-pointer flex-col overflow-hidden rounded-xl border bg-white outline-none transition duration-200 hover:-translate-y-0.5 hover:shadow-xl focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        style={{ borderColor: D.borderSoft, boxShadow: D.shadowSmall }}
        onClick={() => openDetails(event)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openDetails(event);
          }
        }}
      >
        <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
          <img src={resolvePublicAsset(event.poster)} alt={event.title} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]" />
        </div>

        <div className="flex flex-1 flex-col p-4 sm:p-5">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium" style={{ color: D.textMuted }}>
              <span>{formatDateShort(event.dateTime) || dt.date}</span>
              <span aria-hidden="true">·</span>
              <span>{dt.time}</span>
              <span aria-hidden="true">·</span>
              <span>{event.city}</span>
            </div>
            <div className="flex shrink-0 flex-wrap gap-1.5">
              {ageCategory && (
                <span className="w-fit rounded-full border px-2.5 py-1 text-xs font-semibold" style={{ borderColor: "rgba(180,83,9,0.18)", background: D.warningSoft, color: D.warning }}>
                  {ageCategory}
                </span>
              )}
              <span className="w-fit rounded-full border px-2.5 py-1 text-xs font-semibold" style={{ borderColor: D.borderSoft, background: D.accentSoft, color: D.accentText }}>
                {event.category}
              </span>
            </div>
          </div>

          <h3 className="text-lg font-semibold leading-snug line-clamp-2" style={{ color: D.text }}>
            {event.title}
          </h3>

          <div className="mt-3 flex items-start gap-2 text-sm leading-5" style={{ color: D.textMuted }}>
            <MapPin size={16} className="mt-0.5 shrink-0" />
            <span className="line-clamp-2">
              {event.venue}, {event.city}
            </span>
          </div>

          <p className="mt-3 text-sm leading-6 line-clamp-2" style={{ color: D.textSoft }}>
            {event.description}
          </p>

          <div className="mt-auto pt-5">
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <div className="text-xs font-medium" style={{ color: D.textMuted }}>
                  {isSoldOut ? "Билеты закончились" : `${remaining} ${formatTicketWord(remaining)} доступно`}
                </div>
                {priceFrom !== null ? (
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-2xl font-semibold" style={{ color: D.text }}>
                      {priceFrom}
                    </span>
                    <span className="text-sm font-medium" style={{ color: D.textMuted }}>
                      BYN
                    </span>
                  </div>
                ) : (
                  <div className="mt-1 text-base font-semibold" style={{ color: D.text }}>
                    Цена уточняется
                  </div>
                )}
              </div>
              <button
                className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-lg px-4 text-sm font-semibold transition"
                style={{
                  background: isSoldOut ? D.panelStrong : D.accent,
                  color: isSoldOut ? D.textMuted : "#FFFFFF",
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isSoldOut) openDetails(event);
                }}
              >
                {isSoldOut ? "Нет мест" : "Купить"}
                {!isSoldOut && <ChevronRight size={16} />}
              </button>
            </div>
          </div>
        </div>
      </article>
    );
  };

  return (
    <div className="pb-14">
      <nav
        className="sticky top-0 z-40 -mx-4 border-b px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
        style={{ background: "rgba(245, 247, 251, 0.92)", borderColor: D.borderSoft }}
      >
        <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: D.accent, color: "#FFFFFF" }}>
              <Ticket size={18} />
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold" style={{ color: D.text }}>
                CinemaLab
              </div>
              <div className="truncate text-xs" style={{ color: D.textMuted }}>
                прототип билетной платформы
              </div>
            </div>
          </div>

          <button
            onClick={() => setTicketsOpen(true)}
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-semibold transition hover:bg-white sm:px-4"
            style={{
              background: myTickets.length > 0 ? D.accent : D.card,
              borderColor: myTickets.length > 0 ? D.accent : D.border,
              color: myTickets.length > 0 ? "#FFFFFF" : D.textSoft,
            }}
          >
            <Ticket size={16} />
            <span className="hidden sm:inline">Мои билеты</span>
            {myTickets.length > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-bold" style={{ background: "rgba(255,255,255,0.22)" }}>
                {myTickets.length}
              </span>
            )}
          </button>
        </div>
      </nav>

      <section className="grid gap-8 py-8 sm:py-10 lg:grid-cols-[minmax(0,1.1fr)_360px] lg:items-end">
        <div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1.5 text-xs font-semibold" style={{ borderColor: D.borderSoft, color: D.accentText }}>
            <Sparkles size={14} />
            Витрина розничной продажи билетов
          </div>
          <h1 className="max-w-3xl text-[2rem] font-semibold leading-tight tracking-tight sm:text-4xl lg:text-5xl" style={{ color: D.text }}>
            Афиша мероприятий
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 sm:text-lg" style={{ color: D.textSoft }}>
            На этой странице показан покупательский экран платформы: поиск события, фильтрация афиши, выбор ценовой категории и оформление билета в прототипе без изменения реальных данных.
          </p>
        </div>

        <div className="grid gap-3 rounded-xl border bg-white p-4" style={{ borderColor: D.borderSoft, boxShadow: D.shadowSmall }}>
          {[
            { label: "Опубликовано", value: String(publishedEvents.length), note: "событий в афише", icon: Calendar },
            { label: "Доступно", value: String(availableTicketCount), note: formatTicketWord(availableTicketCount), icon: TrendingUp },
            { label: "Покупки", value: String(myTickets.length), note: "билетов", icon: CheckCircle2 },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3 rounded-lg px-2 py-1.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ background: D.accentSoft, color: D.accent }}>
                <item.icon size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium" style={{ color: D.textMuted }}>
                  {item.label}
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-semibold" style={{ color: D.text }}>
                    {item.value}
                  </span>
                  <span className="truncate text-sm" style={{ color: D.textMuted }}>
                    {item.note}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border bg-white p-4 sm:p-5" style={{ borderColor: D.borderSoft, boxShadow: D.shadowSmall }} aria-label="Поиск и фильтры">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: D.text }}>
              <Tag size={16} style={{ color: D.accent }} />
              Поиск и фильтры
            </div>
            <p className="mt-1 text-sm" style={{ color: D.textMuted }}>
              Быстро отберите события по городу, категории или названию.
            </p>
          </div>
          <div className="text-sm" style={{ color: D.textMuted }}>
            Найдено: <span className="font-semibold" style={{ color: D.text }}>{filteredEvents.length}</span>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_220px_auto]">
          <label className="relative block">
            <span className="sr-only">Поиск событий</span>
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: D.textFaint }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Событие, площадка, город..."
              className="h-12 w-full rounded-lg border bg-white pl-10 pr-3 text-sm outline-none transition focus:ring-2 focus:ring-blue-100"
              style={{ borderColor: D.border, color: D.text }}
            />
          </label>

          <label className="relative block">
            <span className="sr-only">Город</span>
            <MapPin size={17} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: D.textFaint }} />
            <select
              value={city}
              onChange={(e) => setCity(e.target.value as "" | (typeof CITY_WHITELIST)[number])}
              className="h-12 w-full appearance-none rounded-lg border bg-white pl-10 pr-8 text-sm outline-none transition focus:ring-2 focus:ring-blue-100"
              style={{ borderColor: D.border, color: city ? D.text : D.textMuted }}
            >
              <option value="">Все города</option>
              {CITY_WHITELIST.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <ChevronRight size={16} className="pointer-events-none absolute right-3 top-1/2 rotate-90 -translate-y-1/2" style={{ color: D.textFaint }} />
          </label>

          <label className="relative block">
            <span className="sr-only">Категория</span>
            <Tag size={17} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: D.textFaint }} />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as "" | (typeof CATEGORY_WHITELIST)[number])}
              className="h-12 w-full appearance-none rounded-lg border bg-white pl-10 pr-8 text-sm outline-none transition focus:ring-2 focus:ring-blue-100"
              style={{ borderColor: D.border, color: category ? D.text : D.textMuted }}
            >
              <option value="">Все категории</option>
              {CATEGORY_WHITELIST.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <ChevronRight size={16} className="pointer-events-none absolute right-3 top-1/2 rotate-90 -translate-y-1/2" style={{ color: D.textFaint }} />
          </label>

          <button
            type="button"
            onClick={resetFilters}
            disabled={!hasActiveFilters}
            className="h-12 rounded-lg border px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-45"
            style={{ borderColor: D.border, background: D.panel, color: D.textSoft }}
          >
            Сбросить
          </button>
        </div>
      </section>

      <section className="mt-8 space-y-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight" style={{ color: D.text }}>
              Афиша
            </h2>
            <p className="mt-1 text-sm" style={{ color: D.textMuted }}>
              Ровная витрина событий с единым форматом карточек и понятным CTA.
            </p>
          </div>
          <div className="inline-flex w-fit items-center gap-2 rounded-full border bg-white px-3 py-1.5 text-sm" style={{ borderColor: D.borderSoft, color: D.textSoft }}>
            <Star size={14} style={{ color: D.warning }} />
            Розничная витрина
          </div>
        </div>

        {filteredEvents.length > 0 ? (
          <div className="grid items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredEvents.map((event) => (
              <EventCard key={event.eventId} event={event} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border bg-white px-5 py-14 text-center" style={{ borderColor: D.borderSoft, boxShadow: D.shadowSmall }}>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: D.accentSoft, color: D.accent }}>
              <Search size={24} />
            </div>
            <h3 className="mt-5 text-lg font-semibold" style={{ color: D.text }}>
              {publishedEvents.length === 0 ? "В афише пока нет опубликованных событий" : "По выбранным условиям ничего не найдено"}
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6" style={{ color: D.textMuted }}>
              {publishedEvents.length === 0
                ? "Запустите демо-сценарий в административном модуле, чтобы наполнить витрину событиями и билетами."
                : "Измените запрос, выберите другой город или сбросьте фильтры, чтобы вернуться к полной афише."}
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="mt-6 h-10 rounded-lg px-4 text-sm font-semibold"
                style={{ background: D.accent, color: "#FFFFFF" }}
              >
                Показать всю афишу
              </button>
            )}
          </div>
        )}
      </section>

      <section className="mt-10 grid gap-4 border-t pt-6 md:grid-cols-3" style={{ borderColor: D.borderSoft }}>
        {[
          { icon: CheckCircle2, title: "Сценарий без лишнего шума", text: "Покупатель видит только афишу, выбор билета и результат покупки." },
          { icon: Ticket, title: "Билет в один поток", text: "После оформления билет появляется в панели «Мои билеты» без перехода на другие страницы." },
          { icon: Star, title: "Готово для презентации", text: "Интерфейс выдержан в спокойной B2C-стилистике для деловой демонстрации." },
        ].map((item) => (
          <div key={item.title} className="flex gap-3 rounded-xl border bg-white p-4" style={{ borderColor: D.borderSoft }}>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ background: D.panel, color: D.accent }}>
              <item.icon size={18} />
            </div>
            <div>
              <h3 className="text-sm font-semibold" style={{ color: D.text }}>
                {item.title}
              </h3>
              <p className="mt-1 text-sm leading-6" style={{ color: D.textMuted }}>
                {item.text}
              </p>
            </div>
          </div>
        ))}
      </section>

      {detailsEvent && (
        <div className="fixed inset-0 z-50 overflow-y-auto px-3 py-4 sm:px-6" onClick={() => setDetailsEventId(null)}>
          <div className="fixed inset-0 bg-slate-950/55 backdrop-blur-sm" />
          <div className="relative mx-auto flex min-h-full max-w-5xl items-center justify-center">
            <div
              className="relative w-full overflow-hidden rounded-2xl bg-white shadow-2xl"
              style={{ border: `1px solid ${D.borderSoft}` }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setDetailsEventId(null)}
                className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border bg-white/95 shadow-sm transition hover:bg-slate-50"
                style={{ borderColor: D.borderSoft, color: D.textSoft }}
              >
                <X size={18} />
              </button>

              <div className="grid lg:grid-cols-[minmax(0,0.9fr)_minmax(420px,1.1fr)]">
                <div className="relative min-h-[260px] bg-slate-100 lg:min-h-full">
                  <img src={resolvePublicAsset(detailsEvent.poster)} alt={detailsEvent.title} className="absolute inset-0 h-full w-full object-cover" />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/70 to-transparent p-5 text-white">
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">
                        {detailsEvent.category}
                      </span>
                      {getEventAgeCategory(state, detailsEvent) && (
                        <span className="inline-flex rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur">
                          {getEventAgeCategory(state, detailsEvent)}
                        </span>
                      )}
                    </div>
                    <h3 className="mt-3 text-2xl font-semibold leading-tight">{detailsEvent.title}</h3>
                  </div>
                </div>

                <div className="max-h-[86vh] overflow-y-auto p-5 sm:p-6 lg:p-7">
                  <div className="space-y-4">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: D.accentText }}>
                        Детали события
                      </div>
                      <h3 className="mt-2 text-2xl font-semibold leading-tight" style={{ color: D.text }}>
                        {detailsEvent.title}
                      </h3>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="rounded-xl border p-3" style={{ borderColor: D.borderSoft, background: D.panel }}>
                        <div className="mb-1 flex items-center gap-2 text-xs font-medium" style={{ color: D.textMuted }}>
                          <Calendar size={14} />
                          Дата и время
                        </div>
                        <div className="text-sm font-semibold" style={{ color: D.text }}>
                          {formatDateLong(detailsEvent.dateTime)} · {formatDateTime(detailsEvent.dateTime).time}
                        </div>
                      </div>
                      <div className="rounded-xl border p-3" style={{ borderColor: D.borderSoft, background: D.panel }}>
                        <div className="mb-1 flex items-center gap-2 text-xs font-medium" style={{ color: D.textMuted }}>
                          <MapPin size={14} />
                          Площадка
                        </div>
                        <div className="text-sm font-semibold" style={{ color: D.text }}>
                          {detailsEvent.city} · {detailsEvent.venue}
                        </div>
                      </div>
                      <div className="rounded-xl border p-3" style={{ borderColor: D.borderSoft, background: D.panel }}>
                        <div className="mb-1 flex items-center gap-2 text-xs font-medium" style={{ color: D.textMuted }}>
                          Возрастная категория
                        </div>
                        <div className="text-sm font-semibold" style={{ color: D.text }}>
                          {getEventAgeCategory(state, detailsEvent) || "—"}
                        </div>
                      </div>
                    </div>

                    <p className="text-sm leading-6" style={{ color: D.textSoft }}>
                      {detailsEvent.description}
                    </p>

                    <div className="rounded-xl border p-4" style={{ borderColor: D.borderSoft, background: D.card }}>
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <div>
                          <h4 className="text-sm font-semibold" style={{ color: D.text }}>
                            Покупка билета
                          </h4>
                          <p className="mt-1 text-xs" style={{ color: D.textMuted }}>
                            Категория и количество для покупки.
                          </p>
                        </div>
                        <div className="rounded-full px-3 py-1 text-xs font-semibold" style={{ background: D.accentSoft, color: D.accentText }}>
                          {getEventIssuedCount(state, detailsEvent.eventId)} {formatTicketWord(getEventIssuedCount(state, detailsEvent.eventId))}
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_130px]">
                        <label className="block">
                          <span className="mb-1.5 block text-xs font-medium" style={{ color: D.textMuted }}>
                            Категория билета
                          </span>
                          <select
                            value={selectedTier}
                            onChange={(e) => setSelectedTier(e.target.value)}
                            className="h-11 w-full rounded-lg border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-blue-100"
                            style={{ borderColor: D.border, color: D.text }}
                          >
                            {detailsEvent.tiers.map((tier) => {
                              const available = getTierIssuedCount(state, detailsEvent.eventId, tier.name);
                              return (
                                <option key={tier.name} value={tier.name} disabled={available === 0}>
                                  {tier.name} — {tier.price} BYN{available === 0 ? " (нет мест)" : ""}
                                </option>
                              );
                            })}
                          </select>
                        </label>

                        <label className="block">
                          <span className="mb-1.5 block text-xs font-medium" style={{ color: D.textMuted }}>
                            Количество
                          </span>
                          <input
                            type="number"
                            min={1}
                            max={6}
                            value={quantity}
                            onChange={(e) => setQuantity(Math.max(1, Math.min(6, Number(e.target.value) || 1)))}
                            className="h-11 w-full rounded-lg border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-blue-100"
                            style={{ borderColor: D.border, color: D.text }}
                          />
                        </label>
                      </div>

                      <div className="mt-4 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: D.borderSoft }}>
                        <div>
                          <div className="text-xs" style={{ color: D.textMuted }}>
                            Итого
                          </div>
                          <div className="text-2xl font-semibold" style={{ color: D.text }}>
                            {totalPrice || 0} <span className="text-sm font-medium" style={{ color: D.textMuted }}>BYN</span>
                          </div>
                        </div>
                        <button
                          onClick={openCheckout}
                          className="h-11 rounded-lg px-5 text-sm font-semibold transition hover:brightness-95 sm:min-w-[160px]"
                          style={{ background: D.accent, color: "#FFFFFF" }}
                        >
                          Купить билет
                        </button>
                      </div>
                    </div>

                    {checkoutOpen && (
                      <div className="rounded-xl border p-4" style={{ background: D.panel, borderColor: D.borderSoft }}>
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ background: D.accentSoft, color: D.accent }}>
                            <Ticket size={18} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-sm font-semibold" style={{ color: D.text }}>
                              Подтверждение покупки
                            </h4>
                            <p className="mt-1 text-sm" style={{ color: D.textMuted }}>
                              {selectedTier} × {quantity} · Итого {totalPrice} BYN
                            </p>
                          </div>
                        </div>

                        <label className="mt-4 block">
                          <span className="mb-1.5 flex items-center gap-2 text-xs font-medium" style={{ color: D.textMuted }}>
                            <User size={14} />
                            Имя покупателя
                          </span>
                          <input
                            value={buyerName}
                            onChange={(e) => setBuyerName(e.target.value)}
                            placeholder="Введите имя"
                            className="h-11 w-full rounded-lg border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-blue-100"
                            style={{ borderColor: D.border, color: D.text }}
                          />
                        </label>

                        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                          <button
                            onClick={() => setCheckoutOpen(false)}
                            className="h-10 rounded-lg border px-4 text-sm font-semibold"
                            style={{ borderColor: D.border, color: D.textSoft, background: D.card }}
                          >
                            Отмена
                          </button>
                          <button onClick={confirmPurchase} className="h-10 rounded-lg px-5 text-sm font-semibold" style={{ background: D.accent, color: "#FFFFFF" }}>
                            Подтвердить
                          </button>
                        </div>
                      </div>
                    )}

                    {successTicketId && (
                      <div className="rounded-xl border p-4" style={{ background: D.successSoft, borderColor: "rgba(4,120,87,0.18)" }}>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 size={18} style={{ color: D.success }} />
                          <h4 className="text-sm font-semibold" style={{ color: D.success }}>
                            Покупка успешна
                          </h4>
                        </div>
                        <p className="mt-2 text-xs font-mono" style={{ color: D.textSoft }}>
                          ID билета: {successTicketId}
                        </p>
                        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                          <button onClick={() => setTicketsOpen(true)} className="h-10 rounded-lg px-4 text-sm font-semibold" style={{ background: D.accent, color: "#FFFFFF" }}>
                            Мои билеты
                          </button>
                          <button
                            onClick={() => setDetailsEventId(null)}
                            className="h-10 rounded-lg border px-4 text-sm font-semibold"
                            style={{ borderColor: D.border, color: D.textSoft, background: D.card }}
                          >
                            Вернуться к афише
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {ticketsOpen && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setTicketsOpen(false)}>
          <div className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm" />
          <aside
            className="relative h-full w-full max-w-md overflow-y-auto bg-white shadow-2xl"
            style={{ borderLeft: `1px solid ${D.borderSoft}` }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white/95 px-5 py-4 backdrop-blur" style={{ borderColor: D.borderSoft }}>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: D.accentSoft, color: D.accent }}>
                  <Ticket size={18} />
                </div>
                <div>
                  <h3 className="text-base font-semibold" style={{ color: D.text }}>
                    Мои билеты
                  </h3>
                  <p className="text-xs" style={{ color: D.textMuted }}>
                    {myTickets.length} {formatTicketWord(myTickets.length)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setTicketsOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full border transition hover:bg-slate-50"
                style={{ borderColor: D.borderSoft, color: D.textSoft }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5">
              {myTickets.length === 0 ? (
                <div className="flex min-h-[360px] flex-col items-center justify-center text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl" style={{ background: D.accentSoft, color: D.accent }}>
                    <Ticket size={28} />
                  </div>
                  <h4 className="mt-5 text-base font-semibold" style={{ color: D.text }}>
                    Билетов пока нет
                  </h4>
                  <p className="mt-2 max-w-xs text-sm leading-6" style={{ color: D.textMuted }}>
                    Выберите событие в афише и оформите покупку, чтобы билет появился здесь.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {myTickets.map((ticket) => {
                    const storedTicket = state.tickets.find((item) => item.ticketId === ticket.ticketId);
                    const isRefunded = ticket.status === "refunded" || storedTicket?.status === "refunded";
                    const refundReason = getTicketRefundBlockReason(state, ticket.ticketId);
                    return (
                    <article key={ticket.ticketId} className="rounded-xl border bg-white p-4" style={{ borderColor: D.borderSoft, boxShadow: D.shadowSmall }}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h4 className="text-sm font-semibold leading-5" style={{ color: D.text }}>
                            {ticket.eventTitle}
                          </h4>
                          <p className="mt-1 text-xs" style={{ color: D.textMuted }}>
                            {ticket.date} · {ticket.time}
                          </p>
                        </div>
                        <span
                          className="shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold"
                          style={{ background: isRefunded ? D.warningSoft : D.successSoft, color: isRefunded ? D.warning : D.success }}
                        >
                          {isRefunded ? "возвращён" : "подтвержден"}
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                        {[
                          ["Город", ticket.city],
                          ["Площадка", ticket.venue],
                          ["Категория", `${ticket.selectedPriceCategory} × ${ticket.quantity}`],
                          ["Покупатель", ticket.buyerName],
                        ].map(([label, value]) => (
                          <div key={label} className="min-w-0 rounded-lg p-2" style={{ background: D.panel }}>
                            <div style={{ color: D.textMuted }}>{label}</div>
                            <div className="truncate font-medium" style={{ color: D.textSoft }}>
                              {value}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-3 border-t pt-3" style={{ borderColor: D.borderSoft }}>
                        <span className="truncate text-[11px] font-mono" style={{ color: D.textMuted }}>
                          {ticket.ticketId}
                        </span>
                        <span className="shrink-0 text-[11px]" style={{ color: D.textMuted }}>
                          {ticket.purchasedAt.replace("T", " ").slice(0, 16)}
                        </span>
                      </div>
                      <div className="mt-3">
                        {!refundReason ? (
                          <button
                            type="button"
                            onClick={() => handleRefundTicket(ticket.ticketId)}
                            className="h-9 w-full rounded-lg px-3 text-sm font-semibold"
                            style={{ background: D.danger, color: "#FFFFFF" }}
                          >
                            Вернуть билет
                          </button>
                        ) : (
                          <div className="rounded-lg px-3 py-2 text-xs leading-5" style={{ background: D.warningSoft, color: D.warning }}>
                            {refundReason}
                          </div>
                        )}
                      </div>
                    </article>
                    );
                  })}
                </div>
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
