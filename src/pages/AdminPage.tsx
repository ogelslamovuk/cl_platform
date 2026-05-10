import React, { useState } from "react";
import { useStorageSync } from "@/hooks/useStorageSync";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { A } from "@/components/admin/adminStyles";
import AdminDashboard from "@/components/admin/AdminDashboard";
import AdminOrganizerApplications from "@/components/admin/AdminOrganizerApplications";
import AdminEventComplianceApplications from "@/components/admin/AdminEventComplianceApplications";
import AdminEvents from "@/components/admin/AdminEvents";
import AdminTickets from "@/components/admin/AdminTickets";
import AdminOperations from "@/components/admin/AdminOperations";
import AdminResellers from "@/components/admin/AdminResellers";
import AdminControl from "@/components/admin/AdminControl";
import AdminCalendar from "@/components/admin/AdminCalendar";
import AdminDecisionLog from "@/components/admin/AdminDecisionLog";
import { AdminOrgRegistry, AdminVenueRegistry } from "@/components/admin/AdminRegistries";
import AdminReports from "@/components/admin/AdminReports";
import AdminRegistryEvents from "@/components/admin/AdminRegistryEvents";
import {
  LayoutDashboard, FileText, Calendar, ShieldAlert, BookOpen, Building2, MapPin,
  Globe, Ticket, Activity, BarChart3, Bell, Zap, Network,
} from "lucide-react";

type AdminTab =
  | "dashboard" | "calendar" | "control" | "decisions"
  | "organizerApplications" | "eventComplianceApplications"
  | "orgRegistry" | "venueRegistry" | "registryEvents" | "events" | "tickets" | "operations" | "resellers" | "reports";

const sidebarSections: { label?: string; items: { key: AdminTab; label: string; icon: React.ElementType }[] }[] = [
  {
    items: [
      { key: "dashboard", label: "Дашборд", icon: LayoutDashboard },
    ],
  },
  {
    label: "Регулятор",
    items: [
      { key: "organizerApplications", label: "Заявки организаторов", icon: FileText },
      { key: "eventComplianceApplications", label: "Заявки на проведение мероприятий", icon: FileText },
      { key: "calendar", label: "Календарь", icon: Calendar },
      { key: "control", label: "Контроль", icon: ShieldAlert },
      { key: "decisions", label: "Журнал решений", icon: BookOpen },
    ],
  },
  {
    label: "Реестры",
    items: [
      { key: "orgRegistry", label: "Организаторы", icon: Building2 },
      { key: "venueRegistry", label: "Площадки", icon: MapPin },
      { key: "registryEvents", label: "Мероприятия", icon: Calendar },
    ],
  },
  {
    label: "by Cinemalab",
    items: [
      { key: "events", label: "События", icon: Globe },
      { key: "tickets", label: "Билеты", icon: Ticket },
      { key: "operations", label: "Операции", icon: Activity },
      { key: "resellers", label: "Реселлеры", icon: Network },
    ],
  },
  {
    items: [
      { key: "reports", label: "Отчёты", icon: BarChart3 },
    ],
  },
];

const tabTitles: Record<AdminTab, string> = {
  dashboard: "Дашборд",
  organizerApplications: "Заявки организаторов",
  eventComplianceApplications: "Заявки на проведение мероприятий",
  calendar: "Календарь мероприятий",
  control: "Контроль и нарушения",
  decisions: "Журнал решений",
  orgRegistry: "Реестр организаторов",
  venueRegistry: "Реестр площадок",
  registryEvents: "Мероприятия",
  events: "Реестр событий",
  tickets: "Реестр билетов",
  operations: "Журнал операций",
  resellers: "Реселлеры",
  reports: "Отчёты",
};

export default function AdminPage() {
  const { state, update } = useStorageSync();
  const [tab, setTab] = useState<AdminTab>("dashboard");
  const syncTime = state.meta?.updatedAt ? new Date(state.meta.updatedAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "—";

  return (
    <div className="min-h-screen flex" style={{ background: A.pageBg, color: A.textPrimary }}>
      <Sonner
        toastOptions={{
          style: { background: A.cardBg, border: `1px solid ${A.borderGlass}`, color: A.textPrimary },
        }}
      />

      {/* Background cosmic gradient */}
      <div className="fixed inset-0 pointer-events-none" style={{ background: A.cosmicGradient }} />

      {/* Sidebar */}
      <aside className="w-[240px] shrink-0 sticky top-0 h-screen z-30 flex flex-col"
        style={{ background: A.sidebarBg, borderRight: `1px solid ${A.border}` }}>
        {/* Logo */}
        <div className="h-14 flex items-center px-5" style={{ borderBottom: `1px solid ${A.border}` }}>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${A.cyan}30, ${A.violet}30)` }}>
              <Zap size={14} style={{ color: A.cyan }} />
            </div>
            <div>
              <div className="text-sm font-bold tracking-tight" style={{ color: A.textPrimary, letterSpacing: '-0.2px' }}>Центр Управления</div>
              <div className="text-[10px]" style={{ color: A.textMuted }}>by Cinemalab</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-4">
          {sidebarSections.map((section, si) => (
            <div key={si}>
              {section.label && (
                <div className="text-[10px] font-semibold uppercase tracking-wider px-2 mb-2" style={{ color: A.textMuted }}>{section.label}</div>
              )}
              <div className="space-y-0.5">
                {section.items.map(item => {
                  const isActive = tab === item.key;
                  return (
                    <button key={item.key} onClick={() => setTab(item.key)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all relative"
                      style={{
                        background: isActive ? A.selectedBg : 'transparent',
                        color: isActive ? A.textPrimary : A.textSecondary,
                      }}
                      onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                      onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}>
                      {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full" style={{ background: A.cyan }} />}
                      <item.icon size={16} style={{ color: isActive ? A.cyan : A.textSecondary }} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Sync status */}
        <div className="px-4 py-3" style={{ borderTop: `1px solid ${A.border}` }}>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: A.statusOk }} />
            <span className="text-[11px]" style={{ color: A.textMuted }}>Sync: {syncTime}</span>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0 relative z-10">
        {/* Topbar */}
        <header className="sticky top-0 z-40 h-14 flex items-center justify-between px-6"
          style={{ background: A.topbarBg, backdropFilter: 'blur(20px)', borderBottom: `1px solid ${A.border}` }}>
          <h1 className="text-base font-semibold" style={{ letterSpacing: '-0.3px' }}>{tabTitles[tab]}</h1>
          <div className="flex items-center gap-3">
            {/* Counts */}
            <div className="hidden md:flex items-center gap-4 mr-2">
              <span className="text-xs" style={{ color: A.textMuted }}>{state.applications.length} заявок</span>
              <span className="text-xs" style={{ color: A.textMuted }}>{state.events.length} событий</span>
              <span className="text-xs" style={{ color: A.textMuted }}>{state.tickets.length} билетов</span>
            </div>
            <button className="p-2 rounded-lg transition-colors" style={{ color: A.textSecondary }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              <Bell size={16} />
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="p-6">
          {tab === "dashboard" && <AdminDashboard state={state} onNavigate={setTab} />}
          {tab === "organizerApplications" && <AdminOrganizerApplications state={state} onUpdate={update} />}
          {tab === "eventComplianceApplications" && (
            <AdminEventComplianceApplications state={state} onUpdate={update} />
          )}
          {tab === "calendar" && <AdminCalendar state={state} />}
          {tab === "control" && <AdminControl state={state} />}
          {tab === "decisions" && <AdminDecisionLog state={state} />}
          {tab === "orgRegistry" && <AdminOrgRegistry state={state} />}
          {tab === "venueRegistry" && <AdminVenueRegistry state={state} />}
          {tab === "registryEvents" && <AdminRegistryEvents state={state} onUpdate={update} />}
          {tab === "events" && <AdminEvents state={state} onUpdate={update} />}
          {tab === "tickets" && <AdminTickets state={state} />}
          {tab === "operations" && <AdminOperations state={state} />}
          {tab === "resellers" && <AdminResellers state={state} onUpdate={update} />}
          {tab === "reports" && <AdminReports state={state} />}
        </main>
      </div>

    </div>
  );
}
