import React, { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Toaster as Sonner } from "@/components/ui/sonner";
import HelpTooltip from "@/components/ui/help-tooltip";
import { useStorageSync } from "@/hooks/useStorageSync";
import {
  calculateComplianceFee,
  buildDefaultSalesChannels,
  createEventComplianceApplication,
  defaultEventComplianceData,
  getSalesChannelLabel,
  updateEventComplianceApplication,
} from "@/lib/store";
import {
  selectCurrentOrganizer,
  selectIsCurrentOrganizerApproved,
  selectMyEventComplianceApplications,
} from "@/lib/organizerSelectors";

const DEMO_POSTERS = [
  { path: "/demo/posters/concert-neva.svg", title: "Концерт «Огни Невы»" },
  { path: "/demo/posters/theatre-night.svg", title: "Театральная ночь" },
  { path: "/demo/posters/family-planet.svg", title: "Семейная планета" },
  { path: "/demo/posters/summer-festival.svg", title: "Летний фестиваль" },
  { path: "/demo/posters/jazz-city.svg", title: "Город и джаз" },
  { path: "/demo/posters/open-air-lights.svg", title: "Open-air lights" },
];

const COMPLIANCE_FEE_TOOLTIP = "Размер госпошлины рассчитывается по проектной вместимости площадки или количеству заявленных билетов: 1–150 — 3 БВ, 151–300 — 10 БВ, 301–500 — 30 БВ, 501–1000 — 50 БВ, 1001–1500 — 80 БВ, 1501–2000 — 100 БВ, 2001–3000 — 150 БВ, свыше 3000 — 200 БВ. Для отдельных категорий может применяться освобождение от пошлины.";
const POSTER_ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];
const POSTER_MAX_SIZE = 5 * 1024 * 1024;

function resolvePublicAsset(path: string): string {
  if (!path) return "";
  if (/^(https?:|data:|blob:)/.test(path)) return path;
  const base = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export default function OrganizerEventCompliancePage() {
  const { state, update } = useStorageSync();
  const [searchParams] = useSearchParams();
  const organizer = useMemo(() => selectCurrentOrganizer(state), [state]);
  const approved = useMemo(() => selectIsCurrentOrganizerApproved(state), [state]);
  const myApps = useMemo(() => selectMyEventComplianceApplications(state), [state]);
  const makeDefaultForm = () => ({
    ...defaultEventComplianceData(),
    salesChannels: buildDefaultSalesChannels(state),
  });
  const [form, setForm] = useState(makeDefaultForm);
  const [tierErrors, setTierErrors] = useState<number[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const activeResellers = useMemo(() => state.resellers.filter((reseller) => reseller.status === "active"), [state.resellers]);
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
      salesChannels: editingApplication.data.salesChannels?.length ? editingApplication.data.salesChannels : buildDefaultSalesChannels(state),
      ticketTiers: editingApplication.data.ticketTiers?.length ? editingApplication.data.ticketTiers : [{ name: "Стандарт", quantity: 0, price: 0 }],
    });
  }, [approved, editId, editingApplication, organizer, state]);

  if (!organizer) return <Navigate to="/organizer/login" replace />;
  if (!approved) return <Navigate to="/organizer" replace />;

  const totalPlannedTickets = form.ticketTiers.reduce((acc, tier) => acc + (Number.isFinite(tier.quantity) ? Math.max(0, Math.floor(tier.quantity)) : 0), 0);
  const fee = calculateComplianceFee(form.projectedCapacity, totalPlannedTickets, form.ticketTiers);

  const normalizeDateTimeLocal = (value: string | null | undefined): string => {
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
  };

  const normalizeFormPayload = () => {
    const normalizedTitle = (form.title || "").replace(/\s+/g, " ").trim();
    const firstDateSlot = normalizeDateTimeLocal(form.dateSlots[0]);
    const normalizedTiers = (form.ticketTiers || []).map((tier) => ({
      name: (tier.name || "").trim(),
      quantity: Number.isFinite(tier.quantity) ? Math.max(0, Math.floor(tier.quantity)) : 0,
      price: Number.isFinite(tier.price) ? Math.max(0, tier.price) : 0,
    }));
    return {
      ...form,
      title: normalizedTitle,
      dateSlots: [firstDateSlot, ...form.dateSlots.slice(1)],
      ticketTiers: normalizedTiers,
      plannedTicketsForSale: normalizedTiers.reduce((acc, tier) => acc + tier.quantity, 0),
      salesChannels: Array.from(new Set(["OWN", ...(form.salesChannels || [])])),
    };
  };

  const validateTicketTiers = () => {
    const rows = form.ticketTiers || [];
    const invalidRows = rows.reduce<number[]>((acc, tier, index) => {
      if (!tier.name?.trim() || !Number.isFinite(tier.quantity) || tier.quantity <= 0 || !Number.isFinite(tier.price) || tier.price < 0) {
        acc.push(index);
      }
      return acc;
    }, []);
    setTierErrors(invalidRows);
    return rows.length > 0 && totalPlannedTickets > 0 && invalidRows.length === 0;
  };

  const addMockAttachment = (kind: string, target: "eventDocuments" | "paymentAttachments" | "notificationsAttachment", sample = false) => {
    const file = {
      attachmentId: `${kind}-${Date.now()}`,
      kind,
      name: sample ? `Образец: ${kind}` : `dummy-${kind}-${new Date().toLocaleTimeString()}`,
      uploadedAt: new Date().toISOString(),
      isSample: sample,
    };
    setForm((prev) => ({ ...prev, [target]: [...prev[target], file] }));
  };

  const toggleSalesChannel = (code: string, checked: boolean) => {
    if (code === "OWN") return;
    setForm((prev) => {
      const current = new Set(["OWN", ...(prev.salesChannels || [])]);
      if (checked) current.add(code);
      else current.delete(code);
      return { ...prev, salesChannels: Array.from(current) };
    });
  };

  const handlePosterUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!POSTER_ALLOWED_TYPES.includes(file.type)) {
      toast.error("Можно загрузить только JPG, PNG, WEBP или SVG.");
      return;
    }
    if (file.size > POSTER_MAX_SIZE) {
      toast.error("Размер постера не должен превышать 5 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      if (!result) {
        toast.error("Не удалось прочитать файл постера.");
        return;
      }
      setForm((prev) => ({ ...prev, posterPath: result }));
      toast.success("Постер загружен для предпросмотра.");
    };
    reader.onerror = () => toast.error("Не удалось прочитать файл постера.");
    reader.readAsDataURL(file);
  };

  const save = (submit: boolean) => {
    if (submit && !validateTicketTiers()) {
      toast.error("Заполните тарифы билетов: название, количество и стоимость.");
      return;
    }
    const payload = normalizeFormPayload();
    if (submit && !payload.title) {
      toast.error("Укажите наименование мероприятия");
      return;
    }

    const ok = editingId
      ? updateEventComplianceApplication(state, editingId, payload, submit)
      : !!createEventComplianceApplication(state, organizer.organizerId, payload, submit);

    if (!ok) {
      toast.error("Не удалось сохранить заявку");
      return;
    }
    update({ ...state });
    toast.success(submit ? "Заявка отправлена." : "Черновик сохранён.");
    if (submit) {
      setEditingId(null);
      setForm(makeDefaultForm());
      setTierErrors([]);
    }
  };

  return (
    <div className="min-h-screen px-4 py-8" style={{ background: "#0B0F14", color: "#F5F7FA" }}>
      <Sonner />
      <div className="mx-auto max-w-5xl rounded-2xl border p-6 space-y-6" style={{ borderColor: "rgba(255,255,255,0.10)", background: "#111A24" }}>
        <div className="flex justify-between items-start gap-4">
          <div>
            <h1 className="text-2xl font-bold mb-2">Заявка на проведение мероприятия</h1>
            <p className="text-sm" style={{ color: "rgba(245,247,250,0.72)" }}>Согласование, госпошлина и выдача удостоверения.</p>
          </div>
          <div className="inline-flex items-center gap-1">
            <Link to="/organizer" className="px-3 h-9 inline-flex items-center rounded border">Назад в кабинет</Link>
            <HelpTooltip text="Вернуться в кабинет организатора." />
          </div>
        </div>

        <section className="space-y-3">
          <h2 className="font-semibold">Основные сведения о мероприятии</h2>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="relative">
              <input className="h-10 w-full rounded px-3 pr-9 bg-[#0F1620] border" placeholder="Наименование" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
              <div className="absolute right-2 top-1/2 -translate-y-1/2"><HelpTooltip text="Введите название мероприятия." /></div>
            </div>
            <div className="relative">
              <input className="h-10 w-full rounded px-3 pr-9 bg-[#0F1620] border" placeholder="Тип мероприятия" value={form.eventType} onChange={(e) => setForm((p) => ({ ...p, eventType: e.target.value }))} />
              <div className="absolute right-2 top-1/2 -translate-y-1/2"><HelpTooltip text="Выберите тип мероприятия из списка." /></div>
            </div>
            <div className="relative">
              <input className="h-10 w-full rounded px-3 pr-9 bg-[#0F1620] border" type="datetime-local" value={normalizeDateTimeLocal(form.dateSlots[0])} onChange={(e) => setForm((p) => ({ ...p, dateSlots: [normalizeDateTimeLocal(e.target.value), ...p.dateSlots.slice(1)] }))} />
              <div className="absolute right-2 top-1/2 -translate-y-1/2"><HelpTooltip text="Выберите дату и время начала мероприятия." /></div>
            </div>
            <div className="relative">
              <input className="h-10 w-full rounded px-3 pr-9 bg-[#0F1620] border" placeholder="Место проведения" value={form.venueName} onChange={(e) => setForm((p) => ({ ...p, venueName: e.target.value }))} />
              <div className="absolute right-2 top-1/2 -translate-y-1/2"><HelpTooltip text="Введите название площадки, где будет проходить мероприятие." /></div>
            </div>
          </div>
          <div className="relative">
            <input className="h-10 w-full rounded px-3 pr-9 bg-[#0F1620] border" placeholder="Адрес площадки" value={form.venueAddress} onChange={(e) => setForm((p) => ({ ...p, venueAddress: e.target.value }))} />
            <div className="absolute right-2 top-1/2 -translate-y-1/2"><HelpTooltip text="Введите адрес площадки: город, улица, дом." /></div>
          </div>
          <div className="relative">
            <textarea className="w-full min-h-20 rounded px-3 py-2 pr-9 bg-[#0F1620] border" placeholder="Краткое описание" value={form.shortDescription} onChange={(e) => setForm((p) => ({ ...p, shortDescription: e.target.value }))} />
            <div className="absolute right-2 top-3"><HelpTooltip text="Краткое описание мероприятия для согласования." /></div>
          </div>
          <div className="relative">
            <textarea className="w-full min-h-20 rounded px-3 py-2 pr-9 bg-[#0F1620] border" placeholder="Программа" value={form.program} onChange={(e) => setForm((p) => ({ ...p, program: e.target.value }))} />
            <div className="absolute right-2 top-3"><HelpTooltip text="Опишите программу мероприятия." /></div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="font-semibold">Постер мероприятия</h2>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {DEMO_POSTERS.map((poster) => {
                const selected = form.posterPath === poster.path;
                return (
                  <button
                    key={poster.path}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, posterPath: poster.path }))}
                    className="overflow-hidden rounded-xl border p-2 text-left transition"
                    style={{
                      borderColor: selected ? "#F2C94C" : "rgba(255,255,255,0.12)",
                      background: selected ? "rgba(242,201,76,0.12)" : "#0F1620",
                      boxShadow: selected ? "0 0 0 3px rgba(242,201,76,0.16)" : "none",
                    }}
                  >
                    <img src={resolvePublicAsset(poster.path)} alt={poster.title} className="aspect-[16/10] w-full rounded-lg object-cover" />
                    <div className="mt-2 text-xs font-medium">{poster.title}</div>
                  </button>
                );
              })}
            </div>
            <div className="rounded-xl border p-3" style={{ borderColor: "rgba(255,255,255,0.12)", background: "#0F1620" }}>
              <div className="mb-2 text-xs" style={{ color: "rgba(245,247,250,0.72)" }}>Предпросмотр</div>
              {form.posterPath ? (
                <img src={resolvePublicAsset(form.posterPath)} alt="Выбранный постер" className="aspect-[16/10] w-full rounded-lg object-cover" />
              ) : (
                <div className="flex aspect-[16/10] items-center justify-center rounded-lg border text-sm" style={{ borderColor: "rgba(255,255,255,0.12)", color: "rgba(245,247,250,0.55)" }}>
                  Постер не выбран
                </div>
              )}
              <div className="mt-3 space-y-2">
                <label className="inline-flex h-9 cursor-pointer items-center rounded-lg px-3 text-sm font-semibold" style={{ background: "#1d2a3b", color: "#F5F7FA" }}>
                  Загрузить свой постер
                  <input type="file" accept={POSTER_ALLOWED_TYPES.join(",")} className="hidden" onChange={handlePosterUpload} />
                </label>
                <p className="text-xs leading-relaxed" style={{ color: "rgba(245,247,250,0.65)" }}>
                  JPG, PNG, WEBP или SVG, до 5 MB. Рекомендуемый размер — 1200×750 px.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="font-semibold">Исполнители</h2>
          <div className="flex gap-5 text-sm">
            <label className="flex items-center gap-2"><input type="checkbox" checked={form.onlyBelarusianPerformers} onChange={(e) => setForm((p) => ({ ...p, onlyBelarusianPerformers: e.target.checked }))} /> Только белорусские исполнители <HelpTooltip text="Отметьте, если среди исполнителей нет иностранных граждан." /></label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={form.hasForeignPerformers} onChange={(e) => setForm((p) => ({ ...p, hasForeignPerformers: e.target.checked }))} /> Есть зарубежные исполнители <HelpTooltip text="Отметьте, если в мероприятии участвуют исполнители из других стран." /></label>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="font-semibold">Площадка и вместимость</h2>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="relative">
              <input className="h-10 w-full rounded px-3 pr-9 bg-[#0F1620] border" placeholder="Тип площадки" value={form.venueType} onChange={(e) => setForm((p) => ({ ...p, venueType: e.target.value }))} />
              <div className="absolute right-2 top-1/2 -translate-y-1/2"><HelpTooltip text="Укажите тип площадки." /></div>
            </div>
            <div className="relative">
              <input className="h-10 w-full rounded px-3 pr-9 bg-[#0F1620] border" type="number" placeholder="Проектная вместимость" value={form.projectedCapacity ?? ""} onChange={(e) => setForm((p) => ({ ...p, projectedCapacity: e.target.value ? Number(e.target.value) : null }))} />
              <div className="absolute right-2 top-1/2 -translate-y-1/2"><HelpTooltip text="Введите максимальное количество зрителей, которое может принять площадка." /></div>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="font-semibold">Тарифы билетов</h2>
          <div className="inline-flex items-center gap-1">
            <p className="text-xs" style={{ color: "rgba(245,247,250,0.72)" }}>Количество билетов и стоимость задаются по каждому тарифу отдельно.</p>
            <HelpTooltip text="Расчёт показывает, сколько билетов заявлено по тарифам относительно вместимости площадки." />
          </div>
          <div className="space-y-2">
            {form.ticketTiers.map((tier, idx) => {
              const hasError = tierErrors.includes(idx);
              return (
                <div key={idx} className="grid md:grid-cols-[1.2fr_1fr_1fr_auto] gap-2 items-center">
                  <div className="relative">
                    <input
                    className="h-10 w-full rounded px-3 pr-9 bg-[#0F1620] border"
                    style={hasError ? { borderColor: "#f87171" } : undefined}
                    placeholder="Тариф"
                    value={tier.name}
                    onChange={(e) => setForm((p) => ({ ...p, ticketTiers: p.ticketTiers.map((row, rowIdx) => rowIdx === idx ? { ...row, name: e.target.value } : row) }))}
                  />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2"><HelpTooltip text="Введите название ценовой категории билетов." /></div>
                  </div>
                  <div className="relative">
                    <input
                    className="h-10 w-full rounded px-3 pr-9 bg-[#0F1620] border"
                    style={hasError ? { borderColor: "#f87171" } : undefined}
                    type="number"
                    min={0}
                    placeholder="Количество"
                    value={Number.isFinite(tier.quantity) ? (tier.quantity === 0 ? "" : tier.quantity) : ""}
                    onFocus={(e) => e.currentTarget.select()}
                    onChange={(e) => setForm((p) => ({ ...p, ticketTiers: p.ticketTiers.map((row, rowIdx) => rowIdx === idx ? { ...row, quantity: e.target.value ? Number(e.target.value) : 0 } : row) }))}
                  />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2"><HelpTooltip text="Количество билетов, доступное по данному тарифу." /></div>
                  </div>
                  <div className="relative">
                    <input
                    className="h-10 w-full rounded px-3 pr-9 bg-[#0F1620] border"
                    style={hasError ? { borderColor: "#f87171" } : undefined}
                    type="number"
                    min={0}
                    placeholder="Стоимость билета"
                    value={Number.isFinite(tier.price) ? (tier.price === 0 ? "" : tier.price) : ""}
                    onFocus={(e) => e.currentTarget.select()}
                    onChange={(e) => setForm((p) => ({ ...p, ticketTiers: p.ticketTiers.map((row, rowIdx) => rowIdx === idx ? { ...row, price: e.target.value ? Number(e.target.value) : 0 } : row) }))}
                  />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2"><HelpTooltip text="Цена одного билета по этому тарифу." /></div>
                  </div>
                  <div className="inline-flex items-center gap-1">
                    <button
                    className="h-10 px-3 rounded bg-[#1d2a3b] disabled:opacity-50"
                    disabled={form.ticketTiers.length <= 1}
                    onClick={() => setForm((p) => ({ ...p, ticketTiers: p.ticketTiers.filter((_, rowIdx) => rowIdx !== idx) }))}
                  >
                    Удалить
                  </button>
                    <HelpTooltip text="Удалить эту ценовую категорию из заявки." />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between gap-3">
            <div className="inline-flex items-center gap-1">
              <button
              className="px-3 h-9 rounded bg-[#1d2a3b]"
              onClick={() => setForm((p) => ({ ...p, ticketTiers: [...p.ticketTiers, { name: "", quantity: 0, price: 0 }] }))}
            >
              Добавить тариф
            </button>
              <HelpTooltip text="Добавить ещё одну ценовую категорию." />
            </div>
            <div className="inline-flex items-center gap-1 text-xs" style={{ color: "rgba(245,247,250,0.72)" }}>Итого планируемых билетов: {totalPlannedTickets}<HelpTooltip text="Общее количество билетов, заявленных по всем тарифам." /></div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="font-semibold">Каналы продаж</h2>
          <p className="text-xs" style={{ color: "rgba(245,247,250,0.72)" }}>
            Выберите каналы, через которые организатор планирует распространять билеты. Свой канал включён всегда.
          </p>
          <div className="grid gap-2 md:grid-cols-2">
            <label className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm" style={{ borderColor: "rgba(255,255,255,0.12)", background: "#0F1620" }}>
              <input type="checkbox" checked disabled />
              Свой канал
            </label>
            {activeResellers.map((reseller) => (
              <label key={reseller.resellerId} className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm" style={{ borderColor: "rgba(255,255,255,0.12)", background: "#0F1620" }}>
                <input
                  type="checkbox"
                  checked={(form.salesChannels || []).includes(reseller.code)}
                  onChange={(event) => toggleSalesChannel(reseller.code, event.target.checked)}
                />
                {getSalesChannelLabel(state, reseller.code)}
              </label>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="font-semibold">Возрастная категория и режим согласования</h2>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="relative">
              <select className="h-10 w-full rounded px-3 pr-9 bg-[#0F1620] border" value={form.ageCategory} onChange={(e) => setForm((p) => ({ ...p, ageCategory: e.target.value as "0+" | "6+" | "12+" | "16+" | "18+" }))}>
              <option value="0+">0+</option><option value="6+">6+</option><option value="12+">12+</option><option value="16+">16+</option><option value="18+">18+</option>
              </select>
              <div className="absolute right-2 top-1/2 -translate-y-1/2"><HelpTooltip text="Выберите минимальный возраст зрителей." /></div>
            </div>
            <div className="relative">
              <select className="h-10 w-full rounded px-3 pr-9 bg-[#0F1620] border" value={form.approvalMode} onChange={(e) => setForm((p) => ({ ...p, approvalMode: e.target.value as "certificate_required" | "notice_only" | "certificate_not_required" }))}>
              <option value="certificate_required">Требуется удостоверение</option>
              <option value="notice_only">Требуется только уведомление</option>
              <option value="certificate_not_required">Удостоверение не требуется</option>
              </select>
              <div className="absolute right-2 top-1/2 -translate-y-1/2"><HelpTooltip text="Выберите порядок согласования мероприятия." /></div>
            </div>
          </div>
          <div className="relative">
            <textarea className="w-full min-h-16 rounded px-3 py-2 pr-9 bg-[#0F1620] border" placeholder="Основание / комментарий" value={form.approvalBasis} onChange={(e) => setForm((p) => ({ ...p, approvalBasis: e.target.value }))} />
            <div className="absolute right-2 top-3"><HelpTooltip text="Укажите основание или комментарий к выбранному режиму согласования." /></div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="font-semibold">Документы и материалы по мероприятию</h2>
          <div className="space-y-2">
            <h3 className="font-semibold">Документы</h3>
            <div className="flex gap-2 flex-wrap">
              <div className="inline-flex items-center gap-1"><button className="px-3 py-2 rounded bg-[#1d2a3b]" onClick={() => addMockAttachment("registry-statement", "eventDocuments")}>Загрузить заявление (тестовый файл)</button><HelpTooltip text="Прикрепить заявление по мероприятию." /></div>
              <div className="inline-flex items-center gap-1"><button className="px-3 py-2 rounded bg-[#1d2a3b]" onClick={() => addMockAttachment("registry-appendix", "eventDocuments")}>Загрузить приложение (тестовый файл)</button><HelpTooltip text="Прикрепить приложение к заявлению." /></div>
              <div className="inline-flex items-center gap-1"><button className="px-3 py-2 rounded bg-[#2b3f57]" onClick={() => addMockAttachment("sample", "eventDocuments", true)}>Скачать образец</button><HelpTooltip text="Скачать образец документа для заполнения." /></div>
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold">Материалы мероприятия</h3>
            <div className="flex gap-2 flex-wrap">
              <div className="inline-flex items-center gap-1"><button type="button" className="px-3 py-2 rounded bg-[#1d2a3b]">Загрузить программу мероприятия (тестовый файл)</button><HelpTooltip text="Демонстрационная загрузка программы мероприятия. В MVP файл не сохраняется." /></div>
              <div className="inline-flex items-center gap-1"><button type="button" className="px-3 py-2 rounded bg-[#1d2a3b]">Загрузить видео (тестовый файл)</button><HelpTooltip text="Демонстрационная загрузка видеоматериала мероприятия. В MVP файл не сохраняется." /></div>
              <div className="inline-flex items-center gap-1"><button type="button" className="px-3 py-2 rounded bg-[#1d2a3b]">Загрузить аудио (тестовый файл)</button><HelpTooltip text="Демонстрационная загрузка аудиоматериала мероприятия. В MVP файл не сохраняется." /></div>
              <div className="inline-flex items-center gap-1"><button type="button" className="px-3 py-2 rounded bg-[#1d2a3b]">Загрузить рекламные материалы (тестовый файл)</button><HelpTooltip text="Демонстрационная загрузка рекламных материалов мероприятия. В MVP файл не сохраняется." /></div>
            </div>
            <p className="text-xs" style={{ color: "rgba(245,247,250,0.65)" }}>Программа мероприятия: PDF, DOC или DOCX. Видео: MP4 или AVI, до 100 ГБ. Аудио: MP3 или WAV. Рекламные материалы: PDF, JPG или PNG.</p>
          </div>
          <p className="text-xs" style={{ color: "rgba(245,247,250,0.65)" }}>Демонстрационный блок. В MVP файлы не загружаются и используются только для визуализации процесса подачи заявки.</p>
        </section>

        <section className="space-y-3">
          <h2 className="font-semibold">Сроки и госпошлина</h2>
          <div className="relative">
            <input className="h-10 w-full rounded px-3 pr-9 bg-[#0F1620] border" type="date" value={form.salesStartDate} onChange={(e) => setForm((p) => ({ ...p, salesStartDate: e.target.value }))} />
            <div className="absolute right-2 top-1/2 -translate-y-1/2"><HelpTooltip text="Укажите дату начала реализации билетов." /></div>
          </div>
          <div className="inline-flex items-center gap-1"><p className="text-xs" style={{ color: "#F2C94C" }}>Документы на удостоверение должны быть поданы заранее, не позднее чем за 10 рабочих дней до начала реализации билетов.</p><HelpTooltip text="Срок подачи нужен для проверки соблюдения регламентного срока до старта продаж." /></div>
          {form.approvalMode === "certificate_required" && (
            <div className="rounded-xl border p-4 space-y-2" style={{ borderColor: "rgba(255,255,255,0.12)", background: "#0F1620" }}>
              <div className="inline-flex items-center gap-1">Расчёт пошлины: <b>{fee} БВ</b><HelpTooltip text={COMPLIANCE_FEE_TOOLTIP} /></div>
              <label className="flex items-center gap-2"><input type="checkbox" checked={form.feeExempt} onChange={(e) => setForm((p) => ({ ...p, feeExempt: e.target.checked }))} /> Освобождён от пошлины <HelpTooltip text="Отметьте, если госпошлина не требуется по закону." /></label>
              <div className="relative">
                <input className="h-10 w-full rounded px-3 pr-9 bg-[#111A24] border" placeholder="Основание освобождения" value={form.feeExemptReason} onChange={(e) => setForm((p) => ({ ...p, feeExemptReason: e.target.value }))} />
                <div className="absolute right-2 top-1/2 -translate-y-1/2"><HelpTooltip text="Укажите основание освобождения от госпошлины." /></div>
              </div>
              <label className="flex items-center gap-2"><input type="checkbox" checked={form.feePaid} onChange={(e) => setForm((p) => ({ ...p, feePaid: e.target.checked }))} /> Пошлина оплачена <HelpTooltip text="Отметьте, если пошлина уже оплачена." /></label>
              <div className="inline-flex items-center gap-1"><button className="px-3 py-2 rounded bg-[#1d2a3b]" onClick={() => addMockAttachment("payment-order", "paymentAttachments")}>Платёжка (тестовый файл)</button><HelpTooltip text="Прикрепите платёжный документ." /></div>
            </div>
          )}
        </section>

        <section className="space-y-2 text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" checked={form.adRestrictionConfirmed} onChange={(e) => setForm((p) => ({ ...p, adRestrictionConfirmed: e.target.checked }))} /> Подтверждаю ограничение на рекламу до получения удостоверения <HelpTooltip text="Отметьте, что реклама не будет размещаться до получения удостоверения." /></label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={form.changesDeclared} onChange={(e) => setForm((p) => ({ ...p, changesDeclared: e.target.checked }))} /> Изменены дата / место / состав участников <HelpTooltip text="Отметьте, если параметры мероприятия были изменены." /></label>
          {form.approvalMode === "notice_only" && (
            <>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.executiveCommitteeNotified} onChange={(e) => setForm((p) => ({ ...p, executiveCommitteeNotified: e.target.checked }))} />
                Уполномоченный орган уведомлён
                <HelpTooltip text="Используется для сценариев, где удостоверение не требуется, но требуется уведомление уполномоченного органа." />
              </label>
              <div className="inline-flex items-center gap-1"><button className="px-3 py-2 rounded bg-[#1d2a3b]" onClick={() => addMockAttachment("notify-proof", "notificationsAttachment")}>Подтверждение уведомления (тестовый файл)</button><HelpTooltip text="Загрузите подтверждение уведомления." /></div>
            </>
          )}
          <div className="relative">
            <textarea className="w-full min-h-16 rounded px-3 py-2 pr-9 bg-[#0F1620] border" placeholder="Комментарий" value={form.cancellationComment} onChange={(e) => setForm((p) => ({ ...p, cancellationComment: e.target.value }))} />
            <div className="absolute right-2 top-3"><HelpTooltip text="Укажите комментарий по изменениям или уведомлению." /></div>
          </div>
        </section>

        <div className="flex gap-3">
          <div className="inline-flex items-center gap-1">
            <button className="px-4 h-10 rounded bg-[#2b3f57]" onClick={() => save(false)}>Сохранить черновик</button>
            <HelpTooltip text="Сохранить текущую заявку без отправки на рассмотрение." />
          </div>
          <div className="inline-flex items-center gap-1">
            <button className="px-4 h-10 rounded font-semibold" style={{ background: "#F2C94C", color: "#111" }} onClick={() => save(true)}>Отправить заявку</button>
            <HelpTooltip text="Отправить заполненную заявку на согласование." />
          </div>
        </div>

        <section className="space-y-2">
          <h2 className="font-semibold">Мои заявки</h2>
          {myApps.length === 0 ? <div className="text-sm opacity-70">Пока нет заявок.</div> : (
            <div className="space-y-2">
              {myApps.map((app) => (
                <div key={app.eventComplianceApplicationId} className="rounded border p-3 flex items-center justify-between" style={{ borderColor: "rgba(255,255,255,0.12)" }}>
                  <div>
                    <div className="font-medium">{app.data.title || "Без названия"}</div>
                    <div className="text-xs opacity-70">{app.eventComplianceApplicationId} · {complianceStatusLabel[app.status] || app.status}</div>
                    {!!app.adminComment && <div className="text-xs mt-1"><span className="opacity-70">Комментарий администратора:</span> {app.adminComment}</div>}
                  </div>
                  {(app.status === "needs_rework" || app.status === "draft") && (
                    <div className="inline-flex items-center gap-1">
                      <button
                      className="px-3 py-2 rounded bg-[#1d2a3b]"
                      onClick={() => {
                        setEditingId(app.eventComplianceApplicationId);
                        setForm({
                          ...app.data,
                          ticketTiers: app.data.ticketTiers?.length ? app.data.ticketTiers : [{ name: "Стандарт", quantity: 0, price: 0 }],
                        });
                        setTierErrors([]);
                      }}
                    >
                      {app.status === "draft" ? "Продолжить" : "Доработать"}
                      </button>
                      <HelpTooltip text={app.status === "draft" ? "Продолжить редактирование черновика заявки." : "Внести правки по замечаниям администратора."} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
