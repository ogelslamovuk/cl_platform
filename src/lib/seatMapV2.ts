export type SeatMapBlockV2Type = "straight" | "diagonal" | "arc" | "balcony" | "box" | "openArea";
export type SeatMapSectorV2Type = "parterre" | "side" | "balcony" | "box" | "arena";
export type SeatMapObjectV2Type = "stage" | "pit" | "arena" | "label" | "aisle";

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
  rowSpacing?: number;
  seatSpacing?: number;
  tariffName?: string;
  price?: number;
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
export const MAX_COMPLEX_LAYOUT_SEATS = 500;
export type SeatMapConstructorBlockType = Extract<SeatMapBlockV2Type, "straight" | "diagonal" | "balcony" | "box">;

type TariffStyle = {
  name: string;
  price: number;
  color: string;
};

type BuildBlockOptions = {
  layoutId?: string;
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
  const firstTariff = options.tariffForRow(0);
  return {
    id: options.id,
    name: options.name,
    type: options.type,
    x: options.x,
    y: options.y,
    rotation: options.rotation ?? 0,
    accent: options.accent,
    rowSpacing: rowGap,
    seatSpacing: seatGap,
    tariffName: firstTariff.name,
    price: firstTariff.price,
    rows: Array.from({ length: options.rows }, (_, rowIndex) => {
      const row = `${options.rowPrefix}${rowIndex + 1}`;
      const tariff = options.tariffForRow(rowIndex);
      const indent = options.indentForRow?.(rowIndex) ?? 0;
      return {
        id: `${options.id}-${row}`,
        label: row,
        seats: Array.from({ length: options.seatsPerRow }, (_, seatIndex) => ({
          seatId: `${options.layoutId || COMPLEX_THEATRE_LAYOUT_ID}-${options.id}-${row}-${seatIndex + 1}`,
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
    name: "Большая концертная сцена",
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

export function flattenSeatMapLayoutV2ToLegacySeats(layout: SeatMapLayoutV2): Array<LegacySeatLike & { w: number; h: number }> {
  return flattenSeatMapLayoutV2(layout).map((seat, index) => ({
    seatId: seat.seatId,
    label: seat.label,
    row: seat.row,
    number: seat.number,
    x: index % 20,
    y: Math.floor(index / 20),
    w: 1,
    h: 1,
  }));
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

type ConstructorTariff = TariffStyle & { id: string };

export const CONSTRUCTOR_TARIFFS: ConstructorTariff[] = [
  { id: "standard", name: "Стандарт", price: 70, color: "#2563EB" },
  { id: "premium", name: "Премиум", price: 120, color: "#8B5CF6" },
  { id: "vip", name: "VIP", price: 180, color: "#F59E0B" },
  { id: "box", name: "Ложа", price: 240, color: "#EA580C" },
];

export type SeatMapConstructorBlockSettings = {
  name: string;
  rows: number;
  seatsPerRow: number;
  rowSpacing: number;
  seatSpacing: number;
  rotation: number;
  tariffId: string;
};

type ConstructorTemplate = {
  name: string;
  sectorId: string;
  sectorName: string;
  sectorType: SeatMapSectorV2Type;
  labelX: number;
  labelY: number;
  accent: string;
  x: number;
  y: number;
  rotation: number;
  rows: number;
  seatsPerRow: number;
  rowPrefix: string;
  tariffId: string;
};

const CONSTRUCTOR_TEMPLATES: Record<SeatMapConstructorBlockType, ConstructorTemplate> = {
  straight: {
    name: "Центральный партер",
    sectorId: "constructor-parterre",
    sectorName: "ПАРТЕР",
    sectorType: "parterre",
    labelX: 560,
    labelY: 212,
    accent: "#2563EB",
    x: 452,
    y: 258,
    rotation: 0,
    rows: 6,
    seatsPerRow: 10,
    rowPrefix: "P",
    tariffId: "standard",
  },
  diagonal: {
    name: "Боковой сектор",
    sectorId: "constructor-side",
    sectorName: "БОКОВЫЕ СЕКТОРА",
    sectorType: "side",
    labelX: 48,
    labelY: 212,
    accent: "#38BDF8",
    x: 148,
    y: 284,
    rotation: -12,
    rows: 5,
    seatsPerRow: 5,
    rowPrefix: "S",
    tariffId: "premium",
  },
  balcony: {
    name: "Балкон",
    sectorId: "constructor-balcony",
    sectorName: "БАЛКОН",
    sectorType: "balcony",
    labelX: 570,
    labelY: 578,
    accent: "#8B5CF6",
    x: 374,
    y: 622,
    rotation: 0,
    rows: 3,
    seatsPerRow: 15,
    rowPrefix: "B",
    tariffId: "premium",
  },
  box: {
    name: "Ложа",
    sectorId: "constructor-boxes",
    sectorName: "ЛОЖИ",
    sectorType: "box",
    labelX: 62,
    labelY: 155,
    accent: "#F97316",
    x: 82,
    y: 205,
    rotation: -5,
    rows: 1,
    seatsPerRow: 5,
    rowPrefix: "Л",
    tariffId: "box",
  },
};

function constructorTariff(tariffId: string): ConstructorTariff {
  return CONSTRUCTOR_TARIFFS.find((tariff) => tariff.id === tariffId) || CONSTRUCTOR_TARIFFS[0];
}

function constructorBlockCount(layout: SeatMapLayoutV2, type: SeatMapConstructorBlockType): number {
  return layout.sectors.flatMap((sector) => sector.blocks).filter((block) => block.type === type).length;
}

function buildConstructorBlock(
  layout: SeatMapLayoutV2,
  type: SeatMapConstructorBlockType,
  id: string,
  settings: SeatMapConstructorBlockSettings,
  x: number,
  y: number,
): SeatMapBlockV2 {
  const template = CONSTRUCTOR_TEMPLATES[type];
  const tariff = constructorTariff(settings.tariffId);
  return buildBlock({
    layoutId: layout.layoutId,
    id,
    name: settings.name,
    type,
    x,
    y,
    rotation: settings.rotation,
    accent: tariff.color || template.accent,
    rows: type === "box" ? 1 : settings.rows,
    seatsPerRow: settings.seatsPerRow,
    rowPrefix: template.rowPrefix,
    tariffForRow: () => tariff,
    seatGap: settings.seatSpacing,
    rowGap: settings.rowSpacing,
    indentForRow: type === "balcony" ? (row) => Math.max(0, settings.rows - row - 1) * 8 : undefined,
  });
}

export function createConstructorLayoutV2(layoutId: string, name: string): SeatMapLayoutV2 {
  const base: SeatMapLayoutV2 = {
    version: 2,
    layoutId,
    name,
    style: "theatre",
    width: 1220,
    height: 790,
    objects: [{
      id: `${layoutId}-object-stage`,
      type: "stage",
      x: 388,
      y: 46,
      width: 444,
      height: 84,
      radius: 40,
      label: "СЦЕНА",
      fill: "#172554",
      stroke: "#60A5FA",
    }],
    sectors: [],
  };
  return addConstructorBlockV2(base, "straight");
}

export function addConstructorBlockV2(layout: SeatMapLayoutV2, type: SeatMapConstructorBlockType): SeatMapLayoutV2 {
  const template = CONSTRUCTOR_TEMPLATES[type];
  const count = constructorBlockCount(layout, type);
  let number = count + 1;
  const blocks = layout.sectors.flatMap((sector) => sector.blocks);
  while (blocks.some((block) => block.id === `${type}-${number}`)) number += 1;
  const id = `${type}-${number}`;
  const settings: SeatMapConstructorBlockSettings = {
    name: count === 0 ? template.name : `${template.name} ${number}`,
    rows: template.rows,
    seatsPerRow: template.seatsPerRow,
    rowSpacing: 29,
    seatSpacing: 27,
    rotation: type === "diagonal" && count % 2 === 1 ? Math.abs(template.rotation) : template.rotation,
    tariffId: template.tariffId,
  };
  const offsetX = type === "diagonal" ? (count % 2 === 1 ? 730 : 0) : count * 34;
  const offsetY = type === "box" ? count * 94 : count * 32;
  const block = buildConstructorBlock(layout, type, id, settings, template.x + offsetX, template.y + offsetY);
  const sector = layout.sectors.find((item) => item.id === template.sectorId);
  if (sector) {
    return {
      ...layout,
      sectors: layout.sectors.map((item) => item.id === sector.id ? { ...item, blocks: [...item.blocks, block] } : item),
    };
  }
  return {
    ...layout,
    sectors: [...layout.sectors, {
      id: template.sectorId,
      name: template.sectorName,
      type: template.sectorType,
      x: 0,
      y: 0,
      rotation: 0,
      labelX: template.labelX,
      labelY: template.labelY,
      accent: template.accent,
      blocks: [block],
    }],
  };
}

export function getConstructorBlockSettings(block: SeatMapBlockV2): SeatMapConstructorBlockSettings {
  const firstSeat = block.rows[0]?.seats[0];
  const tariff = CONSTRUCTOR_TARIFFS.find((item) => item.name === (block.tariffName || firstSeat?.tariffName));
  return {
    name: block.name,
    rows: Math.max(1, block.rows.length),
    seatsPerRow: Math.max(1, block.rows[0]?.seats.length || 1),
    rowSpacing: block.rowSpacing || 29,
    seatSpacing: block.seatSpacing || 27,
    rotation: block.rotation,
    tariffId: tariff?.id || "standard",
  };
}

export function updateConstructorBlockV2(
  layout: SeatMapLayoutV2,
  blockId: string,
  patch: Partial<SeatMapConstructorBlockSettings> & Partial<Pick<SeatMapBlockV2, "x" | "y">>,
): SeatMapLayoutV2 {
  return {
    ...layout,
    sectors: layout.sectors.map((sector) => ({
      ...sector,
      blocks: sector.blocks.map((block) => {
        if (block.id !== blockId || !["straight", "diagonal", "balcony", "box"].includes(block.type)) return block;
        const settings = { ...getConstructorBlockSettings(block), ...patch };
        return buildConstructorBlock(
          layout,
          block.type as SeatMapConstructorBlockType,
          block.id,
          settings,
          patch.x ?? block.x,
          patch.y ?? block.y,
        );
      }),
    })),
  };
}

export function removeConstructorBlockV2(layout: SeatMapLayoutV2, blockId: string): SeatMapLayoutV2 {
  return {
    ...layout,
    sectors: layout.sectors
      .map((sector) => ({ ...sector, blocks: sector.blocks.filter((block) => block.id !== blockId) }))
      .filter((sector) => sector.blocks.length > 0),
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
