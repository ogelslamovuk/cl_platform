import React, { useState, useMemo, useRef } from "react";
import type { AppState, Application, AppStatus } from "@/lib/store";
import { approveApplication, rejectApplication } from "@/lib/store";
import { toast } from "sonner";
import { A, appStatusChip, statusChip } from "./adminStyles";
import { FileText, Search, ShieldCheck, AlertTriangle, X, CheckCircle, XCircle, Clock } from "lucide-react";
import HelpTooltip from "@/components/ui/help-tooltip";
import { formatDisplayId } from "@/lib/display";

interface Props {
  state: AppState;
  onUpdate: (s: AppState) => void;
  title?: string;
  subtitle?: string;
  fixedStatus?: AppStatus;
  hideKpi?: boolean;
}

const statusLabel: Record<string, string> = {
  draft: "Черновик", submitted: "Отправлена", approved: "Одобрена", rejected: "Отклонена",
};

// Локальные проверки для демонстрационного согласования заявки.
function checkRegistry(app: Application): boolean {
  return app.title.toLowerCase().includes("концерт") || app.title.toLowerCase().includes("фестиваль") || app.title.toLowerCase().includes("спектакль");
}
function checkFeePaid(app: Application): boolean {
  return app.capacity <= 500;
}

function matchesApplicationFilters(app: Application, filterStatus: string, blockedOnly: boolean, query: string): boolean {
  const isBlocked = app.status === "submitted" && (!checkRegistry(app) || !checkFeePaid(app));
  if (blockedOnly && !isBlocked) return false;
  if (filterStatus && app.status !== filterStatus) return false;
  if (!query) return true;
  const s = query.toLowerCase();
  return app.appId.toLowerCase().includes(s) || formatDisplayId(app.appId).toLowerCase().includes(s) || app.title.toLowerCase().includes(s) || app.venue.toLowerCase().includes(s);
}

export default function AdminApplications({ state, onUpdate, title, subtitle, fixedStatus, hideKpi }: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [kpiFilter, setKpiFilter] = useState<"" | "blocked">("");
  const [drawerApp, setDrawerApp] = useState<Application | null>(null);
  const [confirm, setConfirm] = useState<{ app: Application; action: "approve" | "reject" } | null>(null);
  const tableRef = useRef<HTMLDivElement | null>(null);

  const kpi = useMemo(() => {
    const a = state.applications;
    return {
      newCount: a.filter((x) => matchesApplicationFilters(x, "submitted", false, "")).length,
      reviewing: a.filter((x) => matchesApplicationFilters(x, "submitted", false, "")).length,
      approved: a.filter((x) => matchesApplicationFilters(x, "approved", false, "")).length,
      blocked: a.filter((x) => matchesApplicationFilters(x, "", true, "")).length,
    };
  }, [state.applications]);

  const effectiveStatusFilter = fixedStatus || statusFilter;

  const filtered = useMemo(() => {
    const blockedOnly = fixedStatus ? false : kpiFilter === "blocked";
    return state.applications.filter((a) => matchesApplicationFilters(a, effectiveStatusFilter, blockedOnly, search));
  }, [state.applications, effectiveStatusFilter, kpiFilter, search, fixedStatus]);

  const handleConfirm = () => {
    if (!confirm) return;
    const { app, action } = confirm;
    if (action === "approve") {
      const res = approveApplication(state, app.appId);
      if (res) toast.success(`Одобрено. Удостоверение ${formatDisplayId(res.licenseId)}, мероприятие ${formatDisplayId(res.eventId)}`);
    } else {
      rejectApplication(state, app.appId);
      toast.success(`Заявка ${formatDisplayId(app.appId)} отклонена`);
    }
    setConfirm(null);
    setDrawerApp(null);
    onUpdate({ ...state });
  };

  const kpiItems = [
    { key: "new" as const, label: "Новые", value: kpi.newCount, accent: A.cyan },
    { key: "review" as const, label: "На проверке", value: kpi.reviewing, accent: A.blue },
    { key: "approved" as const, label: "Одобрено", value: kpi.approved, accent: A.statusOk },
    { key: "blocked" as const, label: "Блокировано", value: kpi.blocked, accent: A.statusError },
  ];

  const handleKpiClick = (key: "new" | "review" | "approved" | "blocked") => {
    if (key === "new" || key === "review") {
      setStatusFilter("submitted");
      setKpiFilter("");
    } else if (key === "approved") {
      setStatusFilter("approved");
      setKpiFilter("");
    } else {
      setStatusFilter("");
      setKpiFilter("blocked");
    }
    tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="space-y-5">
      {(title || subtitle) && (
        <div className="space-y-1">
          {title && <h2 className="text-base font-semibold" style={{ color: A.textPrimary }}>{title}</h2>}
          {subtitle && <p className="text-xs" style={{ color: A.textSecondary }}>{subtitle}</p>}
        </div>
      )}

      {/* Mini KPI */}
      {!hideKpi && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {kpiItems.map((k, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleKpiClick(k.key)}
              style={{ background: A.cardBg, border: `1px solid ${A.border}`, borderRadius: 14 }}
              className="p-4 text-left transition hover:opacity-90"
            >
              <div style={{ color: k.accent }} className="text-xl font-bold">{k.value}</div>
              <div style={{ color: A.textSecondary }} className="text-xs mt-0.5">{k.label}</div>
            </button>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={14} style={{ color: A.textMuted }} className="absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск по номеру, названию, площадке..."
            className="w-full h-9 pl-9 pr-3 rounded-lg text-sm outline-none"
            style={{ background: A.surfaceBg, border: `1px solid ${A.border}`, color: A.textPrimary }} />
        </div>
        <HelpTooltip text="Поиск работает по номеру заявки, названию мероприятия и площадке." />
        {!fixedStatus && (
          <>
            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setKpiFilter(""); }}
              className="h-9 px-3 rounded-lg text-sm outline-none cursor-pointer"
              style={{ background: A.surfaceBg, border: `1px solid ${A.border}`, color: A.textPrimary }}>
              <option value="">Все статусы</option>
              <option value="submitted">Отправленные</option>
              <option value="approved">Одобренные</option>
              <option value="rejected">Отклонённые</option>
              <option value="draft">Черновики</option>
            </select>
            <HelpTooltip text="Выберите статус, чтобы показать только нужный этап обработки заявок." />
          </>
        )}
      </div>

      {/* Table */}
      <div ref={tableRef} style={{ background: A.cardBg, border: `1px solid ${A.border}`, borderRadius: 16, boxShadow: A.cardShadow }} className="overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center py-12">
            <FileText size={28} style={{ color: A.textMuted }} className="mb-2" />
            <p style={{ color: A.textMuted }} className="text-sm">Нет заявок</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: A.tableHeaderBg }}>
                  {["Номер заявки", "Мероприятие", "Площадка", "Дата", "Вместимость", "УНП", "Пошлина", "Статус", ""].map((h, i) => (
                    <th key={i} className="text-left py-3 px-4 font-medium text-xs" style={{ color: A.textSecondary, borderBottom: `1px solid ${A.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(a => {
                  const chip = appStatusChip(a.status);
                  const regOk = checkRegistry(a);
                  const feeOk = checkFeePaid(a);
                  const regChip = regOk ? statusChip('ok') : statusChip('error');
                  const feeChip = feeOk ? statusChip('ok') : statusChip('warn');
                  return (
                    <tr key={a.appId} className="transition-colors cursor-pointer"
                      style={{ borderBottom: `1px solid ${A.border}` }}
                      onClick={() => setDrawerApp(a)}
                      onMouseEnter={e => (e.currentTarget.style.background = A.rowHover)}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <td className="py-3 px-4 text-xs font-semibold" style={{ color: A.cyan }}>{formatDisplayId(a.appId)}</td>
                      <td className="py-3 px-4" style={{ color: A.textPrimary }}>{a.title}</td>
                      <td className="py-3 px-4" style={{ color: A.textSecondary }}>{a.venue}</td>
                      <td className="py-3 px-4" style={{ color: A.textSecondary }}>{a.dateTime?.replace("T", " ").slice(0, 16)}</td>
                      <td className="py-3 px-4" style={{ color: A.textPrimary }}>{a.capacity}</td>
                      <td className="py-3 px-4">
                        <span style={{ background: regChip.bg, color: regChip.color, borderRadius: 999 }} className="text-xs px-2 py-0.5 font-medium">
                          {regOk ? "Проверено" : "Не найден"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span style={{ background: feeChip.bg, color: feeChip.color, borderRadius: 999 }} className="text-xs px-2 py-0.5 font-medium">
                          {feeOk ? "Оплачено" : "Ожидает"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span style={{ background: chip.bg, color: chip.color, borderRadius: 999 }} className="text-xs px-2.5 py-0.5 font-medium">
                          {statusLabel[a.status]}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button style={{ color: A.cyan }} className="text-xs hover:underline" onClick={e => { e.stopPropagation(); setDrawerApp(a); }}>Открыть</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Drawer */}
      {drawerApp && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setDrawerApp(null)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative w-full max-w-md h-full overflow-y-auto animate-in slide-in-from-right duration-300"
            style={{ background: A.glassGradient + ', ' + A.sidebarBg, borderLeft: `1px solid ${A.borderGlass}`, boxShadow: '0 0 60px rgba(0,0,0,0.5)' }}
            onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between p-5" style={{ background: A.topbarBg, backdropFilter: 'blur(16px)', borderBottom: `1px solid ${A.border}` }}>
              <h3 style={{ color: A.textPrimary }} className="text-base font-semibold">Заявка {formatDisplayId(drawerApp.appId)}</h3>
              <button onClick={() => setDrawerApp(null)} style={{ color: A.textMuted }} className="hover:opacity-80"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-5">
              {/* Status */}
              <div className="flex items-center gap-2">
                {(() => { const c = appStatusChip(drawerApp.status); return <span style={{ background: c.bg, color: c.color, borderRadius: 999 }} className="text-xs px-3 py-1 font-semibold">{statusLabel[drawerApp.status]}</span>; })()}
              </div>
              {/* Data */}
              <div className="space-y-4">
                {([
                  ["Мероприятие", drawerApp.title],
                  ["Площадка", drawerApp.venue],
                  ["Дата/время", drawerApp.dateTime?.replace("T", " ")],
                  ["Вместимость", String(drawerApp.capacity)],
                ] as [string, string][]).map(([k, v]) => (
                  <div key={k}>
                    <div style={{ color: A.textMuted }} className="text-xs font-medium mb-1">{k}</div>
                    <div style={{ color: A.textPrimary }} className="text-sm">{v}</div>
                  </div>
                ))}
                <div>
                  <div style={{ color: A.textMuted }} className="text-xs font-medium mb-1">Категории</div>
                  <div className="space-y-1">
                    {drawerApp.tiers.map(t => (
                      <div key={t.name} className="flex justify-between text-sm" style={{ color: A.textPrimary }}>
                        <span>{t.name}</span><span>{t.price.toLocaleString()}₽</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {/* Checks */}
              {drawerApp.status === "submitted" && (() => {
                const regOk = checkRegistry(drawerApp);
                const feeOk = checkFeePaid(drawerApp);
                const canApprove = regOk && feeOk;
                return (
                  <div className="space-y-4">
                    <div style={{ background: A.surfaceBg, border: `1px solid ${A.border}`, borderRadius: 12 }} className="p-4 space-y-3">
                      <div className="text-xs font-semibold" style={{ color: A.textSecondary }}>Проверки</div>
                      <div className="flex items-center gap-2">
                        {regOk ? <CheckCircle size={14} style={{ color: A.statusOk }} /> : <XCircle size={14} style={{ color: A.statusError }} />}
                        <span style={{ color: regOk ? A.statusOk : A.statusError }} className="text-sm">УНП: {regOk ? "проверен в реестре" : "не найден в реестре"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {feeOk ? <CheckCircle size={14} style={{ color: A.statusOk }} /> : <XCircle size={14} style={{ color: A.statusWarn }} />}
                        <span style={{ color: feeOk ? A.statusOk : A.statusWarn }} className="text-sm">Пошлина: {feeOk ? "оплачена" : "ожидает оплаты"}</span>
                      </div>
                    </div>
                    {!canApprove && (
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: A.statusErrorBg }}>
                        <AlertTriangle size={14} style={{ color: A.statusError }} />
                        <span style={{ color: A.statusError }} className="text-xs">Одобрение заблокировано: {!regOk ? "УНП не в реестре" : ""}{!regOk && !feeOk ? ", " : ""}{!feeOk ? "пошлина не оплачена" : ""}</span>
                      </div>
                    )}
                    <div className="flex gap-3 pt-2">
                      <button disabled={!canApprove} onClick={() => setConfirm({ app: drawerApp, action: "approve" })}
                        className="flex-1 h-10 rounded-xl text-sm font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        style={{ background: canApprove ? A.statusOk : A.textMuted, color: '#000' }}>
                        Одобрить
                      </button>
                      <button onClick={() => setConfirm({ app: drawerApp, action: "reject" })}
                        className="flex-1 h-10 rounded-xl text-sm font-semibold"
                        style={{ background: 'transparent', border: `1px solid ${A.borderLight}`, color: A.textPrimary }}>
                        Отклонить
                      </button>
                    </div>
                  </div>
                );
              })()}
              {drawerApp.status === "approved" && drawerApp.licenseId && (
                <div style={{ background: A.statusOkBg, borderRadius: 12 }} className="p-4 space-y-2">
                  <div className="flex items-center gap-2"><CheckCircle size={14} style={{ color: A.statusOk }} /><span style={{ color: A.statusOk }} className="text-sm font-semibold">Одобрена</span></div>
                  <div style={{ color: A.textSecondary }} className="text-xs">Номер удостоверения: <span style={{ color: A.textPrimary }}>{formatDisplayId(drawerApp.licenseId)}</span></div>
                  <div style={{ color: A.textSecondary }} className="text-xs">Номер мероприятия: <span style={{ color: A.textPrimary }}>{formatDisplayId(drawerApp.eventId)}</span></div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirm modal */}
      {confirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center" onClick={() => setConfirm(null)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative max-w-sm w-full p-6 rounded-2xl" onClick={e => e.stopPropagation()}
            style={{ background: A.glassGradient + ', ' + A.cardBg, border: `1px solid ${A.borderGlass}`, boxShadow: A.cardShadow }}>
            <h3 style={{ color: A.textPrimary }} className="font-semibold mb-3">
              {confirm.action === "approve" ? "Одобрить заявку?" : "Отклонить заявку?"}
            </h3>
            <p style={{ color: A.textSecondary }} className="text-sm mb-5">{confirm.app.title} ({formatDisplayId(confirm.app.appId)})</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirm(null)} className="px-4 h-9 rounded-xl text-sm font-medium"
                style={{ border: `1px solid ${A.borderLight}`, color: A.textPrimary }}>Отмена</button>
              <button onClick={handleConfirm} className="px-4 h-9 rounded-xl text-sm font-semibold"
                style={{ background: confirm.action === "approve" ? A.statusOk : A.statusError, color: '#000' }}>
                Подтвердить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
