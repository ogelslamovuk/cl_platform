import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Konva from "konva";
import type { KonvaEventObject } from "konva/lib/Node";
import { Circle, Group, Layer, Line, Rect, Stage, Text } from "react-konva";
import { Maximize2, Minus, Plus } from "lucide-react";
import type { EventSeat, SeatStatus } from "@/lib/store";
import type { SeatMapBlockV2, SeatMapLayoutV2, SeatMapSeatV2 } from "@/lib/seatMapV2";
import { flattenSeatMapLayoutV2 } from "@/lib/seatMapV2";

type Variant = "light" | "dark";

type Props = {
  layout: SeatMapLayoutV2;
  eventSeats?: EventSeat[];
  selectedSeatIds?: string[];
  onSeatClick?: (seatId: string) => void;
  interactive?: boolean;
  allowUnavailableSelection?: boolean;
  variant?: Variant;
  className?: string;
  height?: number;
  compact?: boolean;
};

type HoveredSeat = {
  seat: SeatMapSeatV2;
  eventSeat?: EventSeat;
  sectorName: string;
  blockName: string;
  x: number;
  y: number;
};

const STATUS_TEXT: Record<SeatStatus, string> = {
  available: "Свободно",
  sold: "Продано",
  blocked: "Не в продаже",
};

const MIN_SCALE = 0.2;
const MAX_SCALE = 2.3;

function blockBounds(block: SeatMapBlockV2) {
  const seats = block.rows.flatMap((row) => row.seats);
  const minX = Math.min(...seats.map((seat) => seat.x - seat.radius), 0);
  const minY = Math.min(...seats.map((seat) => seat.y - seat.radius), 0);
  const maxX = Math.max(...seats.map((seat) => seat.x + seat.radius), 1);
  const maxY = Math.max(...seats.map((seat) => seat.y + seat.radius), 1);
  return { x: minX - 14, y: minY - 14, width: maxX - minX + 28, height: maxY - minY + 28 };
}

function seatFill(seat: SeatMapSeatV2, eventSeat: EventSeat | undefined, selected: boolean): string {
  if (selected) return "#06B6D4";
  if (eventSeat?.status === "sold") return "#64748B";
  if (eventSeat?.status === "blocked") return "#CBD5E1";
  return eventSeat?.color || seat.color || "#2563EB";
}

function statusOf(eventSeat: EventSeat | undefined): SeatStatus {
  return eventSeat?.status || "available";
}

export default function SeatMapViewerCanvas({
  layout,
  eventSeats = [],
  selectedSeatIds = [],
  onSeatClick,
  interactive = false,
  allowUnavailableSelection = false,
  variant = "light",
  className = "",
  height,
  compact = false,
}: Props) {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<Konva.Stage | null>(null);
  const [size, setSize] = useState({ width: 1, height: 1 });
  const [viewport, setViewport] = useState({ x: 0, y: 0, scale: 1 });
  const [hovered, setHovered] = useState<HoveredSeat | null>(null);
  const seatMap = useMemo(() => new Map(eventSeats.map((seat) => [seat.seatId, seat])), [eventSeats]);
  const selectedSet = useMemo(() => new Set(selectedSeatIds), [selectedSeatIds]);
  const v2Seats = useMemo(() => flattenSeatMapLayoutV2(layout), [layout]);
  const dark = variant === "dark";

  useEffect(() => {
    const node = canvasRef.current;
    if (!node) return;
    const measure = () => setSize({ width: Math.max(1, node.clientWidth), height: Math.max(1, node.clientHeight) });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const fitToView = useCallback(() => {
    const scale = Math.max(MIN_SCALE, Math.min(1.3, (size.width - 42) / layout.width, (size.height - 34) / layout.height));
    setViewport({
      scale,
      x: (size.width - layout.width * scale) / 2,
      y: (size.height - layout.height * scale) / 2,
    });
  }, [layout.height, layout.width, size.height, size.width]);

  useEffect(() => {
    fitToView();
  }, [fitToView, layout.layoutId]);

  const zoomAtCenter = (direction: 1 | -1) => {
    const nextScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, viewport.scale * (direction > 0 ? 1.15 : 0.87)));
    const center = { x: size.width / 2, y: size.height / 2 };
    const world = { x: (center.x - viewport.x) / viewport.scale, y: (center.y - viewport.y) / viewport.scale };
    setViewport({ scale: nextScale, x: center.x - world.x * nextScale, y: center.y - world.y * nextScale });
  };

  const handleWheel = (event: KonvaEventObject<WheelEvent>) => {
    event.evt.preventDefault();
    const stage = stageRef.current;
    const pointer = stage?.getPointerPosition();
    if (!pointer) return;
    const nextScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, viewport.scale * (event.evt.deltaY > 0 ? 0.92 : 1.08)));
    const world = { x: (pointer.x - viewport.x) / viewport.scale, y: (pointer.y - viewport.y) / viewport.scale };
    setViewport({ scale: nextScale, x: pointer.x - world.x * nextScale, y: pointer.y - world.y * nextScale });
  };

  const counts = v2Seats.reduce(
    (acc, seat) => {
      acc[statusOf(seatMap.get(seat.seatId))] += 1;
      return acc;
    },
    { available: 0, sold: 0, blocked: 0 } as Record<SeatStatus, number>,
  );

  const panelStyle = dark
    ? { background: "#07121F", borderColor: "rgba(125, 211, 252, 0.18)" }
    : { background: "#F8FAFC", borderColor: "#E2E8F0" };

  return (
    <section
      data-seat-map-v2-canvas={layout.layoutId}
      className={`flex min-h-0 flex-col overflow-hidden rounded-xl border ${className}`}
      style={{ ...panelStyle, height: height ? `${height}px` : undefined }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2" style={{ borderColor: dark ? "rgba(148,163,184,0.18)" : "#E2E8F0" }}>
        <div className="flex flex-wrap items-center gap-2 text-[11px]" style={{ color: dark ? "#CBD5E1" : "#475569" }}>
          <span className="rounded-full px-2 py-1 font-semibold" style={{ background: dark ? "rgba(37,99,235,0.16)" : "#EFF6FF", color: dark ? "#93C5FD" : "#1D4ED8" }}>
            SeatMap V2
          </span>
          <span>{v2Seats.length} мест</span>
          {!compact && <span>Свободно: {counts.available} · Продано: {counts.sold} · Блок: {counts.blocked}</span>}
        </div>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => zoomAtCenter(-1)} aria-label="Уменьшить масштаб" className="flex h-8 w-8 items-center justify-center rounded-md border bg-white/90 text-slate-600">
            <Minus size={14} />
          </button>
          <button type="button" onClick={fitToView} aria-label="Вписать схему" className="inline-flex h-8 items-center gap-1 rounded-md border bg-white/90 px-2 text-[11px] font-semibold text-slate-600">
            <Maximize2 size={13} /> Вписать
          </button>
          <button type="button" onClick={() => zoomAtCenter(1)} aria-label="Увеличить масштаб" className="flex h-8 w-8 items-center justify-center rounded-md border bg-white/90 text-slate-600">
            <Plus size={14} />
          </button>
        </div>
      </div>

      <div ref={canvasRef} className="relative min-h-[280px] flex-1 overflow-hidden">
        <Stage
          ref={stageRef}
          width={size.width}
          height={size.height}
          x={viewport.x}
          y={viewport.y}
          scaleX={viewport.scale}
          scaleY={viewport.scale}
          draggable
          onDragEnd={(event) => setViewport((prev) => ({ ...prev, x: event.target.x(), y: event.target.y() }))}
          onWheel={handleWheel}
        >
          <Layer>
            <Rect width={layout.width} height={layout.height} cornerRadius={26} fill={dark ? "#071827" : "#FFFFFF"} stroke={dark ? "#173047" : "#E2E8F0"} strokeWidth={2} />
            {layout.objects.map((object) => {
              if (object.type === "label") {
                return <Text key={object.id} x={object.x} y={object.y} width={object.width} text={object.label} align="center" fontSize={12} fontStyle="bold" fill={dark ? "#64748B" : "#94A3B8"} letterSpacing={2} />;
              }
              if (object.type === "aisle") {
                return <Rect key={object.id} x={object.x} y={object.y} width={object.width} height={object.height} cornerRadius={object.radius || 0} fill={object.fill} opacity={dark ? 0.25 : 0.8} />;
              }
              return (
                <Group key={object.id}>
                  <Rect x={object.x} y={object.y} width={object.width} height={object.height} cornerRadius={object.radius || 0} fill={object.fill} stroke={object.stroke} strokeWidth={2} shadowColor={dark ? "#000000" : "#94A3B8"} shadowBlur={object.type === "stage" ? 12 : 0} shadowOpacity={0.22} />
                  <Text x={object.x} y={object.y + object.height / 2 - 7} width={object.width} text={object.label} align="center" fontSize={object.type === "stage" ? 15 : 11} fontStyle="bold" fill={object.type === "stage" ? "#DBEAFE" : "#475569"} letterSpacing={object.type === "stage" ? 4 : 2} />
                </Group>
              );
            })}
            {layout.sectors.map((sector) => (
              <Group key={sector.id} x={sector.x} y={sector.y} rotation={sector.rotation}>
                <Text x={sector.labelX} y={sector.labelY} text={sector.name} fontSize={11} fontStyle="bold" fill={dark ? "#94A3B8" : "#64748B"} letterSpacing={2} />
                {sector.blocks.map((block) => {
                  const bounds = blockBounds(block);
                  return (
                    <Group key={block.id} x={block.x} y={block.y} rotation={block.rotation}>
                      <Rect
                        x={bounds.x}
                        y={bounds.y}
                        width={bounds.width}
                        height={bounds.height}
                        cornerRadius={14}
                        fill={dark ? "#0D2233" : "#F8FAFC"}
                        stroke={block.accent}
                        strokeWidth={1}
                        opacity={0.8}
                      />
                      <Text x={bounds.x + 5} y={bounds.y - 19} text={block.name} fontSize={10} fill={dark ? "#94A3B8" : "#64748B"} />
                      {block.rows.map((row) => (
                        <Group key={row.id}>
                          {row.seats.map((seat) => {
                            const eventSeat = seatMap.get(seat.seatId);
                            const status = statusOf(eventSeat);
                            const selected = selectedSet.has(seat.seatId);
                            const canClick = interactive && (allowUnavailableSelection || status === "available");
                            return (
                              <Group
                                key={seat.seatId}
                                onMouseEnter={(event) => {
                                  const pointer = stageRef.current?.getPointerPosition();
                                  if (pointer) setHovered({ seat, eventSeat, sectorName: sector.name, blockName: block.name, x: pointer.x, y: pointer.y });
                                  event.target.getStage()!.container().style.cursor = canClick ? "pointer" : "default";
                                }}
                                onMouseMove={() => {
                                  const pointer = stageRef.current?.getPointerPosition();
                                  if (pointer) setHovered((prev) => prev && prev.seat.seatId === seat.seatId ? { ...prev, x: pointer.x, y: pointer.y } : prev);
                                }}
                                onMouseLeave={(event) => {
                                  setHovered(null);
                                  event.target.getStage()!.container().style.cursor = "grab";
                                }}
                                onClick={() => canClick && onSeatClick?.(seat.seatId)}
                                onTap={() => canClick && onSeatClick?.(seat.seatId)}
                              >
                                {selected && <Circle x={seat.x} y={seat.y} radius={seat.radius + 4} stroke="#06B6D4" strokeWidth={2} />}
                                <Circle
                                  x={seat.x}
                                  y={seat.y}
                                  radius={seat.radius}
                                  fill={seatFill(seat, eventSeat, selected)}
                                  stroke={selected ? "#ECFEFF" : status === "available" ? "#FFFFFF" : "#475569"}
                                  strokeWidth={selected ? 2 : 1}
                                  shadowColor={status === "available" ? seat.color || "#2563EB" : "#64748B"}
                                  shadowBlur={status === "available" ? 4 : 0}
                                  shadowOpacity={0.28}
                                />
                                {status === "blocked" && (
                                  <Line points={[seat.x - 5, seat.y - 5, seat.x + 5, seat.y + 5, seat.x - 5, seat.y + 5, seat.x + 5, seat.y - 5]} stroke="#64748B" strokeWidth={1.2} />
                                )}
                              </Group>
                            );
                          })}
                        </Group>
                      ))}
                    </Group>
                  );
                })}
              </Group>
            ))}
          </Layer>
        </Stage>
        {hovered && (
          <div
            className="pointer-events-none absolute z-10 w-max max-w-[250px] rounded-lg bg-slate-950 px-3 py-2 text-xs text-white shadow-xl"
            style={{
              left: Math.min(Math.max(8, hovered.x + 12), Math.max(8, size.width - 255)),
              top: Math.max(8, hovered.y - 72),
            }}
          >
            <div className="font-semibold">{hovered.seat.label} · {hovered.blockName}</div>
            <div className="mt-1 text-slate-300">
              Ряд {hovered.seat.row}, место {hovered.seat.number} · {hovered.eventSeat?.tariffName || hovered.seat.tariffName || "Тариф не назначен"}
            </div>
            <div className="mt-1 flex items-center justify-between gap-3">
              <span>{hovered.eventSeat?.price ?? hovered.seat.price ?? 0} BYN</span>
              <span>{STATUS_TEXT[statusOf(hovered.eventSeat)]}</span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
