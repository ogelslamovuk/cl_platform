import React, { useEffect, useMemo, useState } from "react";
import type { AppState } from "@/lib/store";
import { setOrganizerApplicationReview } from "@/lib/store";
import { A } from "./adminStyles";
import HelpTooltip from "@/components/ui/help-tooltip";
import MockDocumentPreview, { type MockDocumentPreviewData } from "@/components/MockDocumentPreview";
import { getScopedRegionFilterOptions, isInAdminScope, normalizeRegion, type AdminRegionScope } from "./adminScope";

interface Props { state: AppState; onUpdate: (s: AppState) => void; regionScope?: AdminRegionScope; }
type StatusFilter = "submitted" | "approved" | "rejected" | "needs_rework" | "all";

function CardHelp({ text }: { text: string }) {
  return (
    <div className="absolute right-4 top-4 z-10">
      <HelpTooltip text={text} />
    </div>
  );
}

const statusLabel: Record<string, string> = {
  draft: "Черновик",
  submitted: "Отправлена",
  approved: "Одобрена",
  rejected: "Отклонена",
  needs_rework: "На доработке",
};

export default function AdminOrganizerApplications({ state, onUpdate, regionScope = "all" }: Props) {
  const [comment, setComment] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("submitted");
  const [regionFilter, setRegionFilter] = useState("");
  const [previewDoc, setPreviewDoc] = useState<MockDocumentPreviewData>(null);

  const regionOptions = useMemo(() => getScopedRegionFilterOptions(state, regionScope), [regionScope, state]);
  useEffect(() => {
    if (regionFilter && !regionOptions.includes(regionFilter)) setRegionFilter("");
  }, [regionFilter, regionOptions]);
  const rows = useMemo(() => state.organizerApplications
    .filter((application) => {
      const region = normalizeRegion(application.data.region);
      if (!isInAdminScope(region, regionScope)) return false;
      if (regionFilter && region !== regionFilter) return false;
      if (statusFilter !== "all" && application.status !== statusFilter) return false;
      return true;
    })
    .slice()
    .reverse(), [regionFilter, regionScope, state.organizerApplications, statusFilter]);

  const applyDecision = (id: string, decision: "approved" | "rejected" | "needs_rework") => {
    const row = state.organizerApplications.find((application) => application.organizerApplicationId === id);
    if (!row || row.status !== "submitted") {
      setErrors((prev) => ({ ...prev, [id]: "Решение уже принято для этой заявки." }));
      return;
    }
    if ((decision === "rejected" || decision === "needs_rework") && !(comment[id] || "").trim()) {
      setErrors((prev) => ({ ...prev, [id]: "Укажите комментарий для отклонения или возврата на доработку." }));
      return;
    }
    const ok = setOrganizerApplicationReview(state, id, decision, comment[id] || "");
    if (!ok) {
      setErrors((prev) => ({ ...prev, [id]: "Укажите комментарий для отклонения или возврата на доработку." }));
      return;
    }
    setErrors((prev) => ({ ...prev, [id]: "" }));
    onUpdate({ ...state });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1.5">
        <h2 className="text-sm" style={{ color: A.textSecondary }}>Заявки организаторов</h2>
      </div>
      <div className="flex flex-wrap gap-2 rounded-xl border p-3" style={{ background: A.surfaceBg, borderColor: A.border }}>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)} className="h-9 rounded-lg px-3 text-sm outline-none" style={{ background: A.cardBg, border: `1px solid ${A.border}`, color: A.textPrimary }}>
          <option value="submitted">Новые / на рассмотрении</option>
          <option value="approved">Одобрены</option>
          <option value="needs_rework">На доработке</option>
          <option value="rejected">Отклонены</option>
          <option value="all">Все статусы</option>
        </select>
        <select value={regionFilter} onChange={(event) => setRegionFilter(event.target.value)} className="h-9 rounded-lg px-3 text-sm outline-none" style={{ background: A.cardBg, border: `1px solid ${A.border}`, color: A.textPrimary }}>
          <option value="">{regionScope === "all" ? "Все регионы" : "Регион сотрудника"}</option>
          {regionOptions.map((region) => <option key={region} value={region}>{region}</option>)}
        </select>
      </div>
      <div style={{ background: A.cardBg, border: `1px solid ${A.border}`, borderRadius: 12 }} className="relative overflow-hidden">
        <CardHelp text="Список заявок организаций на включение в реестр организаторов мероприятий. Решение принимается по каждой заявке отдельно." />
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: A.tableHeaderBg }}>
              {[
                "ID",
                "Дата подачи",
                "Организация",
                "Регион",
                "Рег. номер",
                "Руководитель",
                "Файлы",
                "Статус",
                "Действия",
              ].map((h) => (
                <th key={h} className="text-left py-2 px-3 text-xs" style={{ color: A.textSecondary }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const organizerDocs = [...r.data.documents, ...r.data.pastMaterials];
              return (
              <tr key={r.organizerApplicationId} style={{ borderTop: `1px solid ${A.border}` }}>
                <td className="py-2 px-3 font-mono text-xs">{r.organizerApplicationId}</td>
                <td className="py-2 px-3">{r.submittedAt ? r.submittedAt.slice(0, 16).replace("T", " ") : "—"}</td>
                <td className="py-2 px-3">{r.data.legalName}</td>
                <td className="py-2 px-3">{normalizeRegion(r.data.region)}</td>
                <td className="py-2 px-3">{r.data.registrationNumber}</td>
                <td className="py-2 px-3">{r.data.director.fullName}</td>
                <td className="py-2 px-3">
                  <div className="flex max-w-[240px] flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPreviewDoc({
                        title: "Документ руководителя",
                        fileName: "director_id_mock.pdf",
                        kind: "identity",
                        rows: [["ФИО", r.data.director.fullName], ["Тип", r.data.director.docType], ["Номер", r.data.director.docNumber], ["Организация", r.data.legalName]],
                      })}
                      className="rounded border px-2 py-1 text-[11px]"
                      style={{ borderColor: A.border, background: A.surfaceBg, color: A.textPrimary }}
                    >
                      Руководитель
                    </button>
                    {r.data.workers.slice(0, 2).map((worker, index) => (
                      <button
                        key={`${worker.docNumber}-${index}`}
                        type="button"
                        onClick={() => setPreviewDoc({
                          title: "Документ работника",
                          fileName: "worker_id_mock.pdf",
                          kind: "identity",
                          rows: [["ФИО", worker.fullName], ["Тип", worker.docType], ["Номер", worker.docNumber], ["Организация", r.data.legalName]],
                        })}
                        className="rounded border px-2 py-1 text-[11px]"
                        style={{ borderColor: A.border, background: A.surfaceBg, color: A.textPrimary }}
                      >
                        Работник {index + 1}
                      </button>
                    ))}
                    {organizerDocs.slice(0, 3).map((document) => (
                      <button
                        key={document.attachmentId}
                        type="button"
                        onClick={() => setPreviewDoc({
                          title: document.name,
                          fileName: document.name,
                          kind: "participation",
                          rows: [["Файл", document.name], ["Тип", document.kind], ["Статус", document.isSample ? "mock-образец" : "приложен"], ["Заявка", r.organizerApplicationId]],
                        })}
                        className="rounded border px-2 py-1 text-[11px]"
                        style={{ borderColor: A.border, background: A.surfaceBg, color: A.textPrimary }}
                      >
                        {document.kind}
                      </button>
                    ))}
                  </div>
                </td>
                <td className="py-2 px-3">{statusLabel[r.status] || r.status}</td>
                <td className="py-2 px-3 space-y-2">
                  <div className="relative">
                    <textarea
                    className="w-full min-h-16 rounded px-2 py-1 pr-9 text-xs"
                    placeholder="Комментарий (обязателен при отклонении и возврате на доработку)"
                    value={comment[r.organizerApplicationId] || ""}
                    onChange={(e) => {
                      setComment((p) => ({ ...p, [r.organizerApplicationId]: e.target.value }));
                      setErrors((p) => ({ ...p, [r.organizerApplicationId]: "" }));
                    }}
                    style={{ background: A.surfaceBg, border: `1px solid ${A.border}`, color: A.textPrimary }}
                  />
                    <div className="absolute right-2 top-3">
                      <HelpTooltip text="Комментарий обязателен при отклонении заявки или возврате на доработку." />
                    </div>
                  </div>
                  {errors[r.organizerApplicationId] && (
                    <div className="text-xs" style={{ color: A.statusError }}>
                      {errors[r.organizerApplicationId]}
                    </div>
                  )}
                  <div className="flex gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1">
                      <button disabled={r.status !== "submitted"} className="px-2 py-1 rounded text-xs disabled:opacity-50 disabled:cursor-not-allowed" style={{ background: A.statusOkBg, color: A.statusOk }} onClick={() => applyDecision(r.organizerApplicationId, "approved")}>Одобрить</button>
                      <HelpTooltip text="Одобрить заявку организатора и включить организацию в реестр." />
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <button disabled={r.status !== "submitted"} className="px-2 py-1 rounded text-xs disabled:opacity-50 disabled:cursor-not-allowed" style={{ background: A.statusWarnBg, color: A.statusWarn }} onClick={() => applyDecision(r.organizerApplicationId, "needs_rework")}>Вернуть на доработку</button>
                      <HelpTooltip text="Вернуть заявку организатору на доработку с комментарием." />
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <button disabled={r.status !== "submitted"} className="px-2 py-1 rounded text-xs disabled:opacity-50 disabled:cursor-not-allowed" style={{ background: A.statusErrorBg, color: A.statusError }} onClick={() => applyDecision(r.organizerApplicationId, "rejected")}>Отклонить</button>
                      <HelpTooltip text="Отклонить заявку организатора с указанием причины." />
                    </span>
                  </div>
                </td>
              </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td className="py-6 px-3 text-center" colSpan={9} style={{ color: A.textMuted }}>Пока нет заявок организаторов</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <MockDocumentPreview preview={previewDoc} onClose={() => setPreviewDoc(null)} theme="admin" />
    </div>
  );
}
