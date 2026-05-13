import React, { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useStorageSync } from "@/hooks/useStorageSync";
import { loginOrganizer } from "@/lib/store";
import { toast } from "sonner";
import { Toaster as Sonner } from "@/components/ui/sonner";

export default function OrganizerLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { state, update } = useStorageSync();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const showSubmittedSuccess = Boolean((location.state as { showSubmittedSuccess?: boolean } | null)?.showSubmittedSuccess);

  if (state.currentOrganizerId) {
    const currentOrganizer = state.organizers.find((organizer) => organizer.organizerId === state.currentOrganizerId);
    if (currentOrganizer) {
      return <Navigate to="/organizer" replace />;
    }
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = loginOrganizer(state, login, password);
    if (!result.ok) {
      toast.error("Неверный логин или пароль.");
      return;
    }
    update({ ...state });
    toast.success(`Вход выполнен: ${result.organizer.name}`);
    navigate("/organizer", { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#0B0F14", color: "#F5F7FA" }}>
      <Sonner />
      <div className="w-full max-w-md rounded-2xl border p-6 md:p-7" style={{ borderColor: "rgba(255,255,255,0.10)", background: "#111A24" }}>
        <h1 className="text-2xl font-bold mb-2">Кабинет организатора</h1>
        <p className="text-sm mb-6" style={{ color: "rgba(245,247,250,0.70)" }}>
          Вход для организаторов мероприятий
        </p>
        {showSubmittedSuccess && (
          <div
            className="mb-4 rounded-xl border px-3 py-2 text-sm"
            style={{ borderColor: "rgba(34,197,94,0.45)", background: "rgba(34,197,94,0.12)", color: "#DCFCE7" }}
          >
            Заявка отправлена на рассмотрение. Результат будет направлен на указанный email.
          </div>
        )}
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1.5">Логин</label>
            <input
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              className="w-full h-11 rounded-xl border px-3 text-sm"
              style={{ borderColor: "rgba(255,255,255,0.12)", background: "#0F1620" }}
              placeholder="Введите логин"
            />
          </div>
          <div>
            <label className="block text-sm mb-1.5">Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-11 rounded-xl border px-3 text-sm"
              style={{ borderColor: "rgba(255,255,255,0.12)", background: "#0F1620" }}
              placeholder="Введите пароль"
            />
          </div>
          <button
            type="submit"
            className="w-full h-11 rounded-xl text-sm font-semibold"
            style={{ background: "#F2C94C", color: "#111" }}
          >
            Войти
          </button>
        </form>
        <div className="mt-5 text-sm">
          <Link to="/organizer/register" className="underline" style={{ color: "#F2C94C" }}>
            Стать организатором
          </Link>
        </div>
        <div className="mt-5 text-xs" style={{ color: "rgba(245,247,250,0.45)" }}>
          Демо-доступы: organizer.minskconcert / demo123, organizer.philharmonic / demo123
        </div>
      </div>
    </div>
  );
}
