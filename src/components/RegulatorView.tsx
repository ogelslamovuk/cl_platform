import React, { useState, useMemo } from "react";
import type { Application, AppState } from "@/lib/store";
import { approveApplication, rejectApplication } from "@/lib/store";
import { toast } from "sonner";
import { formatDisplayId } from "@/lib/display";

interface Props {
  state: AppState;
  onUpdate: (s: AppState) => void;
}

const statusLabel: Record<string, string> = {
  draft: "Черновик", submitted: "Отправлена", approved: "Одобрена", rejected: "Отклонена",
};
const statusBadge: Record<string, string> = {
  draft: "bg-muted", submitted: "bg-role-organizer", approved: "bg-role-channel", rejected: "bg-role-regulator",
};

export default function RegulatorView({ state, onUpdate }: Props) {
  const [filter, setFilter] = useState<string>("submitted");
  const [drawerApp, setDrawerApp] = useState<Application | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ app: Application; action: "approve" | "reject" } | null>(null);

  const filtered = useMemo(() => {
    return state.applications.filter((a) => !filter || a.status === filter);
  }, [state.applications, filter]);

  const handleConfirm = () => {
    if (!confirmAction) return;
    const { app, action } = confirmAction;
    if (action === "approve") {
      const res = approveApplication(state, app.appId);
      if (res) toast.success(`Одобрено. Удостоверение ${formatDisplayId(res.licenseId)}, мероприятие ${formatDisplayId(res.eventId)}`);
    } else {
      rejectApplication(state, app.appId);
      toast.success(`Заявка ${formatDisplayId(app.appId)} отклонена`);
    }
    setConfirmAction(null);
    setDrawerApp(null);
    onUpdate({ ...state });
  };

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-lg p-6 shadow-card border border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Очередь заявок</h2>
          <select className="border border-border rounded-md px-3 py-2 text-sm bg-card"
            value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">Все</option>
            <option value="submitted">Отправленные</option>
            <option value="approved">Одобренные</option>
            <option value="rejected">Отклонённые</option>
          </select>
        </div>
        {filtered.length === 0 ? (
          <p className="text-center py-8 opacity-60">Нет заявок</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="py-2 px-2 font-medium">Номер заявки</th>
                  <th className="py-2 px-2 font-medium">Название</th>
                  <th className="py-2 px-2 font-medium">Площадка</th>
                  <th className="py-2 px-2 font-medium">Дата/время</th>
                  <th className="py-2 px-2 font-medium">Вместимость</th>
                  <th className="py-2 px-2 font-medium">Статус</th>
                  <th className="py-2 px-2 font-medium">Действия</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr key={a.appId} className="border-b border-border/50">
                    <td className="py-2 px-2 text-xs font-semibold">{formatDisplayId(a.appId)}</td>
                    <td className="py-2 px-2">{a.title}</td>
                    <td className="py-2 px-2">{a.venue}</td>
                    <td className="py-2 px-2">{a.dateTime?.replace("T", " ")}</td>
                    <td className="py-2 px-2">{a.capacity}</td>
                    <td className="py-2 px-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge[a.status]}`}>
                        {statusLabel[a.status]}
                      </span>
                    </td>
                    <td className="py-2 px-2">
                      {a.status === "submitted" && (
                        <button onClick={() => setDrawerApp(a)} className="underline text-xs">Рассмотреть</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Drawer */}
      {drawerApp && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setDrawerApp(null)}>
          <div className="absolute inset-0 bg-foreground/20" />
          <div className="relative w-full max-w-md bg-card h-full shadow-xl p-6 overflow-y-auto animate-in slide-in-from-right"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Пакет заявки</h3>
              <button onClick={() => setDrawerApp(null)} className="text-xl">✕</button>
            </div>
            <dl className="space-y-3 text-sm mb-6">
              {([
                ["Номер заявки", formatDisplayId(drawerApp.appId)],
                ["Название", drawerApp.title],
                ["Площадка", drawerApp.venue],
                ["Дата/время", drawerApp.dateTime?.replace("T", " ")],
                ["Вместимость", String(drawerApp.capacity)],
              ] as [string, string][]).map(([k, v]) => (
                <div key={k}><dt className="font-medium opacity-60">{k}</dt><dd>{v}</dd></div>
              ))}
              <div>
                <dt className="font-medium opacity-60">Категории</dt>
                <dd>{drawerApp.tiers.map((t) => `${t.name}: ${t.price}₽`).join(", ")}</dd>
              </div>
            </dl>
            {drawerApp.status === "submitted" && (
              <div className="flex gap-3">
                <button onClick={() => setConfirmAction({ app: drawerApp, action: "approve" })}
                  className="px-5 h-11 rounded-xl bg-primary text-primary-foreground font-semibold text-sm">
                  Одобрить
                </button>
                <button onClick={() => setConfirmAction({ app: drawerApp, action: "reject" })}
                  className="px-5 h-11 rounded-xl border border-border font-semibold text-sm">
                  Отклонить
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirm modal */}
      {confirmAction && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center" onClick={() => setConfirmAction(null)}>
          <div className="absolute inset-0 bg-foreground/30" />
          <div className="relative bg-card rounded-lg p-6 shadow-xl max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold mb-3">
              {confirmAction.action === "approve" ? "Одобрить заявку?" : "Отклонить заявку?"}
            </h3>
            <p className="text-sm opacity-70 mb-4">{confirmAction.app.title} ({formatDisplayId(confirmAction.app.appId)})</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmAction(null)}
                className="px-4 h-10 rounded-xl border border-border text-sm font-medium">Отмена</button>
              <button onClick={handleConfirm}
                className="px-4 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-semibold">
                Подтвердить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
