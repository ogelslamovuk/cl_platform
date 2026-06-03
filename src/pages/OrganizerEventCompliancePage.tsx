import React, { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Toaster as Sonner } from "@/components/ui/sonner";
import HelpTooltip from "@/components/ui/help-tooltip";
import { useStorageSync } from "@/hooks/useStorageSync";
import {
  calculateComplianceFee,
  calculateComplianceFeeAmount,
  buildDefaultSalesChannels,
  buildEventSeatsFromLayout,
  createEventComplianceApplication,
  defaultEventComplianceData,
  DEFAULT_COMPLIANCE_TICKET_TIERS,
  DEMO_TOP_UP_AMOUNT,
  generateComplianceFeeReceipt,
  getCompliancePaymentStatus,
  getOrganizerFinancialAccount,
  getSeatMapLayout,
  getSeatTariffConfigurationSummary,
  getVenueRegistryRecord,
  getSalesChannelLabel,
  payComplianceFeeFromBalance,
  SEAT_TARIFF_COLORS,
  topUpOrganizerBalance,
  updateEventComplianceApplication,
} from "@/lib/store";
import type { EventInteragencyCheck, EventPerformer, EventSeat, PriceTier } from "@/lib/store";
import SeatMapModal from "@/components/seatmap/SeatMapModal";
import SeatTariffSummary from "@/components/seatmap/SeatTariffSummary";
import {
  selectCurrentOrganizer,
  selectIsCurrentOrganizerApproved,
  selectMyEventComplianceApplications,
} from "@/lib/organizerSelectors";

const COMPLIANCE_FEE_TOOLTIP = "Размер госпошлины рассчитывается по проектной вместимости площадки или количеству заявленных билетов: 1-150 - 3 БВ, 151-300 - 10 БВ, 301-500 - 30 БВ, 501-1000 - 50 БВ, 1001-1500 - 80 БВ, 1501-2000 - 100 БВ, 2001-3000 - 150 БВ, свыше 3000 - 200 БВ. Для отдельных категорий может применяться освобождение от пошлины.";
const POSTER_ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];
const POSTER_MAX_SIZE = 5 * 1024 * 1024;
const MAX_PERFORMERS = 10;

const WIZARD_STEPS = [
  "Основные сведения",
  "Программа и участники",
  "Показы / даты проведения",
  "Площадка, зал и вместимость",
  "Билеты и тарифы",
  "Каналы продаж",
  "Проверки и подтверждения",
  "Пошлины и платежи",
  "Проверка и подача",
] as const;

const EVENT_TYPE_TREE: Record<string, Record<string, string[]>> = {
  Культура: {
    Концерт: ["Эстрадный концерт"],
    Театр: ["Драматический спектакль"],
  },
  Спорт: {
    Индивидуальный: ["Стрельба из лука", "Бег"],
    Командный: ["Футбол"],
  },
  Бизнес: {
    Конференция: ["Отраслевая конференция"],
  },
};

const DEFAULT_CHECKS: EventInteragencyCheck[] = [
  { checkId: "mvd", agency: "МВД", subject: "проверка документов участников", status: "Не отправлено", updatedAt: "" },
  { checkId: "migration", agency: "Департамент по гражданству и миграции", subject: "проверка иностранных участников", status: "Не отправлено", updatedAt: "" },
  { checkId: "culture", agency: "Минкульт", subject: "проверка организатора и основания проведения", status: "Не отправлено", updatedAt: "" },
  { checkId: "executive", agency: "Исполком", subject: "уведомление по площадке и проведению мероприятия", status: "Не отправлено", updatedAt: "" },
];

type StepStatus = "Не заполнено" | "Черновик" | "Заполнено" | "Требует внимания";

function resolvePublicAsset(path: string): string {
  if (!path) return "";
  if (/^(https?:|data:|blob:)/.test(path)) return path;
  const base = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

function normalizeDateTimeLocal(value: string | null | undefined): string {
  const raw = (value || "").trim();
  if (!raw) return "";
  const m = raw.match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})/);
  if (m) return `${m[1]}T${m[2]}`;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return "";
  const yyyy = parsed.getFullYear();
  const mm = String(parsed.getMonth() + 1).padStart(2, "0");
  const dd = String(parsed.getDate()).padStart(2, "0");
  const hh = String(parsed.getHours()).padStart(2, "0");
  const mi = String(parsed.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

function formatMoney(value: number): string {
  return `${value.toFixed(2)} BYN`;
}

function mockAttachment(kind: string, name: string, sample = false) {
  return {
    attachmentId: `${kind}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    kind,
    name,
    uploadedAt: new Date().toISOString(),
    isSample: sample,
  };
}

function makePerformer(name = "", country = "Беларусь"): EventPerformer {
  const foreign = country !== "Беларусь";
  return {
    name,
    performerType: "solo",
    country,
    representative: "",
    comment: "",
    documentStatus: foreign ? "макет документа иностранного участника приложен" : "макет документа участника приложен",
    documentNote: foreign ? "Проверка через демо-контекст миграционных документов." : "Проверка по демо-пакету документов участника.",
  };
}

function ensureChecks(rows?: EventInteragencyCheck[]): EventInteragencyCheck[] {
  const source = rows?.length ? rows : DEFAULT_CHECKS;
  return DEFAULT_CHECKS.map((fallback) => {
    const existing = source.find((row) => row.checkId === fallback.checkId);
    return { ...fallback, ...existing };
  });
}

function stepStatus(done: boolean, touched: boolean, attention = false): StepStatus {
  if (attention) return "Требует внимания";
  if (done) return "Заполнено";
  if (touched) return "Черновик";
  return "Не заполнено";
}

export default function OrganizerEventCompliancePage() {
  const { state, update } = useStorageSync();
  const [searchParams] = useSearchParams();
  const organizer = useMemo(() => selectCurrentOrganizer(state), [state]);
  const approved = useMemo(() => selectIsCurrentOrganizerApproved(state), [state]);
  const myApps = useMemo(() => selectMyEventComplianceApplications(state), [state]);
  const makeDefaultForm = () => ({
    ...defaultEventComplianceData(),
    ticketTiers: DEFAULT_COMPLIANCE_TICKET_TIERS.map((tier) => ({ ...tier })),
    salesChannels: buildDefaultSalesChannels(state),
    interagencyChecks: ensureChecks(),
  });
  const [form, setForm] = useState(makeDefaultForm);
  const [tierErrors, setTierErrors] = useState<number[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [seatMapOpen, setSeatMapOpen] = useState(false);
  const [performerDraft, setPerformerDraft] = useState({ name: "", country: "Беларусь" });
  const activeResellers = useMemo(() => state.resellers.filter((reseller) => reseller.status === "active"), [state.resellers]);
  const approvedVenues = useMemo(() => state.venueRegistry.filter((venue) => venue.status === "approved"), [state.venueRegistry]);
  const selectedVenue = getVenueRegistryRecord(state, form.venueId);
  const selectedHall = selectedVenue?.halls.find((hall) => hall.hallId === form.hallId) || null;
  const selectedLayout = getSeatMapLayout(state, form.layoutId);
  const hasSeatMap = Boolean(selectedLayout && selectedHall?.hasSeatMap);
  const eventTypePath = form.eventTypePath || [];
  const complianceStatusLabel: Record<string, string> = {
    draft: "Черновик",
    submitted: "На рассмотрении",
    approved: "Одобрена",
    rejected: "Отклонена",
    needs_rework: "Требует доработки",
  };

  const editId = searchParams.get("edit");
  const editingApplication = editId ? myApps.find((app) => app.eventComplianceApplicationId === editId) : null;
  useEffect(() => {
    if (!organizer || !approved || !editId || !editingApplication) return;
    setEditingId(editId);
    setForm({
      ...editingApplication.data,
      eventTypePath: editingApplication.data.eventTypePath || [],
      salesChannels: editingApplication.data.salesChannels?.length ? editingApplication.data.salesChannels : buildDefaultSalesChannels(state),
      ticketTiers: editingApplication.data.ticketTiers?.length ? editingApplication.data.ticketTiers : DEFAULT_COMPLIANCE_TICKET_TIERS.map((tier) => ({ ...tier })),
      dateSlots: editingApplication.data.dateSlots?.length ? editingApplication.data.dateSlots : [""],
      performers: editingApplication.data.performers || [],
      venueContractStatus: editingApplication.data.venueContractStatus || "требуется",
      interagencyChecks: ensureChecks(editingApplication.data.interagencyChecks),
    });
    setActiveStep(Math.min(Math.max(editingApplication.data.wizardLastStep || 0, 0), WIZARD_STEPS.length - 1));
  }, [approved, editId, editingApplication, organizer, state]);

  if (!organizer) return <Navigate to="/organizer" replace />;
  if (!approved) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#0B0F14", color: "#F5F7FA" }}>
        <div className="w-full max-w-2xl rounded-2xl border p-6" style={{ borderColor: "rgba(255,255,255,0.10)", background: "#111A24" }}>
          <div className="inline-flex rounded-full border px-3 py-1 text-xs font-semibold" style={{ borderColor: "rgba(242,201,76,0.25)", background: "rgba(242,201,76,0.14)", color: "#F2C94C" }}>
            Реестр организаторов
          </div>
          <h1 className="mt-5 text-2xl font-bold">Подача заявки на мероприятие недоступна</h1>
          <p className="mt-3 text-sm leading-6" style={{ color: "rgba(245,247,250,0.72)" }}>
            Организатор ещё не включён в реестр. До одобрения заявки Центром Управления создание заявок на мероприятия заблокировано.
          </p>
          <Link to="/organizer" className="mt-6 inline-flex h-10 items-center rounded-xl px-4 text-sm font-semibold" style={{ background: "#F2C94C", color: "#111" }}>
            Вернуться в кабинет организатора
          </Link>
        </div>
      </div>
    );
  }

  const normalizedTiersWithColors = (form.ticketTiers || []).map((tier, index): PriceTier => ({
    ...tier,
    color: tier.color || SEAT_TARIFF_COLORS[index % SEAT_TARIFF_COLORS.length],
  }));
  const tariffConfigurationSummary = getSeatTariffConfigurationSummary({ eventSeats: form.eventSeats, ticketTiers: normalizedTiersWithColors });
  const seatCounts = (form.eventSeats || []).reduce((acc, seat) => {
    if (seat.status === "blocked") acc.blocked += 1;
    else if (seat.tariffName) acc.assigned += 1;
    else acc.unassigned += 1;
    return acc;
  }, { assigned: 0, blocked: 0, unassigned: 0 });
  const totalPlannedTickets = hasSeatMap ? tariffConfigurationSummary.assignedSeats : form.ticketTiers.reduce((acc, tier) => acc + (Number.isFinite(tier.quantity) ? Math.max(0, Math.floor(tier.quantity)) : 0), 0);
  const fee = calculateComplianceFee(form.projectedCapacity, totalPlannedTickets, form.ticketTiers);
  const feeAmount = calculateComplianceFeeAmount({ ...form, plannedTicketsForSale: totalPlannedTickets, ticketTiers: form.ticketTiers });
  const organizerFinancialAccount = getOrganizerFinancialAccount(state, organizer.organizerId);
  const editingPaymentApplication = editingId ? state.eventComplianceApplications.find((app) => app.eventComplianceApplicationId === editingId) || null : null;
  const paymentStatus = editingPaymentApplication ? getCompliancePaymentStatus(editingPaymentApplication) : form.feePaid || form.feeExempt || form.approvalMode !== "certificate_required" ? "Оплачено" : form.paymentComment === "Недостаточно средств" ? "Недостаточно средств" : "Ожидает оплаты";
  const paymentOperations = state.finance.organizerOperations
    .filter((operation) => operation.organizerId === organizer.organizerId && (!editingId || operation.eventComplianceApplicationId === editingId))
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const paymentReceipts = state.finance.organizerReceipts
    .filter((receipt) => receipt.organizerId === organizer.organizerId && (!editingId || receipt.eventComplianceApplicationId === editingId))
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const requiredMissing = [
    !form.title.trim() && "наименование мероприятия",
    eventTypePath.length !== 3 && "тип мероприятия",
    !form.program.trim() && "программа",
    !form.dateSlots.some(Boolean) && "дата проведения",
    !form.venueId && "площадка из реестра",
    !form.venueContractStatus || form.venueContractStatus === "требуется" ? "договор с площадкой" : "",
    !validateTicketTiers(false) && "билеты и тарифы",
    !(form.salesChannels || []).length && "каналы продаж",
  ].filter(Boolean) as string[];
  const canSubmit = requiredMissing.length === 0;
  const stepStatuses: StepStatus[] = [
    stepStatus(Boolean(form.title.trim() && eventTypePath.length === 3), Boolean(form.title || form.shortDescription || eventTypePath.length)),
    stepStatus(Boolean(form.program.trim() && form.performers.length > 0), Boolean(form.program || form.performers.length), form.performers.length > MAX_PERFORMERS),
    stepStatus(form.dateSlots.some(Boolean), form.dateSlots.some(Boolean)),
    stepStatus(Boolean(form.venueId && form.hallId && form.venueContractStatus && form.venueContractStatus !== "требуется"), Boolean(form.venueId || form.venueName), form.venueContractStatus === "требуется"),
    stepStatus(validateTicketTiers(false), form.ticketTiers.some((tier) => tier.name || tier.quantity || tier.price) || seatCounts.assigned > 0, tierErrors.length > 0),
    stepStatus(Boolean((form.salesChannels || []).length), Boolean((form.salesChannels || []).length)),
    stepStatus(ensureChecks(form.interagencyChecks).some((row) => row.status !== "Не отправлено"), ensureChecks(form.interagencyChecks).some((row) => row.status !== "Не отправлено")),
    stepStatus(Boolean(form.feePaid || form.feeExempt || form.paymentAttachments.length), Boolean(form.feePaid || form.feeExempt || form.paymentAttachments.length)),
    stepStatus(canSubmit, requiredMissing.length < 9, !canSubmit),
  ];

  function updateForm(patch: Partial<typeof form>) {
    setForm((prev) => ({ ...prev, ...patch }));
  }

  function normalizeFormPayload() {
    const normalizedTitle = (form.title || "").replace(/\s+/g, " ").trim();
    const normalizedSlots = (form.dateSlots.length ? form.dateSlots : [""]).map(normalizeDateTimeLocal);
    const normalizedTiers = (form.ticketTiers || []).map((tier, index) => ({
      name: (tier.name || "").trim(),
      quantity: Number.isFinite(tier.quantity) ? Math.max(0, Math.floor(tier.quantity)) : 0,
      price: Number.isFinite(tier.price) ? Math.max(0, tier.price) : 0,
      color: tier.color || SEAT_TARIFF_COLORS[index % SEAT_TARIFF_COLORS.length],
    }));
    const eventSeats = form.eventSeats || [];
    const seatTiers = hasSeatMap
      ? normalizedTiers.map((tier) => ({
          ...tier,
          quantity: eventSeats.filter((seat) => seat.status !== "blocked" && seat.tariffName === tier.name).length,
        }))
      : normalizedTiers;
    return {
      ...form,
      title: normalizedTitle,
      eventType: eventTypePath.join(" / "),
      eventTypePath,
      dateSlots: normalizedSlots,
      ticketTiers: seatTiers,
      plannedTicketsForSale: seatTiers.reduce((acc, tier) => acc + tier.quantity, 0),
      salesChannels: Array.from(new Set(["OWN", ...(form.salesChannels || [])])),
      interagencyChecks: ensureChecks(form.interagencyChecks),
      wizardLastStep: activeStep,
    };
  }

  function validateTicketTiers(showToast = true) {
    const rows = form.ticketTiers || [];
    const invalidRows = rows.reduce<number[]>((acc, tier, index) => {
      const seatQuantity = hasSeatMap ? (form.eventSeats || []).filter((seat) => seat.status !== "blocked" && seat.tariffName === tier.name).length : tier.quantity;
      if (!tier.name?.trim() || !Number.isFinite(seatQuantity) || seatQuantity <= 0 || !Number.isFinite(tier.price) || tier.price < 0) {
        acc.push(index);
      }
      return acc;
    }, []);
    if (showToast) setTierErrors(invalidRows);
    if (!form.venueId) {
      if (showToast) toast.error("Выберите утверждённую площадку из реестра.");
      return false;
    }
    if (hasSeatMap && seatCounts.unassigned > 0) {
      if (showToast) toast.error("Назначьте тариф каждому продаваемому месту или заблокируйте его.");
      return false;
    }
    return rows.length > 0 && (hasSeatMap ? seatCounts.assigned > 0 : totalPlannedTickets > 0) && invalidRows.length === 0;
  }

  function selectEventType(level: number, value: string) {
    const next = [...eventTypePath.slice(0, level), value].filter(Boolean);
    const leaf = next.length === 3 ? next[2] : "";
    updateForm({ eventTypePath: next, eventType: leaf });
  }

  function selectVenue(venueId: string) {
    const venue = getVenueRegistryRecord(state, venueId);
    const hall = venue?.halls[0];
    const layout = hall?.layoutId ? getSeatMapLayout(state, hall.layoutId) : null;
    setForm((prev) => ({
      ...prev,
      venueId,
      hallId: hall?.hallId || "",
      layoutId: hall?.layoutId || "",
      venueName: venue?.name || "",
      venueAddress: venue?.address || "",
      venueType: venue?.type || "",
      projectedCapacity: hall?.capacity || venue?.capacity || null,
      eventSeats: layout ? buildEventSeatsFromLayout(layout, prev.ticketTiers) : [],
      ticketTiers: layout ? prev.ticketTiers.map((tier) => ({ ...tier, quantity: 0 })) : prev.ticketTiers,
    }));
  }

  function addMockAttachment(kind: string, target: "eventDocuments" | "paymentAttachments" | "notificationsAttachment", name: string, sample = false) {
    const file = mockAttachment(kind, name, sample);
    setForm((prev) => ({ ...prev, [target]: [...prev[target], file] }));
  }

  function ensureEditableApplicationForPayment(): string | null {
    if (editingId) return editingId;
    const payload = normalizeFormPayload();
    const record = createEventComplianceApplication(state, organizer.organizerId, payload, false);
    setEditingId(record.eventComplianceApplicationId);
    setForm(record.data);
    return record.eventComplianceApplicationId;
  }

  function handleTopUpBalance() {
    topUpOrganizerBalance(state, organizer.organizerId);
    update({ ...state });
    toast.success(`Счёт пополнен на ${formatMoney(DEMO_TOP_UP_AMOUNT)}.`);
  }

  function handleGenerateFeeReceipt() {
    const applicationId = ensureEditableApplicationForPayment();
    if (!applicationId) {
      toast.error("Сначала сохраните заявку.");
      return;
    }
    const receipt = generateComplianceFeeReceipt(state, organizer.organizerId, applicationId);
    update({ ...state });
    if (!receipt) {
      toast.error("Не удалось сформировать квитанцию.");
      return;
    }
    toast.success(`Квитанция ${receipt.number} сформирована.`);
  }

  function handlePayFromBalance() {
    const applicationId = ensureEditableApplicationForPayment();
    if (!applicationId) {
      toast.error("Сначала сохраните заявку.");
      return;
    }
    const result = payComplianceFeeFromBalance(state, organizer.organizerId, applicationId);
    const updatedApplication = state.eventComplianceApplications.find((app) => app.eventComplianceApplicationId === applicationId);
    if (updatedApplication) setForm(updatedApplication.data);
    update({ ...state });
    if (result.ok) {
      toast.success(result.message);
      return;
    }
    toast.error(result.message);
  }

  function addPerformer() {
    const name = performerDraft.name.trim();
    if (!name) {
      toast.error("Укажите имя участника или исполнителя.");
      return;
    }
    if (form.performers.length >= MAX_PERFORMERS) {
      toast.error("Вручную можно добавить не больше 10 участников.");
      return;
    }
    setForm((prev) => ({
      ...prev,
      performers: [...prev.performers, makePerformer(name, performerDraft.country)],
      hasForeignPerformers: prev.hasForeignPerformers || performerDraft.country !== "Беларусь",
      onlyBelarusianPerformers: performerDraft.country === "Беларусь" && !prev.performers.some((row) => row.country !== "Беларусь"),
    }));
    setPerformerDraft({ name: "", country: "Беларусь" });
  }

  function toggleSalesChannel(code: string, checked: boolean) {
    if (code === "OWN") return;
    setForm((prev) => {
      const current = new Set(["OWN", ...(prev.salesChannels || [])]);
      if (checked) current.add(code);
      else current.delete(code);
      return { ...prev, salesChannels: Array.from(current) };
    });
  }

  function handlePosterUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!POSTER_ALLOWED_TYPES.includes(file.type)) {
      toast.error("Можно загрузить только JPG, PNG, WEBP или SVG.");
      return;
    }
    if (file.size > POSTER_MAX_SIZE) {
      toast.error("Размер постера не должен превышать 5 МБ.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      if (!result) {
        toast.error("Не удалось прочитать файл постера.");
        return;
      }
      updateForm({ posterPath: result });
      toast.success("Постер загружен для предпросмотра.");
    };
    reader.onerror = () => toast.error("Не удалось прочитать файл постера.");
    reader.readAsDataURL(file);
  }

  function setCheckStatus(checkId: string, status: EventInteragencyCheck["status"]) {
    setForm((prev) => ({
      ...prev,
      interagencyChecks: ensureChecks(prev.interagencyChecks).map((row) => row.checkId === checkId ? { ...row, status, updatedAt: new Date().toISOString() } : row),
    }));
  }

  function batchSetChecks(status: EventInteragencyCheck["status"]) {
    setForm((prev) => ({
      ...prev,
      interagencyChecks: ensureChecks(prev.interagencyChecks).map((row) => ({ ...row, status, updatedAt: new Date().toISOString() })),
    }));
  }

  function fillWithDemoData() {
    const eventDate = new Date();
    eventDate.setDate(eventDate.getDate() + 14);
    eventDate.setHours(19, 0, 0, 0);
    const secondDate = new Date(eventDate);
    secondDate.setDate(secondDate.getDate() + 1);
    const salesStart = new Date(eventDate);
    salesStart.setDate(salesStart.getDate() - 7);
    const selectedDemoVenue = approvedVenues.find((venue) => venue.halls.some((hall) => hall.hasSeatMap)) || approvedVenues[0];
    const hall = selectedDemoVenue?.halls[0];
    const layout = hall?.layoutId ? getSeatMapLayout(state, hall.layoutId) : null;
    const tiers = DEFAULT_COMPLIANCE_TICKET_TIERS.map((tier, index) => ({
      ...tier,
      quantity: hall?.hasSeatMap ? 0 : index === 0 ? 180 : index === 3 ? 40 : 0,
    }));
    setForm((prev) => ({
      ...prev,
      title: "Гала-концерт «Беларусь культурная»",
      eventType: "Эстрадный концерт",
      eventTypePath: ["Культура", "Концерт", "Эстрадный концерт"],
      shortDescription: "Демонстрационное культурно-зрелищное мероприятие для проверки полного цикла согласования, выпуска билетов и отчётности.",
      program: "Торжественное открытие, выступление белорусских исполнителей, концертная программа и финальный номер.",
      posterPath: "/demo/posters/belarus-u-sertsy.svg",
      salesChannels: Array.from(new Set(["OWN", ...buildDefaultSalesChannels(state)])),
      dateSlots: [normalizeDateTimeLocal(eventDate.toISOString()), normalizeDateTimeLocal(secondDate.toISOString())],
      venueId: selectedDemoVenue?.venueId || "",
      hallId: hall?.hallId || "",
      layoutId: hall?.layoutId || "",
      venueName: selectedDemoVenue?.name || "",
      venueAddress: selectedDemoVenue?.address || "",
      venueType: selectedDemoVenue?.type || "",
      projectedCapacity: hall?.capacity || selectedDemoVenue?.capacity || 220,
      eventSeats: layout ? buildEventSeatsFromLayout(layout, tiers) : [],
      performers: [
        makePerformer("Ансамбль «Спадчына»"),
        makePerformer("Мария Ковалёва"),
        makePerformer("Гость программы", "Польша"),
      ],
      onlyBelarusianPerformers: false,
      hasForeignPerformers: true,
      plannedTicketsForSale: 220,
      ticketTiers: tiers,
      ageCategory: "6+",
      approvalMode: "certificate_required",
      approvalBasis: "Проведение культурно-зрелищного мероприятия с реализацией входных билетов.",
      eventDocuments: [
        mockAttachment("registry-statement", "Образец: заявление на проведение мероприятия", true),
        mockAttachment("registry-appendix", "Образец: приложение к заявлению", true),
        mockAttachment("venue-contract", "Договор с площадкой", true),
      ],
      venueContractStatus: "приложен",
      interagencyChecks: ensureChecks().map((row) => ({ ...row, status: "Проверено", updatedAt: new Date().toISOString() })),
      salesStartDate: salesStart.toISOString().slice(0, 10),
      feeExempt: false,
      feeExemptReason: "",
      feePaid: false,
      paymentAttachments: [],
      adRestrictionConfirmed: true,
      changesDeclared: false,
      executiveCommitteeNotified: true,
      citizensNotified: false,
      notificationsAttachment: [],
      cancellationComment: "",
      wizardLastStep: activeStep,
    }));
    setTierErrors([]);
    toast.success("Заявка заполнена демо-данными. Проверьте этапы и подайте на рассмотрение.");
  }

  function save(submit: boolean) {
    if (submit && !canSubmit) {
      toast.error(`Заполните обязательный минимум: ${requiredMissing.join(", ")}.`);
      setActiveStep(8);
      return;
    }
    if (submit && !validateTicketTiers()) {
      toast.error("Заполните тарифы билетов: название, количество и стоимость.");
      return;
    }
    const payload = normalizeFormPayload();
    const ok = editingId
      ? updateEventComplianceApplication(state, editingId, payload, submit)
      : !!createEventComplianceApplication(state, organizer.organizerId, payload, submit);

    if (!ok) {
      toast.error("Не удалось сохранить заявку.");
      return;
    }
    update({ ...state });
    toast.success(submit ? "Заявка подана на рассмотрение." : "Черновик сохранён.");
    if (submit) {
      setEditingId(null);
      setForm(makeDefaultForm());
      setTierErrors([]);
      setActiveStep(0);
    }
  }

  function saveAndReturnLater() {
    save(false);
    toast.success("Данные сохранены. Можно продолжить позже из списка заявок.");
  }

  function nextStep() {
    setActiveStep((step) => Math.min(step + 1, WIZARD_STEPS.length - 1));
  }

  const level1Options = Object.keys(EVENT_TYPE_TREE);
  const level2Options = eventTypePath[0] ? Object.keys(EVENT_TYPE_TREE[eventTypePath[0]] || {}) : [];
  const level3Options = eventTypePath[0] && eventTypePath[1] ? EVENT_TYPE_TREE[eventTypePath[0]]?.[eventTypePath[1]] || [] : [];

  return (
    <div className="min-h-screen px-4 py-8" style={{ background: "#0B0F14", color: "#F5F7FA" }}>
      <Sonner />
      <div className="mx-auto max-w-6xl rounded-2xl border p-6 space-y-6" style={{ borderColor: "rgba(255,255,255,0.10)", background: "#111A24" }}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">Заявка на проведение мероприятия</h1>
            <p className="text-sm" style={{ color: "rgba(245,247,250,0.72)" }}>Заполните этапы, сохраните черновик или подайте заявку в Центр Управления.</p>
            {editingApplication?.adminComment && (
              <div className="mt-3 rounded-xl border p-3 text-sm" style={{ borderColor: "rgba(251,191,36,0.35)", background: "rgba(251,191,36,0.12)", color: "#FBBF24" }}>
                Замечание Центра Управления: {editingApplication.adminComment}
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link to="/organizer" className="px-3 h-9 inline-flex items-center rounded border">Назад в кабинет</Link>
            <span className="inline-flex items-center gap-1">
              <button type="button" className="px-3 h-9 inline-flex items-center rounded border bg-[#1d2a3b]" onClick={fillWithDemoData}>Заполнить демо-данными</button>
              <HelpTooltip text="Автоматически заполнить этапы безопасными демонстрационными данными без реальных паспортных сведений." />
            </span>
          </div>
        </div>

        <section className="grid gap-2 md:grid-cols-3 xl:grid-cols-9">
          {WIZARD_STEPS.map((label, index) => {
            const active = activeStep === index;
            const status = stepStatuses[index];
            return (
              <button
                key={label}
                type="button"
                onClick={() => setActiveStep(index)}
                className="rounded-xl border p-3 text-left transition"
                style={{
                  borderColor: active ? "rgba(242,201,76,0.65)" : "rgba(255,255,255,0.12)",
                  background: active ? "rgba(242,201,76,0.12)" : "#0F1620",
                  color: "#F5F7FA",
                }}
              >
                <div className="text-xs opacity-70">Этап {index + 1}</div>
                <div className="mt-1 text-sm font-semibold leading-5">{label}</div>
                <div className="mt-2 text-[11px]" style={{ color: status === "Требует внимания" ? "#FBBF24" : "rgba(245,247,250,0.62)" }}>{status}</div>
              </button>
            );
          })}
        </section>

        <section className="rounded-2xl border p-5 space-y-5" style={{ borderColor: "rgba(255,255,255,0.12)", background: "#0F1620" }}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">{WIZARD_STEPS[activeStep]}</h2>
              <p className="mt-1 text-xs" style={{ color: "rgba(245,247,250,0.65)" }}>Свободный переход между этапами доступен через верхний список.</p>
            </div>
            <HelpTooltip text="Этапы помогают сохранить черновик и вернуться к заявке позже. Жёсткого порядка заполнения нет." />
          </div>

          {activeStep === 0 && (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-3">
                <FieldHelp text="Введите публичное название мероприятия.">
                  <input className="h-10 w-full rounded px-3 pr-9 bg-[#111A24] border" placeholder="Наименование" value={form.title} onChange={(e) => updateForm({ title: e.target.value })} />
                </FieldHelp>
                <FieldHelp text="Краткое описание используется в карточке заявки и будущего события.">
                  <input className="h-10 w-full rounded px-3 pr-9 bg-[#111A24] border" placeholder="Краткое описание" value={form.shortDescription} onChange={(e) => updateForm({ shortDescription: e.target.value })} />
                </FieldHelp>
              </div>
              <div className="grid md:grid-cols-3 gap-3">
                <FieldHelp text="Первый уровень демо-каталога типа мероприятия.">
                  <select className="h-10 w-full rounded px-3 pr-9 bg-[#111A24] border" value={eventTypePath[0] || ""} onChange={(e) => selectEventType(0, e.target.value)}>
                    <option value="">Раздел</option>
                    {level1Options.map((value) => <option key={value} value={value}>{value}</option>)}
                  </select>
                </FieldHelp>
                <FieldHelp text="Второй уровень демо-каталога зависит от выбранного раздела.">
                  <select className="h-10 w-full rounded px-3 pr-9 bg-[#111A24] border" value={eventTypePath[1] || ""} onChange={(e) => selectEventType(1, e.target.value)}>
                    <option value="">Направление</option>
                    {level2Options.map((value) => <option key={value} value={value}>{value}</option>)}
                  </select>
                </FieldHelp>
                <FieldHelp text="Третий уровень сохраняется как выбранный тип мероприятия.">
                  <select className="h-10 w-full rounded px-3 pr-9 bg-[#111A24] border" value={eventTypePath[2] || ""} onChange={(e) => selectEventType(2, e.target.value)}>
                    <option value="">Тип мероприятия</option>
                    {level3Options.map((value) => <option key={value} value={value}>{value}</option>)}
                  </select>
                </FieldHelp>
              </div>
              <div className="rounded-xl border p-3 text-sm" style={{ borderColor: "rgba(255,255,255,0.12)", background: "#111A24" }}>
                Выбранный путь: <span className="font-semibold" style={{ color: "#F2C94C" }}>{eventTypePath.length ? eventTypePath.join(" / ") : "не выбран"}</span>
              </div>
              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
                <div className="rounded-xl border p-4" style={{ borderColor: "rgba(255,255,255,0.12)", background: "#111A24" }}>
                  <div className="mb-2 text-xs" style={{ color: "rgba(245,247,250,0.72)" }}>Предпросмотр постера</div>
                  {form.posterPath ? (
                    <img src={resolvePublicAsset(form.posterPath)} alt="Выбранный постер" className="aspect-[16/10] w-full rounded-lg object-cover" />
                  ) : (
                    <div className="flex aspect-[16/10] items-center justify-center rounded-lg border text-sm" style={{ borderColor: "rgba(255,255,255,0.12)", color: "rgba(245,247,250,0.55)" }}>Постер не выбран</div>
                  )}
                </div>
                <div className="rounded-xl border p-4" style={{ borderColor: "rgba(255,255,255,0.12)", background: "#111A24" }}>
                  <label className="inline-flex h-9 cursor-pointer items-center rounded-lg px-3 text-sm font-semibold" style={{ background: "#1d2a3b", color: "#F5F7FA" }}>
                    Загрузить постер
                    <input type="file" accept={POSTER_ALLOWED_TYPES.join(",")} className="hidden" onChange={handlePosterUpload} />
                  </label>
                  <p className="mt-2 text-xs leading-relaxed" style={{ color: "rgba(245,247,250,0.65)" }}>JPG, PNG, WEBP или SVG, до 5 МБ.</p>
                </div>
              </div>
            </div>
          )}

          {activeStep === 1 && (
            <div className="space-y-4">
              <FieldHelp text="Опишите программу, порядок проведения и ключевые блоки мероприятия.">
                <textarea className="w-full min-h-28 rounded px-3 py-2 pr-9 bg-[#111A24] border" placeholder="Программа мероприятия" value={form.program} onChange={(e) => updateForm({ program: e.target.value })} />
              </FieldHelp>
              <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_180px_auto]">
                <FieldHelp text="Фамилия, имя или название коллектива участника.">
                  <input className="h-10 w-full rounded px-3 pr-9 bg-[#111A24] border" placeholder="Участник или исполнитель" value={performerDraft.name} onChange={(e) => setPerformerDraft((prev) => ({ ...prev, name: e.target.value }))} />
                </FieldHelp>
                <FieldHelp text="Для иностранного участника показывается отдельный демо-контекст документов.">
                  <select className="h-10 w-full rounded px-3 pr-9 bg-[#111A24] border" value={performerDraft.country} onChange={(e) => setPerformerDraft((prev) => ({ ...prev, country: e.target.value }))}>
                    <option value="Беларусь">Беларусь</option>
                    <option value="Польша">Польша</option>
                    <option value="Литва">Литва</option>
                    <option value="Армения">Армения</option>
                  </select>
                </FieldHelp>
                <span className="inline-flex items-center gap-1">
                  <button type="button" className="h-10 rounded bg-[#1d2a3b] px-3" onClick={addPerformer}>Добавить</button>
                  <HelpTooltip text="Добавить участника в список. Лимит ручного добавления - 10 участников." />
                </span>
              </div>
              <div className="text-xs" style={{ color: "rgba(245,247,250,0.65)" }}>Добавлено участников: {form.performers.length} из {MAX_PERFORMERS}</div>
              <div className="space-y-2">
                {form.performers.map((performer, index) => (
                  <div key={`${performer.name}-${index}`} className="rounded-xl border p-3 text-sm" style={{ borderColor: "rgba(255,255,255,0.12)", background: "#111A24" }}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold">{performer.name || "Без имени"}</div>
                        <div className="text-xs opacity-70">{performer.country} · {performer.documentStatus || "макет документа приложен"}</div>
                        <div className="mt-1 text-xs opacity-70">{performer.documentNote || "Демо-проверка документов без реальных паспортных данных."}</div>
                      </div>
                      <button type="button" className="rounded bg-[#1d2a3b] px-2 py-1 text-xs" onClick={() => updateForm({ performers: form.performers.filter((_, rowIndex) => rowIndex !== index) })}>Удалить</button>
                    </div>
                  </div>
                ))}
                {!form.performers.length && <div className="text-sm opacity-70">Участники пока не добавлены.</div>}
              </div>
            </div>
          )}

          {activeStep === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                {form.dateSlots.map((slot, index) => (
                  <div key={index} className="grid gap-2 md:grid-cols-[minmax(0,1fr)_auto]">
                    <FieldHelp text="Укажите дату и время отдельного показа или слота проведения.">
                      <input className="h-10 w-full rounded px-3 pr-9 bg-[#111A24] border" type="datetime-local" value={normalizeDateTimeLocal(slot)} onChange={(e) => updateForm({ dateSlots: form.dateSlots.map((row, rowIndex) => rowIndex === index ? normalizeDateTimeLocal(e.target.value) : row) })} />
                    </FieldHelp>
                    <button type="button" className="h-10 rounded bg-[#1d2a3b] px-3 disabled:opacity-50" disabled={form.dateSlots.length <= 1} onClick={() => updateForm({ dateSlots: form.dateSlots.filter((_, rowIndex) => rowIndex !== index) })}>Удалить слот</button>
                  </div>
                ))}
              </div>
              <span className="inline-flex items-center gap-1">
                <button type="button" className="h-9 rounded bg-[#1d2a3b] px-3" onClick={() => updateForm({ dateSlots: [...form.dateSlots, ""] })}>Добавить слот</button>
                <HelpTooltip text="Добавить ещё одну дату или время показа без создания отдельного механизма расписания." />
              </span>
            </div>
          )}

          {activeStep === 3 && (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-3">
                <FieldHelp text="Выберите только утверждённую площадку из реестра Центра Управления. Добавление площадки из заявки недоступно.">
                  <select className="h-10 w-full rounded px-3 pr-9 bg-[#111A24] border" value={form.venueId || ""} onChange={(e) => selectVenue(e.target.value)}>
                    <option value="">Выберите площадку из реестра</option>
                    {approvedVenues.map((venue) => (
                      <option key={venue.venueId} value={venue.venueId}>{venue.city} · {venue.type} · {venue.name}</option>
                    ))}
                  </select>
                </FieldHelp>
                <FieldHelp text="Зал или пространство берётся из карточки выбранной площадки.">
                  <select className="h-10 w-full rounded px-3 pr-9 bg-[#111A24] border" value={form.hallId || ""} onChange={(e) => {
                    const hall = selectedVenue?.halls.find((item) => item.hallId === e.target.value);
                    const layout = hall?.layoutId ? getSeatMapLayout(state, hall.layoutId) : null;
                    setForm((p) => ({
                      ...p,
                      hallId: hall?.hallId || "",
                      layoutId: hall?.layoutId || "",
                      projectedCapacity: hall?.capacity || selectedVenue?.capacity || null,
                      eventSeats: layout ? buildEventSeatsFromLayout(layout, p.ticketTiers) : [],
                    }));
                  }}>
                    <option value="">Зал / пространство</option>
                    {(selectedVenue?.halls || []).map((hall) => (
                      <option key={hall.hallId} value={hall.hallId}>{hall.name} · {hall.capacity} мест{hall.hasSeatMap ? " · схема" : ""}</option>
                    ))}
                  </select>
                </FieldHelp>
              </div>
              <div className="rounded-xl border p-3 text-sm" style={{ borderColor: "rgba(255,255,255,0.12)", background: "#111A24" }}>
                <div className="grid gap-2 md:grid-cols-4">
                  <div><span className="block text-xs opacity-70">Город</span>{selectedVenue?.city || "—"}</div>
                  <div><span className="block text-xs opacity-70">Тип</span>{selectedVenue?.type || form.venueType || "—"}</div>
                  <div><span className="block text-xs opacity-70">Вместимость</span>{form.projectedCapacity || "—"}</div>
                  <div><span className="block text-xs opacity-70">Схема</span>{hasSeatMap ? "есть" : "нет, только вместимость"}</div>
                </div>
              </div>
              <div className="rounded-xl border p-3" style={{ borderColor: "rgba(255,255,255,0.12)", background: "#111A24" }}>
                <div className="mb-2 inline-flex items-center gap-1 text-sm font-semibold">
                  Договор с площадкой
                  <HelpTooltip text="Обязательная демонстрационная строка документа. Генератор договора в этой итерации не создаётся." />
                </div>
                <div className="grid gap-2 md:grid-cols-3">
                  {(["требуется", "образец", "приложен"] as const).map((status) => (
                    <label key={status} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "rgba(255,255,255,0.12)" }}>
                      <input type="radio" checked={(form.venueContractStatus || "требуется") === status} onChange={() => {
                        updateForm({
                          venueContractStatus: status,
                          eventDocuments: status === "приложен" && !form.eventDocuments.some((doc) => doc.kind === "venue-contract")
                            ? [...form.eventDocuments, mockAttachment("venue-contract", "Договор с площадкой", true)]
                            : form.eventDocuments,
                        });
                      }} />
                      {status}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeStep === 4 && (
            <div className="space-y-4">
              <div className="inline-flex items-center gap-1">
                <p className="text-xs" style={{ color: "rgba(245,247,250,0.72)" }}>
                  {hasSeatMap ? "Для события со схемой количество считается по назначенным местам." : "Количество билетов и стоимость задаются по каждому тарифу отдельно."}
                </p>
                <HelpTooltip text="Используется текущий конструктор схемы зала и тарифов. Новый конструктор не создаётся." />
              </div>
              <div className="space-y-2">
                {form.ticketTiers.map((tier, idx) => {
                  const hasError = tierErrors.includes(idx);
                  return (
                    <div key={idx} className="grid md:grid-cols-[1.2fr_1fr_1fr_auto] gap-2 items-center">
                      <FieldHelp text="Название ценовой категории билетов.">
                        <input className="h-10 w-full rounded px-3 pr-9 bg-[#111A24] border" style={hasError ? { borderColor: "#f87171" } : undefined} placeholder="Тариф" value={tier.name} onChange={(e) => updateForm({ ticketTiers: form.ticketTiers.map((row, rowIdx) => rowIdx === idx ? { ...row, name: e.target.value } : row) })} />
                      </FieldHelp>
                      <FieldHelp text={hasSeatMap ? "Количество считается автоматически по местам, назначенным этому тарифу." : "Количество билетов по тарифу."}>
                        <input className="h-10 w-full rounded px-3 pr-9 bg-[#111A24] border" style={hasError ? { borderColor: "#f87171" } : undefined} type="number" min={0} placeholder="Количество" readOnly={hasSeatMap} value={hasSeatMap ? (form.eventSeats || []).filter((seat) => seat.status !== "blocked" && seat.tariffName === tier.name).length : (Number.isFinite(tier.quantity) ? (tier.quantity === 0 ? "" : tier.quantity) : "")} onFocus={(e) => e.currentTarget.select()} onChange={(e) => !hasSeatMap && updateForm({ ticketTiers: form.ticketTiers.map((row, rowIdx) => rowIdx === idx ? { ...row, quantity: e.target.value ? Number(e.target.value) : 0 } : row) })} />
                      </FieldHelp>
                      <FieldHelp text="Цена одного билета по тарифу.">
                        <input className="h-10 w-full rounded px-3 pr-9 bg-[#111A24] border" style={hasError ? { borderColor: "#f87171" } : undefined} type="number" min={0} placeholder="Стоимость билета" value={Number.isFinite(tier.price) ? (tier.price === 0 ? "" : tier.price) : ""} onFocus={(e) => e.currentTarget.select()} onChange={(e) => updateForm({ ticketTiers: form.ticketTiers.map((row, rowIdx) => rowIdx === idx ? { ...row, price: e.target.value ? Number(e.target.value) : 0 } : row) })} />
                      </FieldHelp>
                      <span className="inline-flex items-center gap-1">
                        <button className="h-10 px-3 rounded bg-[#1d2a3b] disabled:opacity-50" disabled={form.ticketTiers.length <= 1} onClick={() => updateForm({ ticketTiers: form.ticketTiers.filter((_, rowIdx) => rowIdx !== idx) })}>Удалить</button>
                        <HelpTooltip text="Удалить ценовую категорию из заявки." />
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-1">
                  <button className="px-3 h-9 rounded bg-[#1d2a3b]" onClick={() => updateForm({ ticketTiers: [...form.ticketTiers, { name: "", quantity: 0, price: 0 }] })}>Добавить тариф</button>
                  <HelpTooltip text="Добавить ещё одну ценовую категорию." />
                </span>
                <div className="inline-flex items-center gap-1 text-xs" style={{ color: "rgba(245,247,250,0.72)" }}>
                  Итого планируемых билетов: {hasSeatMap ? seatCounts.assigned : totalPlannedTickets}
                  <HelpTooltip text={hasSeatMap ? "Автосчёт мест, которым назначен тариф. Заблокированные места не продаются." : "Общее количество билетов по всем тарифам."} />
                </div>
              </div>
              {hasSeatMap && (
                <div className="space-y-3">
                  <div className="rounded-xl border p-3" style={{ borderColor: "rgba(255,255,255,0.12)", background: "#111A24" }}>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="text-sm">
                        <div className="inline-flex items-center gap-1 font-semibold">
                          Схема тарифов
                          <HelpTooltip text="Массовое назначение выполняется через выделение нескольких существующих мест на текущей схеме." />
                        </div>
                        <div className="text-xs opacity-70">Назначено: {seatCounts.assigned}; без тарифа: {seatCounts.unassigned}; блок: {seatCounts.blocked}</div>
                      </div>
                      <span className="inline-flex items-center gap-1">
                        <button type="button" onClick={() => setSeatMapOpen(true)} className="rounded bg-[#1d2a3b] px-3 py-2 text-sm font-semibold">Назначить тарифы на схеме</button>
                        <HelpTooltip text="Открыть текущий конструктор схемы зала и тарифов для группового назначения и индивидуальных исключений." />
                      </span>
                    </div>
                  </div>
                  <SeatTariffSummary
                    summary={tariffConfigurationSummary}
                    venueName={form.venueName}
                    hallName={selectedHall?.name}
                    capacity={form.projectedCapacity}
                    variant="dark"
                  />
                </div>
              )}
            </div>
          )}

          {activeStep === 5 && (
            <div className="space-y-4">
              <div className="inline-flex items-center gap-1">
                <p className="text-xs" style={{ color: "rgba(245,247,250,0.72)" }}>Свой канал включён всегда. Реселлеры берутся из текущих структур Центра Управления.</p>
                <HelpTooltip text="Выберите каналы, через которые организатор планирует распространять билеты." />
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                <label className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm" style={{ borderColor: "rgba(255,255,255,0.12)", background: "#111A24" }}>
                  <input type="checkbox" checked disabled />
                  Свой канал
                </label>
                {activeResellers.map((reseller) => (
                  <label key={reseller.resellerId} className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm" style={{ borderColor: "rgba(255,255,255,0.12)", background: "#111A24" }}>
                    <input type="checkbox" checked={(form.salesChannels || []).includes(reseller.code)} onChange={(event) => toggleSalesChannel(reseller.code, event.target.checked)} />
                    {getSalesChannelLabel(state, reseller.code)}
                  </label>
                ))}
              </div>
            </div>
          )}

          {activeStep === 6 && (
            <div className="space-y-4">
              <div className="grid gap-2 md:grid-cols-3">
                <span className="inline-flex items-center gap-1"><button className="h-9 rounded bg-[#1d2a3b] px-3" onClick={() => batchSetChecks("Отправлено")}>Сформировать пакет</button><HelpTooltip text="Собрать демонстрационный пакет сведений для межведомственных проверок." /></span>
                <span className="inline-flex items-center gap-1"><button className="h-9 rounded bg-[#1d2a3b] px-3" onClick={() => batchSetChecks("В обработке")}>Отправить на проверку</button><HelpTooltip text="Перевести демонстрационные проверки в обработку без реальных интеграций." /></span>
                <span className="inline-flex items-center gap-1"><button className="h-9 rounded bg-[#1d2a3b] px-3" onClick={() => batchSetChecks("Проверено")}>Обновить статус</button><HelpTooltip text="Обновить статусы проверок для демонстрации прохождения." /></span>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {ensureChecks(form.interagencyChecks).map((row) => (
                  <div key={row.checkId} className="rounded-xl border p-3" style={{ borderColor: "rgba(255,255,255,0.12)", background: "#111A24" }}>
                    <div className="font-semibold">{row.agency}</div>
                    <div className="mt-1 text-xs opacity-70">{row.subject}</div>
                    <FieldHelp text="Статус демонстрационной межведомственной проверки. Реальная интеграция не выполняется.">
                      <select className="mt-3 h-10 w-full rounded px-3 pr-9 bg-[#0F1620] border" value={row.status} onChange={(e) => setCheckStatus(row.checkId, e.target.value as EventInteragencyCheck["status"])}>
                        {["Не отправлено", "Отправлено", "В обработке", "Проверено", "Требует уточнения"].map((status) => <option key={status} value={status}>{status}</option>)}
                      </select>
                    </FieldHelp>
                  </div>
                ))}
              </div>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.adRestrictionConfirmed} onChange={(e) => updateForm({ adRestrictionConfirmed: e.target.checked })} /> Подтверждаю ограничение на рекламу до получения удостоверения <HelpTooltip text="Отметьте, что реклама не будет размещаться до получения удостоверения." /></label>
            </div>
          )}

          {activeStep === 7 && (
            <div className="space-y-4">
              <div className="rounded-xl border p-4 space-y-3" style={{ borderColor: "rgba(255,255,255,0.12)", background: "#111A24" }}>
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-xl border p-3" style={{ borderColor: "rgba(255,255,255,0.12)", background: "#0F1620" }}>
                    <div className="inline-flex items-center gap-1 text-xs opacity-75">Начислено <HelpTooltip text={COMPLIANCE_FEE_TOOLTIP} /></div>
                    <div className="mt-2 text-xl font-semibold">{fee} БВ</div>
                    <div className="mt-1 text-xs opacity-70">{formatMoney(feeAmount)}</div>
                  </div>
                  <div className="rounded-xl border p-3" style={{ borderColor: "rgba(255,255,255,0.12)", background: "#0F1620" }}>
                    <div className="inline-flex items-center gap-1 text-xs opacity-75">Текущий баланс <HelpTooltip text="Баланс финансового счёта организатора, доступный для оплаты обязательных пошлин." /></div>
                    <div className="mt-2 text-xl font-semibold">{formatMoney(organizerFinancialAccount.balance)}</div>
                    <div className="mt-1 text-xs opacity-70">Доступно: {formatMoney(organizerFinancialAccount.available)}</div>
                  </div>
                  <div className="rounded-xl border p-3" style={{ borderColor: paymentStatus === "Оплачено" ? "rgba(52,211,153,0.35)" : paymentStatus === "Недостаточно средств" ? "rgba(251,191,36,0.45)" : "rgba(96,165,250,0.35)", background: "#0F1620" }}>
                    <div className="inline-flex items-center gap-1 text-xs opacity-75">Статус оплаты <HelpTooltip text="Статус показывает, можно ли одобрить заявку в Центре Управления после подачи." /></div>
                    <div className="mt-2 text-xl font-semibold">{paymentStatus}</div>
                    <div className="mt-1 text-xs opacity-70">{paymentStatus === "Оплачено" ? "Одобрение будет доступно после подачи." : "Подать заявку можно, одобрение откроется после оплаты."}</div>
                  </div>
                </div>
                <FieldHelp text="Укажите дату начала реализации билетов.">
                  <input className="h-10 w-full rounded px-3 pr-9 bg-[#0F1620] border" type="date" value={form.salesStartDate} onChange={(e) => updateForm({ salesStartDate: e.target.value })} />
                </FieldHelp>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.feeExempt} onChange={(e) => updateForm({ feeExempt: e.target.checked })} /> Освобождён от пошлины <HelpTooltip text="Отметьте, если госпошлина не требуется по закону." /></label>
                <FieldHelp text="Укажите основание освобождения от госпошлины.">
                  <input className="h-10 w-full rounded px-3 pr-9 bg-[#0F1620] border" placeholder="Основание освобождения" value={form.feeExemptReason} onChange={(e) => updateForm({ feeExemptReason: e.target.value })} />
                </FieldHelp>
                {paymentStatus === "Недостаточно средств" && (
                  <div className="rounded-xl border px-3 py-2 text-sm" style={{ borderColor: "rgba(251,191,36,0.45)", background: "rgba(251,191,36,0.10)", color: "#FBBF24" }}>
                    Недостаточно средств. Пополните счёт и повторите оплату.
                  </div>
                )}
                <div className="flex flex-wrap gap-3">
                  <span className="inline-flex items-center gap-1">
                    <button className="px-3 py-2 rounded bg-[#1d2a3b]" onClick={handleTopUpBalance}>Пополнить счёт</button>
                    <HelpTooltip text={`Добавить на финансовый счёт демонстрационную сумму ${formatMoney(DEMO_TOP_UP_AMOUNT)} без внешнего платёжного шлюза.`} />
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <button className="px-3 py-2 rounded bg-[#1d2a3b]" onClick={handleGenerateFeeReceipt}>Сформировать квитанцию</button>
                    <HelpTooltip text="Создать демонстрационную квитанцию по текущей заявке." />
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <button className="px-3 py-2 rounded font-semibold disabled:opacity-50" style={{ background: "#F2C94C", color: "#111" }} onClick={handlePayFromBalance} disabled={paymentStatus === "Оплачено"}>Оплатить с баланса</button>
                    <HelpTooltip text="Списать демонстрационную сумму пошлины с финансового счёта организатора." />
                  </span>
                </div>
              </div>
              <div className="grid gap-3 lg:grid-cols-2">
                <div className="rounded-xl border p-3" style={{ borderColor: "rgba(255,255,255,0.12)", background: "#111A24" }}>
                  <div className="mb-2 inline-flex items-center gap-1 text-sm font-semibold">След операции <HelpTooltip text="Показывает операции финансового счёта, связанные с текущей заявкой." /></div>
                  <div className="space-y-2 text-sm">
                    {paymentOperations.map((operation) => (
                      <div key={operation.financeOperationId} className="rounded border px-3 py-2" style={{ borderColor: "rgba(255,255,255,0.12)" }}>
                        <div className="font-medium">{operation.kind}</div>
                        <div className="text-xs opacity-70">{operation.title} · {formatMoney(operation.amount)}</div>
                      </div>
                    ))}
                    {!paymentOperations.length && <div className="opacity-70">Операций по заявке пока нет.</div>}
                  </div>
                </div>
                <div className="rounded-xl border p-3" style={{ borderColor: "rgba(255,255,255,0.12)", background: "#111A24" }}>
                  <div className="mb-2 inline-flex items-center gap-1 text-sm font-semibold">Квитанции <HelpTooltip text="Демонстрационные квитанции по пошлине появляются после формирования или оплаты." /></div>
                  <div className="space-y-2 text-sm">
                    {paymentReceipts.map((receipt) => <div key={receipt.receiptId} className="rounded border px-3 py-2" style={{ borderColor: "rgba(255,255,255,0.12)" }}>{receipt.number} · {receipt.status} · {formatMoney(receipt.amount)}</div>)}
                    {form.paymentAttachments.map((file) => <div key={file.attachmentId} className="rounded border px-3 py-2" style={{ borderColor: "rgba(255,255,255,0.12)" }}>{file.name}</div>)}
                    {!paymentReceipts.length && !form.paymentAttachments.length && <div className="opacity-70">Квитанции пока не сформированы.</div>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeStep === 8 && (
            <div className="space-y-4">
              <div className="grid gap-2 md:grid-cols-3">
                {WIZARD_STEPS.map((label, index) => (
                  <div key={label} className="rounded-xl border p-3 text-sm" style={{ borderColor: "rgba(255,255,255,0.12)", background: "#111A24" }}>
                    <div className="font-semibold">{label}</div>
                    <div className="mt-1 text-xs opacity-70">{stepStatuses[index]}</div>
                  </div>
                ))}
              </div>
              <SummaryRow label="Тип мероприятия" value={eventTypePath.join(" / ") || "—"} />
              <SummaryRow label="Участники" value={`${form.performers.length} из ${MAX_PERFORMERS}`} />
              <SummaryRow label="Площадка" value={form.venueName || "—"} />
              <SummaryRow label="Договор с площадкой" value={form.venueContractStatus || "требуется"} />
              <SummaryRow label="Показы" value={form.dateSlots.filter(Boolean).map((slot) => slot.replace("T", " ")).join(", ") || "—"} />
              {hasSeatMap && (
                <SeatTariffSummary
                  summary={tariffConfigurationSummary}
                  venueName={form.venueName}
                  hallName={selectedHall?.name}
                  capacity={form.projectedCapacity}
                  variant="dark"
                />
              )}
              <SummaryRow label="Проверки" value={ensureChecks(form.interagencyChecks).map((row) => `${row.agency}: ${row.status}`).join("; ")} />
              <SummaryRow label="Пошлина" value={`${paymentStatus} · ${formatMoney(feeAmount)}`} />
              <div className="rounded-xl border p-3" style={{ borderColor: canSubmit ? "rgba(52,211,153,0.35)" : "rgba(251,191,36,0.35)", background: canSubmit ? "rgba(52,211,153,0.10)" : "rgba(251,191,36,0.10)" }}>
                {canSubmit ? "Обязательный минимум заполнен. Заявку можно подать на рассмотрение." : `Не заполнено: ${requiredMissing.join(", ")}.`}
              </div>
            </div>
          )}
        </section>

        <div className="flex flex-wrap gap-3">
          <span className="inline-flex items-center gap-1">
            <button className="px-4 h-10 rounded bg-[#2b3f57]" onClick={() => save(false)}>Сохранить</button>
            <HelpTooltip text="Сохранить текущие данные в черновик без отправки в Центр Управления." />
          </span>
          <span className="inline-flex items-center gap-1">
            <button className="px-4 h-10 rounded bg-[#2b3f57]" onClick={saveAndReturnLater}>Сохранить и продолжить позже</button>
            <HelpTooltip text="Сохранить черновик, чтобы продолжить заполнение из кабинета организатора позже." />
          </span>
          <span className="inline-flex items-center gap-1">
            <button className="px-4 h-10 rounded bg-[#1d2a3b]" onClick={nextStep} disabled={activeStep === WIZARD_STEPS.length - 1}>Далее</button>
            <HelpTooltip text="Перейти к следующему этапу. Заполнение можно вести в любом порядке." />
          </span>
          <span className="inline-flex items-center gap-1">
            <button className="px-4 h-10 rounded font-semibold disabled:opacity-50" style={{ background: "#F2C94C", color: "#111" }} onClick={() => save(true)} disabled={!canSubmit}>Подать на рассмотрение</button>
            <HelpTooltip text="Отправить заполненную заявку в Центр Управления. Черновики там не отображаются." />
          </span>
        </div>

        <section className="space-y-2">
          <h2 className="font-semibold">Мои заявки</h2>
          {myApps.length === 0 ? <div className="text-sm opacity-70">Пока нет заявок.</div> : (
            <div className="space-y-2">
              {myApps.map((app) => (
                <div key={app.eventComplianceApplicationId} className="rounded border p-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between" style={{ borderColor: "rgba(255,255,255,0.12)" }}>
                  <div>
                    <div className="font-medium">{app.data.title || "Без названия"}</div>
                    <div className="text-xs opacity-70">{app.eventComplianceApplicationId} · {complianceStatusLabel[app.status] || app.status}</div>
                    {!!app.adminComment && <div className="mt-2 rounded-lg border px-3 py-2 text-xs" style={{ borderColor: "rgba(251,191,36,0.35)", color: "#FBBF24" }}>Замечание Центра Управления: {app.adminComment}</div>}
                  </div>
                  {(app.status === "needs_rework" || app.status === "draft") && (
                    <span className="inline-flex items-center gap-1">
                      <button
                        className="px-3 py-2 rounded bg-[#1d2a3b]"
                        onClick={() => {
                          setEditingId(app.eventComplianceApplicationId);
                          setForm({
                            ...app.data,
                            eventTypePath: app.data.eventTypePath || [],
                            dateSlots: app.data.dateSlots?.length ? app.data.dateSlots : [""],
                            performers: app.data.performers || [],
                            ticketTiers: app.data.ticketTiers?.length ? app.data.ticketTiers : DEFAULT_COMPLIANCE_TICKET_TIERS.map((tier) => ({ ...tier })),
                            venueContractStatus: app.data.venueContractStatus || "требуется",
                            interagencyChecks: ensureChecks(app.data.interagencyChecks),
                          });
                          setActiveStep(Math.min(Math.max(app.data.wizardLastStep || 0, 0), WIZARD_STEPS.length - 1));
                          setTierErrors([]);
                        }}
                      >
                        {app.status === "draft" ? "Продолжить" : "Доработать"}
                      </button>
                      <HelpTooltip text={app.status === "draft" ? "Продолжить редактирование черновика заявки." : "Внести правки по замечанию Центра Управления."} />
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
      <SeatMapModal
        open={seatMapOpen}
        title="Назначение тарифов на схеме"
        subtitle={[selectedVenue?.name, selectedHall?.name].filter(Boolean).join(" · ")}
        mode="assign"
        baseSeats={selectedLayout?.seats || []}
        eventSeats={(form.eventSeats || []) as EventSeat[]}
        layoutV2={selectedLayout?.layoutV2}
        tiers={normalizedTiersWithColors}
        onClose={() => setSeatMapOpen(false)}
        onSaveEventSeats={(seats) => {
          setForm((prev) => ({
            ...prev,
            eventSeats: seats,
            ticketTiers: prev.ticketTiers.map((tier) => ({
              ...tier,
              quantity: seats.filter((seat) => seat.status !== "blocked" && seat.tariffName === tier.name).length,
            })),
          }));
          setSeatMapOpen(false);
          toast.success("Назначение тарифов сохранено в заявке.");
        }}
      />
    </div>
  );
}

function FieldHelp({ text, children }: { text: string; children: React.ReactNode }) {
  return (
    <div className="relative">
      {children}
      <div className="absolute right-2 top-1/2 -translate-y-1/2">
        <HelpTooltip text={text} />
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 rounded-xl border p-3 text-sm md:grid-cols-[220px_minmax(0,1fr)]" style={{ borderColor: "rgba(255,255,255,0.12)", background: "#111A24" }}>
      <div className="opacity-70">{label}</div>
      <div>{value}</div>
    </div>
  );
}
