import React, { useMemo, useState } from "react";
import type { AppState, VenueRegistryRecord } from "@/lib/store";
import { getSeatMapLayout, saveSeatMapLayout } from "@/lib/store";
import { A, statusChip } from "./adminStyles";
import { Building2, MapPin, X } from "lucide-react";
import HelpTooltip from "@/components/ui/help-tooltip";
import SeatMapModal from "@/components/seatmap/SeatMapModal";

function CardHelp({ text }: { text: string }) {
  return (
    <div className="absolute right-4 top-4 z-10">
      <HelpTooltip text={text} />
    </div>
  );
}

const riskLabel: Record<string, string> = {
  high: "Высокий",
  medium: "Средний",
  low: "Низкий",
};

// Organizer Registry
export function AdminOrgRegistry({ state }: { state: AppState }) {
  const [drawer, setDrawer] = useState<any>(null);
  const organizerMetaFallback: Record<string, { address: string; activities: string }> = {
    demo_org_1: {
      address: "220004, г. Минск, пр-т Победителей, 11",
      activities: "Концерты, Шоу, Фестивали",
    },
    demo_org_2: {
      address: "246050, г. Гомель, ул. Советская, 7",
      activities: "Концерты, Шоу, Театр",
    },
  };

  const orgs = useMemo(() => {
    const approvedOrganizerIds = new Set(state.organizerRegistry.map((record) => record.organizerId));
    return state.organizers
      .filter((organizer) => approvedOrganizerIds.has(organizer.organizerId))
      .map((organizer) => {
        const latestOrganizerApplication = state.organizerApplications
          .filter((application) => application.organizerId === organizer.organizerId)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] || null;
        const apps = state.applications.filter((a) => a.organizerId === organizer.organizerId);
        const events = state.events.filter((e) => e.organizerId === organizer.organizerId);
        const eventIds = new Set(events.map((e) => e.eventId));
        const violations = state.ops.filter((o) => o.result === "error" && eventIds.has(o.eventId)).length;
        const updatedAt = [
          organizer.registryRegisteredAt ? `${organizer.registryRegisteredAt}T00:00:00` : "",
          ...apps.map((a) => a.updatedAt),
          ...events.map((e) => e.updatedAt),
        ].filter(Boolean).sort((a, b) => b.localeCompare(a))[0] || "";
        return {
          id: organizer.organizerId,
          name: organizer.name,
          registryNumber: state.organizerRegistry.find((r) => r.organizerId === organizer.organizerId)?.internalNumber || "—",
          apps: apps.length,
          events: events.length,
          violations,
          lastActivity: updatedAt,
          risk: violations > 2 ? "high" : violations > 0 ? "medium" : "low",
          latestOrganizerApplication,
        };
      });
  }, [state]);

  const riskChip = (r: string) => r === 'high' ? statusChip('error') : r === 'medium' ? statusChip('warn') : statusChip('ok');

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-1.5">
        <span className="text-xs" style={{ color: A.textSecondary }}>Реестр организаторов</span>
        <HelpTooltip text="Нажмите на строку, чтобы открыть карточку организатора с деталями и риском." />
      </div>
      <div style={{ background: A.cardBg, border: `1px solid ${A.border}`, borderRadius: 16, boxShadow: A.cardShadow }} className="relative overflow-hidden">
        <CardHelp text="Реестр показывает утверждённых организаторов, их активность, количество мероприятий и риск по операциям." />
        {orgs.length === 0 ? (
          <div className="flex flex-col items-center py-12">
            <Building2 size={28} style={{ color: A.textMuted }} className="mb-2" />
            <p style={{ color: A.textMuted }} className="text-sm">Нет организаторов</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: A.tableHeaderBg }}>
                  {["Организатор", "№ в реестре", "Заявки", "Мероприятия", "Нарушения", "Риск", "Последняя активность"].map((h, i) => (
                    <th key={i} className="text-left py-3 px-4 font-medium text-xs" style={{ color: A.textSecondary, borderBottom: `1px solid ${A.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orgs.map(o => {
                  const rc = riskChip(o.risk);
                  return (
                    <tr key={o.id} className="transition-colors cursor-pointer"
                      style={{ borderBottom: `1px solid ${A.border}` }}
                      onClick={() => setDrawer(o)}
                      onMouseEnter={e => (e.currentTarget.style.background = A.rowHover)}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <td className="py-3 px-4" style={{ color: A.textPrimary }}>{o.name}</td>
                      <td className="py-3 px-4" style={{ color: A.textSecondary }}>{o.registryNumber}</td>
                      <td className="py-3 px-4" style={{ color: A.textPrimary }}>{o.apps}</td>
                      <td className="py-3 px-4" style={{ color: A.textPrimary }}>{o.events}</td>
                      <td className="py-3 px-4" style={{ color: A.textPrimary }}>{o.violations}</td>
                      <td className="py-3 px-4">
                        <span style={{ background: rc.bg, color: rc.color, borderRadius: 999 }} className="text-xs px-2.5 py-0.5 font-medium">{riskLabel[o.risk] || o.risk}</span>
                      </td>
                      <td className="py-3 px-4 text-xs" style={{ color: A.textMuted }}>{o.lastActivity?.replace("T", " ").slice(0, 16)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {drawer && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setDrawer(null)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative w-full max-w-md h-full overflow-y-auto animate-in slide-in-from-right duration-300"
            style={{ background: A.glassGradient + ', ' + A.sidebarBg, borderLeft: `1px solid ${A.borderGlass}` }}
            onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 z-10 flex items-center justify-between p-5" style={{ background: A.topbarBg, backdropFilter: 'blur(16px)', borderBottom: `1px solid ${A.border}` }}>
              <h3 style={{ color: A.textPrimary }} className="text-base font-semibold">{drawer.name}</h3>
              <button onClick={() => setDrawer(null)} style={{ color: A.textMuted }}><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              {([["Полное наименование", drawer.latestOrganizerApplication?.data?.legalName || drawer.name || "—"], ["Регистрационный номер", drawer.latestOrganizerApplication?.data?.registrationNumber || state.organizers.find((organizer) => organizer.organizerId === drawer.id)?.unp || "—"], ["Контактный телефон", drawer.latestOrganizerApplication?.data?.contactPhone || state.organizers.find((organizer) => organizer.organizerId === drawer.id)?.phone || "—"], ["Электронная почта", drawer.latestOrganizerApplication?.data?.email || state.organizers.find((organizer) => organizer.organizerId === drawer.id)?.email || "—"], ["ФИО руководителя", drawer.latestOrganizerApplication?.data?.director?.fullName || state.organizers.find((organizer) => organizer.organizerId === drawer.id)?.director || "—"], ["Адрес", [drawer.latestOrganizerApplication?.data?.postalCode, drawer.latestOrganizerApplication?.data?.region, drawer.latestOrganizerApplication?.data?.locality, drawer.latestOrganizerApplication?.data?.street, drawer.latestOrganizerApplication?.data?.houseNumber, drawer.latestOrganizerApplication?.data?.roomTypeAndNumber, drawer.latestOrganizerApplication?.data?.addressExtra].filter((part: string | undefined) => Boolean(part && part.trim())).join(", ") || organizerMetaFallback[drawer.id]?.address || "—"], ["Вид деятельности / выбранные категории", [Array.isArray(drawer.latestOrganizerApplication?.data?.activities) ? drawer.latestOrganizerApplication.data.activities.join(", ") : "", drawer.latestOrganizerApplication?.data?.activityOther || ""].filter(Boolean).join(", ") || organizerMetaFallback[drawer.id]?.activities || "—"], ["Реестровый номер", drawer.registryNumber], ["Последняя активность", drawer.lastActivity?.replace("T", " ").slice(0, 16) || "—"]] as [string, string][]).map(([k, v]) => (
                <div key={k}>
                  <div style={{ color: A.textMuted }} className="text-xs font-medium mb-1">{k}</div>
                  <div style={{ color: A.textPrimary }} className="text-sm">{v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      <SeatMapModal
        open={Boolean(schemeVenue && activeLayout)}
        title={schemeVenue?.name || "Схема площадки"}
        subtitle={activeHall?.name}
        mode="layout"
        baseSeats={activeLayout?.seats || []}
        onClose={() => setSchemeVenue(null)}
        onSaveLayout={(seats) => {
          if (activeLayout && saveSeatMapLayout(state, activeLayout.layoutId, seats)) {
            onUpdate({ ...state });
          }
          setSchemeVenue(null);
        }}
      />
    </div>
  );
}

// Venue Registry
export function AdminVenueRegistry({ state, onUpdate }: { state: AppState; onUpdate: (s: AppState) => void }) {
  const [drawer, setDrawer] = useState<VenueRegistryRecord | null>(null);
  const [schemeVenue, setSchemeVenue] = useState<VenueRegistryRecord | null>(null);
  const [cityFilter, setCityFilter] = useState("");

  const venues = useMemo(() => {
    return state.venueRegistry
      .slice()
      .sort((a, b) => a.city.localeCompare(b.city) || a.name.localeCompare(b.name))
      .filter((venue) => !cityFilter || venue.city === cityFilter);
  }, [cityFilter, state.venueRegistry]);
  const cityOptions = useMemo(() => Array.from(new Set(state.venueRegistry.map((venue) => venue.city))).sort(), [state.venueRegistry]);
  const activeHall = schemeVenue?.halls.find((hall) => hall.layoutId) || null;
  const activeLayout = getSeatMapLayout(state, activeHall?.layoutId);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-1.5">
        <span className="text-xs" style={{ color: A.textSecondary }}>Реестр площадок</span>
        <HelpTooltip text="Нажмите на строку площадки, чтобы открыть подробные сведения в боковой панели." />
      </div>
      <div className="max-w-xs">
        <select value={cityFilter} onChange={(event) => setCityFilter(event.target.value)} className="h-9 w-full rounded-lg border px-3 text-sm outline-none" style={{ background: A.surfaceBg, borderColor: A.border, color: A.textPrimary }}>
          <option value="">Все города / регионы</option>
          {cityOptions.map((city) => <option key={city} value={city}>{city}</option>)}
        </select>
      </div>
      <div style={{ background: A.cardBg, border: `1px solid ${A.border}`, borderRadius: 16, boxShadow: A.cardShadow }} className="relative overflow-hidden">
        <CardHelp text="Реестр показывает площадки, связанные с заявками и опубликованными мероприятиями." />
        {venues.length === 0 ? (
          <div className="flex flex-col items-center py-12">
            <MapPin size={28} style={{ color: A.textMuted }} className="mb-2" />
            <p style={{ color: A.textMuted }} className="text-sm">Нет площадок</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: A.tableHeaderBg }}>
                  {["Площадка", "Город", "Тип", "Вместимость", "Статус", "Схема", "Действия"].map((h, i) => (
                    <th key={i} className="text-left py-3 px-4 font-medium text-xs" style={{ color: A.textSecondary, borderBottom: `1px solid ${A.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {venues.map(v => {
                  const hallWithScheme = v.halls.find((hall) => hall.hasSeatMap && hall.layoutId);
                  return (
                  <tr key={v.venueId} className="transition-colors cursor-pointer"
                    style={{ borderBottom: `1px solid ${A.border}` }}
                    onClick={() => setDrawer(v)}
                    onMouseEnter={e => (e.currentTarget.style.background = A.rowHover)}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td className="py-3 px-4" style={{ color: A.textPrimary }}>{v.name}</td>
                    <td className="py-3 px-4" style={{ color: A.textSecondary }}>{v.city}</td>
                    <td className="py-3 px-4" style={{ color: A.textSecondary }}>{v.type}</td>
                    <td className="py-3 px-4" style={{ color: A.textPrimary }}>{v.capacity}</td>
                    <td className="py-3 px-4" style={{ color: A.textPrimary }}>{v.status === "approved" ? "утверждена" : "черновик"}</td>
                    <td className="py-3 px-4" style={{ color: hallWithScheme ? A.statusOk : A.textMuted }}>{hallWithScheme ? "есть схема" : "без схемы"}</td>
                    <td className="py-3 px-4">
                      {hallWithScheme && (
                        <button onClick={(event) => { event.stopPropagation(); setSchemeVenue(v); }} className="rounded px-2 py-1 text-xs font-semibold" style={{ background: A.statusInfoBg, color: A.statusInfo }}>Открыть схему</button>
                      )}
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {drawer && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setDrawer(null)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative w-full max-w-md h-full overflow-y-auto animate-in slide-in-from-right duration-300"
            style={{ background: A.glassGradient + ', ' + A.sidebarBg, borderLeft: `1px solid ${A.borderGlass}` }}
            onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 z-10 flex items-center justify-between p-5" style={{ background: A.topbarBg, backdropFilter: 'blur(16px)', borderBottom: `1px solid ${A.border}` }}>
              <h3 style={{ color: A.textPrimary }} className="text-base font-semibold">{drawer.name}</h3>
              <button onClick={() => setDrawer(null)} style={{ color: A.textMuted }}><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              {([["Город / регион", `${drawer.city} / ${drawer.region}`], ["Тип", drawer.type], ["Адрес", drawer.address], ["Описание", drawer.description], ["Вместимость", String(drawer.capacity)], ["Залы / пространства", drawer.halls.map((hall) => `${hall.name}: ${hall.capacity}${hall.hasSeatMap ? " · схема" : ""}`).join("; ")]] as [string, string][]).map(([k, v]) => (
                <div key={k}>
                  <div style={{ color: A.textMuted }} className="text-xs font-medium mb-1">{k}</div>
                  <div style={{ color: A.textPrimary }} className="text-sm">{v}</div>
                </div>
              ))}
              {drawer.halls.some((hall) => hall.hasSeatMap) && (
                <button onClick={() => setSchemeVenue(drawer)} className="w-full rounded-lg px-3 py-2 text-sm font-semibold" style={{ background: A.statusInfoBg, color: A.statusInfo }}>Открыть схему</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
