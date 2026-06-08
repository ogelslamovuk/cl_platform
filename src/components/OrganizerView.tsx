import React, { useState, useMemo } from "react";
import type { Application, AppState } from "@/lib/store";
import { createApplication, submitApplication } from "@/lib/store";
import { toast } from "sonner";
import { formatDisplayId } from "@/lib/display";

interface Props {
  state: AppState;
  onUpdate: (s: AppState) => void;
}

const statusBadge: Record<string, string> = {
  draft: "bg-muted text-foreground",
  submitted: "bg-role-organizer text-foreground",
  approved: "bg-role-channel text-foreground",
  rejected: "bg-role-regulator text-foreground",
};

const statusLabel: Record<string, string> = {
  draft: "Черновик",
  submitted: "Отправлена",
  approved: "Одобрена",
  rejected: "Отклонена",
};

export default function OrganizerView({ state, onUpdate }: Props) {
  const [title, setTitle] = useState("");
  const [venue, setVenue] = useState("");
  const [dateTime, setDateTime] = useState("");
  const [capacity, setCapacity] = useState("");
  const [tiers, setTiers] = useState([
    { name: "Партер", price: "" },
    { name: "Балкон", price: "" },
  ]);
  const [search, setSearch] = useState("");
  const [drawerApp, setDrawerApp] = useState<Application | null>(null);

  const addTier = () => {
    if (tiers.length < 3) setTiers([...tiers, { name: "", price: "" }]);
  };
  const removeTier = (i: number) => {
    if (tiers.length > 2) setTiers(tiers.filter((_, idx) => idx !== i));
  };

  const isValid = title.trim() && venue.trim() && dateTime && Number(capacity) > 0 && Number(capacity) <= 5000 &&
    tiers.every((t) => t.name.trim() && Number(t.price) > 0);

  const handleSave = (submit: boolean) => {
    if (!isValid) { toast.error("Заполните все поля корректно"); return; }
    const app = createApplication(state, {
      title: title.trim(),
      venue: venue.trim(),
      dateTime,
      capacity: Number(capacity),
      tiers: tiers.map((t) => ({ name: t.name.trim(), price: Number(t.price) })),
    }, submit);
    toast.success(submit ? `Заявка ${app.appId} отправлена` : `Черновик ${app.appId} сохранён`);
    onUpdate({ ...state });
    setTitle(""); setVenue(""); setDateTime(""); setCapacity("");
    setTiers([{ name: "Партер", price: "" }, { name: "Балкон", price: "" }]);
  };

  const handleSubmit = (appId: string) => {
    submitApplication(state, appId);
    toast.success(`Заявка ${appId} отправлена`);
    onUpdate({ ...state });
  };

  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    return state.applications.filter((a) =>
      !s || a.appId.toLowerCase().includes(s) || a.title.toLowerCase().includes(s) || a.venue.toLowerCase().includes(s)
    );
  }, [state.applications, search]);

  return (
    <div className="space-y-6">
      {/* Form */}
      <div className="bg-card rounded-lg p-6 shadow-card border border-border">
        <h2 className="text-lg font-semibold mb-4">Новая заявка</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Название *</label>
            <input className="w-full border border-border rounded-md px-3 py-2 text-sm bg-card" maxLength={80}
              value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Концерт..." />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Площадка *</label>
            <input className="w-full border border-border rounded-md px-3 py-2 text-sm bg-card" maxLength={60}
              value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="Зал..." />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Дата/время *</label>
            <input type="datetime-local" className="w-full border border-border rounded-md px-3 py-2 text-sm bg-card"
              value={dateTime} onChange={(e) => setDateTime(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Вместимость * (1–5000)</label>
            <input type="number" min={1} max={5000} className="w-full border border-border rounded-md px-3 py-2 text-sm bg-card"
              value={capacity} onChange={(e) => setCapacity(e.target.value)} />
          </div>
        </div>
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium">Ценовые категории</label>
            {tiers.length < 3 && (
              <button onClick={addTier} className="text-sm underline opacity-70 hover:opacity-100">+ Добавить</button>
            )}
          </div>
          {tiers.map((t, i) => (
            <div key={i} className="flex gap-3 mb-2 items-center">
              <input className="flex-1 border border-border rounded-md px-3 py-2 text-sm bg-card" maxLength={20}
                value={t.name} onChange={(e) => { const n = [...tiers]; n[i].name = e.target.value; setTiers(n); }} placeholder="Категория" />
              <input type="number" min={1} className="w-28 border border-border rounded-md px-3 py-2 text-sm bg-card"
                value={t.price} onChange={(e) => { const n = [...tiers]; n[i].price = e.target.value; setTiers(n); }} placeholder="Цена" />
              {tiers.length > 2 && (
                <button onClick={() => removeTier(i)} className="text-sm opacity-50 hover:opacity-100">✕</button>
              )}
            </div>
          ))}
        </div>
        <div className="flex gap-3">
          <button onClick={() => handleSave(false)} disabled={!isValid}
            className="px-5 h-11 rounded-xl border border-border font-semibold text-sm disabled:opacity-40">
            Сохранить черновик
          </button>
          <button onClick={() => handleSave(true)} disabled={!isValid}
            className="px-5 h-11 rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-40">
            Отправить заявку
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-lg p-6 shadow-card border border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Мои заявки</h2>
          <input className="border border-border rounded-md px-3 py-2 text-sm bg-card w-64"
            placeholder="Поиск..." value={search} onChange={(e) => setSearch(e.target.value)} />
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
                    <td className="py-2 px-2 space-x-2">
                      <button onClick={() => setDrawerApp(a)} className="underline text-xs">Открыть</button>
                      {a.status === "draft" && (
                        <button onClick={() => handleSubmit(a.appId)} className="underline text-xs">Отправить</button>
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
              <h3 className="text-lg font-semibold">Карточка заявки</h3>
              <button onClick={() => setDrawerApp(null)} className="text-xl">✕</button>
            </div>
            <dl className="space-y-3 text-sm">
              {([
                ["Номер заявки", formatDisplayId(drawerApp.appId)],
                ["Название", drawerApp.title],
                ["Площадка", drawerApp.venue],
                ["Дата/время", drawerApp.dateTime?.replace("T", " ")],
                ["Вместимость", String(drawerApp.capacity)],
                ["Статус", statusLabel[drawerApp.status]],
                ...(drawerApp.licenseId ? [["Номер удостоверения", formatDisplayId(drawerApp.licenseId)]] : []),
                ...(drawerApp.eventId ? [["Номер мероприятия", formatDisplayId(drawerApp.eventId)]] : []),
              ] as [string, string][]).map(([k, v]) => (
                <div key={k}>
                  <dt className="font-medium opacity-60">{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
              <div>
                <dt className="font-medium opacity-60">Категории</dt>
                <dd>{drawerApp.tiers.map((t) => `${t.name}: ${t.price}₽`).join(", ")}</dd>
              </div>
            </dl>
          </div>
        </div>
      )}
    </div>
  );
}
