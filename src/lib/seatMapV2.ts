export type SeatMapBlockV2Type = "straight" | "diagonal" | "arc" | "balcony" | "box" | "openArea";
export type SeatMapSectorV2Type = "parterre" | "side" | "balcony" | "box" | "arena";
export type SeatMapObjectV2Type = "stage" | "pit" | "label" | "aisle";

export interface SeatMapSeatV2 {
  seatId: string;
  label: string;
  row: string;
  number: number;
  x: number;
  y: number;
  radius: number;
  tariffName?: string;
  price?: number;
  color?: string;
}

export interface SeatMapRowV2 {
  id: string;
  label: string;
  seats: SeatMapSeatV2[];
}

export interface SeatMapBlockV2 {
  id: string;
  name: string;
  type: SeatMapBlockV2Type;
  x: number;
  y: number;
  rotation: number;
  accent: string;
  rows: SeatMapRowV2[];
}

export interface SeatMapSectorV2 {
  id: string;
  name: string;
  type: SeatMapSectorV2Type;
  x: number;
  y: number;
  rotation: number;
  labelX: number;
  labelY: number;
  accent: string;
  blocks: SeatMapBlockV2[];
}

export interface SeatMapObjectV2 {
  id: string;
  type: SeatMapObjectV2Type;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  radius?: number;
  label?: string;
  fill?: string;
  stroke?: string;
}

export interface SeatMapLayoutV2 {
  version: 2;
  layoutId: string;
  name: string;
  style: "theatre" | "arena";
  width: number;
  height: number;
  objects: SeatMapObjectV2[];
  sectors: SeatMapSectorV2[];
}

export interface LegacySeatLike {
  seatId: string;
  label: string;
  row: string;
  number: number;
  x: number;
  y: number;
}

export const COMPLEX_THEATRE_LAYOUT_ID = "layout_grand_theatre_v2";

type TariffStyle = {
  name: string;
  price: number;
  color: string;
};

type BuildBlockOptions = {
  id: string;
  name: string;
  type: SeatMapBlockV2Type;
  x: number;
  y: number;
  rotation?: number;
  accent: string;
  rows: number;
  seatsPerRow: number;
  rowPrefix: string;
  tariffForRow: (rowIndex: number) => TariffStyle;
  seatGap?: number;
  rowGap?: number;
  indentForRow?: (rowIndex: number) => number;
};

const VIP: TariffStyle = { name: "VIP", price: 180, color: "#F59E0B" };
const PARTERRE: TariffStyle = { name: "Партер", price: 110, color: "#2563EB" };
const BALCONY: TariffStyle = { name: "Балкон", price: 65, color: "#7C3AED" };
const BOX: TariffStyle = { name: "Ложа", price: 240, color: "#EA580C" };

function buildBlock(options: BuildBlockOptions): SeatMapBlockV2 {
  const seatGap = options.seatGap ?? 27;
  const rowGap = options.rowGap ?? 29;
  return {
    id: options.id,
    name: options.name,
    type: options.type,
    x: options.x,
    y: options.y,
    rotation: options.rotation ?? 0,
    accent: options.accent,
    rows: Array.from({ length: options.rows }, (_, rowIndex) => {
      const row = `${options.rowPrefix}${rowIndex + 1}`;
      const tariff = options.tariffForRow(rowIndex);
      const indent = options.indentForRow?.(rowIndex) ?? 0;
      return {
        id: `${options.id}-${row}`,
        label: row,
        seats: Array.from({ length: options.seatsPerRow }, (_, seatIndex) => ({
          seatId: `${COMPLEX_THEATRE_LAYOUT_ID}-${options.id}-${row}-${seatIndex + 1}`,
          label: `${row}-${seatIndex + 1}`,
          row,
          number: seatIndex + 1,
          x: indent + seatIndex * seatGap,
          y: rowIndex * rowGap,
          radius: 9,
          tariffName: tariff.name,
          price: tariff.price,
          color: tariff.color,
        })),
      };
    }),
  };
}

export function createGrandTheatreLayoutV2(): SeatMapLayoutV2 {
  const central = buildBlock({
    id: "parterre-center",
    name: "Центральный партер",
    type: "straight",
    x: 414,
    y: 244,
    accent: "#2563EB",
    rows: 9,
    seatsPerRow: 12,
    rowPrefix: "P",
    tariffForRow: (row) => (row < 3 ? VIP : PARTERRE),
    indentForRow: (row) => Math.abs(4 - row) * 3,
  });
  const leftWing = buildBlock({
    id: "parterre-left",
    name: "Левый партер",
    type: "diagonal",
    x: 164,
    y: 286,
    rotation: -10,
    accent: "#38BDF8",
    rows: 8,
    seatsPerRow: 5,
    rowPrefix: "L",
    tariffForRow: (row) => (row < 2 ? VIP : PARTERRE),
    indentForRow: (row) => row * 4,
  });
  const rightWing = buildBlock({
    id: "parterre-right",
    name: "Правый партер",
    type: "diagonal",
    x: 900,
    y: 263,
    rotation: 10,
    accent: "#38BDF8",
    rows: 8,
    seatsPerRow: 5,
    rowPrefix: "R",
    tariffForRow: (row) => (row < 2 ? VIP : PARTERRE),
  });
  const balcony = buildBlock({
    id: "balcony-center",
    name: "Балкон",
    type: "balcony",
    x: 286,
    y: 635,
    accent: "#8B5CF6",
    rows: 4,
    seatsPerRow: 18,
    rowPrefix: "B",
    tariffForRow: () => BALCONY,
    indentForRow: (row) => (3 - row) * 11,
  });
  const leftBoxUpper = buildBlock({
    id: "box-left-1",
    name: "Ложа L1",
    type: "box",
    x: 78,
    y: 185,
    rotation: -5,
    accent: "#F97316",
    rows: 2,
    seatsPerRow: 4,
    rowPrefix: "Л1.",
    tariffForRow: () => BOX,
    seatGap: 25,
  });
  const leftBoxLower = buildBlock({
    id: "box-left-2",
    name: "Ложа L2",
    type: "box",
    x: 75,
    y: 402,
    rotation: -5,
    accent: "#F97316",
    rows: 2,
    seatsPerRow: 4,
    rowPrefix: "Л2.",
    tariffForRow: () => BOX,
    seatGap: 25,
  });
  const rightBoxUpper = buildBlock({
    id: "box-right-1",
    name: "Ложа R1",
    type: "box",
    x: 1030,
    y: 174,
    rotation: 5,
    accent: "#F97316",
    rows: 2,
    seatsPerRow: 4,
    rowPrefix: "П1.",
    tariffForRow: () => BOX,
    seatGap: 25,
  });
  const rightBoxLower = buildBlock({
    id: "box-right-2",
    name: "Ложа R2",
    type: "box",
    x: 1030,
    y: 392,
    rotation: 5,
    accent: "#F97316",
    rows: 2,
    seatsPerRow: 4,
    rowPrefix: "П2.",
    tariffForRow: () => BOX,
    seatGap: 25,
  });

  return {
    version: 2,
    layoutId: COMPLEX_THEATRE_LAYOUT_ID,
    name: "Grand Theatre V2",
    style: "theatre",
    width: 1220,
    height: 790,
    objects: [
      { id: "stage", type: "stage", x: 358, y: 38, width: 504, height: 92, radius: 42, label: "СЦЕНА", fill: "#172554", stroke: "#60A5FA" },
      { id: "pit", type: "pit", x: 424, y: 148, width: 372, height: 42, radius: 22, label: "ОРКЕСТРОВАЯ ЯМА", fill: "#DBEAFE", stroke: "#93C5FD" },
      { id: "balcony-band", type: "aisle", x: 214, y: 602, width: 793, height: 8, radius: 4, fill: "#DDD6FE" },
      { id: "entrance-label", type: "label", x: 536, y: 752, width: 150, height: 18, label: "ВХОД / ФОЙЕ" },
    ],
    sectors: [
      { id: "parterre", name: "ПАРТЕР", type: "parterre", x: 0, y: 0, rotation: 0, labelX: 566, labelY: 208, accent: "#2563EB", blocks: [central, leftWing, rightWing] },
      { id: "balcony", name: "БАЛКОН", type: "balcony", x: 0, y: 0, rotation: 0, labelX: 565, labelY: 574, accent: "#8B5CF6", blocks: [balcony] },
      { id: "left-boxes", name: "ЛОЖИ L", type: "box", x: 0, y: 0, rotation: 0, labelX: 73, labelY: 145, accent: "#F97316", blocks: [leftBoxUpper, leftBoxLower] },
      { id: "right-boxes", name: "ЛОЖИ R", type: "box", x: 0, y: 0, rotation: 0, labelX: 1030, labelY: 134, accent: "#F97316", blocks: [rightBoxUpper, rightBoxLower] },
    ],
  };
}

export function flattenSeatMapLayoutV2(layout: SeatMapLayoutV2): SeatMapSeatV2[] {
  return layout.sectors.flatMap((sector) => sector.blocks.flatMap((block) => block.rows.flatMap((row) => row.seats)));
}

export function countSeatMapLayoutV2Seats(layout: SeatMapLayoutV2): number {
  return flattenSeatMapLayoutV2(layout).length;
}

export function cloneSeatMapLayoutV2(layout: SeatMapLayoutV2): SeatMapLayoutV2 {
  return {
    ...layout,
    objects: layout.objects.map((object) => ({ ...object })),
    sectors: layout.sectors.map((sector) => ({
      ...sector,
      blocks: sector.blocks.map((block) => ({
        ...block,
        rows: block.rows.map((row) => ({
          ...row,
          seats: row.seats.map((seat) => ({ ...seat })),
        })),
      })),
    })),
  };
}

export function adaptLegacySeatsToLayoutV2(layoutId: string, name: string, seats: LegacySeatLike[]): SeatMapLayoutV2 {
  const maxX = Math.max(1, ...seats.map((seat) => seat.x + 1));
  const maxY = Math.max(1, ...seats.map((seat) => seat.y + 1));
  const rows = new Map<string, SeatMapSeatV2[]>();
  seats.forEach((seat) => {
    const target = rows.get(seat.row) || [];
    target.push({
      seatId: seat.seatId,
      label: seat.label,
      row: seat.row,
      number: seat.number,
      x: seat.x * 29,
      y: seat.y * 30,
      radius: 9,
    });
    rows.set(seat.row, target);
  });
  return {
    version: 2,
    layoutId,
    name,
    style: "theatre",
    width: Math.max(420, maxX * 29 + 120),
    height: Math.max(340, maxY * 30 + 180),
    objects: [
      { id: `${layoutId}-stage`, type: "stage", x: 60, y: 28, width: Math.max(260, maxX * 29), height: 54, radius: 28, label: "СЦЕНА", fill: "#E2E8F0", stroke: "#94A3B8" },
    ],
    sectors: [{
      id: `${layoutId}-sector`,
      name: "ЗАЛ",
      type: "parterre",
      x: 60,
      y: 122,
      rotation: 0,
      labelX: 60,
      labelY: 96,
      accent: "#2563EB",
      blocks: [{
        id: `${layoutId}-block`,
        name: "Основной блок",
        type: "straight",
        x: 0,
        y: 0,
        rotation: 0,
        accent: "#2563EB",
        rows: Array.from(rows.entries()).map(([label, rowSeats]) => ({
          id: `${layoutId}-row-${label}`,
          label,
          seats: rowSeats,
        })),
      }],
    }],
  };
}
