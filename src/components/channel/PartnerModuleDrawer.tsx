import React, { useEffect } from "react";

export interface DrawerMetric {
  label: string;
  value: string;
}

export interface DrawerRow {
  left: string;
  right: string;
  status?: "ok" | "warn" | "info";
}

export interface DrawerAction {
  label: string;
  kind?: "primary" | "secondary";
}

export interface ModuleDrawerContent {
  key: string;
  title: string;
  status: string;
  badges: string[];
  updatedAt: string;
  summary: DrawerMetric[];
  rows: DrawerRow[];
  actions: DrawerAction[];
  footer?: string;
}

interface Props {
  module: ModuleDrawerContent | null;
  onClose: () => void;
  onAction: (moduleKey: string, actionLabel: string) => void;
}

const statusClass: Record<NonNullable<DrawerRow["status"]>, string> = {
  ok: "bg-emerald-500/15 text-emerald-200 border-emerald-300/30",
  warn: "bg-amber-500/15 text-amber-200 border-amber-300/30",
  info: "bg-slate-500/20 text-slate-200 border-slate-300/20",
};

export default function PartnerModuleDrawer({ module, onClose, onAction }: Props) {
  useEffect(() => {
    if (!module) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [module, onClose]);

  if (!module) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-slate-950/50" onClick={onClose} />
      <aside className="fixed right-0 top-0 z-50 h-full w-full max-w-[460px] border-l border-white/10 bg-slate-950 shadow-2xl">
        <div className="flex h-full flex-col">
          <header className="border-b border-white/10 px-5 py-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Модуль оператора</p>
                <h3 className="mt-1 text-lg font-semibold text-white">{module.title}</h3>
              </div>
              <button
                onClick={onClose}
                className="h-8 w-8 rounded-md border border-white/15 text-slate-200 transition hover:bg-white/10"
                aria-label="Закрыть"
              >
                ✕
              </button>
            </div>

            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="rounded-md border border-cyan-300/35 bg-cyan-500/10 px-2 py-1 text-cyan-100">{module.status}</span>
              {module.badges.map((badge) => (
                <span key={badge} className="rounded-md border border-white/20 bg-slate-900 px-2 py-1 text-slate-200">
                  {badge}
                </span>
              ))}
            </div>
            <p className="mt-2 text-xs text-slate-500">Обновлено: {module.updatedAt}</p>
          </header>

          <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
            <section className="grid grid-cols-2 gap-2">
              {module.summary.map((item) => (
                <article key={item.label} className="rounded-lg border border-white/10 bg-slate-900/80 p-3">
                  <p className="text-xs text-slate-400">{item.label}</p>
                  <p className="mt-1 text-base font-semibold text-white">{item.value}</p>
                </article>
              ))}
            </section>

            <section className="rounded-lg border border-white/10 bg-slate-900/70 p-3">
              <p className="mb-2 text-xs uppercase tracking-wide text-slate-400">Данные модуля</p>
              <div className="space-y-2 text-sm">
                {module.rows.map((row, idx) => (
                  <div key={`${row.left}-${idx}`} className="flex items-center justify-between gap-3 rounded-md border border-white/5 px-2 py-2">
                    <span className="text-slate-300">{row.left}</span>
                    <span className={`rounded px-2 py-1 text-xs ${row.status ? statusClass[row.status] : "border border-white/15 text-slate-100"}`}>
                      {row.right}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <footer className="border-t border-white/10 px-5 py-4">
            <div className="flex gap-2">
              {module.actions.map((action) => (
                <button
                  key={action.label}
                  onClick={() => onAction(module.key, action.label)}
                  className={`h-10 rounded-lg px-3 text-sm font-medium transition ${
                    action.kind === "primary"
                      ? "bg-cyan-400 text-slate-950 hover:bg-cyan-300"
                      : "border border-white/15 bg-slate-900 text-slate-100 hover:bg-slate-800"
                  }`}
                >
                  {action.label}
                </button>
              ))}
            </div>
            {module.footer && <p className="mt-3 text-xs text-slate-500">{module.footer}</p>}
          </footer>
        </div>
      </aside>
    </>
  );
}
