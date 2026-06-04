import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Toaster as Sonner } from "@/components/ui/sonner";
import HelpTooltip from "@/components/ui/help-tooltip";
import SeatMapModal from "@/components/seatmap/SeatMapModal";
import SeatMapPreview from "@/components/seatmap/SeatMapPreview";
import { useStorageSync } from "@/hooks/useStorageSync";
import type { AppState, EventComplianceApplicationRecord, EventRecord, OrganizerDocument, OrganizerFinanceOperation, OrganizerFinanceReceipt, OrganizerSaleRecord } from "@/lib/store";
import { calculateComplianceFee, calculateComplianceFeeAmount, DEMO_TOP_UP_AMOUNT, getCompliancePaymentStatus, getEventSeatsWithSalesState, getEventSeatSummary, getOrganizerFinancialAccount, getSalesChannelLabel, getSeatMapLayout, logoutOrganizer, topUpOrganizerBalance } from "@/lib/store";
import { formatDisplayId, getEventStatusLabel, getOperationTypeLabel } from "@/lib/display";
import {
  calculateOrganizerFinance,
  calculateOrganizerSettlementReport,
  type OrganizerSettlementEventRow,
  type OrganizerSettlementReport,
} from "@/lib/finance";
import {
  selectCurrentOrganizer,
  selectMyEventComplianceApplications,
  selectMyDocuments,
  selectMyEvents,
  selectMySales,
} from "@/lib/organizerSelectors";
import {
  BarChart3,
  Calendar,
  ChevronDown,
  FileText,
  FolderOpen,
  HelpCircle,
  LayoutDashboard,
  Megaphone,
  Plus,
  ReceiptText,
  Search,
  ShieldCheck,
  TrendingUp,
  User,
  Wallet,
  X,
} from "lucide-react";

type Section = "dashboard" | "financial" | "applications" | "events" | "sales" | "reports" | "marketing" | "documents" | "support";
type AppFilter = "all" | "draft" | "submitted" | "approved" | "rejected" | "needs_rework";
type SortDirection = "asc" | "desc";

const sidebarItems: { id: Section; label: string; icon: React.ElementType; demo?: boolean }[] = [
  { id: "dashboard", label: "Дашборд", icon: LayoutDashboard },
  { id: "applications", label: "Заявки", icon: FileText },
  { id: "events", label: "Мероприятия", icon: Calendar },
  { id: "sales", label: "Продажи и билеты", icon: BarChart3 },
  { id: "reports", label: "Отчетность", icon: BarChart3 },
  { id: "marketing", label: "Маркетинг", icon: Megaphone, demo: true },
  { id: "documents", label: "Документы", icon: FolderOpen },
  { id: "support", label: "Поддержка", icon: HelpCircle },
];

const pendingLockedSections: Section[] = ["applications", "events", "sales", "reports", "marketing"];

const statusStyle: Record<string, React.CSSProperties> = {
  draft: { background: "rgba(148,163,184,0.18)", color: "#94A3B8" },
  submitted: { background: "rgba(59,130,246,0.18)", color: "#3B82F6" },
  approved: { background: "rgba(34,197,94,0.18)", color: "#22C55E" },
  rejected: { background: "rgba(239,68,68,0.18)", color: "#EF4444" },
  needs_rework: { background: "rgba(245,158,11,0.18)", color: "#F59E0B" },
};

const statusLabel: Record<string, string> = {
  draft: "Черновик",
  submitted: "На рассмотрении",
  approved: "Одобрено",
  rejected: "Отклонено",
  needs_rework: "Требует доработки",
};

const T = {
  pageBg: "#0B0F14",
  sidebarBg: "#0F1620",
  cardBg: "#111A24",
  border: "rgba(255,255,255,0.06)",
  textPrimary: "#F5F7FA",
  textSecondary: "rgba(245,247,250,0.84)",
  textMuted: "rgba(245,247,250,0.62)",
  gold: "#F2C94C",
  goldBg: "rgba(242,201,76,0.14)",
  goldBgHover: "rgba(242,201,76,0.08)",
  goldBorder: "rgba(242,201,76,0.25)",
  tableHeaderBg: "rgba(255,255,255,0.04)",
  cardShadow: "0 14px 40px rgba(0,0,0,0.35)",
  cardGradient: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0))",
  btnSecondaryBorder: "rgba(255,255,255,0.12)",
  btnSecondaryHover: "rgba(255,255,255,0.04)",
};

const EVENT_POSTER_FALLBACK = "/placeholder.svg";

function resolvePublicAsset(path: string): string {
  const assetPath = path || EVENT_POSTER_FALLBACK;
  if (/^(https?:|data:|blob:)/.test(assetPath)) return assetPath;
  const base = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
  return `${base}${assetPath.startsWith("/") ? assetPath : `/${assetPath}`}`;
}

function fmtDateTime(v: string): string {
  return v?.replace("T", " ").slice(0, 16) || "—";
}

function getComplianceByEvent(state: AppState, event: EventRecord): EventComplianceApplicationRecord | null {
  return state.eventComplianceApplications.find((app) =>
    app.eventComplianceApplicationId === event.complianceApplicationId ||
    app.linkedEventId === event.eventId ||
    (app.organizerId === event.organizerId && app.data.title === event.title)
  ) || null;
}

function getEventAgeCategory(state: AppState, event: EventRecord): string {
  return getComplianceByEvent(state, event)?.data.ageCategory || "—";
}

function formatMoney(value: number): string {
  return `${value.toFixed(2)} BYN`;
}

function sortDir(next: boolean): SortDirection {
  return next ? "asc" : "desc";
}

function CardHelp({ text }: { text: string }) {
  return (
    <div className="absolute right-4 top-4 z-10">
      <HelpTooltip text={text} />
    </div>
  );
}

export default function OrganizerPage() {
  const navigate = useNavigate();
  const { state, update } = useStorageSync();
  const organizer = selectCurrentOrganizer(state);

  const [activeSection, setActiveSection] = useState<Section>("dashboard");
  const [drawerApp, setDrawerApp] = useState<EventComplianceApplicationRecord | null>(null);
  const [drawerEvent, setDrawerEvent] = useState<EventRecord | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileCardOpen, setProfileCardOpen] = useState(false);

  const [search, setSearch] = useState("");
  const [appFilter, setAppFilter] = useState<AppFilter>("all");
  const [appSort, setAppSort] = useState<{ key: "title" | "city" | "dateTime" | "capacity" | "status"; dir: SortDirection } | null>(null);
  const [eventSort, setEventSort] = useState<{ key: "title" | "city" | "dateTime" | "capacity" | "status"; dir: SortDirection } | null>(null);

  const myComplianceApplications = useMemo(() => selectMyEventComplianceApplications(state), [state]);
  const myEvents = useMemo(() => selectMyEvents(state), [state]);
  const mySales = useMemo(() => selectMySales(state), [state]);
  const myDocuments = useMemo(() => selectMyDocuments(state), [state]);
  const organizerFinance = useMemo(() => (
    organizer
      ? calculateOrganizerFinance(state, organizer.organizerId)
      : { currentRevenue: 0, soldTickets: 0, amountDue: 0, openEvents: 0, commissionPercent: 5 }
  ), [organizer, state]);
  const organizerFinancialAccount = useMemo(() => (
    organizer
      ? getOrganizerFinancialAccount(state, organizer.organizerId)
      : { balance: 0, available: 0, reserved: 0, operations: [], receipts: [] }
  ), [organizer, state]);
  const organizerSettlementReport = useMemo(() => (
    organizer
      ? calculateOrganizerSettlementReport(state, organizer.organizerId)
      : {
          openEvents: [],
          closedEvents: [],
          openSummary: { revenue: 0, soldTickets: 0, amountDue: 0 },
          closedSummary: { revenue: 0, soldTickets: 0, amountDue: 0 },
          totalRevenue: 0,
          totalSoldTickets: 0,
          totalAmountDue: 0,
          paidAmount: 0,
          remainingDue: 0,
          commissionPercent: 5,
        }
  ), [organizer, state]);
  const isOrganizerApproved = useMemo(() => {
    if (!organizer) return false;
    if (organizer.accountStatus === "активен") return true;
    const latestOrganizerApplication = state.organizerApplications
      .filter((attempt) => attempt.organizerId === organizer.organizerId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
    return latestOrganizerApplication?.status === "approved";
  }, [organizer, state.organizerApplications]);

  const recentOps = useMemo(() => {
    const allowedEventIds = new Set(myEvents.map((e) => e.eventId));
    return state.ops.filter((op) => allowedEventIds.has(op.eventId)).slice(-6).reverse();
  }, [state.ops, myEvents]);

  const upcomingEvents = useMemo(() => {
    return [...myEvents]
      .sort((a, b) => a.dateTime.localeCompare(b.dateTime))
      .slice(0, 5);
  }, [myEvents]);

  const filteredApplications = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = myComplianceApplications.filter((a) => {
      if (appFilter !== "all" && a.status !== appFilter) return false;
      if (!q) return true;
      return [
        a.eventComplianceApplicationId,
        a.data.title,
        a.data.venueName,
        a.data.venueAddress,
        a.data.eventType,
        a.adminComment,
      ].join(" ").toLowerCase().includes(q);
    });
    if (!appSort) return filtered;
    const sorted = [...filtered].sort((a, b) => {
      const va = String(appSort.key === "title" ? a.data.title : appSort.key === "dateTime" ? a.data.dateSlots[0] : appSort.key === "status" ? a.status : appSort.key === "city" ? a.data.venueAddress : (a.data.projectedCapacity ?? 0));
      const vb = String(appSort.key === "title" ? b.data.title : appSort.key === "dateTime" ? b.data.dateSlots[0] : appSort.key === "status" ? b.status : appSort.key === "city" ? b.data.venueAddress : (b.data.projectedCapacity ?? 0));
      return appSort.dir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
    });
    return sorted;
  }, [myComplianceApplications, appFilter, search, appSort]);

  const filteredEvents = useMemo(() => {
    const filtered = [...myEvents];
    if (!eventSort) return filtered;
    return filtered.sort((a, b) => {
      const va = String(a[eventSort.key]);
      const vb = String(b[eventSort.key]);
      return eventSort.dir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
    });
  }, [myEvents, eventSort]);
  const latestOrganizerApplication = useMemo(() => {
    if (!organizer) return null;
    return state.organizerApplications
      .filter((application) => application.organizerId === organizer.organizerId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] || null;
  }, [organizer, state.organizerApplications]);

  const handleLogout = () => {
    logoutOrganizer(state);
    update({ ...state });
    navigate("/organizer/login", { replace: true });
  };

  const handleTopUpBalance = () => {
    if (!organizer) return;
    topUpOrganizerBalance(state, organizer.organizerId);
    update({ ...state });
    toast.success(`Счёт пополнен на ${formatMoney(DEMO_TOP_UP_AMOUNT)}.`);
  };

  if (!organizer) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: T.pageBg, color: T.textPrimary }}>
        <Sonner
          theme="dark"
          toastOptions={{
            style: { background: T.cardBg, border: `1px solid ${T.border}`, color: T.textPrimary },
          }}
        />
        <div className="w-full max-w-3xl rounded-[22px] border p-8" style={{ background: T.cardBg, borderColor: T.border, boxShadow: T.cardShadow }}>
          <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold" style={{ borderColor: T.goldBorder, background: T.goldBg, color: T.gold }}>
            Реестр организаторов
          </div>
          <h1 className="mt-5 text-3xl font-bold" style={{ color: T.textPrimary }}>Кабинет организатора</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6" style={{ color: T.textSecondary }}>
            Для подачи заявок на мероприятия организация должна быть включена в реестр. Начните с демонстрационной заявки на регистрацию организатора.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => navigate("/organizer/register")}
              className="h-11 rounded-xl px-5 text-sm font-semibold"
              style={{ background: T.gold, color: "#111" }}
            >
              Стать организатором
            </button>
            <button
              onClick={() => navigate("/organizer/login")}
              className="h-11 rounded-xl border px-5 text-sm font-semibold"
              style={{ borderColor: T.btnSecondaryBorder, color: T.textPrimary, background: "transparent" }}
            >
              Войти в кабинет
            </button>
          </div>
        </div>
      </div>
    );
  }

  const submittedAt = latestOrganizerApplication?.submittedAt || latestOrganizerApplication?.createdAt || "";

  const showPendingSectionToast = () => {
    toast.info("Раздел будет доступен после включения организации в реестр.");
  };

  const refreshPendingStatus = () => {
    toast.info("Статус заявки пока не изменился. Ожидайте решения Центра Управления.");
  };

  const openUnpCheck = () => {
    if (!isOrganizerApproved) {
      toast.success(`УНП подтвержден: ${organizer.unp || "—"}. Сведения синхронизированы в demo-режиме.`);
      return;
    }
    toast.success(`УНП подтвержден: ${organizer.unp}. Организатор зарегистрирован в реестре. Данные актуальны на 15.04.2026.`);
  };

  const sectionTiles: { id: Section; label: string; desc: string; icon: React.ElementType }[] = [
    { id: "applications", label: "Новая заявка", desc: "Создать заявку на мероприятие", icon: Plus },
    { id: "applications", label: "Мои заявки", desc: "Управление статусами заявок", icon: FileText },
    { id: "reports", label: "Отчетность", desc: "Финансовые показатели и расчеты с платформой", icon: BarChart3 },
    { id: "marketing", label: "Маркетинг", desc: "Раздел будет расширен позже", icon: Megaphone },
    { id: "documents", label: "Документы", desc: "Реестр, договоры, реквизиты", icon: FolderOpen },
    { id: "support", label: "Поддержка", desc: "Каналы связи и AI-помощник", icon: HelpCircle },
  ];

  return (
    <div className="min-h-screen flex" style={{ background: T.pageBg, color: T.textPrimary }}>
      <Sonner
        theme="dark"
        toastOptions={{
          style: { background: T.cardBg, border: `1px solid ${T.border}`, color: T.textPrimary },
        }}
      />
      {isOrganizerApproved && (
        <div className="fixed right-5 bottom-5 z-20 inline-flex items-center gap-1">
          <button
            onClick={() => navigate("/organizer/compliance")}
            className="px-4 h-10 rounded-xl text-sm font-semibold shadow-lg"
            style={{ background: T.gold, color: "#111" }}
          >
            Новая заявка
          </button>
          <HelpTooltip text="Создать новую заявку на проведение мероприятия." />
        </div>
      )}

      <aside className="w-60 min-h-screen border-r flex-shrink-0 flex flex-col" style={{ background: T.sidebarBg, borderColor: T.border }}>
        <div className="px-5 py-5 border-b" style={{ borderColor: T.border }}>
          <div className="font-semibold text-base" style={{ color: T.textPrimary }}>Кабинет организатора</div>
          <div className="text-xs mt-0.5" style={{ color: T.textMuted }}>Управление мероприятиями и продажами</div>
        </div>

        <nav className="flex-1 py-3 px-2 space-y-0.5">
          {sidebarItems.map((item) => {
            const active = activeSection === item.id;
            const locked = !isOrganizerApproved && pendingLockedSections.includes(item.id);
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (locked) {
                    showPendingSectionToast();
                    return;
                  }
                  setActiveSection(item.id);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-colors relative"
                style={{
                  color: active ? T.textPrimary : T.textSecondary,
                  background: active ? "rgba(242,201,76,0.10)" : "transparent",
                  cursor: locked ? "not-allowed" : "pointer",
                  opacity: locked ? 0.48 : 1,
                }}
              >
                {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full" style={{ background: T.gold }} />}
                <item.icon size={18} strokeWidth={active ? 2 : 1.5} style={{ color: active ? T.textPrimary : T.textSecondary }} />
                <span>{item.label}</span>
                {locked ? (
                  <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full font-semibold" style={{ background: "rgba(148,163,184,0.14)", color: T.textMuted }}>
                    после реестра
                  </span>
                ) : item.demo && (
                  <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full font-semibold" style={{ background: T.goldBg, color: T.gold }}>
                    демо
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <button
          onClick={() => setProfileCardOpen(true)}
          className="px-5 py-4 border-t flex items-center gap-3 text-left transition-colors"
          style={{ borderColor: T.border }}
          onMouseEnter={(e) => { e.currentTarget.style.background = T.btnSecondaryHover; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
        >
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: T.goldBg, color: T.gold }}>
            {organizer.name[0]}
          </div>
          <div>
            <div className="text-[13px] font-semibold" style={{ color: T.textPrimary }}>{organizer.name}</div>
            <div className="text-[11px]" style={{ color: T.textMuted }}>{organizer.email}</div>
          </div>
        </button>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen">
        <header className="sticky top-0 z-40 border-b flex items-center justify-between px-6 h-14" style={{ background: T.sidebarBg, borderColor: T.border }}>
          <h1 className="text-lg font-semibold" style={{ color: T.textPrimary }}>
            {activeSection === "financial" ? "Финансовый счёт" : sidebarItems.find((s) => s.id === activeSection)?.label || "Дашборд"}
          </h1>
          <div className="flex items-center gap-3">
            <button
              onClick={openUnpCheck}
              className="h-9 px-4 rounded-xl border text-[13px] font-semibold flex items-center gap-2 transition-colors"
              style={{ borderColor: T.btnSecondaryBorder, color: T.textSecondary, background: "transparent" }}
            >
              <ShieldCheck size={14} /> Проверить УНП
            </button>
            <div className="inline-flex items-center gap-1">
              <button
                onClick={() => navigate("/organizer/compliance")}
                disabled={!isOrganizerApproved}
                className="h-9 px-4 rounded-xl text-[13px] font-semibold flex items-center gap-2 org-btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: "#111111", color: "#FFF" }}
              >
                <Plus size={14} /> Создать заявку
              </button>
              {!isOrganizerApproved && <HelpTooltip text="Доступно после включения организации в реестр." />}
            </div>
            <div className="relative">
              <button
                onClick={() => setProfileOpen((v) => !v)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: T.goldBg, color: T.gold }}
              >
                {organizer.name[0]}
              </button>
              {profileOpen && (
                <div className="absolute right-0 mt-2 w-72 rounded-xl border p-4 z-50" style={{ background: T.cardBg, borderColor: T.border }}>
                  <div className="text-sm font-semibold mb-2">Профиль организатора</div>
                  <div className="space-y-1 text-xs" style={{ color: T.textSecondary }}>
                    <p><span style={{ color: T.textMuted }}>Организация:</span> {organizer.fullName}</p>
                    <p><span style={{ color: T.textMuted }}>УНП:</span> {organizer.unp}</p>
                    <p><span style={{ color: T.textMuted }}>Реестр:</span> {organizer.registryStatus}</p>
                    <p><span style={{ color: T.textMuted }}>Дата регистрации:</span> {organizer.registryRegisteredAt}</p>
                    <p><span style={{ color: T.textMuted }}>Директор:</span> {organizer.director}</p>
                    <p><span style={{ color: T.textMuted }}>Электронная почта:</span> {organizer.email}</p>
                    <p><span style={{ color: T.textMuted }}>Телефон:</span> {organizer.phone}</p>
                  </div>
                  <button onClick={handleLogout} className="mt-3 w-full h-9 rounded-lg text-sm font-semibold" style={{ background: "rgba(239,68,68,0.18)", color: "#EF4444" }}>
                    Выйти
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-[1200px] mx-auto space-y-5">
            {!isOrganizerApproved && (
              <PendingOrganizerLockedCard
                organizer={organizer}
                application={latestOrganizerApplication}
                submittedAt={submittedAt}
                onLogout={handleLogout}
                onRefresh={refreshPendingStatus}
              />
            )}

            {activeSection === "dashboard" && isOrganizerApproved && (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: "Текущая выручка", value: formatMoney(organizerFinance.currentRevenue), icon: TrendingUp, tooltip: "Выручка по открытым мероприятиям: учитываются только проданные и не возвращённые билеты.", onClick: () => setActiveSection("reports") },
                      { label: "Продано билетов", value: String(organizerFinance.soldTickets), icon: BarChart3, tooltip: "Количество проданных билетов по открытым мероприятиям без возвращённых билетов.", onClick: () => setActiveSection("sales") },
                      { label: "Баланс", value: formatMoney(organizerFinancialAccount.balance), icon: Wallet, tooltip: "Текущий баланс финансового счёта организатора. Нажмите карточку, чтобы открыть операции и квитанции.", onClick: () => setActiveSection("financial") },
                      { label: "Открытые мероприятия", value: String(organizerFinance.openEvents), icon: Calendar, tooltip: "Опубликованные мероприятия, дата и время которых ещё не прошли.", onClick: () => setActiveSection("events") },
                    ].map((k) => (
                    <div key={k.label} className="relative">
                    <button
                      type="button"
                      onClick={k.onClick}
                      className="rounded-[18px] border p-5 text-left transition-all duration-200 hover:-translate-y-0.5 w-full"
                      style={{ background: T.cardBg, backgroundImage: T.cardGradient, borderColor: T.border, boxShadow: T.cardShadow, cursor: "pointer" }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: T.goldBg }}>
                          <k.icon size={18} style={{ color: T.gold }} />
                        </div>
                      </div>
                      <div className="text-[28px] font-bold" style={{ color: T.textPrimary }}>{k.value}</div>
                      <div className="text-[13px] mt-1" style={{ color: T.textSecondary }}>{k.label}</div>
                    </button>
                    <CardHelp text={k.tooltip} />
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="rounded-[18px] border p-6 relative" style={{ background: T.cardBg, borderColor: T.border, boxShadow: T.cardShadow }}>
                    <CardHelp text="Показывает регистрационные данные организатора, статус в реестре, состояние пошлин и количество заявок." />
                    <h2 className="text-lg font-semibold mb-4" style={{ color: T.textPrimary }}>Статус организатора</h2>
                    <dl className="space-y-3 text-[13px]">
                      <Row dt="УНП" dd={organizer.unp} />
                      <Row dt="Статус" dd={organizer.registryStatus} />
                      <Row dt="Дата регистрации" dd={organizer.registryRegisteredAt} />
                      <Row dt="Пошлины" dd={organizer.feesStatus} />
                      <Row dt="Всего заявок" dd={String(myComplianceApplications.length)} />
                    </dl>
                  </div>

                  <div className="rounded-[18px] border p-6 relative" style={{ background: T.cardBg, borderColor: T.border, boxShadow: T.cardShadow }}>
                    <CardHelp text="Показывает последние операции по мероприятиям и билетам организатора." />
                    <h2 className="text-lg font-semibold mb-4" style={{ color: T.textPrimary }}>Последние действия</h2>
                    {recentOps.length === 0 ? (
                      <p className="text-[13px]" style={{ color: T.textSecondary }}>Пока нет действий.</p>
                    ) : (
                      <div className="space-y-2">
                        {recentOps.map((op) => (
                          <div key={op.opId} className="flex items-center justify-between py-2 border-b" style={{ borderColor: T.border }}>
                            <span className="text-[12px]" style={{ color: T.textSecondary }}>
                              {getOperationTypeLabel(op.type)} · {formatDisplayId(op.ticketId || op.eventId)}
                            </span>
                            <span className="text-[11px] px-2 py-0.5 rounded-full" style={op.result === "ok" ? { background: "rgba(34,197,94,0.18)", color: "#22C55E" } : { background: "rgba(239,68,68,0.18)", color: "#EF4444" }}>
                              {op.result === "ok" ? "Успешно" : "Ошибка"}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-[18px] border p-6 relative" style={{ background: T.cardBg, borderColor: T.border, boxShadow: T.cardShadow }}>
                  <CardHelp text="Показывает ближайшие одобренные мероприятия организатора." />
                  <h2 className="text-lg font-semibold mb-4" style={{ color: T.textPrimary }}>Ближайшие мероприятия</h2>
                  <EventsTable rows={upcomingEvents} state={state} compact />
                </div>

                <div>
                  <h2 className="text-lg font-semibold mb-4" style={{ color: T.textPrimary }}>Разделы</h2>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    {sectionTiles.map((tile) => (
                      <div key={tile.label} className="relative">
                      <button
                        onClick={() => tile.id === "applications" && tile.label === "Новая заявка" ? navigate("/organizer/compliance") : setActiveSection(tile.id)}
                        className="rounded-[18px] border p-5 text-left transition-all duration-200 hover:-translate-y-0.5 group w-full"
                        style={{ background: T.cardBg, borderColor: T.border }}
                      >
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: T.goldBg }}>
                          <tile.icon size={20} style={{ color: T.gold }} />
                        </div>
                        <div className="text-[14px] font-semibold mb-1">{tile.label}</div>
                        <div className="text-[12px]" style={{ color: T.textSecondary }}>{tile.desc}</div>
                      </button>
                      <CardHelp text={tile.label === "Новая заявка" ? "Создать новую заявку на проведение мероприятия." : tile.label === "Мои заявки" ? "Перейти к списку всех отправленных и черновых заявок." : tile.label === "Отчетность" ? "Просмотреть отчёты и финансовые показатели." : tile.label === "Маркетинг" ? "Раздел временно недоступен и будет расширен позже." : tile.label === "Документы" ? "Перейти к реестру документов и удостоверений." : "Контакты и каналы связи со службой поддержки."} />
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {activeSection === "financial" && isOrganizerApproved && (
              <FinancialAccountSection
                account={organizerFinancialAccount}
                applications={myComplianceApplications}
                onBack={() => setActiveSection("dashboard")}
                onTopUp={handleTopUpBalance}
              />
            )}

            {activeSection === "applications" && isOrganizerApproved && (
              <ApplicationsTable
                rows={filteredApplications}
                search={search}
                setSearch={setSearch}
                appFilter={appFilter}
                setAppFilter={setAppFilter}
                sort={appSort}
                setSort={setAppSort}
                onOpen={setDrawerApp}
                onCreateNew={() => navigate("/organizer/compliance")}
                onEdit={(id) => navigate(`/organizer/compliance?edit=${id}`)}
              />
            )}

            {activeSection === "events" && isOrganizerApproved && (
              <EventsSection rows={filteredEvents} state={state} sort={eventSort} setSort={setEventSort} onOpen={setDrawerEvent} />
            )}

            {activeSection === "sales" && isOrganizerApproved && (
              <SalesSection rows={mySales} />
            )}

            {activeSection === "reports" && isOrganizerApproved && (
              <ReportsSection report={organizerSettlementReport} />
            )}

            {activeSection === "documents" && isOrganizerApproved && (
              <DocumentsSection rows={myDocuments} complianceRows={myComplianceApplications} />
            )}

            {activeSection === "support" && isOrganizerApproved && (
              <SupportSection />
            )}

            {activeSection === "marketing" && isOrganizerApproved && (
              <SimpleCard title="Маркетинг" text="Раздел будет расширен в следующих версиях демо-кабинета." tooltipText="Раздел маркетинга в демонстрационном режиме. Будет расширен позже." />
            )}
          </div>
        </main>
      </div>

      {drawerApp && (
        <ApplicationDetailsDrawer app={drawerApp} state={state} onClose={() => setDrawerApp(null)} />
      )}

      {drawerEvent && (
        <EventDetailsDrawer event={drawerEvent} state={state} onClose={() => setDrawerEvent(null)} />
      )}

      {profileCardOpen && (
        <OrganizerProfileCard organizer={organizer} onClose={() => setProfileCardOpen(false)} />
      )}

      <style>{`
        .org-btn-primary {
          transition: box-shadow 0.2s, border-color 0.2s;
          border: 1px solid transparent;
        }
        .org-btn-primary:hover:not(:disabled) {
          border-color: rgba(242,201,76,0.35);
          box-shadow: 0 0 0 4px rgba(242,201,76,0.08);
        }
      `}</style>
    </div>
  );
}

function Row({ dt, dd }: { dt: string; dd: string }) {
  return (
    <div className="flex justify-between">
      <dt style={{ color: T.textSecondary }}>{dt}</dt>
      <dd className="font-medium" style={{ color: T.textPrimary }}>{dd}</dd>
    </div>
  );
}

function PendingOrganizerLockedCard({
  organizer,
  application,
  submittedAt,
  onLogout,
  onRefresh,
}: {
  organizer: NonNullable<ReturnType<typeof selectCurrentOrganizer>>;
  application: AppState["organizerApplications"][number] | null;
  submittedAt: string;
  onLogout: () => void;
  onRefresh: () => void;
}) {
  return (
    <div className="rounded-[22px] border p-8 relative" style={{ background: T.cardBg, borderColor: T.border, boxShadow: T.cardShadow }}>
      <CardHelp text="Статус заявки на включение организации в реестр. Создание мероприятий откроется после одобрения." />
      <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold" style={{ borderColor: T.goldBorder, background: T.goldBg, color: T.gold }}>
        Статус: на рассмотрении
      </div>
      <h2 className="mt-5 text-3xl font-bold" style={{ color: T.textPrimary }}>Заявка на включение в реестр подана</h2>
      <p className="mt-3 max-w-3xl text-sm leading-6" style={{ color: T.textSecondary }}>
        До включения в реестр подача заявок на мероприятия недоступна.<br />
        Кабинет будет разблокирован после одобрения заявки оператором Центра Управления.<br />
        Результат будет направлен на указанный email.
      </p>
      <dl className="mt-6 grid gap-3 rounded-xl border p-4 text-sm md:grid-cols-2" style={{ borderColor: T.border, background: T.sidebarBg }}>
        <Row dt="Организация" dd={organizer.fullName || organizer.name || "—"} />
        <Row dt="ID заявки" dd={application?.organizerApplicationId || "—"} />
        <Row dt="Подано" dd={submittedAt ? fmtDateTime(submittedAt) : "—"} />
        <Row dt="УНП" dd={organizer.unp || "—"} />
        <Row dt="Email" dd={organizer.email || "—"} />
      </dl>
      <div className="mt-6 flex flex-wrap gap-3">
        <button
          onClick={onRefresh}
          className="h-11 rounded-xl border px-5 text-sm font-semibold"
          style={{ borderColor: T.btnSecondaryBorder, color: T.textPrimary, background: "transparent" }}
        >
          Обновить статус
        </button>
        <button
          onClick={onLogout}
          className="h-11 rounded-xl border px-5 text-sm font-semibold"
          style={{ borderColor: "rgba(239,68,68,0.35)", color: "#EF4444", background: "rgba(239,68,68,0.10)" }}
        >
          Выйти
        </button>
      </div>
    </div>
  );
}

function SortableHeader({ label, active, direction, onClick }: { label: string; active: boolean; direction: SortDirection | null; onClick: () => void }) {
  return (
    <button onClick={onClick} className="inline-flex items-center gap-1" style={{ color: T.textPrimary }}>
      <span>{label}</span>
      <ChevronDown size={12} style={{ opacity: active ? 1 : 0.3, transform: direction === "asc" ? "rotate(180deg)" : "rotate(0deg)" }} />
    </button>
  );
}

function ApplicationsTable({
  rows,
  search,
  setSearch,
  appFilter,
  setAppFilter,
  sort,
  setSort,
  onOpen,
  onCreateNew,
  onEdit,
}: {
  rows: EventComplianceApplicationRecord[];
  search: string;
  setSearch: (s: string) => void;
  appFilter: AppFilter;
  setAppFilter: (f: AppFilter) => void;
  sort: { key: "title" | "city" | "dateTime" | "capacity" | "status"; dir: SortDirection } | null;
  setSort: (s: { key: "title" | "city" | "dateTime" | "capacity" | "status"; dir: SortDirection } | null) => void;
  onOpen: (a: EventComplianceApplicationRecord) => void;
  onCreateNew: () => void;
  onEdit: (id: string) => void;
}) {
  const setColumnSort = (key: "title" | "city" | "dateTime" | "capacity" | "status") => {
    if (!sort || sort.key !== key) {
      setSort({ key, dir: sortDir(true) });
      return;
    }
    setSort({ key, dir: sort.dir === "asc" ? "desc" : "asc" });
  };

  return (
    <div className="rounded-[18px] border p-6 relative" style={{ background: T.cardBg, borderColor: T.border, boxShadow: T.cardShadow }}>
      <CardHelp text="Список заявок на проведение мероприятий и их текущих статусов." />
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold" style={{ color: T.textPrimary }}>Мои заявки</h2>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: T.textMuted }} />
            <input
              className="border rounded-xl pl-9 pr-9 py-2 text-[13px] w-56"
              style={{ borderColor: T.btnSecondaryBorder, background: T.sidebarBg, color: T.textPrimary }}
              placeholder="Поиск"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <HelpTooltip text="Введите ID заявки, название, площадку или комментарий для поиска." />
            </div>
          </div>
          <div className="relative w-full">
          <select
            value={appFilter}
            onChange={(e) => setAppFilter(e.target.value as AppFilter)}
            className="border rounded-xl px-3 py-2 text-[13px] pr-9 w-full"
            style={{ borderColor: T.btnSecondaryBorder, background: T.sidebarBg, color: T.textPrimary }}
          >
            <option value="all">Все статусы</option>
            <option value="draft">Черновики</option>
            <option value="submitted">На рассмотрении</option>
            <option value="needs_rework">Требует доработки</option>
            <option value="approved">Одобрено</option>
            <option value="rejected">Отклонено</option>
          </select>
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <HelpTooltip text="Выберите статус для фильтрации списка." />
            </div>
          </div>
          <div className="inline-flex items-center gap-1">
          <button onClick={onCreateNew} className="h-9 px-4 rounded-xl text-[13px] font-semibold flex items-center gap-2 org-btn-primary" style={{ background: "#111111", color: "#FFF" }}>
            <Plus size={14} /> Создать
          </button>
          <HelpTooltip text="Создать новую заявку на проведение мероприятия." />
          </div>
        </div>
      </div>

      {rows.length === 0 ? (
        <SimpleEmpty title="Нет заявок" desc="Создайте первую заявку или измените фильтр." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr style={{ background: T.tableHeaderBg }}>
                <th className="py-2.5 px-3 text-left font-semibold" style={{ color: T.textPrimary }}>ID заявки</th>
                <th className="py-2.5 px-3 text-left font-semibold" style={{ color: T.textPrimary }}><SortableHeader label="Название" active={sort?.key === "title"} direction={sort?.key === "title" ? sort.dir : null} onClick={() => setColumnSort("title")} /></th>
                <th className="py-2.5 px-3 text-left font-semibold" style={{ color: T.textPrimary }}>Площадка</th>
                <th className="py-2.5 px-3 text-left font-semibold" style={{ color: T.textPrimary }}><SortableHeader label="Дата и время" active={sort?.key === "dateTime"} direction={sort?.key === "dateTime" ? sort.dir : null} onClick={() => setColumnSort("dateTime")} /></th>
                <th className="py-2.5 px-3 text-left font-semibold" style={{ color: T.textPrimary }}>Возраст</th>
                <th className="py-2.5 px-3 text-left font-semibold" style={{ color: T.textPrimary }}><SortableHeader label="Статус" active={sort?.key === "status"} direction={sort?.key === "status" ? sort.dir : null} onClick={() => setColumnSort("status")} /></th>
                <th className="py-2.5 px-3 text-left font-semibold" style={{ color: T.textPrimary }}>Комментарий администратора</th>
                <th className="py-2.5 px-3 text-left font-semibold" style={{ color: T.textPrimary }}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <tr
                  key={a.eventComplianceApplicationId}
                  className="cursor-pointer border-b transition-colors"
                  style={{ borderColor: T.border }}
                  onClick={() => onOpen(a)}
                  onMouseEnter={(event) => (event.currentTarget.style.background = "rgba(255,255,255,0.04)")}
                  onMouseLeave={(event) => (event.currentTarget.style.background = "transparent")}
                >
                  <td className="py-2.5 px-3 font-mono text-xs" style={{ color: T.textSecondary }}>{formatDisplayId(a.eventComplianceApplicationId)}</td>
                  <td className="py-2.5 px-3" style={{ color: T.textPrimary }}>{a.data.title || "—"}</td>
                  <td className="py-2.5 px-3" style={{ color: T.textSecondary }}>{a.data.venueName || "—"}</td>
                  <td className="py-2.5 px-3" style={{ color: T.textSecondary }}>{fmtDateTime(a.data.dateSlots[0] || "")}</td>
                  <td className="py-2.5 px-3" style={{ color: T.textSecondary }}>{a.data.ageCategory || "—"}</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold" style={statusStyle[a.status]}>{statusLabel[a.status]}</span>
                  </td>
                  <td className="py-2.5 px-3 text-xs" style={{ color: T.textSecondary }}>{a.adminComment || "—"}</td>
                  <td className="py-2.5 px-3 space-x-2 whitespace-nowrap" onClick={(event) => event.stopPropagation()}>
                    <span className="inline-flex items-center gap-1">
                      <button onClick={() => onOpen(a)} className="h-7 px-3 rounded-lg border text-[12px]" style={{ borderColor: T.btnSecondaryBorder, color: T.textSecondary }}>Просмотр</button>
                      <HelpTooltip text="Открыть карточку заявки для просмотра подробностей." />
                    </span>
                    {(a.status === "draft" || a.status === "needs_rework") && (
                      <span className="inline-flex items-center gap-1">
                      <button onClick={() => onEdit(a.eventComplianceApplicationId)} className="h-7 px-3 rounded-lg text-[12px]" style={{ background: "#111111", color: "#FFF" }}>
                        {a.status === "draft" ? "Продолжить" : "Доработать"}
                      </button>
                      <HelpTooltip text={a.status === "draft" ? "Продолжить редактирование черновика заявки." : "Внести правки по замечаниям администратора."} />
                    </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function EventsSection({ rows, state, sort, setSort, onOpen }: {
  rows: EventRecord[];
  state: ReturnType<typeof useStorageSync>["state"];
  sort: { key: "title" | "city" | "dateTime" | "capacity" | "status"; dir: SortDirection } | null;
  setSort: (s: { key: "title" | "city" | "dateTime" | "capacity" | "status"; dir: SortDirection } | null) => void;
  onOpen: (event: EventRecord) => void;
}) {
  const setColumnSort = (key: "title" | "city" | "dateTime" | "capacity" | "status") => {
    if (!sort || sort.key !== key) {
      setSort({ key, dir: sortDir(true) });
      return;
    }
    setSort({ key, dir: sort.dir === "asc" ? "desc" : "asc" });
  };

  return (
    <div className="rounded-[18px] border p-6 relative" style={{ background: T.cardBg, borderColor: T.border, boxShadow: T.cardShadow }}>
      <CardHelp text="Перечень мероприятий, которые прошли согласование и доступны в системе." />
      <h2 className="text-lg font-semibold mb-4" style={{ color: T.textPrimary }}>Мои мероприятия</h2>
      {rows.length === 0 ? (
        <SimpleEmpty title="Нет одобренных мероприятий" desc="Одобренные заявки автоматически появляются в этом разделе." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr style={{ background: T.tableHeaderBg }}>
                <th className="py-2.5 px-3 text-left font-semibold" style={{ color: T.textPrimary }}>Постер</th>
                <th className="py-2.5 px-3 text-left font-semibold" style={{ color: T.textPrimary }}>ID мероприятия</th>
                <th className="py-2.5 px-3 text-left font-semibold" style={{ color: T.textPrimary }}><SortableHeader label="Название" active={sort?.key === "title"} direction={sort?.key === "title" ? sort.dir : null} onClick={() => setColumnSort("title")} /></th>
                <th className="py-2.5 px-3 text-left font-semibold" style={{ color: T.textPrimary }}>Площадка</th>
                <th className="py-2.5 px-3 text-left font-semibold" style={{ color: T.textPrimary }}><SortableHeader label="Город" active={sort?.key === "city"} direction={sort?.key === "city" ? sort.dir : null} onClick={() => setColumnSort("city")} /></th>
                <th className="py-2.5 px-3 text-left font-semibold" style={{ color: T.textPrimary }}>Категория</th>
                <th className="py-2.5 px-3 text-left font-semibold" style={{ color: T.textPrimary }}>Возраст</th>
                <th className="py-2.5 px-3 text-left font-semibold" style={{ color: T.textPrimary }}>Каналы продаж</th>
                <th className="py-2.5 px-3 text-left font-semibold" style={{ color: T.textPrimary }}><SortableHeader label="Дата" active={sort?.key === "dateTime"} direction={sort?.key === "dateTime" ? sort.dir : null} onClick={() => setColumnSort("dateTime")} /></th>
                <th className="py-2.5 px-3 text-left font-semibold" style={{ color: T.textPrimary }}><SortableHeader label="Вместимость" active={sort?.key === "capacity"} direction={sort?.key === "capacity" ? sort.dir : null} onClick={() => setColumnSort("capacity")} /></th>
                <th className="py-2.5 px-3 text-left font-semibold" style={{ color: T.textPrimary }}><SortableHeader label="Статус" active={sort?.key === "status"} direction={sort?.key === "status" ? sort.dir : null} onClick={() => setColumnSort("status")} /></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((e) => (
                <tr
                  key={e.eventId}
                  className="cursor-pointer border-b transition-colors"
                  style={{ borderColor: T.border }}
                  onClick={() => onOpen(e)}
                  onMouseEnter={(event) => (event.currentTarget.style.background = "rgba(255,255,255,0.04)")}
                  onMouseLeave={(event) => (event.currentTarget.style.background = "transparent")}
                >
                  <td className="py-2.5 px-3">
                    <img src={resolvePublicAsset(e.poster)} alt={e.title} className="h-16 w-11 rounded-lg object-cover" />
                  </td>
                  <td className="py-2.5 px-3 font-mono text-xs" style={{ color: T.textSecondary }}>{formatDisplayId(e.eventId)}</td>
                  <td className="py-2.5 px-3" style={{ color: T.textPrimary }}>{e.title}</td>
                  <td className="py-2.5 px-3" style={{ color: T.textSecondary }}>{e.venue}</td>
                  <td className="py-2.5 px-3" style={{ color: T.textSecondary }}>{e.city || "—"}</td>
                  <td className="py-2.5 px-3" style={{ color: T.textSecondary }}>{e.category || "—"}</td>
                  <td className="py-2.5 px-3" style={{ color: T.textSecondary }}>{getEventAgeCategory(state, e)}</td>
                  <td className="py-2.5 px-3" style={{ color: T.textSecondary }}>{(e.salesChannels?.length ? e.salesChannels : ["OWN"]).map((code) => getSalesChannelLabel(state, code)).join(", ")}</td>
                  <td className="py-2.5 px-3" style={{ color: T.textSecondary }}>{fmtDateTime(e.dateTime)}</td>
                  <td className="py-2.5 px-3" style={{ color: T.textSecondary }}>{e.capacity}</td>
                  <td className="py-2.5 px-3" style={{ color: T.textSecondary }}>{getEventStatusLabel(e.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function EventsTable({ rows, state, compact = false }: { rows: EventRecord[]; state: ReturnType<typeof useStorageSync>["state"]; compact?: boolean }) {
  if (rows.length === 0) {
    return <SimpleEmpty title="Нет мероприятий" desc="Создайте заявку, чтобы добавить мероприятие." />;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[13px]">
        <thead>
          <tr style={{ background: T.tableHeaderBg }}>
            <th className="py-2.5 px-3 text-left font-semibold">Постер</th>
            <th className="py-2.5 px-3 text-left font-semibold">ID мероприятия</th>
            <th className="py-2.5 px-3 text-left font-semibold">Название</th>
            <th className="py-2.5 px-3 text-left font-semibold">Дата и время</th>
            <th className="py-2.5 px-3 text-left font-semibold">Возраст</th>
            {!compact && <th className="py-2.5 px-3 text-left font-semibold">Площадка</th>}
            {!compact && <th className="py-2.5 px-3 text-left font-semibold">Каналы продаж</th>}
            <th className="py-2.5 px-3 text-left font-semibold">Статус</th>
            <th className="py-2.5 px-3 text-left font-semibold">Осталось</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((e) => (
            <tr key={e.eventId} className="border-b" style={{ borderColor: T.border }}>
              <td className="py-2.5 px-3">
                <img src={resolvePublicAsset(e.poster)} alt={e.title} className="h-14 w-10 rounded-lg object-cover" />
              </td>
              <td className="py-2.5 px-3 font-mono text-xs" style={{ color: T.textSecondary }}>{formatDisplayId(e.eventId)}</td>
              <td className="py-2.5 px-3" style={{ color: T.textPrimary }}>{e.title}</td>
              <td className="py-2.5 px-3" style={{ color: T.textSecondary }}>{fmtDateTime(e.dateTime)}</td>
              <td className="py-2.5 px-3" style={{ color: T.textSecondary }}>{getEventAgeCategory(state, e)}</td>
              {!compact && <td className="py-2.5 px-3" style={{ color: T.textSecondary }}>{e.venue}</td>}
              {!compact && <td className="py-2.5 px-3" style={{ color: T.textSecondary }}>{(e.salesChannels?.length ? e.salesChannels : ["OWN"]).map((code) => getSalesChannelLabel(state, code)).join(", ")}</td>}
              <td className="py-2.5 px-3" style={{ color: T.textSecondary }}>{getEventStatusLabel(e.status)}</td>
              <td className="py-2.5 px-3" style={{ color: T.textSecondary }}>{e.remaining}/{e.capacity}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FinancialAccountSection({
  account,
  applications,
  onBack,
  onTopUp,
}: {
  account: { balance: number; available: number; reserved: number; operations: OrganizerFinanceOperation[]; receipts: OrganizerFinanceReceipt[] };
  applications: EventComplianceApplicationRecord[];
  onBack: () => void;
  onTopUp: () => void;
}) {
  const applicationById = new Map(applications.map((application) => [application.eventComplianceApplicationId, application]));
  const applicationPaymentRows = applications
    .filter((application) => application.status !== "draft")
    .map((application) => ({
      application,
      feeAmount: calculateComplianceFeeAmount(application.data),
      status: getCompliancePaymentStatus(application),
    }));

  return (
    <div className="space-y-5">
      <div className="rounded-[18px] border p-6 relative" style={{ background: T.cardBg, borderColor: T.border, boxShadow: T.cardShadow }}>
        <CardHelp text="Финансовый счёт используется в демо-режиме для пополнения баланса и оплаты обязательных пошлин по заявкам." />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <button onClick={onBack} className="mb-4 h-9 rounded-lg border px-3 text-sm" style={{ borderColor: T.btnSecondaryBorder, color: T.textSecondary, background: "transparent" }}>
              Вернуться в дашборд
            </button>
            <h2 className="text-xl font-semibold" style={{ color: T.textPrimary }}>Финансовый счёт</h2>
            <p className="mt-1 text-sm" style={{ color: T.textSecondary }}>Баланс, операции по заявкам и демонстрационные квитанции.</p>
          </div>
          <span className="inline-flex items-center gap-1">
            <button onClick={onTopUp} className="h-10 rounded-xl px-4 text-sm font-semibold" style={{ background: T.gold, color: "#111" }}>
              Пополнить счёт
            </button>
            <HelpTooltip text={`Добавляет на финансовый счёт демонстрационную сумму ${formatMoney(DEMO_TOP_UP_AMOUNT)} без подключения банка.`} />
          </span>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <MetricCard label="Текущий баланс" value={formatMoney(account.balance)} help="Общая сумма на финансовом счёте организатора." />
          <MetricCard label="Доступно к использованию" value={formatMoney(account.available)} help="Сумма, доступная для оплаты обязательных пошлин по заявкам." />
          <MetricCard label="Зарезервировано" value={formatMoney(account.reserved)} help="В текущем демонстрационном сценарии средства не резервируются отдельно." />
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <section className="rounded-[18px] border p-6 relative" style={{ background: T.cardBg, borderColor: T.border, boxShadow: T.cardShadow }}>
          <CardHelp text="История показывает пополнения, оплаты пошлин и формирование квитанций." />
          <h3 className="text-lg font-semibold mb-4" style={{ color: T.textPrimary }}>История операций</h3>
          {account.operations.length === 0 ? (
            <SimpleEmpty title="Операций пока нет" desc="После пополнения или оплаты здесь появится запись." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr style={{ background: T.tableHeaderBg }}>
                    <th className="py-2.5 px-3 text-left font-semibold">Дата</th>
                    <th className="py-2.5 px-3 text-left font-semibold">Операция</th>
                    <th className="py-2.5 px-3 text-left font-semibold">Заявка</th>
                    <th className="py-2.5 px-3 text-right font-semibold">Сумма</th>
                  </tr>
                </thead>
                <tbody>
                  {account.operations.map((operation) => (
                    <tr key={operation.financeOperationId} className="border-b" style={{ borderColor: T.border }}>
                      <td className="py-2.5 px-3" style={{ color: T.textSecondary }}>{fmtDateTime(operation.createdAt)}</td>
                      <td className="py-2.5 px-3" style={{ color: T.textPrimary }}>
                        <div className="font-medium">{operation.kind}</div>
                        <div className="text-xs" style={{ color: T.textMuted }}>{operation.title}</div>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-xs" style={{ color: T.textSecondary }}>
                        {operation.eventComplianceApplicationId ? formatDisplayId(operation.eventComplianceApplicationId) : "—"}
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold" style={{ color: operation.amount < 0 ? "#F59E0B" : "#22C55E" }}>
                        {formatMoney(operation.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded-[18px] border p-6 relative" style={{ background: T.cardBg, borderColor: T.border, boxShadow: T.cardShadow }}>
          <CardHelp text="Квитанции создаются для демонстрации подтверждения платежа или подготовленного платёжного документа." />
          <h3 className="text-lg font-semibold mb-4" style={{ color: T.textPrimary }}>Квитанции</h3>
          {account.receipts.length === 0 ? (
            <SimpleEmpty title="Квитанций пока нет" desc="Сформируйте квитанцию или оплатите пошлину по заявке." />
          ) : (
            <div className="space-y-3">
              {account.receipts.map((receipt) => (
                <div key={receipt.receiptId} className="rounded-xl border p-3" style={{ borderColor: T.border, background: T.sidebarBg }}>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-lg p-2" style={{ background: T.goldBg, color: T.gold }}><ReceiptText size={16} /></div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold" style={{ color: T.textPrimary }}>{receipt.number}</div>
                      <div className="mt-1 text-xs" style={{ color: T.textSecondary }}>{receipt.title}</div>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs" style={{ color: T.textMuted }}>
                        <span>{formatMoney(receipt.amount)}</span>
                        <span>{receipt.status}</span>
                        <span>{fmtDateTime(receipt.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="rounded-[18px] border p-6 relative" style={{ background: T.cardBg, borderColor: T.border, boxShadow: T.cardShadow }}>
        <CardHelp text="Операции по заявкам связывают начисленную пошлину, статус оплаты и квитанцию." />
        <h3 className="text-lg font-semibold mb-4" style={{ color: T.textPrimary }}>Операции по заявкам</h3>
        {applicationPaymentRows.length === 0 ? (
          <SimpleEmpty title="Нет поданных заявок" desc="После подачи заявки здесь появятся начисления и статусы оплаты." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr style={{ background: T.tableHeaderBg }}>
                  <th className="py-2.5 px-3 text-left font-semibold">ID заявки</th>
                  <th className="py-2.5 px-3 text-left font-semibold">Название</th>
                  <th className="py-2.5 px-3 text-left font-semibold">Статус оплаты</th>
                  <th className="py-2.5 px-3 text-right font-semibold">Сумма</th>
                  <th className="py-2.5 px-3 text-left font-semibold">Квитанция</th>
                </tr>
              </thead>
              <tbody>
                {applicationPaymentRows.map(({ application, feeAmount, status }) => {
                  const receipt = account.receipts.find((item) => item.eventComplianceApplicationId === application.eventComplianceApplicationId && item.status === "оплачена");
                  return (
                    <tr key={application.eventComplianceApplicationId} className="border-b" style={{ borderColor: T.border }}>
                      <td className="py-2.5 px-3 font-mono text-xs" style={{ color: T.textSecondary }}>{formatDisplayId(application.eventComplianceApplicationId)}</td>
                      <td className="py-2.5 px-3" style={{ color: T.textPrimary }}>{applicationById.get(application.eventComplianceApplicationId)?.data.title || "—"}</td>
                      <td className="py-2.5 px-3">
                        <span className="rounded-full px-2 py-0.5 text-[11px] font-semibold" style={status === "Оплачено" ? statusStyle.approved : status === "Недостаточно средств" ? statusStyle.needs_rework : statusStyle.submitted}>
                          {status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right" style={{ color: T.textSecondary }}>{formatMoney(feeAmount)}</td>
                      <td className="py-2.5 px-3" style={{ color: T.textSecondary }}>{receipt?.number || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function MetricCard({ label, value, help }: { label: string; value: string; help: string }) {
  return (
    <div className="relative rounded-xl border p-4" style={{ borderColor: T.border, background: T.sidebarBg }}>
      <div className="absolute right-3 top-3"><HelpTooltip text={help} /></div>
      <div className="text-[12px]" style={{ color: T.textSecondary }}>{label}</div>
      <div className="mt-2 text-2xl font-bold" style={{ color: T.textPrimary }}>{value}</div>
    </div>
  );
}

function SalesSection({ rows }: { rows: OrganizerSaleRecord[] }) {
  return (
    <div className="rounded-[18px] border p-6 relative" style={{ background: T.cardBg, borderColor: T.border, boxShadow: T.cardShadow }}>
      <CardHelp text="Сводка продаж и билетов по мероприятиям организатора." />
      <h2 className="text-lg font-semibold mb-4" style={{ color: T.textPrimary }}>Продажи и билеты</h2>
      {rows.length === 0 ? (
        <SimpleEmpty title="Пока нет продаж" desc="Продажи появляются после покупок на розничной витрине по вашим мероприятиям." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr style={{ background: T.tableHeaderBg }}>
                <th className="py-2.5 px-3 text-left font-semibold" style={{ color: T.textPrimary }}>ID продажи</th>
                <th className="py-2.5 px-3 text-left font-semibold" style={{ color: T.textPrimary }}>Мероприятие</th>
                <th className="py-2.5 px-3 text-left font-semibold" style={{ color: T.textPrimary }}>Дата продажи</th>
                <th className="py-2.5 px-3 text-left font-semibold" style={{ color: T.textPrimary }}>Количество билетов</th>
                <th className="py-2.5 px-3 text-left font-semibold" style={{ color: T.textPrimary }}>Сумма</th>
                <th className="py-2.5 px-3 text-left font-semibold" style={{ color: T.textPrimary }}>Канал</th>
                <th className="py-2.5 px-3 text-left font-semibold" style={{ color: T.textPrimary }}>Статус</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.saleId} className="border-b" style={{ borderColor: T.border }}>
                  <td className="py-2.5 px-3 font-mono text-xs" style={{ color: T.textSecondary }}>{s.saleId}</td>
                  <td className="py-2.5 px-3" style={{ color: T.textPrimary }}>{s.eventTitle}</td>
                  <td className="py-2.5 px-3" style={{ color: T.textSecondary }}>{fmtDateTime(s.soldAt)}</td>
                  <td className="py-2.5 px-3" style={{ color: T.textSecondary }}>{s.quantity}</td>
                  <td className="py-2.5 px-3" style={{ color: T.textSecondary }}>{s.amount.toFixed(2)} BYN</td>
                  <td className="py-2.5 px-3" style={{ color: T.textSecondary }}>{s.channel}</td>
                  <td className="py-2.5 px-3" style={{ color: T.textSecondary }}>{s.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ReportsSection({ report }: { report: OrganizerSettlementReport }) {
  return (
    <div className="space-y-4">
      <div className="rounded-[18px] border p-4 relative" style={{ background: T.cardBg, borderColor: T.border }}>
        <CardHelp text="Расчёт использует процент платформы из демо-настроек и учитывает только активные проданные билеты без возвратов." />
        <div className="text-sm" style={{ color: T.textSecondary }}>
          Процент платформы / Минкульта: <span className="font-semibold" style={{ color: T.textPrimary }}>{report.commissionPercent}%</span>.
          Суммы к уплате рассчитываются по открытым и закрытым мероприятиям. Оплаты в прототипе пока не моделируются.
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard title="Выручка" value={formatMoney(report.totalRevenue)} cardTitle="Сумма активных продаж по открытым и закрытым мероприятиям." />
        <KpiCard title="Продано билетов" value={String(report.totalSoldTickets)} cardTitle="Количество проданных и погашенных билетов без возвращённых билетов." />
        <KpiCard title="Начисления платформы" value={formatMoney(report.totalAmountDue)} cardTitle="Начисление по настроенному проценту платформы / Минкульта." />
        <KpiCard title="Оплачено" value={formatMoney(report.paidAmount)} cardTitle="Платежный контур в этом прототипе не моделируется." />
        <KpiCard title="Остаток к оплате" value={formatMoney(report.remainingDue)} cardTitle="Сумма к уплате за вычетом уже отражённых оплат." />
      </div>

      <SettlementEventsTable
        title="Открытые мероприятия"
        rows={report.openEvents}
        summary={report.openSummary}
        commissionPercent={report.commissionPercent}
        emptyTitle="Нет открытых мероприятий"
        emptyDesc="Опубликованные мероприятия с будущей датой появятся здесь после открытия продаж."
      />

      <SettlementEventsTable
        title="Закрытые мероприятия"
        rows={report.closedEvents}
        summary={report.closedSummary}
        commissionPercent={report.commissionPercent}
        emptyTitle="Нет закрытых мероприятий"
        emptyDesc="Мероприятия с прошедшей датой появятся здесь для сверки начислений."
      />
    </div>
  );
}

function SettlementEventsTable({
  title,
  rows,
  summary,
  commissionPercent,
  emptyTitle,
  emptyDesc,
}: {
  title: string;
  rows: OrganizerSettlementEventRow[];
  summary: OrganizerSettlementReport["openSummary"];
  commissionPercent: number;
  emptyTitle: string;
  emptyDesc: string;
}) {
  return (
    <div className="rounded-[18px] border p-6 relative" style={{ background: T.cardBg, borderColor: T.border, boxShadow: T.cardShadow }}>
      <CardHelp text="Возвращённые билеты не входят в выручку и начисления." />
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: T.textPrimary }}>{title}</h2>
          <p className="mt-1 text-sm" style={{ color: T.textSecondary }}>
            Выручка {formatMoney(summary.revenue)} · продано {summary.soldTickets} · к уплате {formatMoney(summary.amountDue)}
          </p>
        </div>
        <div className="rounded-full border px-3 py-1 text-xs font-semibold" style={{ borderColor: T.goldBorder, color: T.gold, background: T.goldBg }}>
          Комиссия платформы {commissionPercent}%
        </div>
      </div>

      {rows.length === 0 ? (
        <SimpleEmpty title={emptyTitle} desc={emptyDesc} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr style={{ background: T.tableHeaderBg }}>
                <th className="py-2.5 px-3 text-left font-semibold">Мероприятие</th>
                <th className="py-2.5 px-3 text-left font-semibold">Дата</th>
                <th className="py-2.5 px-3 text-left font-semibold">Продано билетов</th>
                <th className="py-2.5 px-3 text-left font-semibold">Выручка</th>
                <th className="py-2.5 px-3 text-left font-semibold">Комиссия платформы</th>
                <th className="py-2.5 px-3 text-left font-semibold">Начисления платформы</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.eventId} className="border-b" style={{ borderColor: T.border }}>
                  <td className="py-2.5 px-3" style={{ color: T.textPrimary }}>{row.title}</td>
                  <td className="py-2.5 px-3" style={{ color: T.textSecondary }}>{fmtDateTime(row.dateTime)}</td>
                  <td className="py-2.5 px-3" style={{ color: T.textSecondary }}>{row.soldTickets}</td>
                  <td className="py-2.5 px-3" style={{ color: T.textSecondary }}>{formatMoney(row.revenue)}</td>
                  <td className="py-2.5 px-3" style={{ color: T.textSecondary }}>{commissionPercent}%</td>
                  <td className="py-2.5 px-3" style={{ color: T.textSecondary }}>{formatMoney(row.amountDue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function KpiCard({ title, value, cardTitle }: { title: string; value: string; cardTitle?: string }) {
  return (
    <div className="rounded-[18px] border p-5 relative" style={{ background: T.cardBg, borderColor: T.border }}>
      {cardTitle && <CardHelp text={cardTitle} />}
      <div className="text-[13px]" style={{ color: T.textSecondary }}>{title}</div>
      <div className="text-[22px] font-bold mt-1" style={{ color: T.textPrimary }}>{value}</div>
    </div>
  );
}

function DocumentsSection({ rows, complianceRows }: { rows: OrganizerDocument[]; complianceRows: ReturnType<typeof selectMyEventComplianceApplications> }) {
  const [openedDoc, setOpenedDoc] = useState<OrganizerDocument | null>(null);
  const certificates = useMemo(
    () => complianceRows.filter((x) => x.status === "approved" && x.certificateNumber && x.linkedEventId),
    [complianceRows]
  );

  return (
    <>
      {certificates.length > 0 && (
        <div className="rounded-[18px] border p-6 mb-4" style={{ background: T.cardBg, borderColor: T.border, boxShadow: T.cardShadow }}>
          <h2 className="text-lg font-semibold mb-4" style={{ color: T.textPrimary }}>Удостоверения по одобренным мероприятиям</h2>
          <div className="space-y-2">
            {certificates.map((item) => (
              <div key={item.eventComplianceApplicationId} className="rounded-xl border p-3 flex items-center justify-between gap-3" style={{ borderColor: T.border, background: T.sidebarBg }}>
                <div>
                  <div className="text-sm font-semibold">{item.data.title || "Без названия"}</div>
                  <div className="text-xs" style={{ color: T.textSecondary }}>
                    Событие: {item.linkedEventId} · № удостоверения: {item.certificateNumber} · дата: {item.certificateDate || "—"}
                  </div>
                </div>
                <div className="inline-flex items-center gap-1">
                <button
                  className="h-9 px-4 rounded-lg text-sm font-semibold"
                  style={{ background: "#111", color: "#FFF" }}
                  onClick={() => toast.success(`Удостоверение ${item.certificateNumber} готово к выдаче по событию ${item.linkedEventId}`)}
                >
                  Скачать удостоверение
                </button>
                <HelpTooltip text="Скачать удостоверение по одобренному мероприятию." />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="rounded-[18px] border p-6 relative" style={{ background: T.cardBg, borderColor: T.border, boxShadow: T.cardShadow }}>
        <CardHelp text="Удостоверения и документы, связанные с одобренными мероприятиями." />
        <h2 className="text-lg font-semibold mb-4" style={{ color: T.textPrimary }}>Документы организатора</h2>
        {rows.length === 0 ? (
          <SimpleEmpty title="Нет документов" desc="Документы появятся после добавления в профиль организатора." />
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {rows.map((doc) => (
              <button key={doc.documentId} onClick={() => setOpenedDoc(doc)} className="rounded-xl border p-4 text-left" style={{ borderColor: T.border, background: T.sidebarBg }}>
                <div className="font-semibold text-sm mb-1">{doc.title}</div>
                <div className="text-xs" style={{ color: T.textSecondary }}>Тип: {doc.type}</div>
                <div className="text-xs" style={{ color: T.textSecondary }}>Обновлено: {doc.updatedAt.slice(0, 10)}</div>
              </button>
            ))}
          </div>
        )}
      </div>
      {openedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setOpenedDoc(null)}>
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative w-full max-w-md rounded-2xl border p-5" style={{ background: T.cardBg, borderColor: T.border }} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-2" style={{ color: T.textPrimary }}>Открыт документ</h3>
            <p className="text-sm mb-1">{openedDoc.title}</p>
            <p className="text-xs" style={{ color: T.textSecondary }}>ID документа: {openedDoc.documentId}</p>
            <p className="text-xs" style={{ color: T.textSecondary }}>Статус: {openedDoc.status}</p>
            <button className="mt-4 h-9 px-4 rounded-lg text-sm" style={{ background: "#111", color: "#FFF" }} onClick={() => setOpenedDoc(null)}>
              Закрыть
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function SupportSection() {
  const [messageOpen, setMessageOpen] = useState(false);

  return (
    <>
      <div className="rounded-[18px] border p-6 space-y-4 relative" style={{ background: T.cardBg, borderColor: T.border, boxShadow: T.cardShadow }}>
        <CardHelp text="Раздел для обращений, контактов и связи со службой поддержки." />
        <h2 className="text-lg font-semibold" style={{ color: T.textPrimary }}>Поддержка платформы</h2>
        <div className="text-sm" style={{ color: T.textSecondary }}>
          Электронная почта: support@tickethub.by<br />
          Телефон: +375 (17) 300-00-00<br />
          Средняя скорость ответа: до 15 минут в рабочее время.
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="inline-flex items-center gap-1">
            <button onClick={() => setMessageOpen(true)} className="h-9 px-4 rounded-lg text-sm" style={{ background: "#111", color: "#FFF" }}>
              Написать в поддержку
            </button>
            <HelpTooltip text="Открыть форму обращения в службу поддержки." />
          </div>
          <div className="inline-flex items-center gap-1">
            <button onClick={() => toast.success("Форма обращения будет добавлена в следующем релизе.")} className="h-9 px-4 rounded-lg border text-sm" style={{ borderColor: T.btnSecondaryBorder, color: T.textPrimary, background: "rgba(255,255,255,0.03)" }}>
              Оставить обращение
            </button>
            <HelpTooltip text="Создать обращение в службу поддержки." />
          </div>
          <div className="inline-flex items-center gap-1">
            <button onClick={() => toast.success("ИИ-помощник откроется в отдельном виджете.")} className="h-9 px-4 rounded-lg border text-sm" style={{ borderColor: T.btnSecondaryBorder, color: T.textPrimary, background: "rgba(255,255,255,0.03)" }}>
              Открыть ИИ-помощника
            </button>
            <HelpTooltip text="Открывает цифрового помощника для консультаций по работе с платформой." />
          </div>
        </div>
      </div>
      {messageOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setMessageOpen(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative w-full max-w-md rounded-2xl border p-5" style={{ background: T.cardBg, borderColor: T.border }} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-2" style={{ color: T.textPrimary }}>Обращение в поддержку</h3>
            <p className="text-sm" style={{ color: T.textSecondary }}>Канал связи активирован. В демо-режиме сообщение не отправляется на внешний сервер.</p>
            <button className="mt-4 h-9 px-4 rounded-lg text-sm" style={{ background: "#111", color: "#FFF" }} onClick={() => setMessageOpen(false)}>
              Понятно
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function SimpleCard({ title, text, tooltipText }: { title: string; text: string; tooltipText?: string }) {
  return (
    <div className="rounded-[18px] border p-10 text-center relative" style={{ background: T.cardBg, borderColor: T.border, boxShadow: T.cardShadow }}>
      {tooltipText && <CardHelp text={tooltipText} />}
      <h2 className="text-lg font-semibold mb-1" style={{ color: T.textPrimary }}>{title}</h2>
      <p className="text-[13px]" style={{ color: T.textSecondary }}>{text}</p>
    </div>
  );
}

function SimpleEmpty({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="text-center py-10">
      <p className="text-[14px] font-medium mb-1" style={{ color: T.textSecondary }}>{title}</p>
      <p className="text-[13px]" style={{ color: T.textMuted }}>{desc}</p>
    </div>
  );
}

function OrganizerProfileCard({ organizer, onClose }: { organizer: NonNullable<ReturnType<typeof selectCurrentOrganizer>>; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <div className="relative w-full max-w-xl rounded-2xl border p-6" style={{ background: T.cardBg, borderColor: T.border }} onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-4" style={{ color: T.textPrimary }}>Профиль организатора</h3>
        <div className="grid md:grid-cols-2 gap-3 text-sm" style={{ color: T.textSecondary }}>
          <div><strong style={{ color: T.textPrimary }}>Полное название:</strong><br />{organizer.fullName}</div>
          <div><strong style={{ color: T.textPrimary }}>УНП:</strong><br />{organizer.unp}</div>
          <div><strong style={{ color: T.textPrimary }}>Регистрация:</strong><br />{organizer.registryStatus}</div>
          <div><strong style={{ color: T.textPrimary }}>Дата регистрации:</strong><br />{organizer.registryRegisteredAt}</div>
          <div><strong style={{ color: T.textPrimary }}>Директор:</strong><br />{organizer.director}</div>
          <div><strong style={{ color: T.textPrimary }}>Электронная почта:</strong><br />{organizer.email}</div>
          <div><strong style={{ color: T.textPrimary }}>Телефон:</strong><br />{organizer.phone}</div>
          <div><strong style={{ color: T.textPrimary }}>Статус аккаунта:</strong><br />{organizer.accountStatus}</div>
        </div>
        <button className="mt-5 h-9 px-4 rounded-lg text-sm" style={{ background: "#111", color: "#FFF" }} onClick={onClose}>
          Закрыть
        </button>
      </div>
    </div>
  );
}

const approvalModeLabel: Record<string, string> = {
  certificate_required: "Требуется удостоверение",
  notice_only: "Требуется только уведомление",
  certificate_not_required: "Удостоверение не требуется",
};

function ApplicationDetailsDrawer({ app, state, onClose }: { app: EventComplianceApplicationRecord; state: ReturnType<typeof useStorageSync>["state"]; onClose: () => void }) {
  const [schemeOpen, setSchemeOpen] = useState(false);
  const fee = app.data.approvalMode === "certificate_required"
    ? `${calculateComplianceFee(app.data.projectedCapacity, app.data.plannedTicketsForSale, app.data.ticketTiers)} БВ`
    : "—";
  const feeAmount = calculateComplianceFeeAmount(app.data);
  const paymentStatus = getCompliancePaymentStatus(app);
  const paidReceipt = state.finance.organizerReceipts.find((receipt) => receipt.eventComplianceApplicationId === app.eventComplianceApplicationId && receipt.status === "оплачена");
  const salesChannels = (app.data.salesChannels?.length ? app.data.salesChannels : ["OWN"]).map((code) => getSalesChannelLabel(state, code));
  const linkedEvent = app.linkedEventId ? state.events.find((event) => event.eventId === app.linkedEventId) || null : null;
  const schemeSeats = linkedEvent?.eventSeats?.length ? linkedEvent.eventSeats : app.data.eventSeats || [];
  const schemeTiers = linkedEvent?.tiers?.length ? linkedEvent.tiers : app.data.ticketTiers || [];
  const schemeSummary = getEventSeatSummary({ eventSeats: schemeSeats, tiers: schemeTiers });
  const schemeLayoutV2 = getSeatMapLayout(state, linkedEvent?.layoutId || app.data.layoutId)?.layoutV2;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.55)" }} />
      <div className="relative w-full max-w-xl h-full overflow-y-auto" style={{ background: T.cardBg, boxShadow: "-10px 0 50px rgba(0,0,0,0.4)" }} onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 flex justify-between items-center px-6 py-4 border-b" style={{ background: T.cardBg, borderColor: T.border }}>
          <h3 className="text-lg font-semibold" style={{ color: T.textPrimary }}>Карточка заявки</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center"><X size={18} /></button>
        </div>
        <div className="space-y-5 p-6">
          <div className="mb-4"><span className="px-2.5 py-1 rounded-full text-[11px] font-semibold" style={statusStyle[app.status]}>{statusLabel[app.status]}</span></div>
          {schemeSummary.hasSeatMap && (
            <section className="space-y-3 rounded-xl border p-3" style={{ borderColor: T.border, background: T.sidebarBg }}>
              <SeatMapPreview eventSeats={schemeSeats} tiers={schemeTiers} title="Схема зала в заявке" layoutV2={schemeLayoutV2} />
              <button onClick={() => setSchemeOpen(true)} className="h-9 rounded-lg px-3 text-sm font-semibold" style={{ background: T.goldBg, color: T.gold }}>
                Открыть схему
              </button>
            </section>
          )}
          <dl className="space-y-3 text-[13px]">
            <Item k="ID заявки" v={formatDisplayId(app.eventComplianceApplicationId)} />
            <Item k="ID организатора" v={formatDisplayId(app.organizerId)} />
            <Item k="Название" v={app.data.title || "—"} />
            <Item k="Статус" v={statusLabel[app.status] || app.status} />
            <Item k="Дата подачи" v={fmtDateTime(app.submittedAt || app.createdAt)} />
            <Item k="Площадка" v={app.data.venueName || "—"} />
            <Item k="Дата мероприятия" v={fmtDateTime(app.data.dateSlots[0] || "")} />
            <Item k="Возрастная категория" v={app.data.ageCategory || "—"} />
            <Item k="Каналы продаж" v={salesChannels.join(", ")} />
            <Item k="Режим согласования" v={approvalModeLabel[app.data.approvalMode] || app.data.approvalMode} />
            <Item k="Госпошлина" v={fee} />
            <Item k="Сумма к оплате" v={formatMoney(feeAmount)} />
            <Item k="Статус оплаты" v={paymentStatus} />
            <Item k="Квитанция" v={paidReceipt?.number || "—"} />
            <Item k="Комментарий администратора" v={app.adminComment || "—"} />
            {app.certificateNumber && <Item k="Номер удостоверения" v={app.certificateNumber} />}
            {app.certificateDate && <Item k="Дата удостоверения" v={app.certificateDate} />}
          </dl>
          <section className="rounded-xl border p-3" style={{ borderColor: T.border, background: T.sidebarBg }}>
            <div className="mb-2 text-xs" style={{ color: T.textSecondary }}>Тарифы</div>
            <div className="space-y-1">
              {(app.data.ticketTiers || []).map((tier, index) => (
                <div key={`${tier.name}-${index}`} className="flex justify-between gap-3 text-[13px]">
                  <span style={{ color: T.textPrimary }}>{tier.name || "—"}</span>
                  <span style={{ color: T.textSecondary }}>{tier.quantity || 0} × {tier.price || 0} BYN</span>
                </div>
              ))}
            </div>
          </section>
          <section className="rounded-xl border p-3" style={{ borderColor: T.border, background: T.sidebarBg }}>
            <div className="mb-2 text-xs" style={{ color: T.textSecondary }}>Постер</div>
            {app.data.posterPath ? (
              <img src={resolvePublicAsset(app.data.posterPath)} alt={app.data.title || "Постер заявки"} className="mx-auto aspect-[2/3] w-full max-w-[220px] rounded-lg object-cover" />
            ) : (
              <div className="mx-auto flex aspect-[2/3] w-full max-w-[220px] items-center justify-center rounded-lg border text-sm" style={{ borderColor: T.border, color: T.textMuted }}>
                Постер не выбран
              </div>
            )}
          </section>
        </div>
      </div>
      <SeatMapModal
        open={schemeOpen}
        title="Схема заявки"
        subtitle={app.data.title}
        mode="viewer"
        eventSeats={schemeSeats}
        layoutV2={schemeLayoutV2}
        tiers={schemeTiers}
        onClose={() => setSchemeOpen(false)}
      />
    </div>
  );
}

function EventDetailsDrawer({ event, state, onClose }: { event: EventRecord; state: ReturnType<typeof useStorageSync>["state"]; onClose: () => void }) {
  const [schemeOpen, setSchemeOpen] = useState(false);
  const compliance = getComplianceByEvent(state, event);
  const salesChannels = (event.salesChannels?.length ? event.salesChannels : ["OWN"]).map((code) => getSalesChannelLabel(state, code));
  const eventSeats = getEventSeatsWithSalesState(state, event);
  const summary = getEventSeatSummary({ eventSeats, tiers: event.tiers });
  const layoutV2 = getSeatMapLayout(state, event.layoutId)?.layoutV2;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.55)" }} />
      <div className="relative h-full w-full max-w-xl overflow-y-auto" style={{ background: T.cardBg, boxShadow: "-10px 0 50px rgba(0,0,0,0.4)" }} onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b px-6 py-4" style={{ background: T.cardBg, borderColor: T.border }}>
          <h3 className="text-lg font-semibold" style={{ color: T.textPrimary }}>Карточка мероприятия</h3>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg"><X size={18} /></button>
        </div>
        <div className="space-y-5 p-6">
          {summary.hasSeatMap && (
            <section className="space-y-3 rounded-xl border p-3" style={{ borderColor: T.border, background: T.sidebarBg }}>
              <SeatMapPreview eventSeats={eventSeats} tiers={event.tiers} title="Схема зала мероприятия" layoutV2={layoutV2} />
              <div className="text-[12px]" style={{ color: T.textSecondary }}>Выручка: {summary.revenue} BYN</div>
              <button onClick={() => setSchemeOpen(true)} className="h-9 rounded-lg px-3 text-sm font-semibold" style={{ background: T.goldBg, color: T.gold }}>
                Открыть схему
              </button>
            </section>
          )}
          <dl className="space-y-3 text-[13px]">
            <Item k="ID мероприятия" v={formatDisplayId(event.eventId)} />
            <Item k="Название" v={event.title || "—"} />
            <Item k="Статус" v={getEventStatusLabel(event.status)} />
            <Item k="Площадка" v={event.venue || "—"} />
            <Item k="Дата и время" v={fmtDateTime(event.dateTime)} />
            <Item k="Возрастная категория" v={compliance?.data.ageCategory || "—"} />
            <Item k="Вместимость" v={String(event.capacity)} />
            <Item k="Остаток" v={String(event.remaining)} />
            <Item k="Каналы продаж" v={salesChannels.join(", ")} />
            <Item k="Заявка" v={formatDisplayId(event.complianceApplicationId || event.appId)} />
          </dl>

          <section className="rounded-xl border p-3" style={{ borderColor: T.border, background: T.sidebarBg }}>
            <div className="mb-2 text-xs" style={{ color: T.textSecondary }}>Тарифы</div>
            <div className="space-y-1">
              {event.tiers.map((tier, index) => (
                <div key={`${tier.name}-${index}`} className="flex justify-between gap-3 text-[13px]">
                  <span style={{ color: T.textPrimary }}>{tier.name || "—"}</span>
                  <span style={{ color: T.textSecondary }}>{tier.quantity || 0} × {tier.price || 0} BYN</span>
                </div>
              ))}
            </div>
          </section>

        </div>
      </div>
      <SeatMapModal
        open={schemeOpen}
        title="Схема мероприятия"
        subtitle={event.title}
        mode="viewer"
        eventSeats={eventSeats}
        layoutV2={layoutV2}
        tiers={event.tiers}
        onClose={() => setSchemeOpen(false)}
      />
    </div>
  );
}

function Item({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between">
      <dt style={{ color: T.textSecondary }}>{k}</dt>
      <dd style={{ color: T.textPrimary }} className="font-medium">{v}</dd>
    </div>
  );
}
