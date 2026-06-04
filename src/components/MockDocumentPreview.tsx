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

type ConcretePreview = Exclude<MockDocumentPreviewData, null>;

function rowValue(preview: ConcretePreview, hints: string[]): string {
  const normalizedHints = hints.map((hint) => hint.toLowerCase());
  return preview.rows.find(([label]) => normalizedHints.some((hint) => label.toLowerCase().includes(hint)))?.[1] || "";
}

function isLikelyFemale(preview: ConcretePreview): boolean {
  const subject = rowValue(preview, ["фио", "участник", "исполнитель", "представитель", "организация"]).toLowerCase();
  return /(ова|ева|ина|ая|на)(\s|$)/.test(subject);
}

function PixelPortrait({ female = false }: { female?: boolean }) {
  const palette = female
    ? { paper: "#FDE7D6", hair: "#5B2A1F", face: "#F6C7A9", accent: "#C2410C", shade: "#9A3412" }
    : { paper: "#DBEAFE", hair: "#1E293B", face: "#E7B98D", accent: "#2563EB", shade: "#475569" };
  const colorAt = (row: number, col: number) => {
    if (row < 2) return palette.paper;
    if (row === 2 && col > 1 && col < 6) return palette.hair;
    if (row >= 3 && row <= 5 && col > 1 && col < 6) return palette.face;
    if (row === 4 && (col === 2 || col === 5)) return "#0F172A";
    if (row === 6 && col > 2 && col < 5) return palette.shade;
    if (row >= 7 && row <= 9 && col > 0 && col < 7) return palette.accent;
    return palette.paper;
  };

  return (
    <div className="grid h-24 w-20 grid-cols-8 gap-px rounded-lg border border-slate-300 bg-white p-1 shadow-inner">
      {Array.from({ length: 80 }).map((_, index) => {
        const row = Math.floor(index / 8);
        const col = index % 8;
        return <span key={index} className="rounded-[1px]" style={{ background: colorAt(row, col) }} />;
      })}
    </div>
  );
}

function BureauStamp({ label, tone = "blue" }: { label: string; tone?: "blue" | "green" | "violet" }) {
  const color = tone === "green" ? "#047857" : tone === "violet" ? "#6D28D9" : "#1D4ED8";
  return (
    <div className="inline-flex rotate-[-6deg] items-center justify-center rounded-full border-2 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em]" style={{ borderColor: color, color }}>
      {label}
    </div>
  );
}

function PaperField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-slate-300 bg-white/70 px-2 py-1">
      <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-500">{label}</div>
      <div className="mt-0.5 truncate font-mono text-[11px] font-semibold text-slate-900">{value || "DEMO-RECORD"}</div>
    </div>
  );
}

function DocumentArt({ kind, preview }: { kind: MockDocumentKind; preview: ConcretePreview }) {
  if (kind === "identity") {
    const subject = rowValue(preview, ["фио", "участник", "исполнитель", "представитель"]) || "Demo Participant";
    const documentNumber = rowValue(preview, ["номер", "документ", "паспорт"]) || "ID-DEMO-0426";
    const country = rowValue(preview, ["страна", "гражданство"]) || "Беларусь";
    return (
      <div className="relative overflow-hidden rounded-xl border border-slate-300 bg-[#F8F1DC] p-3 text-slate-900">
        <div className="absolute right-4 top-4 font-mono text-[10px] font-bold tracking-[0.2em] text-slate-400">DEMO-ID</div>
        <div className="mb-3 border-b border-slate-300 pb-2 text-[11px] font-black uppercase tracking-[0.18em] text-slate-600">Рэспубліка Беларусь · mock record</div>
        <div className="flex items-start gap-3">
          <PixelPortrait female={isLikelyFemale(preview)} />
          <div className="flex-1 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <PaperField label="ФИО" value={subject} />
              <PaperField label="Гражданство" value={country} />
              <PaperField label="Номер" value={documentNumber} />
              <PaperField label="Статус" value="mock-проверка" />
            </div>
            <div className="flex items-center justify-between gap-3 pt-1">
              <div className="h-7 flex-1 rounded border border-dashed border-slate-400 bg-white/70" />
              <BureauStamp label="Проверено" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (kind === "permit") {
    const subject = rowValue(preview, ["фио", "участник", "исполнитель"]) || "Foreign Demo Performer";
    const country = rowValue(preview, ["страна", "гражданство"]) || "Demo country";
    return (
      <div className="rounded-xl border border-sky-300 bg-gradient-to-br from-sky-50 via-white to-cyan-50 p-3 text-slate-900">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.18em] text-sky-800">Border permit · demo</div>
            <div className="mt-1 font-mono text-xs text-sky-700">BY-PERMIT-0426</div>
          </div>
          <BureauStamp label="Demo visa" tone="green" />
        </div>
        <div className="grid grid-cols-[1fr_84px] gap-3">
          <div className="space-y-2">
            <PaperField label="Участник" value={subject} />
            <PaperField label="Страна" value={country} />
            <div className="grid grid-cols-8 gap-px rounded-lg border border-sky-200 bg-white p-2">
              {Array.from({ length: 32 }).map((_, index) => <span key={index} className="h-2 rounded-sm bg-sky-200" />)}
            </div>
          </div>
          <PixelPortrait female={isLikelyFemale(preview)} />
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
            <DocumentArt kind={kind} preview={preview} />
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
