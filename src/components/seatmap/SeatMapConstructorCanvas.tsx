import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Konva from "konva";
import type { KonvaEventObject } from "konva/lib/Node";
import { Circle, Group, Layer, Rect, Stage, Text } from "react-konva";
import { Armchair, Box, Layers3, Maximize2, Minus, Plus, RotateCw, Save, Trash2, X } from "lucide-react";
import {
  CONSTRUCTOR_TARIFFS,
  MAX_COMPLEX_LAYOUT_SEATS,
  addConstructorBlockV2,
  cloneSeatMapLayoutV2,
  countSeatMapLayoutV2Seats,
  createConstructorLayoutV2,
  getConstructorBlockSettings,
  removeConstructorBlockV2,
  updateConstructorBlockV2,
  type SeatMapBlockV2,
  type SeatMapConstructorBlockSettings,
  type SeatMapConstructorBlockType,
  type SeatMapLayoutV2,
  type SeatMapObjectV2,
  type SeatMapObjectV2Type,
} from "@/lib/seatMapV2";

type Props = {
  layoutId: string;
  layoutName: string;
  onClose: () => void;
  onSave: (layout: SeatMapLayoutV2) => void;
};

type Selection = { kind: "block"; id: string } | { kind: "object"; id: string } | null;

const MIN_SCALE = 0.28;
const MAX_SCALE = 2.1;
const FIELD_CLASS = "mt-1 h-9 w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 text-sm text-slate-100 outline-none focus:border-blue-400";
type ConstructorTemplateKey = "theatre" | "amphitheatre" | "circus" | "sports" | "ice" | "palace";

const CONSTRUCTOR_TEMPLATES: { key: ConstructorTemplateKey; title: string }[] = [
  { key: "theatre", title: "Театр" },
  { key: "amphitheatre", title: "Амфитеатр" },
  { key: "circus", title: "Цирк" },
  { key: "sports", title: "Малая арена" },
  { key: "ice", title: "Ледовая арена" },
  { key: "palace", title: "Дворец спорта" },
];

function blockBounds(block: SeatMapBlockV2) {
  const seats = block.rows.flatMap((row) => row.seats);
  const minX = Math.min(...seats.map((seat) => seat.x - seat.radius), 0);
  const minY = Math.min(...seats.map((seat) => seat.y - seat.radius), 0);
  const maxX = Math.max(...seats.map((seat) => seat.x + seat.radius), 1);
  const maxY = Math.max(...seats.map((seat) => seat.y + seat.radius), 1);
  return { x: minX - 16, y: minY - 18, width: maxX - minX + 32, height: maxY - minY + 34 };
}

function numberValue(value: string, fallback: number, min: number, max: number): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.max(min, Math.min(max, Math.round(numeric))) : fallback;
}

function nextObject(layout: SeatMapLayoutV2, type: Extract<SeatMapObjectV2Type, "stage" | "pit" | "arena">): SeatMapObjectV2 {
  let number = layout.objects.filter((object) => object.type === type).length + 1;
  while (layout.objects.some((object) => object.id === `${layout.layoutId}-object-${type}-${number}`)) number += 1;
  const presets = {
    stage: { label: "СЦЕНА", x: 388, y: 48 + number * 22, width: 444, height: 84, radius: 40, fill: "#172554", stroke: "#60A5FA" },
    pit: { label: "ОРКЕСТРОВАЯ ЯМА", x: 422, y: 158 + number * 18, width: 376, height: 42, radius: 20, fill: "#1E293B", stroke: "#94A3B8" },
    arena: { label: "АРЕНА", x: 386, y: 252, width: 448, height: 214, radius: 48, fill: "#082F49", stroke: "#38BDF8" },
  };
  return {
    id: `${layout.layoutId}-object-${type}-${number}`,
    type,
    ...presets[type],
  };
}

function createSceneObject(layoutId: string, type: Extract<SeatMapObjectV2Type, "stage" | "pit" | "arena">, number: number): SeatMapObjectV2 {
  const presets = {
    stage: { label: "СЦЕНА", x: 388, y: 48, width: 444, height: 84, radius: 40, fill: "#172554", stroke: "#60A5FA" },
    pit: { label: "ОРКЕСТРОВАЯ ЯМА", x: 422, y: 154, width: 376, height: 42, radius: 20, fill: "#1E293B", stroke: "#94A3B8" },
    arena: { label: "АРЕНА", x: 386, y: 252, width: 448, height: 214, radius: 48, fill: "#082F49", stroke: "#38BDF8" },
  };
  return {
    id: `${layoutId}-object-${type}-${number}`,
    type,
    ...presets[type],
  };
}

function objectTypeLabel(type: SeatMapObjectV2Type): string {
  if (type === "arena") return "Арена";
  if (type === "pit") return "Оркестровая яма";
  return "Сцена";
}

function addTemplateBlock(
  source: SeatMapLayoutV2,
  type: SeatMapConstructorBlockType,
  patch: Partial<SeatMapConstructorBlockSettings> & Partial<Pick<SeatMapBlockV2, "x" | "y">>,
): SeatMapLayoutV2 {
  const added = addConstructorBlockV2(source, type);
  const block = added.sectors.flatMap((sector) => sector.blocks).filter((item) => item.type === type).at(-1);
  return block ? updateConstructorBlockV2(added, block.id, patch) : added;
}

function TemplatePictogram({ type }: { type: ConstructorTemplateKey }) {
  const dots = (count: number, className = "") => Array.from({ length: count }).map((_, index) => (
    <span key={index} className={`h-1.5 w-1.5 rounded-full bg-current ${className}`} />
  ));
  if (type === "circus") {
    return <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 bg-slate-950 text-cyan-300"><span className="h-5 w-5 rounded-full border-2 border-current" /></span>;
  }
  if (type === "ice") {
    return <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 bg-slate-950 text-sky-300"><span className="h-4 w-7 rounded-full border-2 border-current" /></span>;
  }
  if (type === "sports") {
    return <span className="grid h-9 w-9 grid-cols-3 gap-0.5 rounded-lg border border-slate-700 bg-slate-950 p-1.5 text-emerald-300"><span className="col-span-3 h-2 rounded-sm border border-current" />{dots(6)}</span>;
  }
  if (type === "amphitheatre") {
    return <span className="flex h-9 w-9 flex-col items-center justify-center gap-0.5 rounded-lg border border-slate-700 bg-slate-950 text-blue-300"><span className="h-2 w-5 rounded-t-full border-t-2 border-current" /><span className="h-2 w-7 rounded-t-full border-t-2 border-current" /><span className="h-2 w-8 rounded-t-full border-t-2 border-current" /></span>;
  }
  if (type === "palace") {
    return <span className="grid h-9 w-9 grid-cols-4 gap-0.5 rounded-lg border border-slate-700 bg-slate-950 p-1.5 text-amber-300"><span className="col-span-4 h-1.5 rounded bg-current" />{dots(8)}</span>;
  }
  return <span className="grid h-9 w-9 grid-cols-4 gap-0.5 rounded-lg border border-slate-700 bg-slate-950 p-1.5 text-violet-300">{dots(12)}</span>;
}

function buildTemplateLayout(layoutId: string, layoutName: string, key: ConstructorTemplateKey): SeatMapLayoutV2 {
  let next = createConstructorLayoutV2(layoutId, layoutName);
  if (key === "theatre") {
    next = updateConstructorBlockV2(next, "straight-1", { name: "Партер", rows: 8, seatsPerRow: 14, x: 395, y: 250, rowSpacing: 29, seatSpacing: 27 });
    next = addTemplateBlock(next, "diagonal", { name: "Левый боковой сектор", rows: 7, seatsPerRow: 6, x: 202, y: 300, rotation: -12 });
    next = addTemplateBlock(next, "diagonal", { name: "Правый боковой сектор", rows: 7, seatsPerRow: 6, x: 858, y: 270, rotation: 12 });
    next = addTemplateBlock(next, "balcony", { name: "Балкон", rows: 4, seatsPerRow: 20, x: 290, y: 606 });
    next = addTemplateBlock(next, "box", { name: "Ложа L", rows: 2, seatsPerRow: 5, x: 92, y: 245, rotation: -5 });
    next = addTemplateBlock(next, "box", { name: "Ложа R", rows: 2, seatsPerRow: 5, x: 1030, y: 245, rotation: 5 });
    next = { ...next, style: "theatre", objects: [createSceneObject(layoutId, "stage", 1), createSceneObject(layoutId, "pit", 2)] };
  }
  if (key === "amphitheatre") {
    next = updateConstructorBlockV2(next, "straight-1", { name: "Нижний полукруг", rows: 5, seatsPerRow: 18, x: 360, y: 430, rotation: 0, rowSpacing: 30 });
    next = addTemplateBlock(next, "diagonal", { name: "Левое крыло", rows: 8, seatsPerRow: 8, x: 165, y: 300, rotation: -28 });
    next = addTemplateBlock(next, "diagonal", { name: "Правое крыло", rows: 8, seatsPerRow: 8, x: 890, y: 244, rotation: 28 });
    next = addTemplateBlock(next, "balcony", { name: "Верхний полукруг", rows: 5, seatsPerRow: 22, x: 270, y: 625 });
    next = { ...next, style: "theatre", objects: [{ ...createSceneObject(layoutId, "stage", 1), x: 415, y: 168, width: 420, label: "ОТКРЫТАЯ СЦЕНА" }] };
  }
  if (key === "circus") {
    next = updateConstructorBlockV2(next, "straight-1", { name: "Южная трибуна", rows: 5, seatsPerRow: 16, x: 382, y: 580 });
    next = addTemplateBlock(next, "straight", { name: "Северная трибуна", rows: 5, seatsPerRow: 16, x: 382, y: 96 });
    next = addTemplateBlock(next, "diagonal", { name: "Северо-запад", rows: 5, seatsPerRow: 8, x: 206, y: 215, rotation: -38 });
    next = addTemplateBlock(next, "diagonal", { name: "Северо-восток", rows: 5, seatsPerRow: 8, x: 880, y: 170, rotation: 38 });
    next = addTemplateBlock(next, "diagonal", { name: "Юго-запад", rows: 5, seatsPerRow: 8, x: 190, y: 452, rotation: 38 });
    next = addTemplateBlock(next, "diagonal", { name: "Юго-восток", rows: 5, seatsPerRow: 8, x: 895, y: 492, rotation: -38 });
    next = { ...next, style: "arena", objects: [{ id: `${layoutId}-object-arena`, type: "arena", x: 440, y: 270, width: 330, height: 250, radius: 125, label: "МАНЕЖ", fill: "#083344", stroke: "#22D3EE" }] };
  }
  if (key === "sports") {
    next = updateConstructorBlockV2(next, "straight-1", { name: "Трибуна Север", rows: 6, seatsPerRow: 18, x: 350, y: 105 });
    next = addTemplateBlock(next, "straight", { name: "Трибуна Юг", rows: 6, seatsPerRow: 18, x: 350, y: 588 });
    next = addTemplateBlock(next, "diagonal", { name: "Трибуна Запад", rows: 7, seatsPerRow: 8, x: 148, y: 325, rotation: -8 });
    next = addTemplateBlock(next, "diagonal", { name: "Трибуна Восток", rows: 7, seatsPerRow: 8, x: 905, y: 304, rotation: 8 });
    next = { ...next, style: "arena", objects: [{ id: `${layoutId}-object-arena`, type: "arena", x: 358, y: 300, width: 520, height: 210, radius: 26, label: "ИГРОВАЯ ЗОНА", fill: "#064E3B", stroke: "#34D399" }] };
  }
  if (key === "ice") {
    next = updateConstructorBlockV2(next, "straight-1", { name: "Сектор A", rows: 5, seatsPerRow: 20, x: 320, y: 92 });
    next = addTemplateBlock(next, "straight", { name: "Сектор B", rows: 5, seatsPerRow: 20, x: 320, y: 610 });
    next = addTemplateBlock(next, "diagonal", { name: "Сектор C", rows: 6, seatsPerRow: 8, x: 154, y: 320, rotation: -12 });
    next = addTemplateBlock(next, "diagonal", { name: "Сектор D", rows: 6, seatsPerRow: 8, x: 906, y: 288, rotation: 12 });
    next = addTemplateBlock(next, "box", { name: "Пресс-ложа", rows: 2, seatsPerRow: 8, x: 500, y: 530 });
    next = { ...next, style: "arena", objects: [{ id: `${layoutId}-object-arena`, type: "arena", x: 330, y: 285, width: 565, height: 235, radius: 112, label: "ЛЕДОВАЯ АРЕНА", fill: "#DFF6FF", stroke: "#38BDF8" }] };
  }
  if (key === "palace") {
    next = updateConstructorBlockV2(next, "straight-1", { name: "Партер перед сценой", rows: 7, seatsPerRow: 16, x: 355, y: 330 });
    next = addTemplateBlock(next, "balcony", { name: "Балкон дворца", rows: 5, seatsPerRow: 22, x: 260, y: 610 });
    next = addTemplateBlock(next, "box", { name: "VIP-ложи L", rows: 2, seatsPerRow: 8, x: 120, y: 300, rotation: -10 });
    next = addTemplateBlock(next, "box", { name: "VIP-ложи R", rows: 2, seatsPerRow: 8, x: 970, y: 288, rotation: 10 });
    next = addTemplateBlock(next, "diagonal", { name: "Боковой амфитеатр L", rows: 5, seatsPerRow: 7, x: 215, y: 455, rotation: -24 });
    next = addTemplateBlock(next, "diagonal", { name: "Боковой амфитеатр R", rows: 5, seatsPerRow: 7, x: 895, y: 410, rotation: 24 });
    next = { ...next, style: "theatre", objects: [{ ...createSceneObject(layoutId, "stage", 1), x: 350, y: 120, width: 520, label: "ДВОРЦОВАЯ СЦЕНА" }, createSceneObject(layoutId, "pit", 2)] };
  }
  return next;
}

export default function SeatMapConstructorCanvas({ layoutId, layoutName, onClose, onSave }: Props) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<Konva.Stage | null>(null);
  const [layout, setLayout] = useState(() => createConstructorLayoutV2(layoutId, layoutName));
  const [selection, setSelection] = useState<Selection>({ kind: "block", id: "straight-1" });
  const [size, setSize] = useState({ width: 1, height: 1 });
  const [viewport, setViewport] = useState({ x: 0, y: 0, scale: 1 });
  const [warning, setWarning] = useState("");
  const blocks = useMemo(() => layout.sectors.flatMap((sector) => sector.blocks), [layout.sectors]);
  const selectedBlock = selection?.kind === "block" ? blocks.find((block) => block.id === selection.id) || null : null;
  const selectedObject = selection?.kind === "object" ? layout.objects.find((object) => object.id === selection.id) || null : null;
  const selectedSettings = selectedBlock ? getConstructorBlockSettings(selectedBlock) : null;
  const seatCount = countSeatMapLayoutV2Seats(layout);

  useEffect(() => {
    setLayout(createConstructorLayoutV2(layoutId, layoutName));
    setSelection({ kind: "block", id: "straight-1" });
    setWarning("");
  }, [layoutId, layoutName]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  useEffect(() => {
    const node = wrapperRef.current;
    if (!node) return;
    const measure = () => setSize({ width: Math.max(1, node.clientWidth), height: Math.max(1, node.clientHeight) });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const fitToView = useCallback(() => {
    const scale = Math.max(MIN_SCALE, Math.min(1.2, (size.width - 40) / layout.width, (size.height - 36) / layout.height));
    setViewport({
      scale,
      x: (size.width - layout.width * scale) / 2,
      y: (size.height - layout.height * scale) / 2,
    });
  }, [layout.height, layout.width, size.height, size.width]);

  useEffect(() => {
    fitToView();
  }, [fitToView, layoutId]);

  const commitLayout = (candidate: SeatMapLayoutV2): boolean => {
    const nextCount = countSeatMapLayoutV2Seats(candidate);
    if (nextCount > MAX_COMPLEX_LAYOUT_SEATS) {
      setWarning(`Лимит сложной схемы: ${MAX_COMPLEX_LAYOUT_SEATS} мест. Сейчас получилось бы ${nextCount}.`);
      return false;
    }
    setWarning("");
    setLayout(candidate);
    return true;
  };

  const addBlock = (type: SeatMapConstructorBlockType) => {
    const candidate = addConstructorBlockV2(layout, type);
    if (!commitLayout(candidate)) return;
    const last = candidate.sectors.flatMap((sector) => sector.blocks).filter((block) => block.type === type).at(-1);
    if (last) setSelection({ kind: "block", id: last.id });
  };

  const updateBlock = (patch: Partial<SeatMapConstructorBlockSettings> & Partial<Pick<SeatMapBlockV2, "x" | "y">>) => {
    if (!selectedBlock) return;
    commitLayout(updateConstructorBlockV2(layout, selectedBlock.id, patch));
  };

  const addObject = (type: Extract<SeatMapObjectV2Type, "stage" | "pit" | "arena"> = "stage") => {
    const object = nextObject(layout, type);
    setLayout((current) => ({ ...current, objects: [...current.objects, object] }));
    setSelection({ kind: "object", id: object.id });
  };

  const applyTemplate = (key: ConstructorTemplateKey) => {
    const candidate = buildTemplateLayout(layoutId, layoutName, key);
    if (!commitLayout(candidate)) return;
    const firstBlock = candidate.sectors.flatMap((sector) => sector.blocks)[0];
    setSelection(firstBlock ? { kind: "block", id: firstBlock.id } : null);
    window.setTimeout(fitToView, 0);
  };

  const updateObject = (patch: Partial<SeatMapObjectV2>) => {
    if (!selectedObject) return;
    setLayout((current) => ({
      ...current,
      objects: current.objects.map((object) => object.id === selectedObject.id ? { ...object, ...patch } : object),
    }));
  };

  const removeSelected = () => {
    if (selection?.kind === "block") {
      setLayout((current) => removeConstructorBlockV2(current, selection.id));
    } else if (selection?.kind === "object") {
      setLayout((current) => ({ ...current, objects: current.objects.filter((object) => object.id !== selection.id) }));
    }
    setSelection(null);
  };

  const zoomAtCenter = (direction: 1 | -1) => {
    const nextScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, viewport.scale * (direction > 0 ? 1.15 : 0.87)));
    const center = { x: size.width / 2, y: size.height / 2 };
    const world = { x: (center.x - viewport.x) / viewport.scale, y: (center.y - viewport.y) / viewport.scale };
    setViewport({ scale: nextScale, x: center.x - world.x * nextScale, y: center.y - world.y * nextScale });
  };

  const handleWheel = (event: KonvaEventObject<WheelEvent>) => {
    event.evt.preventDefault();
    const pointer = stageRef.current?.getPointerPosition();
    if (!pointer) return;
    const nextScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, viewport.scale * (event.evt.deltaY > 0 ? 0.92 : 1.08)));
    const world = { x: (pointer.x - viewport.x) / viewport.scale, y: (pointer.y - viewport.y) / viewport.scale };
    setViewport({ scale: nextScale, x: pointer.x - world.x * nextScale, y: pointer.y - world.y * nextScale });
  };

  const save = () => {
    if (seatCount === 0) {
      setWarning("Добавьте хотя бы один блок мест или используйте режим «Open-air / без мест».");
      return;
    }
    if (seatCount > MAX_COMPLEX_LAYOUT_SEATS) return;
    onSave(cloneSeatMapLayoutV2(layout));
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <div data-seatmap-constructor className="fixed inset-0 z-[95] bg-slate-950/85 p-3 backdrop-blur-md">
      <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-700 bg-[#07121F] shadow-2xl">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700/80 bg-[#091827] px-5 py-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-100">{layoutName}</h2>
            <p className="mt-0.5 text-xs text-slate-400">SeatMap V2 · Сложная схема / конструктор</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span data-constructor-seat-count className={`rounded-full px-3 py-1.5 text-xs font-semibold ${seatCount > MAX_COMPLEX_LAYOUT_SEATS ? "bg-red-950 text-red-200" : "bg-blue-950 text-blue-200"}`}>
              {seatCount} / {MAX_COMPLEX_LAYOUT_SEATS} мест
            </span>
            <button type="button" onClick={save} className="inline-flex h-9 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-500">
              <Save size={15} /> Сохранить площадку
            </button>
            <button type="button" onClick={onClose} aria-label="Закрыть конструктор" className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800">
              <X size={17} />
            </button>
          </div>
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-[240px_minmax(0,1fr)_285px]">
          <aside className="space-y-4 overflow-y-auto border-r border-slate-700/80 p-4 text-slate-200">
            <div>
              <p className="text-sm font-semibold">Добавить блок</p>
              <p className="mt-1 text-xs leading-5 text-slate-400">Перетащите блок на холсте, затем настройте его справа.</p>
            </div>
            <div className="space-y-2">
              <button data-add-block="straight" type="button" onClick={() => addBlock("straight")} className="flex w-full items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-left text-sm hover:border-blue-500"><Armchair size={16} className="text-blue-400" /> + Партер / прямой блок</button>
              <button data-add-block="diagonal" type="button" onClick={() => addBlock("diagonal")} className="flex w-full items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-left text-sm hover:border-sky-500"><Layers3 size={16} className="text-sky-400" /> + Боковой сектор</button>
              <button data-add-block="balcony" type="button" onClick={() => addBlock("balcony")} className="flex w-full items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-left text-sm hover:border-violet-500"><Layers3 size={16} className="text-violet-400" /> + Балкон</button>
              <button data-add-block="box" type="button" onClick={() => addBlock("box")} className="flex w-full items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-left text-sm hover:border-orange-500"><Box size={16} className="text-orange-400" /> + Ложа</button>
            </div>
            <div className="border-t border-slate-700 pt-4">
              <p className="mb-2 text-sm font-semibold">Объекты сцены</p>
              <div className="grid gap-2">
                <button data-add-object="stage" type="button" onClick={() => addObject("stage")} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-left text-sm hover:border-blue-500">+ Сцена</button>
                <button data-add-object="pit" type="button" onClick={() => addObject("pit")} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-left text-sm hover:border-slate-500">+ Оркестровая яма</button>
                <button data-add-object="arena" type="button" onClick={() => addObject("arena")} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-left text-sm hover:border-sky-500">+ Арена</button>
              </div>
            </div>
            <div className="border-t border-slate-700 pt-4">
              <p className="mb-2 text-sm font-semibold">Шаблоны посадки</p>
              <div className="grid grid-cols-2 gap-2">
                {CONSTRUCTOR_TEMPLATES.map((template) => (
                  <button
                    key={template.key}
                    type="button"
                    onClick={() => applyTemplate(template.key)}
                    className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-2 py-2 text-left hover:border-blue-500"
                  >
                    <TemplatePictogram type={template.key} />
                    <span className="block text-xs font-semibold leading-4 text-slate-100">{template.title}</span>
                  </button>
                ))}
              </div>
            </div>
            <button data-delete-selection type="button" disabled={!selection} onClick={removeSelected} className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-red-800/70 bg-red-950/30 px-3 py-2 text-sm font-semibold text-red-200 disabled:cursor-not-allowed disabled:opacity-40">
              <Trash2 size={15} /> Удалить выбранное
            </button>
          </aside>

          <main className="flex min-h-0 min-w-0 flex-col bg-[#06111E] p-3">
            <div className="mb-2 flex items-center justify-between gap-2 px-1 text-xs text-slate-400">
              <span>Drag: блоки и объекты · Пустое поле: перемещение холста · Колесо: масштаб</span>
              <div className="flex items-center gap-1">
                <button type="button" aria-label="Уменьшить масштаб конструктора" onClick={() => zoomAtCenter(-1)} className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-700 bg-slate-900 text-slate-200"><Minus size={14} /></button>
                <button type="button" data-fit-constructor onClick={fitToView} className="inline-flex h-8 items-center gap-1 rounded-md border border-slate-700 bg-slate-900 px-2 font-semibold text-slate-200"><Maximize2 size={13} /> Вписать</button>
                <button type="button" aria-label="Увеличить масштаб конструктора" onClick={() => zoomAtCenter(1)} className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-700 bg-slate-900 text-slate-200"><Plus size={14} /></button>
              </div>
            </div>
            {warning && <div data-constructor-warning className="mb-2 rounded-lg border border-amber-700 bg-amber-950/60 px-3 py-2 text-xs text-amber-100">{warning}</div>}
            <div ref={wrapperRef} className="min-h-0 flex-1 overflow-hidden rounded-xl border border-slate-700 bg-[#081827]">
              <Stage
                ref={stageRef}
                width={size.width}
                height={size.height}
                x={viewport.x}
                y={viewport.y}
                scaleX={viewport.scale}
                scaleY={viewport.scale}
                draggable
                onDragEnd={(event) => event.target === stageRef.current && setViewport((current) => ({ ...current, x: event.target.x(), y: event.target.y() }))}
                onWheel={handleWheel}
              >
                <Layer>
                  <Rect width={layout.width} height={layout.height} cornerRadius={24} fill="#071827" stroke="#173047" strokeWidth={2} onClick={() => setSelection(null)} />
                  {layout.objects.map((object) => {
                    const selected = selection?.kind === "object" && selection.id === object.id;
                    return (
                      <Group
                        key={object.id}
                        x={object.x}
                        y={object.y}
                        rotation={object.rotation || 0}
                        draggable
                        onClick={(event) => { event.cancelBubble = true; setSelection({ kind: "object", id: object.id }); }}
                        onDragEnd={(event) => {
                          event.cancelBubble = true;
                          setSelection({ kind: "object", id: object.id });
                          setLayout((current) => ({
                            ...current,
                            objects: current.objects.map((item) => item.id === object.id ? { ...item, x: event.target.x(), y: event.target.y() } : item),
                          }));
                        }}
                      >
                        <Rect width={object.width} height={object.height} cornerRadius={object.radius || 0} fill={object.fill} stroke={selected ? "#FACC15" : object.stroke} strokeWidth={selected ? 3 : 2} shadowColor="#020617" shadowBlur={14} shadowOpacity={0.35} />
                        <Text y={object.height / 2 - 8} width={object.width} text={object.label} align="center" fontSize={object.type === "stage" ? 15 : 12} fontStyle="bold" fill="#DBEAFE" letterSpacing={3} />
                      </Group>
                    );
                  })}
                  {layout.sectors.map((sector) => (
                    <Group key={sector.id}>
                      <Text x={sector.labelX} y={sector.labelY} text={sector.name} fontSize={11} fontStyle="bold" fill="#64748B" letterSpacing={2} />
                      {sector.blocks.map((block) => {
                        const bounds = blockBounds(block);
                        const selected = selection?.kind === "block" && selection.id === block.id;
                        return (
                          <Group
                            key={block.id}
                            x={block.x}
                            y={block.y}
                            rotation={block.rotation}
                            draggable
                            onClick={(event) => { event.cancelBubble = true; setSelection({ kind: "block", id: block.id }); }}
                            onDragEnd={(event) => {
                              event.cancelBubble = true;
                              setSelection({ kind: "block", id: block.id });
                              setLayout((current) => updateConstructorBlockV2(current, block.id, { x: event.target.x(), y: event.target.y() }));
                            }}
                          >
                            <Rect x={bounds.x} y={bounds.y} width={bounds.width} height={bounds.height} cornerRadius={14} fill="#0D2233" stroke={selected ? "#FACC15" : block.accent} strokeWidth={selected ? 3 : 1.5} />
                            <Text x={bounds.x + 5} y={bounds.y - 20} text={block.name} fontSize={11} fontStyle={selected ? "bold" : "normal"} fill={selected ? "#FDE68A" : "#94A3B8"} />
                            {block.rows.flatMap((row) => row.seats).map((seat) => (
                              <Circle key={seat.seatId} x={seat.x} y={seat.y} radius={seat.radius} fill={seat.color} stroke="#0F172A" strokeWidth={1} />
                            ))}
                          </Group>
                        );
                      })}
                    </Group>
                  ))}
                </Layer>
              </Stage>
            </div>
          </main>

          <aside className="overflow-y-auto border-l border-slate-700/80 bg-[#091827] p-4 text-slate-200">
            {selectedBlock && selectedSettings ? (
              <div data-selected-block={selectedBlock.id} className="space-y-3">
                <div>
                  <p className="text-sm font-semibold">Параметры блока</p>
                  <p className="mt-1 text-xs text-slate-400">{selectedBlock.type === "box" ? "Ложа / box" : selectedBlock.type === "balcony" ? "Балкон" : selectedBlock.type === "diagonal" ? "Диагональный сектор" : "Прямой блок"}</p>
                </div>
                <label className="block text-xs text-slate-400">Название<input data-block-name value={selectedSettings.name} onChange={(event) => updateBlock({ name: event.target.value })} className={FIELD_CLASS} /></label>
                {selectedBlock.type !== "box" && (
                  <label className="block text-xs text-slate-400">Ряды<input data-block-rows type="number" min={1} max={20} value={selectedSettings.rows} onChange={(event) => updateBlock({ rows: numberValue(event.target.value, selectedSettings.rows, 1, 20) })} className={FIELD_CLASS} /></label>
                )}
                <label className="block text-xs text-slate-400">{selectedBlock.type === "box" ? "Мест в ложе" : "Мест в ряду"}<input data-block-seats type="number" min={1} max={30} value={selectedSettings.seatsPerRow} onChange={(event) => updateBlock({ seatsPerRow: numberValue(event.target.value, selectedSettings.seatsPerRow, 1, 30) })} className={FIELD_CLASS} /></label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="block text-xs text-slate-400">Шаг ряда<input type="number" min={20} max={48} value={selectedSettings.rowSpacing} onChange={(event) => updateBlock({ rowSpacing: numberValue(event.target.value, selectedSettings.rowSpacing, 20, 48) })} className={FIELD_CLASS} /></label>
                  <label className="block text-xs text-slate-400">Шаг кресла<input type="number" min={18} max={44} value={selectedSettings.seatSpacing} onChange={(event) => updateBlock({ seatSpacing: numberValue(event.target.value, selectedSettings.seatSpacing, 18, 44) })} className={FIELD_CLASS} /></label>
                </div>
                <label className="block text-xs text-slate-400">
                  Тариф по умолчанию
                  <select data-block-tariff value={selectedSettings.tariffId} onChange={(event) => updateBlock({ tariffId: event.target.value })} className={FIELD_CLASS}>
                    {CONSTRUCTOR_TARIFFS.map((tariff) => <option key={tariff.id} value={tariff.id}>{tariff.name} · {tariff.price} BYN</option>)}
                  </select>
                </label>
                <label className="block text-xs text-slate-400">Поворот, °<input data-block-rotation type="number" min={-180} max={180} value={selectedSettings.rotation} onChange={(event) => updateBlock({ rotation: numberValue(event.target.value, selectedSettings.rotation, -180, 180) })} className={FIELD_CLASS} /></label>
                <button data-rotate-selection type="button" onClick={() => updateBlock({ rotation: selectedSettings.rotation + 5 })} className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-semibold hover:border-blue-500">
                  <RotateCw size={15} /> Повернуть на 5°
                </button>
                <div className="grid grid-cols-2 gap-2 border-t border-slate-700 pt-3">
                  <label className="block text-xs text-slate-400">X<input type="number" value={Math.round(selectedBlock.x)} onChange={(event) => updateBlock({ x: numberValue(event.target.value, selectedBlock.x, -300, 1500) })} className={FIELD_CLASS} /></label>
                  <label className="block text-xs text-slate-400">Y<input type="number" value={Math.round(selectedBlock.y)} onChange={(event) => updateBlock({ y: numberValue(event.target.value, selectedBlock.y, -300, 1000) })} className={FIELD_CLASS} /></label>
                </div>
              </div>
            ) : selectedObject ? (
              <div data-selected-object={selectedObject.id} className="space-y-3">
                <div>
                  <p className="text-sm font-semibold">Объект сцены</p>
                  <p className="mt-1 text-xs text-slate-400">{objectTypeLabel(selectedObject.type)}</p>
                </div>
                <label className="block text-xs text-slate-400">Тип
                  <select value={selectedObject.type} onChange={(event) => updateObject({ type: event.target.value as SeatMapObjectV2Type })} className={FIELD_CLASS}>
                    <option value="stage">Сцена</option>
                    <option value="pit">Оркестровая яма</option>
                    <option value="arena">Арена</option>
                  </select>
                </label>
                <label className="block text-xs text-slate-400">Подпись<input value={selectedObject.label || ""} onChange={(event) => updateObject({ label: event.target.value })} className={FIELD_CLASS} /></label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="block text-xs text-slate-400">Ширина<input type="number" min={40} max={800} value={selectedObject.width} onChange={(event) => updateObject({ width: numberValue(event.target.value, selectedObject.width, 40, 800) })} className={FIELD_CLASS} /></label>
                  <label className="block text-xs text-slate-400">Высота<input type="number" min={30} max={500} value={selectedObject.height} onChange={(event) => updateObject({ height: numberValue(event.target.value, selectedObject.height, 30, 500) })} className={FIELD_CLASS} /></label>
                </div>
                <label className="block text-xs text-slate-400">Поворот, °<input type="number" min={-180} max={180} value={selectedObject.rotation || 0} onChange={(event) => updateObject({ rotation: numberValue(event.target.value, selectedObject.rotation || 0, -180, 180) })} className={FIELD_CLASS} /></label>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4 text-sm text-slate-400">
                Выберите блок или объект на холсте, чтобы изменить его параметры.
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>,
    document.body,
  );
}
