import React, { useEffect } from "react";

export type MockDocumentKind = "identity" | "permit" | "venueContract" | "eventProgram" | "participation";

export type MockDocumentPreviewData = {
  title: string;
  fileName?: string;
  rows: [string, string][];
  kind?: MockDocumentKind;
} | null;

type Props = {
  preview: MockDocumentPreviewData;
  onClose: () => void;
  theme?: "dark" | "admin";
};

const KIND_LABEL: Record<MockDocumentKind, string> = {
  identity: "Документ личности",
  permit: "Въездная виза / разрешение",
  venueContract: "Договор с площадкой",
  eventProgram: "Программа мероприятия",
  participation: "Подтверждение участия",
};

function inferKind(preview: Exclude<MockDocumentPreviewData, null>): MockDocumentKind {
  const raw = `${preview.kind || ""} ${preview.fileName || ""} ${preview.title || ""}`.toLowerCase();
  if (raw.includes("permit") || raw.includes("visa") || raw.includes("виза") || raw.includes("разреш")) return "permit";
  if (raw.includes("contract") || raw.includes("договор") || raw.includes("площад")) return "venueContract";
  if (raw.includes("program") || raw.includes("программа")) return "eventProgram";
  if (raw.includes("confirmation") || raw.includes("participation") || raw.includes("подтверж")) return "participation";
  return "identity";
}

function DocumentArt({ kind }: { kind: MockDocumentKind }) {
  if (kind === "identity") {
    return (
      <div className="rounded-xl border bg-slate-50 p-3 text-slate-900">
        <div className="flex items-center gap-3">
          <div className="h-24 w-20 rounded-lg bg-gradient-to-br from-slate-300 to-slate-100 shadow-inner">
            <div className="mx-auto mt-5 h-9 w-9 rounded-full bg-slate-400" />
            <div className="mx-auto mt-2 h-7 w-12 rounded-t-full bg-slate-400" />
          </div>
          <div className="flex-1 space-y-2">
            <div className="h-3 w-32 rounded bg-slate-300" />
            <div className="h-3 w-44 rounded bg-slate-200" />
            <div className="grid grid-cols-2 gap-2">
              <div className="h-8 rounded border border-slate-200 bg-white" />
              <div className="h-8 rounded border border-slate-200 bg-white" />
            </div>
            <div className="h-8 rounded border border-dashed border-slate-300 bg-white" />
          </div>
        </div>
      </div>
    );
  }

  if (kind === "permit") {
    return (
      <div className="rounded-xl border border-sky-200 bg-gradient-to-br from-sky-50 to-white p-3 text-slate-900">
        <div className="mb-3 flex items-center justify-between">
          <div className="h-8 w-28 rounded-full bg-sky-200" />
          <div className="font-mono text-xs text-sky-700">BY-PERMIT-0426</div>
        </div>
        <div className="grid grid-cols-[1fr_72px] gap-3">
          <div className="space-y-2">
            <div className="h-3 w-40 rounded bg-sky-200" />
            <div className="h-3 w-52 rounded bg-slate-200" />
            <div className="h-14 rounded-lg border border-sky-100 bg-white" />
          </div>
          <div className="rounded-lg border border-sky-200 bg-white p-2">
            <div className="grid grid-cols-3 gap-1">
              {Array.from({ length: 18 }).map((_, index) => <span key={index} className="h-2 rounded bg-sky-200" />)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (kind === "venueContract") {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-slate-900">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-amber-200 bg-white p-3">
            <div className="mb-3 h-4 w-28 rounded bg-amber-200" />
            <div className="space-y-2">
              <div className="h-2 rounded bg-slate-200" />
              <div className="h-2 rounded bg-slate-200" />
              <div className="h-2 w-2/3 rounded bg-slate-200" />
            </div>
          </div>
          <div className="rounded-lg border border-amber-200 bg-white p-3">
            <div className="mb-3 h-4 w-24 rounded bg-amber-200" />
            <div className="h-12 rounded border border-dashed border-amber-300" />
            <div className="mt-2 h-2 w-20 rounded bg-slate-200" />
          </div>
        </div>
      </div>
    );
  }

  if (kind === "eventProgram") {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-slate-900">
        <div className="mb-3 h-5 w-44 rounded bg-emerald-200" />
        <div className="space-y-2">
          {["18:00", "18:30", "19:15", "20:00"].map((time) => (
            <div key={time} className="grid grid-cols-[52px_1fr] gap-3 rounded-lg bg-white px-3 py-2">
              <span className="font-mono text-xs text-emerald-700">{time}</span>
              <span className="h-2 self-center rounded bg-slate-200" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-violet-200 bg-violet-50 p-3 text-slate-900">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="h-4 w-40 rounded bg-violet-200" />
          <div className="mt-3 space-y-2">
            <div className="h-2 w-52 rounded bg-slate-200" />
            <div className="h-2 w-44 rounded bg-slate-200" />
            <div className="h-2 w-48 rounded bg-slate-200" />
          </div>
        </div>
        <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-violet-300 bg-white text-xs font-bold text-violet-700">
          OK
        </div>
      </div>
    </div>
  );
}

export default function MockDocumentPreview({ preview, onClose, theme = "dark" }: Props) {
  useEffect(() => {
    if (!preview) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, preview]);

  if (!preview) return null;
  const kind = preview.kind || inferKind(preview);
  const panelBg = theme === "admin" ? "#0B1220" : "#111A24";
  const border = theme === "admin" ? "rgba(148,163,184,0.28)" : "rgba(255,255,255,0.14)";

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-2xl rounded-2xl border p-5 text-[#F5F7FA]"
        style={{ borderColor: border, background: panelBg, boxShadow: "0 28px 80px rgba(0,0,0,0.45)" }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold">{preview.title}</h3>
            <div className="mt-1 font-mono text-xs text-sky-200">{preview.fileName || KIND_LABEL[kind]}</div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg border px-3 py-1 text-sm" style={{ borderColor: border }}>
            Закрыть
          </button>
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-white p-4 text-slate-900 shadow-2xl">
          <div className="pointer-events-none absolute inset-0 flex rotate-[-18deg] items-center justify-center text-7xl font-black tracking-[0.2em] text-slate-200/70">
            DEMO
          </div>
          <div className="relative">
            <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Mock document</div>
                <div className="mt-1 text-lg font-bold text-slate-900">{KIND_LABEL[kind]}</div>
              </div>
              <div className="rounded-full border border-slate-200 px-3 py-1 font-mono text-xs text-slate-500">CL-DEMO</div>
            </div>
            <DocumentArt kind={kind} />
            <div className="mt-4 grid gap-2">
              {preview.rows.map(([label, value]) => (
                <div key={label} className="grid grid-cols-[150px_minmax(0,1fr)] gap-3 rounded-lg border border-slate-200 px-3 py-2 text-sm">
                  <span className="text-slate-500">{label}</span>
                  <span className="font-medium text-slate-900">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
