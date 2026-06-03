import { normalizePlatformCommissionPercent } from "@/lib/finance";
import {
  COMPLEX_THEATRE_LAYOUT_ID,
  adaptLegacySeatsToLayoutV2,
  cloneSeatMapLayoutV2,
  createGrandTheatreLayoutV2,
  flattenSeatMapLayoutV2,
  flattenSeatMapLayoutV2ToLegacySeats,
  type SeatMapLayoutV2,
} from "@/lib/seatMapV2";

// TicketHub MVP State Management — localStorage based

export type Role = "organizer" | "regulator" | "tickethub" | "channel" | "b2c";
export type Channel = "OWN" | "ByCard" | "TicketPro" | "KvitkiBY" | "SellerPOS";
export type AppStatus = "draft" | "submitted" | "approved" | "rejected";
export type ReviewStatus = "draft" | "submitted" | "in_review" | "approved" | "rejected" | "needs_rework";
export type EventStatus = "approved" | "published";
export type TicketStatus = "issued" | "sold" | "refunded" | "redeemed";
export type OpType = "sell" | "refund" | "redeem" | "verify";
export type OpResult = "ok" | "error";
export type ResellerStatus = "active" | "disabled";
export type ResellerContractStatus = "Active" | "Suspended" | "Draft";
export const OWN_SALES_CHANNEL = "OWN";
export const OWN_SALES_CHANNEL_LABEL = "Свой канал";

export interface PriceTier {
  name: string;
  price: number;
  quantity: number;
  color?: string;
}

export type SeatStatus = "available" | "sold" | "blocked";

export interface SeatMapSeat {
  seatId: string;
  label: string;
  row: string;
  number: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface SeatMapHall {
  hallId: string;
  venueId: string;
  name: string;
  capacity: number;
  hasSeatMap: boolean;
  layoutId?: string;
}

export interface SeatMapLayout {
  layoutId: string;
  venueId: string;
  hallId: string;
  name: string;
  seats: SeatMapSeat[];
  layoutV2?: SeatMapLayoutV2;
  createdAt: string;
  updatedAt: string;
}

export interface VenueRegistryRecord {
  venueId: string;
  name: string;
  city: string;
  region: string;
  type: "концертный зал" | "театр" | "центр культуры" | "open-air" | "временная площадка";
  address: string;
  description: string;
  capacity: number;
  status: "approved" | "draft";
  halls: SeatMapHall[];
}

export interface EventSeat extends SeatMapSeat {
  tariffId?: string;
  tariffName?: string;
  price?: number;
  color?: string;
  baseTariffId?: string;
  baseTariffName?: string;
  basePrice?: number;
  baseColor?: string;
  isIndividualOverride?: boolean;
  status: SeatStatus;
}

export interface Application {
  appId: string;
  organizerId: string;
  title: string;
  venue: string;
  dateTime: string;
  capacity: number;
  tiers: PriceTier[];
  city: string;
  category: string;
  description: string;
  poster: string;
  status: AppStatus;
  licenseId?: string;
  eventId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EventRecord {
  eventId: string;
  organizerId: string;
  licenseId: string;
  appId: string;
  complianceApplicationId?: string;
  title: string;
  venue: string;
  dateTime: string;
  capacity: number;
  tiers: PriceTier[];
  city: string;
  category: string;
  description: string;
  poster: string;
  salesChannels: string[];
  status: EventStatus;
  remaining: number;
  venueId?: string;
  hallId?: string;
  layoutId?: string;
  eventSeats?: EventSeat[];
  createdAt: string;
  updatedAt: string;
}

export interface Ticket {
  ticketId: string;
  eventId: string;
  tier: string;
  status: TicketStatus;
  soldByChannel?: string;
  soldToUserId?: string;
  seatId?: string;
  seatLabel?: string;
  row?: string;
  seatNumber?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Reseller {
  resellerId: string;
  name: string;
  code: string;
  status: ResellerStatus;
  apiConnected: boolean;
  contractStatus: ResellerContractStatus;
  commissionPercent: number;
  fullName?: string;
  registrationNumber?: string;
  legalAddress?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  contractNumber?: string;
  contractDate?: string;
  apiEndpoint?: string;
  webhookEndpoint?: string;
  signatureValidation?: boolean;
  lastSync?: string;
  updatedAt: string;
}

export interface OpRecord {
  opId: string;
  type: OpType;
  ticketId?: string;
  eventId: string;
  channel: string;
  result: OpResult;
  reason?: string;
  ts: string;
}

export interface DemoUser {
  userId: string;
  name: string;
}

export interface DemoPurchaseTicket {
  ticketId: string;
  eventId: string;
  eventTitle: string;
  date: string;
  time: string;
  city: string;
  venue: string;
  buyerName: string;
  selectedPriceCategory: string;
  quantity: number;
  seatId?: string;
  seatLabel?: string;
  row?: string;
  seatNumber?: number;
  purchasedAt: string;
  status: "confirmed" | "refunded";
}

export interface OrganizerAccount {
  organizerId: string;
  login: string;
  password: string;
  name: string;
  fullName: string;
  unp: string;
  registryStatus: "зарегистрирован в реестре" | "ожидает включения";
  registryRegisteredAt: string | null;
  director: string;
  email: string;
  phone: string;
  accountStatus: "активен" | "pending";
  feesStatus: "оплачены";
}

export type CompliancePaymentStatus = "Ожидает оплаты" | "Недостаточно средств" | "Оплачено";

export interface OrganizerFinanceOperation {
  financeOperationId: string;
  organizerId: string;
  eventComplianceApplicationId?: string;
  kind: "Пополнение счёта" | "Оплата пошлины" | "Формирование квитанции";
  title: string;
  amount: number;
  createdAt: string;
  status: "успешно" | "сформировано";
  receiptId?: string;
}

export interface OrganizerFinanceReceipt {
  receiptId: string;
  organizerId: string;
  eventComplianceApplicationId?: string;
  number: string;
  title: string;
  amount: number;
  createdAt: string;
  status: "сформирована" | "оплачена";
}

export interface FinanceState {
  platformCommissionPercent: number;
  organizerBalances: Record<string, number>;
  organizerOperations: OrganizerFinanceOperation[];
  organizerReceipts: OrganizerFinanceReceipt[];
}

export interface MockAttachment {
  attachmentId: string;
  name: string;
  kind: string;
  uploadedAt: string;
  isSample?: boolean;
}

export interface IdentityRecord {
  fullName: string;
  docType: string;
  docNumber: string;
  issueDate: string;
  issueAuthority: string;
}

export interface OrganizerApplicationData {
  legalName: string;
  registrationNumber: string;
  postalCode: string;
  region: string;
  locality: string;
  street: string;
  houseNumber: string;
  roomTypeAndNumber: string;
  addressExtra: string;
  contactPhone: string;
  website: string;
  email: string;
  ownershipType: "private" | "state" | "mixed";
  director: IdentityRecord;
  workers: IdentityRecord[];
  founders: IdentityRecord[];
  activities: string[];
  activityOther: string;
  pastEventsDescription: string;
  pastMaterials: MockAttachment[];
  documents: MockAttachment[];
  confirmations: { isAccurate: boolean; adminReviewConsent: boolean };
  accountCredentials: { login: string; password: string };
}

export interface OrganizerApplicationRecord {
  organizerApplicationId: string;
  organizerId: string;
  status: ReviewStatus;
  submittedAt: string | null;
  reviewedAt: string | null;
  adminComment: string;
  data: OrganizerApplicationData;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizerRegistryRecord {
  organizerRegistryId: string;
  organizerId: string;
  internalNumber: string;
  includedAt: string;
}

export interface EventPerformer {
  name: string;
  performerType: "solo" | "group";
  country: string;
  representative: string;
  comment: string;
  documentStatus?: string;
  documentNote?: string;
}

export interface EventInteragencyCheck {
  checkId: string;
  agency: string;
  subject: string;
  status: "Не отправлено" | "Отправлено" | "В обработке" | "Проверено" | "Требует уточнения";
  updatedAt: string;
}

export interface EventComplianceData {
  title: string;
  eventType: string;
  eventTypePath?: string[];
  shortDescription: string;
  program: string;
  posterPath: string;
  salesChannels: string[];
  dateSlots: string[];
  venueName: string;
  venueAddress: string;
  venueId?: string;
  hallId?: string;
  layoutId?: string;
  eventSeats?: EventSeat[];
  performers: EventPerformer[];
  onlyBelarusianPerformers: boolean;
  hasForeignPerformers: boolean;
  venueType: string;
  projectedCapacity: number | null;
  plannedTicketsForSale: number | null;
  ticketTiers: PriceTier[];
  ageCategory: "0+" | "6+" | "12+" | "16+" | "18+";
  ageComment: string;
  approvalMode: "certificate_required" | "notice_only" | "certificate_not_required";
  approvalBasis: string;
  eventDocuments: MockAttachment[];
  venueContractStatus?: "приложен" | "требуется" | "образец";
  interagencyChecks?: EventInteragencyCheck[];
  wizardLastStep?: number;
  salesStartDate: string;
  feeExempt: boolean;
  feeExemptReason: string;
  feePaid: boolean;
  paymentAttachments: MockAttachment[];
  paymentComment: string;
  adRestrictionConfirmed: boolean;
  cancelled: boolean;
  changesDeclared: boolean;
  executiveCommitteeNotified: boolean;
  citizensNotified: boolean;
  notificationsAttachment: MockAttachment[];
  cancellationComment: string;
}

export interface EventComplianceApplicationRecord {
  eventComplianceApplicationId: string;
  organizerId: string;
  status: ReviewStatus;
  submittedAt: string | null;
  reviewedAt: string | null;
  adminComment: string;
  feePaymentConfirmedByAdmin: boolean;
  certificateNumber: string;
  certificateDate: string;
  linkedLegacyAppId: string | null;
  linkedEventId: string | null;
  data: EventComplianceData;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizerDocument {
  documentId: string;
  organizerId: string;
  title: string;
  type: string;
  updatedAt: string;
  status: "доступен";
}

export interface AppState {
  meta: { version: string; updatedAt: string };
  counters: { app: number; lic: number; evt: number; tck: number; op: number };
  finance: FinanceState;
  applications: Application[];
  organizerApplications: OrganizerApplicationRecord[];
  eventComplianceApplications: EventComplianceApplicationRecord[];
  organizerRegistry: OrganizerRegistryRecord[];
  venueRegistry: VenueRegistryRecord[];
  seatMapLayouts: SeatMapLayout[];
  events: EventRecord[];
  tickets: Ticket[];
  resellers: Reseller[];
  demoPurchases: DemoPurchaseTicket[];
  ops: OpRecord[];
  users: DemoUser[];
  organizers: OrganizerAccount[];
  organizerDocuments: OrganizerDocument[];
  currentOrganizerId: string | null;
  ui: { selectedRole: Role; selectedChannel: Channel };
}

const STORAGE_KEY = "ticket_hub_state_v1";
const LEGACY_DEFAULT_ORGANIZER_ID = "org_demo_1";
export const DEMO_BASE_UNIT_AMOUNT = 42;
export const DEMO_TOP_UP_AMOUNT = 2000;
let suppressPersistence = false;

const DEFAULT_RESELLERS: Omit<Reseller, "updatedAt">[] = [
  {
    resellerId: "reseller_bycard",
    name: "ByCard",
    code: "ByCard",
    status: "active",
    apiConnected: true,
    contractStatus: "Active",
    commissionPercent: 8,
    fullName: "ООО «ByCard Tickets»",
    registrationNumber: "193000111",
    legalAddress: "220030, г. Минск, пр-т Независимости, 18, офис 42",
    contactPerson: "Анна Романова",
    email: "partner@bycard.example",
    phone: "+375 (29) 700-10-10",
    contractNumber: "TH-BC-2026-01",
    contractDate: "2026-01-15",
    apiEndpoint: "https://sandbox.api.bycard.example/v2/tickethub",
    webhookEndpoint: "https://sandbox.bycard.example/webhooks/tickethub",
    signatureValidation: true,
    lastSync: "2026-05-10T09:20:00",
  },
  {
    resellerId: "reseller_ticketpro",
    name: "TicketPro",
    code: "TicketPro",
    status: "active",
    apiConnected: true,
    contractStatus: "Active",
    commissionPercent: 10,
    fullName: "ЗАО «TicketPro Беларусь»",
    registrationNumber: "193000222",
    legalAddress: "220004, г. Минск, ул. Немига, 5, помещение 12",
    contactPerson: "Сергей Ковалёв",
    email: "integration@ticketpro.example",
    phone: "+375 (33) 700-20-20",
    contractNumber: "TH-TP-2026-02",
    contractDate: "2026-02-01",
    apiEndpoint: "https://sandbox.api.ticketpro.example/v2/tickethub",
    webhookEndpoint: "https://sandbox.ticketpro.example/webhooks/tickethub",
    signatureValidation: true,
    lastSync: "2026-05-10T09:25:00",
  },
  {
    resellerId: "reseller_kvitki_by",
    name: "Kvitki.by",
    code: "KvitkiBY",
    status: "active",
    apiConnected: true,
    contractStatus: "Active",
    commissionPercent: 8,
    fullName: "ООО «Квитки Бай»",
    registrationNumber: "193000444",
    legalAddress: "220030, г. Минск, ул. Кирова, 8, офис 12",
    contactPerson: "Елена Соколова",
    email: "integration@kvitki.example",
    phone: "+375 (29) 700-40-40",
    contractNumber: "TH-KV-2026-03",
    contractDate: "2026-03-01",
    apiEndpoint: "https://sandbox.api.kvitki.example/v2/tickethub",
    webhookEndpoint: "https://sandbox.kvitki.example/webhooks/tickethub",
    signatureValidation: true,
    lastSync: "2026-05-10T09:30:00",
  },
  {
    resellerId: "reseller_legacy_seller",
    name: "Legacy Seller",
    code: "LegacySeller",
    status: "disabled",
    apiConnected: false,
    contractStatus: "Suspended",
    commissionPercent: 6,
    fullName: "ООО «Legacy Seller»",
    registrationNumber: "193000333",
    legalAddress: "220050, г. Минск, ул. Сторожевая, 9",
    contactPerson: "Демо-менеджер",
    email: "legacy@example",
    phone: "+375 (17) 700-30-30",
    contractNumber: "TH-LS-2025-11",
    contractDate: "2025-11-20",
    apiEndpoint: "https://sandbox.api.legacyseller.example/v2/tickethub",
    webhookEndpoint: "https://sandbox.legacyseller.example/webhooks/tickethub",
    signatureValidation: false,
    lastSync: "2026-05-01T08:00:00",
  },
];

const ORGANIZER_DOCUMENT_TEMPLATES: Omit<OrganizerDocument, "organizerId" | "updatedAt">[] = [
  { documentId: "DOC-001", title: "Выписка из реестра организаторов", type: "реестр", status: "доступен" },
  { documentId: "DOC-002", title: "Устав организации", type: "устав", status: "доступен" },
  { documentId: "DOC-003", title: "Договор с платформой TicketHub", type: "договор", status: "доступен" },
  { documentId: "DOC-004", title: "Регистрационные данные", type: "регистрация", status: "доступен" },
  { documentId: "DOC-005", title: "Реквизиты", type: "реквизиты", status: "доступен" },
];

export const SEAT_TARIFF_COLORS = ["#2563EB", "#16A34A", "#D97706", "#7C3AED", "#DC2626", "#0891B2"];
export const DEFAULT_COMPLIANCE_TICKET_TIERS: PriceTier[] = [
  { name: "Стандарт", price: 100, quantity: 0, color: SEAT_TARIFF_COLORS[0] },
  { name: "Премиум", price: 150, quantity: 0, color: SEAT_TARIFF_COLORS[1] },
  { name: "VIP", price: 200, quantity: 0, color: SEAT_TARIFF_COLORS[2] },
  { name: "Льготный (пример)", price: 50, quantity: 0, color: SEAT_TARIFF_COLORS[3] },
];

export function createRectangularSeats(prefix: string, rows: number, cols: number): SeatMapSeat[] {
  const safeRows = Math.max(1, Math.min(20, Math.floor(rows || 1)));
  const safeCols = Math.max(1, Math.min(30, Math.floor(cols || 1)));
  const seats: SeatMapSeat[] = [];
  for (let rowIndex = 0; rowIndex < safeRows; rowIndex++) {
    const row = String.fromCharCode(65 + rowIndex);
    for (let col = 1; col <= safeCols; col++) {
      seats.push({
        seatId: `${prefix}-${row}-${col}`,
        label: `${row}${col}`,
        row,
        number: col,
        x: col - 1,
        y: rowIndex,
        w: 1,
        h: 1,
      });
    }
  }
  return seats;
}

function defaultLayout(layoutId: string, venueId: string, hallId: string, name: string, rows: number, cols: number): SeatMapLayout {
  const now = "2026-05-19T00:00:00.000Z";
  return {
    layoutId,
    venueId,
    hallId,
    name,
    seats: createRectangularSeats(layoutId, rows, cols),
    createdAt: now,
    updatedAt: now,
  };
}

function grandTheatreLayout(): SeatMapLayout {
  const now = "2026-05-26T00:00:00.000Z";
  const layoutV2 = createGrandTheatreLayoutV2();
  return {
    layoutId: layoutV2.layoutId,
    venueId: "venue_grand_theatre_v2",
    hallId: "hall_grand_theatre_v2",
    name: "Большая сцена · SeatMap V2",
    seats: flattenSeatMapLayoutV2(layoutV2).map((seat) => ({
      seatId: seat.seatId,
      label: seat.label,
      row: seat.row,
      number: seat.number,
      x: seat.x,
      y: seat.y,
      w: 1,
      h: 1,
    })),
    layoutV2,
    createdAt: now,
    updatedAt: now,
  };
}

function cloneSeatMapLayout(layout: SeatMapLayout): SeatMapLayout {
  return {
    ...layout,
    seats: layout.seats.map((seat) => ({ ...seat })),
    layoutV2: layout.layoutV2 ? cloneSeatMapLayoutV2(layout.layoutV2) : undefined,
  };
}

export function getSeatMapLayoutV2(layout?: SeatMapLayout | null): SeatMapLayoutV2 | null {
  if (!layout) return null;
  return layout.layoutV2 || adaptLegacySeatsToLayoutV2(layout.layoutId, layout.name, layout.seats);
}

const DEFAULT_SEAT_MAP_LAYOUTS: SeatMapLayout[] = [
  defaultLayout("layout_palace_main", "venue_palace_republic", "hall_palace_main", "Основной зал 5x8", 5, 8),
  defaultLayout("layout_bolshoi_demo", "venue_bolshoi_theatre", "hall_bolshoi_demo", "Демо-схема 4x6", 4, 6),
  defaultLayout("layout_grodno_culture", "venue_grodno_culture", "hall_grodno_main", "Зал 4x5", 4, 5),
  grandTheatreLayout(),
];

const DEFAULT_VENUE_REGISTRY: VenueRegistryRecord[] = [
  {
    venueId: "venue_palace_republic",
    name: "Дворец Республики",
    city: "Минск",
    region: "Минск",
    type: "концертный зал",
    address: "Октябрьская площадь, 1",
    description: "Реестровая концертная площадка с простой прямоугольной схемой для MVP.",
    capacity: 40,
    status: "approved",
    halls: [{ hallId: "hall_palace_main", venueId: "venue_palace_republic", name: "Основной зал", capacity: 40, hasSeatMap: true, layoutId: "layout_palace_main" }],
  },
  {
    venueId: "venue_bolshoi_theatre",
    name: "Большой театр",
    city: "Минск",
    region: "Минск",
    type: "театр",
    address: "пл. Парижской Коммуны, 1",
    description: "Театральная площадка. Для MVP используется простая прямоугольная демо-схема.",
    capacity: 24,
    status: "approved",
    halls: [{ hallId: "hall_bolshoi_demo", venueId: "venue_bolshoi_theatre", name: "Демо-зал", capacity: 24, hasSeatMap: true, layoutId: "layout_bolshoi_demo" }],
  },
  {
    venueId: "venue_grodno_culture",
    name: "Центр культуры Гродно",
    city: "Гродно",
    region: "Гродненская область",
    type: "центр культуры",
    address: "ул. Советская, 12",
    description: "Культурный центр с базовой схемой малого зала.",
    capacity: 20,
    status: "approved",
    halls: [{ hallId: "hall_grodno_main", venueId: "venue_grodno_culture", name: "Малый зал", capacity: 20, hasSeatMap: true, layoutId: "layout_grodno_culture" }],
  },
  {
    venueId: "venue_grand_theatre_v2",
    name: "Grand Theatre · SeatMap V2 Demo",
    city: "Минск",
    region: "Минск",
    type: "театр",
    address: "пр-т Независимости, 25",
    description: "Демонстрационный театр с партером, балконом, диагональными секторами и ложами.",
    capacity: 292,
    status: "approved",
    halls: [{ hallId: "hall_grand_theatre_v2", venueId: "venue_grand_theatre_v2", name: "Большая сцена V2", capacity: 292, hasSeatMap: true, layoutId: COMPLEX_THEATRE_LAYOUT_ID }],
  },
  {
    venueId: "venue_podnikolie_park",
    name: "Парк Подниколье",
    city: "Могилёв",
    region: "Могилёвская область",
    type: "open-air",
    address: "Парк Подниколье",
    description: "Открытая площадка без схемы, только вместимость.",
    capacity: 1500,
    status: "approved",
    halls: [{ hallId: "hall_podnikolie_open", venueId: "venue_podnikolie_park", name: "Основная зона", capacity: 1500, hasSeatMap: false }],
  },
];

function pad(n: number, len: number): string {
  return String(n).padStart(len, "0");
}

export function genId(prefix: string, counter: number): string {
  const len = prefix === "OP" || prefix === "TCK" ? 6 : 4;
  return `${prefix}-${pad(counter, len)}`;
}

export function defaultState(): AppState {
  const createdAt = new Date().toISOString();
  const state: AppState = {
    meta: { version: "v4", updatedAt: createdAt },
    counters: { app: 1, lic: 1, evt: 1, tck: 1, op: 1 },
    finance: {
      platformCommissionPercent: 5,
      organizerBalances: {},
      organizerOperations: [],
      organizerReceipts: [],
    },
    applications: [],
    organizerApplications: [],
    eventComplianceApplications: [],
    organizerRegistry: [],
    venueRegistry: DEFAULT_VENUE_REGISTRY.map((venue) => ({ ...venue, halls: venue.halls.map((hall) => ({ ...hall })) })),
    seatMapLayouts: DEFAULT_SEAT_MAP_LAYOUTS.map(cloneSeatMapLayout),
    events: [],
    tickets: [],
    resellers: DEFAULT_RESELLERS.map((reseller) => ({ ...reseller, updatedAt: createdAt })),
    demoPurchases: [],
    ops: [],
    users: [{ userId: "demo_user_1", name: "Демо пользователь" }],
    organizers: [],
    organizerDocuments: [],
    currentOrganizerId: null,
    ui: { selectedRole: "organizer", selectedChannel: "ByCard" },
  };
  return state;
}

export function ensureDefaultResellers(state: AppState): void {
  if (!Array.isArray(state.resellers)) state.resellers = [];
  const now = new Date().toISOString();
  for (const seed of DEFAULT_RESELLERS) {
    const existing = state.resellers.find((reseller) => reseller.resellerId === seed.resellerId || reseller.code === seed.code);
    if (!existing) {
      state.resellers.push({ ...seed, updatedAt: now });
      continue;
    }
    existing.resellerId ||= seed.resellerId;
    existing.name ||= seed.name;
    existing.code ||= seed.code;
    if (existing.status !== "active" && existing.status !== "disabled") existing.status = seed.status;
    if (typeof existing.apiConnected !== "boolean") existing.apiConnected = seed.apiConnected;
    if (!["Active", "Suspended", "Draft"].includes(existing.contractStatus)) existing.contractStatus = seed.contractStatus;
    if (!Number.isFinite(existing.commissionPercent)) existing.commissionPercent = seed.commissionPercent;
    existing.fullName ||= seed.fullName;
    existing.registrationNumber ||= seed.registrationNumber;
    existing.legalAddress ||= seed.legalAddress;
    existing.contactPerson ||= seed.contactPerson;
    existing.email ||= seed.email;
    existing.phone ||= seed.phone;
    existing.contractNumber ||= seed.contractNumber;
    existing.contractDate ||= seed.contractDate;
    existing.apiEndpoint ||= seed.apiEndpoint;
    existing.webhookEndpoint ||= seed.webhookEndpoint;
    if (typeof existing.signatureValidation !== "boolean") existing.signatureValidation = seed.signatureValidation;
    existing.lastSync ||= seed.lastSync || existing.updatedAt || now;
    existing.updatedAt ||= now;
  }
}

export function ensureOrganizerFinanceState(state: AppState): void {
  state.finance ||= {
    platformCommissionPercent: 5,
    organizerBalances: {},
    organizerOperations: [],
    organizerReceipts: [],
  };
  state.finance.organizerBalances ||= {};
  state.finance.organizerOperations = Array.isArray(state.finance.organizerOperations) ? state.finance.organizerOperations : [];
  state.finance.organizerReceipts = Array.isArray(state.finance.organizerReceipts) ? state.finance.organizerReceipts : [];
  for (const organizer of state.organizers) {
    const current = Number(state.finance.organizerBalances[organizer.organizerId]);
    state.finance.organizerBalances[organizer.organizerId] = Number.isFinite(current) ? Number(current.toFixed(2)) : 350;
  }
}

export function normalizeSalesChannels(channels: unknown, state?: Pick<AppState, "resellers">): string[] {
  const knownResellerCodes = new Set((state?.resellers || []).map((reseller) => reseller.code).filter(Boolean));
  const raw = Array.isArray(channels) ? channels : [];
  const result: string[] = [OWN_SALES_CHANNEL];

  raw.forEach((value) => {
    const code = typeof value === "string" ? value.trim() : "";
    if (!code || code === OWN_SALES_CHANNEL) return;
    if (state && !knownResellerCodes.has(code)) return;
    if (!result.includes(code)) result.push(code);
  });

  return result;
}

export function buildDefaultSalesChannels(state: Pick<AppState, "resellers">): string[] {
  return normalizeSalesChannels(
    [
      OWN_SALES_CHANNEL,
      ...(state.resellers || [])
        .filter((reseller) => reseller.status === "active")
        .map((reseller) => reseller.code),
    ],
    state,
  );
}

export function getSalesChannelLabel(state: Pick<AppState, "resellers">, code: string): string {
  if (code === OWN_SALES_CHANNEL) return OWN_SALES_CHANNEL_LABEL;
  return state.resellers.find((reseller) => reseller.code === code)?.name || code;
}

export function getEventSalesChannels(state: Pick<AppState, "resellers">, event: Pick<EventRecord, "salesChannels">): string[] {
  if (Array.isArray(event.salesChannels) && event.salesChannels.length > 0) {
    return normalizeSalesChannels(event.salesChannels, state);
  }
  return buildDefaultSalesChannels(state);
}

export function isSalesChannelAllowedForEvent(state: Pick<AppState, "resellers">, event: Pick<EventRecord, "salesChannels">, code: string): boolean {
  if (!code) return false;
  if (Array.isArray(event.salesChannels) && event.salesChannels.length > 0) {
    return normalizeSalesChannels(event.salesChannels, state).includes(code);
  }
  if (code === OWN_SALES_CHANNEL) return true;
  return state.resellers.some((reseller) => reseller.code === code && reseller.status === "active");
}

function ensureOrganizerDocuments(state: AppState): void {
  if (!Array.isArray(state.organizerDocuments)) state.organizerDocuments = [];
  const now = new Date().toISOString();
  for (const organizer of state.organizers) {
    for (const tpl of ORGANIZER_DOCUMENT_TEMPLATES) {
      const docId = `${organizer.organizerId}-${tpl.documentId}`;
      if (!state.organizerDocuments.some((d) => d.documentId === docId)) {
        state.organizerDocuments.push({
          ...tpl,
          documentId: docId,
          organizerId: organizer.organizerId,
          updatedAt: now,
        });
      }
    }
  }
}

function migrateState(parsed: Partial<AppState>): AppState {
  suppressPersistence = true;
  try {
    const state: AppState = {
      ...defaultState(),
      ...parsed,
      finance: {
        platformCommissionPercent: normalizePlatformCommissionPercent(parsed.finance?.platformCommissionPercent),
        organizerBalances: parsed.finance?.organizerBalances && typeof parsed.finance.organizerBalances === "object" ? parsed.finance.organizerBalances : {},
        organizerOperations: Array.isArray(parsed.finance?.organizerOperations) ? parsed.finance.organizerOperations : [],
        organizerReceipts: Array.isArray(parsed.finance?.organizerReceipts) ? parsed.finance.organizerReceipts : [],
      },
      applications: Array.isArray(parsed.applications) ? parsed.applications : [],
      organizerApplications: Array.isArray(parsed.organizerApplications) ? parsed.organizerApplications : [],
      eventComplianceApplications: Array.isArray(parsed.eventComplianceApplications) ? parsed.eventComplianceApplications : [],
      organizerRegistry: Array.isArray(parsed.organizerRegistry) ? parsed.organizerRegistry : [],
      venueRegistry: Array.isArray((parsed as Partial<AppState>).venueRegistry) ? (parsed as Partial<AppState>).venueRegistry as VenueRegistryRecord[] : [],
      seatMapLayouts: Array.isArray((parsed as Partial<AppState>).seatMapLayouts) ? (parsed as Partial<AppState>).seatMapLayouts as SeatMapLayout[] : [],
      events: Array.isArray(parsed.events) ? parsed.events : [],
      tickets: Array.isArray(parsed.tickets) ? parsed.tickets : [],
      resellers: Array.isArray(parsed.resellers) ? parsed.resellers : [],
      demoPurchases: Array.isArray(parsed.demoPurchases) ? parsed.demoPurchases : [],
      ops: Array.isArray(parsed.ops) ? parsed.ops : [],
      users: Array.isArray(parsed.users) ? parsed.users : [{ userId: "demo_user_1", name: "Демо пользователь" }],
      organizers: Array.isArray(parsed.organizers) ? parsed.organizers : [],
      organizerDocuments: Array.isArray(parsed.organizerDocuments) ? parsed.organizerDocuments : [],
      currentOrganizerId: typeof parsed.currentOrganizerId === "string" ? parsed.currentOrganizerId : null,
    };
    ensureSeatMapState(state);

    const knownOrganizerIds = new Set(state.organizers.map((o) => o.organizerId));
    for (const organizer of state.organizers) {
      if (!organizer.accountStatus) organizer.accountStatus = "активен";
      if (!organizer.registryStatus) organizer.registryStatus = "зарегистрирован в реестре";
      if (organizer.registryRegisteredAt === undefined) organizer.registryRegisteredAt = null;
    }
    for (const app of state.applications) {
      if (!app.organizerId || !knownOrganizerIds.has(app.organizerId)) {
        app.organizerId = LEGACY_DEFAULT_ORGANIZER_ID;
      }
      app.tiers = normalizeTierRows(app.tiers, app.capacity);
      app.capacity = sumTierQuantity(app.tiers) || app.capacity || 0;
    }
    ensureDefaultResellers(state);
    ensureOrganizerFinanceState(state);
    for (const event of state.events) {
      if (!event.organizerId || !knownOrganizerIds.has(event.organizerId)) {
        const fromApp = state.applications.find((a) => a.appId === event.appId)?.organizerId;
        event.organizerId = fromApp && knownOrganizerIds.has(fromApp) ? fromApp : LEGACY_DEFAULT_ORGANIZER_ID;
      }
      event.tiers = normalizeTierRows(event.tiers, event.capacity);
      event.capacity = sumTierQuantity(event.tiers) || event.capacity || 0;
      event.salesChannels = Array.isArray(event.salesChannels) && event.salesChannels.length > 0
        ? normalizeSalesChannels(event.salesChannels, state)
        : buildDefaultSalesChannels(state);
      event.eventSeats = normalizeEventSeats(event.eventSeats);
      if (event.eventSeats.length > 0) {
        event.capacity = event.eventSeats.filter((seat) => seat.status !== "blocked").length;
        event.tiers = normalizeSeatEventTiers(event.eventSeats, event.tiers);
      }
    }
    for (const app of state.eventComplianceApplications) {
      const tiers = normalizeComplianceTicketTiers(app.data);
      app.data.ticketTiers = tiers;
      app.data.plannedTicketsForSale = sumTierQuantity(tiers);
      app.data.posterPath ||= "";
      app.data.salesChannels = normalizeSalesChannels(app.data.salesChannels, state);
      app.data.eventSeats = normalizeEventSeats(app.data.eventSeats);
    }
    for (const purchase of state.demoPurchases) {
      purchase.status ||= "confirmed";
    }
    if (state.currentOrganizerId && !knownOrganizerIds.has(state.currentOrganizerId)) {
      state.currentOrganizerId = null;
    }
    ensureOrganizerDocuments(state);
    state.meta.version = "v4";
    return state;
  } finally {
    suppressPersistence = false;
  }
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AppState>;
      return migrateState(parsed);
    }
  } catch {}
  return migrateState(defaultState());
}

export function saveState(state: AppState): void {
  if (suppressPersistence) return;
  state.meta.updatedAt = new Date().toISOString();
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

export function resetState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

// ===== Business Logic =====

function nextId(state: AppState, key: "app" | "lic" | "evt" | "tck" | "op", prefix: string): string {
  const id = genId(prefix, state.counters[key]);
  state.counters[key]++;
  return id;
}

function nowIso(): string {
  return new Date().toISOString();
}

function quickId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function addOp(state: AppState, op: Omit<OpRecord, "opId" | "ts">): OpRecord {
  const rec: OpRecord = { ...op, opId: nextId(state, "op", "OP"), ts: new Date().toISOString() };
  state.ops.push(rec);
  return rec;
}

function recalcRemaining(state: AppState, eventId: string) {
  const evt = state.events.find((e) => e.eventId === eventId);
  if (!evt) return;
  evt.remaining = state.tickets.filter((t) => t.eventId === eventId && t.status === "issued").length;
}

function parseTierName(value: unknown): string {
  const name = typeof value === "string" ? value.trim() : "";
  return name || "Стандарт";
}

function parseTierPrice(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return parsed;
}

function parseTierQuantity(value: unknown): number | null {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return Math.max(0, Math.floor(parsed));
}

function sumTierQuantity(tiers: PriceTier[]): number {
  return tiers.reduce((acc, tier) => acc + Math.max(0, Math.floor(tier.quantity || 0)), 0);
}

function copySeat(seat: SeatMapSeat): SeatMapSeat {
  return {
    seatId: String(seat.seatId || quickId("SEAT")),
    label: String(seat.label || seat.seatId || "—"),
    row: String(seat.row || ""),
    number: Number.isFinite(Number(seat.number)) ? Number(seat.number) : 0,
    x: Number.isFinite(Number(seat.x)) ? Number(seat.x) : 0,
    y: Number.isFinite(Number(seat.y)) ? Number(seat.y) : 0,
    w: Number.isFinite(Number(seat.w)) ? Number(seat.w) : 1,
    h: Number.isFinite(Number(seat.h)) ? Number(seat.h) : 1,
  };
}

function normalizeEventSeats(rawSeats: unknown): EventSeat[] {
  const source = Array.isArray(rawSeats) ? rawSeats : [];
  return source.map((raw): EventSeat => {
    const seat = copySeat(raw as SeatMapSeat);
    const value = raw as Partial<EventSeat>;
    const status: SeatStatus = value.status === "sold" || value.status === "blocked" ? value.status : "available";
    return {
      ...seat,
      tariffId: typeof value.tariffId === "string" ? value.tariffId : undefined,
      tariffName: typeof value.tariffName === "string" ? value.tariffName : undefined,
      price: Number.isFinite(Number(value.price)) ? Number(value.price) : undefined,
      color: typeof value.color === "string" ? value.color : undefined,
      baseTariffId: typeof value.baseTariffId === "string" ? value.baseTariffId : undefined,
      baseTariffName: typeof value.baseTariffName === "string" ? value.baseTariffName : undefined,
      basePrice: Number.isFinite(Number(value.basePrice)) ? Number(value.basePrice) : undefined,
      baseColor: typeof value.baseColor === "string" ? value.baseColor : undefined,
      isIndividualOverride: Boolean(value.isIndividualOverride),
      status,
    };
  });
}

function normalizeSeatEventTiers(seats: EventSeat[], fallback: PriceTier[] = []): PriceTier[] {
  const fallbackByName = new Map(normalizeTierRows(fallback, 0).map((tier) => [tier.name, tier]));
  const tiers = new Map<string, PriceTier>();
  seats.filter((seat) => seat.status !== "blocked" && seat.tariffName).forEach((seat) => {
    const name = seat.tariffName || "Стандарт";
    const existing = tiers.get(name);
    const source = fallbackByName.get(name);
    if (existing) {
      existing.quantity += 1;
    } else {
      tiers.set(name, {
        name,
        price: Number.isFinite(seat.price) ? Number(seat.price) : source?.price || 0,
        quantity: 1,
        color: seat.color || source?.color || SEAT_TARIFF_COLORS[tiers.size % SEAT_TARIFF_COLORS.length],
      });
    }
  });
  return tiers.size > 0 ? Array.from(tiers.values()) : normalizeTierRows(fallback, 0);
}

export function ensureSeatMapState(state: AppState): void {
  if (!Array.isArray(state.venueRegistry)) state.venueRegistry = [];
  if (!Array.isArray(state.seatMapLayouts)) state.seatMapLayouts = [];
  for (const layout of DEFAULT_SEAT_MAP_LAYOUTS) {
    const existingLayout = state.seatMapLayouts.find((item) => item.layoutId === layout.layoutId);
    if (!existingLayout) {
      state.seatMapLayouts.push(cloneSeatMapLayout(layout));
    } else if (layout.layoutV2 && !existingLayout.layoutV2) {
      existingLayout.layoutV2 = cloneSeatMapLayoutV2(layout.layoutV2);
    }
  }
  for (const venue of DEFAULT_VENUE_REGISTRY) {
    const existing = state.venueRegistry.find((item) => item.venueId === venue.venueId || item.name === venue.name);
    if (!existing) {
      state.venueRegistry.push({ ...venue, halls: venue.halls.map((hall) => ({ ...hall })) });
      continue;
    }
    existing.venueId ||= venue.venueId;
    existing.name ||= venue.name;
    existing.city ||= venue.city;
    existing.region ||= venue.region;
    existing.type ||= venue.type;
    existing.address ||= venue.address;
    existing.description ||= venue.description;
    existing.capacity = Number.isFinite(existing.capacity) && existing.capacity > 0 ? existing.capacity : venue.capacity;
    existing.status ||= "approved";
    if (!Array.isArray(existing.halls) || existing.halls.length === 0) existing.halls = venue.halls.map((hall) => ({ ...hall }));
  }
}

export function getSeatMapLayout(state: AppState, layoutId?: string): SeatMapLayout | null {
  if (!layoutId) return null;
  return state.seatMapLayouts.find((layout) => layout.layoutId === layoutId) || null;
}

export function getVenueRegistryRecord(state: AppState, venueId?: string): VenueRegistryRecord | null {
  if (!venueId) return null;
  return state.venueRegistry.find((venue) => venue.venueId === venueId) || null;
}

export function buildEventSeatsFromLayout(layout: SeatMapLayout, tiers: PriceTier[] = []): EventSeat[] {
  const normalized = normalizeTierRows(tiers, 0);
  const v2SeatById = new Map((layout.layoutV2 ? flattenSeatMapLayoutV2(layout.layoutV2) : []).map((seat) => [seat.seatId, seat]));
  return layout.seats.map((seat, index) => {
    const v2Seat = v2SeatById.get(seat.seatId);
    const presetTier = normalized.find((item) => item.name === v2Seat?.tariffName);
    const tier = presetTier || normalized[index % Math.max(1, normalized.length)] || normalized[0];
    return {
      ...copySeat(seat),
      tariffId: tier?.name,
      tariffName: tier?.name,
      price: tier?.price,
      color: tier?.color || (presetTier ? v2Seat?.color : undefined) || SEAT_TARIFF_COLORS[normalized.indexOf(tier) % SEAT_TARIFF_COLORS.length],
      baseTariffId: tier?.name,
      baseTariffName: tier?.name,
      basePrice: tier?.price,
      baseColor: tier?.color || (presetTier ? v2Seat?.color : undefined) || SEAT_TARIFF_COLORS[normalized.indexOf(tier) % SEAT_TARIFF_COLORS.length],
      isIndividualOverride: false,
      status: "available",
    };
  });
}

export interface SeatTariffExceptionSummary {
  seatId: string;
  label: string;
  row: string;
  number: number;
  tariffName: string;
  baseTariffName: string;
  price: number;
}

export interface SeatTariffConfigurationSummary {
  hasSeatMap: boolean;
  totalSeats: number;
  assignedSeats: number;
  unassignedSeats: number;
  blockedSeats: number;
  benefitSeats: number;
  individualExceptions: number;
  maxRevenue: number;
  byTariff: Array<PriceTier & { isBenefit: boolean }>;
  exceptionSeats: SeatTariffExceptionSummary[];
}

export function isBenefitTariffName(name?: string): boolean {
  return Boolean(name && name.trim().toLowerCase().startsWith("льгот"));
}

export function getSeatTariffConfigurationSummary(data: { eventSeats?: EventSeat[]; ticketTiers?: PriceTier[] }): SeatTariffConfigurationSummary {
  const seats = normalizeEventSeats(data.eventSeats);
  const normalizedTiers = normalizeTierRows(data.ticketTiers, 0);
  const tierMap = new Map<string, PriceTier & { isBenefit: boolean }>();
  normalizedTiers.forEach((tier, index) => {
    if (!tier.name.trim()) return;
    tierMap.set(tier.name, {
      ...tier,
      quantity: 0,
      color: tier.color || SEAT_TARIFF_COLORS[index % SEAT_TARIFF_COLORS.length],
      isBenefit: isBenefitTariffName(tier.name),
    });
  });

  let assignedSeats = 0;
  let unassignedSeats = 0;
  let benefitSeats = 0;
  let maxRevenue = 0;
  const exceptionSeats: SeatTariffExceptionSummary[] = [];

  seats.forEach((seat) => {
    if (seat.status === "blocked") return;
    const tariffName = seat.tariffName?.trim();
    if (!tariffName) {
      unassignedSeats += 1;
      return;
    }
    assignedSeats += 1;
    const existing = tierMap.get(tariffName);
    const price = Number.isFinite(seat.price) ? Number(seat.price) : existing?.price || 0;
    if (existing) {
      existing.quantity += 1;
      if (!Number.isFinite(existing.price) || existing.price === 0) existing.price = price;
    } else {
      tierMap.set(tariffName, {
        name: tariffName,
        price,
        quantity: 1,
        color: seat.color || SEAT_TARIFF_COLORS[tierMap.size % SEAT_TARIFF_COLORS.length],
        isBenefit: isBenefitTariffName(tariffName),
      });
    }
    if (isBenefitTariffName(tariffName)) benefitSeats += 1;
    maxRevenue += price;
    if (seat.isIndividualOverride) {
      exceptionSeats.push({
        seatId: seat.seatId,
        label: seat.label,
        row: seat.row,
        number: seat.number,
        tariffName,
        baseTariffName: seat.baseTariffName || "групповой тариф не указан",
        price,
      });
    }
  });

  return {
    hasSeatMap: seats.length > 0,
    totalSeats: seats.length,
    assignedSeats,
    unassignedSeats,
    blockedSeats: seats.filter((seat) => seat.status === "blocked").length,
    benefitSeats,
    individualExceptions: exceptionSeats.length,
    maxRevenue,
    byTariff: Array.from(tierMap.values()),
    exceptionSeats,
  };
}

export function getEventSeatSummary(event: Pick<EventRecord, "eventSeats" | "tiers">): {
  hasSeatMap: boolean;
  total: number;
  forSale: number;
  available: number;
  sold: number;
  blocked: number;
  revenue: number;
  byTariff: PriceTier[];
} {
  const seats = normalizeEventSeats(event.eventSeats);
  const soldSeats = seats.filter((seat) => seat.status === "sold");
  return {
    hasSeatMap: seats.length > 0,
    total: seats.length,
    forSale: seats.filter((seat) => seat.status !== "blocked").length,
    available: seats.filter((seat) => seat.status === "available").length,
    sold: soldSeats.length,
    blocked: seats.filter((seat) => seat.status === "blocked").length,
    revenue: soldSeats.reduce((sum, seat) => sum + (seat.price || 0), 0),
    byTariff: normalizeSeatEventTiers(seats, event.tiers),
  };
}

function legacySeatRowLabel(rowIndex: number): string {
  let n = Math.max(0, Math.floor(rowIndex));
  let label = "";
  do {
    label = String.fromCharCode(65 + (n % 26)) + label;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return label;
}

function legacySeatPosition(index: number, total: number): Pick<SeatMapSeat, "label" | "row" | "number" | "x" | "y" | "w" | "h"> {
  const cols = Math.max(1, Math.min(20, Math.ceil(Math.sqrt(Math.max(1, total)))));
  const rowIndex = Math.floor(index / cols);
  const row = legacySeatRowLabel(rowIndex);
  const number = (index % cols) + 1;
  return {
    label: `${row}${number}`,
    row,
    number,
    x: number - 1,
    y: rowIndex,
    w: 1,
    h: 1,
  };
}

function ticketSeatStatus(status: TicketStatus): SeatStatus {
  return status === "sold" || status === "redeemed" ? "sold" : "available";
}

function buildLegacyEventSeatsWithSalesState(
  tickets: Ticket[],
  event: Pick<EventRecord, "eventId" | "tiers" | "capacity">
): EventSeat[] {
  const tiers = normalizeTierRows(event.tiers, event.capacity);
  const tierByName = new Map(tiers.map((tier, index) => [tier.name, { ...tier, index }]));
  const eventTickets = tickets.filter((ticket) => ticket.eventId === event.eventId);

  if (eventTickets.length > 0) {
    return eventTickets.map((ticket, index) => {
      const tier = tierByName.get(ticket.tier) || tiers[0];
      const position = legacySeatPosition(index, eventTickets.length);
      const row = ticket.row || position.row;
      const number = ticket.seatNumber || position.number;
      return {
        seatId: ticket.seatId || `legacy-${event.eventId}-${ticket.ticketId || index}`,
        label: ticket.seatLabel || `${row}${number}`,
        row,
        number,
        x: position.x,
        y: position.y,
        w: 1,
        h: 1,
        tariffId: ticket.tier,
        tariffName: ticket.tier,
        price: tier?.price || 0,
        color: tier?.color || SEAT_TARIFF_COLORS[(tier?.index || 0) % SEAT_TARIFF_COLORS.length],
        status: ticketSeatStatus(ticket.status),
      };
    });
  }

  const plannedSeats = tiers.flatMap((tier, tierIndex) => (
    Array.from({ length: Math.max(0, Math.floor(tier.quantity || 0)) }, () => ({ tier, tierIndex }))
  ));
  const fallbackTotal = plannedSeats.length || Math.max(0, Math.floor(event.capacity || 0));
  const sourceSeats = plannedSeats.length > 0
    ? plannedSeats
    : Array.from({ length: fallbackTotal }, (_, index) => ({ tier: tiers[index % Math.max(1, tiers.length)], tierIndex: index % Math.max(1, tiers.length) }));

  return sourceSeats.map(({ tier, tierIndex }, index) => {
    const position = legacySeatPosition(index, sourceSeats.length);
    return {
      seatId: `legacy-${event.eventId}-${index + 1}`,
      ...position,
      tariffId: tier?.name,
      tariffName: tier?.name,
      price: tier?.price || 0,
      color: tier?.color || SEAT_TARIFF_COLORS[tierIndex % SEAT_TARIFF_COLORS.length],
      status: "available",
    };
  });
}

export function getEventSeatsWithSalesState(
  state: Pick<AppState, "seatMapLayouts" | "tickets">,
  event: Pick<EventRecord, "eventId" | "eventSeats" | "tiers" | "layoutId" | "capacity">
): EventSeat[] {
  const normalizedSeats = normalizeEventSeats(event.eventSeats);
  const layout = normalizedSeats.length === 0 && event.layoutId
    ? state.seatMapLayouts.find((item) => item.layoutId === event.layoutId)
    : null;
  const seats = normalizedSeats.length > 0
    ? normalizedSeats
    : layout
      ? buildEventSeatsFromLayout(layout, event.tiers)
      : [];

  if (seats.length === 0) return buildLegacyEventSeatsWithSalesState(state.tickets, event);

  const statusBySeatId = new Map<string, SeatStatus>();
  state.tickets.forEach((ticket) => {
    if (ticket.eventId !== event.eventId || !ticket.seatId) return;
    if (ticket.status === "sold" || ticket.status === "redeemed") {
      statusBySeatId.set(ticket.seatId, "sold");
      return;
    }
    if (!statusBySeatId.has(ticket.seatId)) {
      statusBySeatId.set(ticket.seatId, "available");
    }
  });

  return seats.map((seat) => {
    if (seat.status === "blocked") return seat;
    const ticketStatus = statusBySeatId.get(seat.seatId);
    return ticketStatus ? { ...seat, status: ticketStatus } : seat;
  });
}

export function saveSeatMapLayout(state: AppState, layoutId: string, seats: SeatMapSeat[]): boolean {
  const layout = state.seatMapLayouts.find((item) => item.layoutId === layoutId);
  if (!layout) return false;
  layout.seats = seats.map(copySeat);
  layout.updatedAt = nowIso();
  const venue = state.venueRegistry.find((item) => item.venueId === layout.venueId);
  const hall = venue?.halls.find((item) => item.hallId === layout.hallId);
  if (hall) {
    hall.capacity = layout.seats.length;
    hall.hasSeatMap = layout.seats.length > 0;
  }
  if (venue) venue.capacity = Math.max(...venue.halls.map((item) => item.capacity), layout.seats.length);
  saveState(state);
  return true;
}

export function updateEventSeatMap(state: AppState, eventId: string, seats: EventSeat[]): boolean {
  const event = state.events.find((item) => item.eventId === eventId);
  if (!event) return false;
  event.eventSeats = normalizeEventSeats(seats);
  event.tiers = normalizeSeatEventTiers(event.eventSeats, event.tiers);
  event.capacity = event.eventSeats.filter((seat) => seat.status !== "blocked").length;
  event.remaining = event.eventSeats.filter((seat) => seat.status === "available").length;
  event.updatedAt = nowIso();
  saveState(state);
  return true;
}

export type CreateVenueRegistryInput = {
  name: string;
  city: string;
  region: string;
  type: VenueRegistryRecord["type"];
  address: string;
  description: string;
  hallName: string;
  rows: number;
  cols: number;
  hasSeatMap: boolean;
  layoutV2?: SeatMapLayoutV2;
};

export function createVenueRegistryRecord(state: AppState, input: CreateVenueRegistryInput): VenueRegistryRecord | null {
  const name = input.name.trim();
  const city = input.city.trim();
  const address = input.address.trim();
  if (!name || !city || !address) return null;

  const now = nowIso();
  const venueId = quickId("VENUE");
  const hallId = quickId("HALL");
  const layoutId = input.hasSeatMap ? quickId("LAYOUT") : undefined;
  const layoutV2 = input.hasSeatMap && input.layoutV2 ? cloneSeatMapLayoutV2(input.layoutV2) : undefined;
  if (layoutV2 && layoutId) layoutV2.layoutId = layoutId;
  const seats = input.hasSeatMap
    ? layoutV2
      ? flattenSeatMapLayoutV2ToLegacySeats(layoutV2)
      : createRectangularSeats(layoutId || hallId, input.rows, input.cols)
    : [];
  if (layoutV2 && seats.length > 500) return null;
  const capacity = input.hasSeatMap ? seats.length : Math.max(1, Math.floor(input.rows || 1) * Math.floor(input.cols || 1));

  if (layoutId) {
    state.seatMapLayouts.push({
      layoutId,
      venueId,
      hallId,
      name: layoutV2
        ? `${input.hallName.trim() || "Основной зал"} · сложная схема`
        : `${input.hallName.trim() || "Основной зал"} ${Math.max(1, Math.floor(input.rows || 1))}x${Math.max(1, Math.floor(input.cols || 1))}`,
      seats,
      layoutV2,
      createdAt: now,
      updatedAt: now,
    });
  }

  const venue: VenueRegistryRecord = {
    venueId,
    name,
    city,
    region: input.region.trim() || city,
    type: input.type,
    address,
    description: input.description.trim() || "Demo-площадка, созданная в реестре Центра Управления.",
    capacity,
    status: "approved",
    halls: [{
      hallId,
      venueId,
      name: input.hallName.trim() || "Основной зал",
      capacity,
      hasSeatMap: Boolean(layoutId),
      layoutId,
    }],
  };

  state.venueRegistry.push(venue);
  saveState(state);
  return venue;
}

export function ensureMockVenueRegistryRecord(state: AppState): VenueRegistryRecord {
  ensureSeatMapState(state);

  const now = nowIso();
  const venueId = "venue_mock_seatmap_demo";
  const hallId = "hall_mock_seatmap_demo";
  const layoutId = "layout_mock_seatmap_demo";
  const venueName = "Demo-площадка со схемой";
  const hallName = "Demo-зал";
  const seats = createRectangularSeats(layoutId, 4, 6);
  const capacity = seats.length;

  let layout = state.seatMapLayouts.find((item) => item.layoutId === layoutId);
  if (!layout) {
    layout = {
      layoutId,
      venueId,
      hallId,
      name: "Demo-схема 4x6",
      seats,
      createdAt: now,
      updatedAt: now,
    };
    state.seatMapLayouts.push(layout);
  } else {
    layout.venueId = venueId;
    layout.hallId = hallId;
    layout.name ||= "Demo-схема 4x6";
    if (!Array.isArray(layout.seats) || layout.seats.length === 0) {
      layout.seats = seats;
    }
    layout.updatedAt = now;
  }

  let venue = state.venueRegistry.find((item) => item.venueId === venueId || item.name === venueName);
  if (!venue) {
    venue = {
      venueId,
      name: venueName,
      city: "Минск",
      region: "Минск",
      type: "концертный зал",
      address: "ул. Demo, 1",
      description: "Demo-площадка для проверки схемы зала в реестре.",
      capacity,
      status: "approved",
      halls: [{
        hallId,
        venueId,
        name: hallName,
        capacity,
        hasSeatMap: true,
        layoutId,
      }],
    };
    state.venueRegistry.push(venue);
  } else {
    venue.venueId = venueId;
    venue.name = venueName;
    venue.city ||= "Минск";
    venue.region ||= venue.city;
    venue.type ||= "концертный зал";
    venue.address ||= "ул. Demo, 1";
    venue.description ||= "Demo-площадка для проверки схемы зала в реестре.";
    venue.capacity = Math.max(venue.capacity || 0, capacity);
    venue.status = "approved";
    if (!Array.isArray(venue.halls)) venue.halls = [];
    let hall = venue.halls.find((item) => item.hallId === hallId || item.layoutId === layoutId);
    if (!hall) {
      hall = {
        hallId,
        venueId,
        name: hallName,
        capacity,
        hasSeatMap: true,
        layoutId,
      };
      venue.halls.push(hall);
    } else {
      hall.hallId = hallId;
      hall.venueId = venueId;
      hall.name ||= hallName;
      hall.capacity = Math.max(hall.capacity || 0, capacity);
      hall.hasSeatMap = true;
      hall.layoutId = layoutId;
    }
  }

  saveState(state);
  return venue;
}

function normalizeTierRows(rawTiers: unknown, fallbackTotal = 0): PriceTier[] {
  const source = Array.isArray(rawTiers) ? rawTiers : [];
  if (source.length === 0) {
    return [{ name: "Стандарт", price: 0, quantity: Math.max(0, Math.floor(fallbackTotal || 0)) }];
  }
  const missingIndexes: number[] = [];
  const tiers: PriceTier[] = source.map((tier, index) => {
    const row = tier && typeof tier === "object" ? (tier as Record<string, unknown>) : {};
    const quantity = parseTierQuantity(row.quantity);
    if (quantity === null) missingIndexes.push(index);
    return {
      name: parseTierName(row.name),
      price: parseTierPrice(row.price),
      quantity: quantity ?? 0,
      color: typeof row.color === "string" ? row.color : undefined,
    };
  });
  if (missingIndexes.length > 0 && fallbackTotal > 0) {
    const knownTotal = tiers.reduce((acc, tier, index) => acc + (missingIndexes.includes(index) ? 0 : tier.quantity), 0);
    let remaining = Math.max(0, Math.floor(fallbackTotal) - knownTotal);
    const chunk = Math.floor(remaining / missingIndexes.length);
    missingIndexes.forEach((index, i) => {
      const delta = i === missingIndexes.length - 1 ? remaining : chunk;
      tiers[index].quantity = delta;
      remaining -= delta;
    });
  }
  return tiers;
}

function normalizeComplianceTicketTiers(data: EventComplianceData): PriceTier[] {
  const eventSeats = normalizeEventSeats(data.eventSeats);
  if (eventSeats.length > 0) return normalizeSeatEventTiers(eventSeats, data.ticketTiers);
  const fallbackLegacy = data.plannedTicketsForSale && data.plannedTicketsForSale > 0 ? data.plannedTicketsForSale : 0;
  return normalizeTierRows((data as EventComplianceData & { ticketTiers?: PriceTier[] }).ticketTiers, fallbackLegacy);
}

function validateTicketTiers(tiers: PriceTier[], data?: EventComplianceData): boolean {
  const eventSeats = normalizeEventSeats(data?.eventSeats);
  if (eventSeats.length > 0) {
    if (!data?.venueId || !data.hallId || !data.layoutId) return false;
    return eventSeats.every((seat) => seat.status === "blocked" || Boolean(seat.tariffName?.trim()));
  }
  if (!tiers.length) return false;
  if (sumTierQuantity(tiers) <= 0) return false;
  return tiers.every((tier) =>
    Boolean(tier.name.trim()) &&
    Number.isFinite(tier.price) &&
    tier.price >= 0 &&
    Number.isFinite(tier.quantity) &&
    tier.quantity > 0
  );
}

export function defaultIdentityRecord(): IdentityRecord {
  return { fullName: "", docType: "", docNumber: "", issueDate: "", issueAuthority: "" };
}

export function defaultOrganizerApplicationData(): OrganizerApplicationData {
  return {
    legalName: "",
    registrationNumber: "",
    postalCode: "",
    region: "",
    locality: "",
    street: "",
    houseNumber: "",
    roomTypeAndNumber: "",
    addressExtra: "",
    contactPhone: "",
    website: "",
    email: "",
    ownershipType: "private",
    director: defaultIdentityRecord(),
    workers: [],
    founders: [],
    activities: [],
    activityOther: "",
    pastEventsDescription: "",
    pastMaterials: [],
    documents: [],
    confirmations: { isAccurate: false, adminReviewConsent: false },
    accountCredentials: { login: "", password: "" },
  };
}

export function defaultEventComplianceData(): EventComplianceData {
  return {
    title: "",
    eventType: "",
    eventTypePath: [],
    shortDescription: "",
    program: "",
    posterPath: "",
    salesChannels: [OWN_SALES_CHANNEL],
    dateSlots: [""],
    venueName: "",
    venueAddress: "",
    venueId: "",
    hallId: "",
    layoutId: "",
    eventSeats: [],
    performers: [],
    onlyBelarusianPerformers: false,
    hasForeignPerformers: false,
    venueType: "",
    projectedCapacity: null,
    plannedTicketsForSale: null,
    ticketTiers: DEFAULT_COMPLIANCE_TICKET_TIERS.map((tier) => ({ ...tier })),
    ageCategory: "0+",
    ageComment: "",
    approvalMode: "certificate_required",
    approvalBasis: "",
    eventDocuments: [],
    venueContractStatus: "требуется",
    interagencyChecks: [],
    wizardLastStep: 0,
    salesStartDate: "",
    feeExempt: false,
    feeExemptReason: "",
    feePaid: false,
    paymentAttachments: [],
    paymentComment: "",
    adRestrictionConfirmed: false,
    cancelled: false,
    changesDeclared: false,
    executiveCommitteeNotified: false,
    citizensNotified: false,
    notificationsAttachment: [],
    cancellationComment: "",
  };
}

export function calculateComplianceFee(capacity: number | null, plannedTicketsForSale: number | null, ticketTiers?: PriceTier[]): number {
  const tierTotal = ticketTiers ? sumTierQuantity(ticketTiers) : 0;
  const basis = capacity && capacity > 0 ? capacity : (tierTotal > 0 ? tierTotal : (plannedTicketsForSale && plannedTicketsForSale > 0 ? plannedTicketsForSale : 0));
  if (basis <= 0) return 3;
  if (basis <= 150) return 3;
  if (basis <= 300) return 10;
  if (basis <= 500) return 30;
  if (basis <= 1000) return 50;
  if (basis <= 1500) return 80;
  if (basis <= 2000) return 100;
  if (basis <= 3000) return 150;
  return 200;
}

export function calculateComplianceFeeAmount(data: EventComplianceData): number {
  if (data.feeExempt || data.approvalMode !== "certificate_required") return 0;
  return Number((calculateComplianceFee(data.projectedCapacity, data.plannedTicketsForSale, data.ticketTiers) * DEMO_BASE_UNIT_AMOUNT).toFixed(2));
}

export function getCompliancePaymentStatus(app: Pick<EventComplianceApplicationRecord, "data">): CompliancePaymentStatus {
  if (app.data.feeExempt || app.data.approvalMode !== "certificate_required" || app.data.feePaid) return "Оплачено";
  if (app.data.paymentComment === "Недостаточно средств") return "Недостаточно средств";
  return "Ожидает оплаты";
}

export function getOrganizerFinancialAccount(state: AppState, organizerId: string) {
  ensureOrganizerFinanceState(state);
  const balance = Number(state.finance.organizerBalances[organizerId] || 0);
  const operations = state.finance.organizerOperations
    .filter((operation) => operation.organizerId === organizerId)
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const receipts = state.finance.organizerReceipts
    .filter((receipt) => receipt.organizerId === organizerId)
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return {
    balance: Number(balance.toFixed(2)),
    available: Number(balance.toFixed(2)),
    reserved: 0,
    operations,
    receipts,
  };
}

function createFinanceReceipt(
  state: AppState,
  organizerId: string,
  data: {
    eventComplianceApplicationId?: string;
    title: string;
    amount: number;
    status: OrganizerFinanceReceipt["status"];
  }
): OrganizerFinanceReceipt {
  const receiptId = quickId("RCPT");
  const receipt: OrganizerFinanceReceipt = {
    receiptId,
    organizerId,
    eventComplianceApplicationId: data.eventComplianceApplicationId,
    number: `КВ-${new Date().getFullYear()}-${String(state.finance.organizerReceipts.length + 1).padStart(4, "0")}`,
    title: data.title,
    amount: Number(data.amount.toFixed(2)),
    createdAt: nowIso(),
    status: data.status,
  };
  state.finance.organizerReceipts.push(receipt);
  return receipt;
}

function addFinanceOperation(
  state: AppState,
  organizerId: string,
  data: Omit<OrganizerFinanceOperation, "financeOperationId" | "organizerId" | "createdAt">
): OrganizerFinanceOperation {
  const operation: OrganizerFinanceOperation = {
    financeOperationId: quickId("FINOP"),
    organizerId,
    createdAt: nowIso(),
    ...data,
    amount: Number(data.amount.toFixed(2)),
  };
  state.finance.organizerOperations.push(operation);
  return operation;
}

export function topUpOrganizerBalance(state: AppState, organizerId: string, amount = DEMO_TOP_UP_AMOUNT): OrganizerFinanceOperation {
  ensureOrganizerFinanceState(state);
  const value = Number(amount.toFixed(2));
  state.finance.organizerBalances[organizerId] = Number(((state.finance.organizerBalances[organizerId] || 0) + value).toFixed(2));
  const operation = addFinanceOperation(state, organizerId, {
    kind: "Пополнение счёта",
    title: "Демонстрационное пополнение финансового счёта",
    amount: value,
    status: "успешно",
  });
  saveState(state);
  return operation;
}

export function generateComplianceFeeReceipt(
  state: AppState,
  organizerId: string,
  eventComplianceApplicationId: string
): OrganizerFinanceReceipt | null {
  ensureOrganizerFinanceState(state);
  const app = state.eventComplianceApplications.find((row) => row.eventComplianceApplicationId === eventComplianceApplicationId);
  if (!app) return null;
  const amount = calculateComplianceFeeAmount(app.data);
  const existing = state.finance.organizerReceipts.find((receipt) =>
    receipt.organizerId === organizerId &&
    receipt.eventComplianceApplicationId === eventComplianceApplicationId &&
    receipt.status === "сформирована"
  );
  if (existing) return existing;
  const receipt = createFinanceReceipt(state, organizerId, {
    eventComplianceApplicationId,
    title: `Квитанция по заявке ${eventComplianceApplicationId}`,
    amount,
    status: "сформирована",
  });
  addFinanceOperation(state, organizerId, {
    eventComplianceApplicationId,
    kind: "Формирование квитанции",
    title: `Сформирована квитанция по заявке ${eventComplianceApplicationId}`,
    amount,
    status: "сформировано",
    receiptId: receipt.receiptId,
  });
  saveState(state);
  return receipt;
}

export function payComplianceFeeFromBalance(
  state: AppState,
  organizerId: string,
  eventComplianceApplicationId: string
): { ok: boolean; status: CompliancePaymentStatus; message: string; receipt?: OrganizerFinanceReceipt } {
  ensureOrganizerFinanceState(state);
  const app = state.eventComplianceApplications.find((row) => row.eventComplianceApplicationId === eventComplianceApplicationId && row.organizerId === organizerId);
  if (!app) return { ok: false, status: "Ожидает оплаты", message: "Заявка не найдена." };
  const amount = calculateComplianceFeeAmount(app.data);
  if (amount <= 0) {
    app.data.feePaid = true;
    app.data.paymentComment = "Обязательные пошлины по заявке не начисляются.";
    app.updatedAt = nowIso();
    saveState(state);
    return { ok: true, status: "Оплачено", message: "Оплата по заявке не требуется." };
  }
  const balance = Number(state.finance.organizerBalances[organizerId] || 0);
  if (balance < amount) {
    app.data.feePaid = false;
    app.data.paymentComment = "Недостаточно средств";
    app.updatedAt = nowIso();
    saveState(state);
    return { ok: false, status: "Недостаточно средств", message: "Недостаточно средств. Пополните счёт и повторите оплату." };
  }
  state.finance.organizerBalances[organizerId] = Number((balance - amount).toFixed(2));
  const receipt = createFinanceReceipt(state, organizerId, {
    eventComplianceApplicationId,
    title: `Квитанция об оплате обязательной пошлины по заявке ${eventComplianceApplicationId}`,
    amount,
    status: "оплачена",
  });
  addFinanceOperation(state, organizerId, {
    eventComplianceApplicationId,
    kind: "Оплата пошлины",
    title: `Оплата обязательной пошлины по заявке ${eventComplianceApplicationId}`,
    amount: -amount,
    status: "успешно",
    receiptId: receipt.receiptId,
  });
  app.data.feePaid = true;
  app.data.paymentComment = `Оплачено с баланса. Квитанция ${receipt.number}.`;
  if (!app.data.paymentAttachments.some((attachment) => attachment.attachmentId === receipt.receiptId)) {
    app.data.paymentAttachments.push({
      attachmentId: receipt.receiptId,
      kind: "balance-fee-receipt",
      name: receipt.title,
      uploadedAt: receipt.createdAt,
      isSample: true,
    });
  }
  app.feePaymentConfirmedByAdmin = true;
  app.updatedAt = nowIso();
  saveState(state);
  return { ok: true, status: "Оплачено", message: "Пошлина оплачена с баланса.", receipt };
}

export function upsertOrganizerApplication(
  state: AppState,
  organizerId: string,
  data: OrganizerApplicationData,
  submit: boolean
): OrganizerApplicationRecord {
  const organizerAttempts = state.organizerApplications
    .filter((x) => x.organizerId === organizerId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const latest = organizerAttempts[0];

  if (!submit && latest && latest.status === "draft") {
    latest.data = data;
    latest.updatedAt = nowIso();
    latest.adminComment = "";
    saveState(state);
    return latest;
  }

  const rec: OrganizerApplicationRecord = {
    organizerApplicationId: quickId("ORGAPP"),
    organizerId,
    status: submit ? "submitted" : "draft",
    submittedAt: submit ? nowIso() : null,
    reviewedAt: null,
    adminComment: "",
    data,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  state.organizerApplications.push(rec);
  saveState(state);
  return rec;
}

export function getOrganizerApplicationByOrganizerId(state: AppState, organizerId: string): OrganizerApplicationRecord | null {
  const attempts = state.organizerApplications
    .filter((x) => x.organizerId === organizerId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return attempts[0] || null;
}

export function getOrganizerApplicationHistory(state: AppState, organizerId: string): OrganizerApplicationRecord[] {
  return state.organizerApplications
    .filter((x) => x.organizerId === organizerId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function createPendingOrganizerAccount(
  state: AppState,
  profile: { legalName: string; registrationNumber: string; directorName: string; email: string; phone: string; login: string; password: string }
): OrganizerAccount {
  const existing = state.organizers.find((x) => x.login.toLowerCase() === profile.login.toLowerCase());
  if (existing) return existing;
  const organizer: OrganizerAccount = {
    organizerId: quickId("ORG"),
    login: profile.login.trim(),
    password: profile.password,
    name: profile.legalName,
    fullName: profile.legalName,
    unp: profile.registrationNumber,
    registryStatus: "ожидает включения",
    registryRegisteredAt: null,
    director: profile.directorName,
    email: profile.email,
    phone: profile.phone,
    accountStatus: "pending",
    feesStatus: "оплачены",
  };
  state.organizers.push(organizer);
  saveState(state);
  return organizer;
}

export function setOrganizerApplicationReview(
  state: AppState,
  organizerApplicationId: string,
  decision: "approved" | "rejected" | "needs_rework",
  comment = ""
): boolean {
  const app = state.organizerApplications.find((x) => x.organizerApplicationId === organizerApplicationId);
  if (!app) return false;
  if (app.status !== "submitted") return false;
  if ((decision === "rejected" || decision === "needs_rework") && !comment.trim()) return false;
  app.status = decision;
  app.adminComment = comment.trim();
  app.reviewedAt = nowIso();
  app.updatedAt = nowIso();
  const organizer = state.organizers.find((o) => o.organizerId === app.organizerId);
  if (organizer && decision === "approved") {
    organizer.accountStatus = "активен";
    organizer.registryStatus = "зарегистрирован в реестре";
    organizer.registryRegisteredAt = nowIso().slice(0, 10);
    const hasRegistry = state.organizerRegistry.some((r) => r.organizerId === organizer.organizerId);
    if (!hasRegistry) {
      state.organizerRegistry.push({
        organizerRegistryId: quickId("ORGREG"),
        organizerId: organizer.organizerId,
        internalNumber: `REG-${state.organizerRegistry.length + 1}`,
        includedAt: nowIso().slice(0, 10),
      });
    }
  }
  saveState(state);
  return true;
}

export function createEventComplianceApplication(
  state: AppState,
  organizerId: string,
  data: EventComplianceData,
  submit: boolean
): EventComplianceApplicationRecord {
  const normalizedTiers = normalizeComplianceTicketTiers(data);
  const canSubmit = submit && validateTicketTiers(normalizedTiers, data);
  const nextData: EventComplianceData = {
    ...data,
    eventSeats: normalizeEventSeats(data.eventSeats),
    ticketTiers: normalizedTiers,
    plannedTicketsForSale: sumTierQuantity(normalizedTiers),
    salesChannels: normalizeSalesChannels(data.salesChannels, state),
  };
  const rec: EventComplianceApplicationRecord = {
    eventComplianceApplicationId: quickId("EVAPP"),
    organizerId,
    status: canSubmit ? "submitted" : "draft",
    submittedAt: canSubmit ? nowIso() : null,
    reviewedAt: null,
    adminComment: "",
    feePaymentConfirmedByAdmin: false,
    certificateNumber: "",
    certificateDate: "",
    linkedLegacyAppId: null,
    linkedEventId: null,
    data: nextData,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  state.eventComplianceApplications.push(rec);
  saveState(state);
  return rec;
}

export function updateEventComplianceApplication(
  state: AppState,
  eventComplianceApplicationId: string,
  data: EventComplianceData,
  submit: boolean
): boolean {
  const app = state.eventComplianceApplications.find((x) => x.eventComplianceApplicationId === eventComplianceApplicationId);
  if (!app) return false;
  if (app.status === "approved" || app.status === "rejected") return false;
  if (app.status === "submitted" && !submit) return false;
  const normalizedTiers = normalizeComplianceTicketTiers(data);
  if (submit && !validateTicketTiers(normalizedTiers, data)) return false;
  const nextData: EventComplianceData = {
    ...data,
    eventSeats: normalizeEventSeats(data.eventSeats),
    ticketTiers: normalizedTiers,
    plannedTicketsForSale: sumTierQuantity(normalizedTiers),
    salesChannels: normalizeSalesChannels(data.salesChannels, state),
  };
  app.data = nextData;
  app.status = submit ? "submitted" : app.status === "needs_rework" ? "needs_rework" : "draft";
  app.submittedAt = submit ? nowIso() : app.submittedAt;
  app.updatedAt = nowIso();
  if (submit) app.adminComment = "";
  saveState(state);
  return true;
}

export function setEventComplianceReview(
  state: AppState,
  eventComplianceApplicationId: string,
  payload: {
    decision: "approved" | "rejected" | "needs_rework";
    comment?: string;
    confirmFeePayment?: boolean;
  }
): boolean {
  const app = state.eventComplianceApplications.find((x) => x.eventComplianceApplicationId === eventComplianceApplicationId);
  if (!app) return false;
  if (app.status !== "submitted") return false;
  const comment = payload.comment?.trim() || "";
  if ((payload.decision === "rejected" || payload.decision === "needs_rework") && !comment) return false;
  if (payload.decision === "approved") {
    if (getCompliancePaymentStatus(app) !== "Оплачено") return false;
    const normalizedTiers = normalizeComplianceTicketTiers(app.data);
    if (!validateTicketTiers(normalizedTiers, app.data)) return false;
  }

  app.status = payload.decision;
  app.adminComment = comment;
  app.reviewedAt = nowIso();
  app.updatedAt = nowIso();
  app.feePaymentConfirmedByAdmin = getCompliancePaymentStatus(app) === "Оплачено" || Boolean(payload.confirmFeePayment);

  if (payload.decision === "approved") {
    const now = nowIso();
    const certificateDate = now.slice(0, 10);
    app.certificateNumber = app.eventComplianceApplicationId;
    app.certificateDate = certificateDate;
    const existing = app.linkedEventId ? state.events.find((event) => event.eventId === app.linkedEventId) : null;
    const dateTime = app.data.dateSlots.find(Boolean) || "";
    const normalizedTiers = normalizeComplianceTicketTiers(app.data);
    const eventSeats = normalizeEventSeats(app.data.eventSeats);
    const capacity = eventSeats.length > 0 ? eventSeats.filter((seat) => seat.status !== "blocked").length : sumTierQuantity(normalizedTiers);
    const posterPath = app.data.posterPath || existing?.poster || "";
    const salesChannels = normalizeSalesChannels(app.data.salesChannels, state);
    app.data.salesChannels = salesChannels;
    const nextEvent: EventRecord = existing || {
      eventId: nextId(state, "evt", "EVT"),
      organizerId: app.organizerId,
      licenseId: nextId(state, "lic", "LIC"),
      appId: app.linkedLegacyAppId || app.eventComplianceApplicationId,
      complianceApplicationId: app.eventComplianceApplicationId,
      title: "",
      venue: "",
      dateTime: "",
      capacity: 0,
      tiers: [{ name: "Стандарт", price: 50, quantity: 1 }],
      city: "",
      category: "",
      description: "",
      poster: posterPath,
      salesChannels,
      status: "approved",
      remaining: 0,
      createdAt: now,
      updatedAt: now,
    };
    nextEvent.organizerId = app.organizerId;
    nextEvent.complianceApplicationId = app.eventComplianceApplicationId;
    nextEvent.title = app.data.title || "Без названия";
    nextEvent.venue = app.data.venueName || "Площадка не указана";
    nextEvent.dateTime = dateTime;
    nextEvent.capacity = capacity;
    nextEvent.tiers = normalizedTiers;
    nextEvent.venueId = app.data.venueId || undefined;
    nextEvent.hallId = app.data.hallId || undefined;
    nextEvent.layoutId = app.data.layoutId || undefined;
    nextEvent.eventSeats = eventSeats;
    nextEvent.city = "";
    nextEvent.category = app.data.eventType || "Иное";
    nextEvent.description = app.data.shortDescription;
    nextEvent.poster = posterPath;
    nextEvent.salesChannels = salesChannels;
    nextEvent.status = existing?.status || "approved";
    nextEvent.remaining = existing ? state.tickets.filter((ticket) => ticket.eventId === existing.eventId && ticket.status === "issued").length : eventSeats.filter((seat) => seat.status === "available").length;
    nextEvent.updatedAt = now;
    if (!existing) {
      state.events.push(nextEvent);
    }
    app.linkedEventId = nextEvent.eventId;
  } else {
    app.certificateNumber = "";
    app.certificateDate = "";
  }
  saveState(state);
  return true;
}

export function createApplication(
  state: AppState,
  data: {
    title: string;
    venue: string;
    dateTime: string;
    capacity: number;
    tiers: Array<{ name: string; price: number; quantity?: number }>;
    city?: string;
    category?: string;
    description?: string;
    poster?: string;
  },
  submit: boolean,
  organizerId?: string
): Application {
  const effectiveOrganizerId = organizerId || state.currentOrganizerId || LEGACY_DEFAULT_ORGANIZER_ID;
  const app: Application = {
    appId: nextId(state, "app", "APP"),
    organizerId: effectiveOrganizerId,
    ...data,
    tiers: normalizeTierRows(data.tiers, data.capacity),
    city: data.city || "",
    category: data.category || "",
    description: data.description || "",
    poster: data.poster || "",
    status: submit ? "submitted" : "draft",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  state.applications.push(app);
  saveState(state);
  return app;
}

export function submitApplication(state: AppState, appId: string): boolean {
  const app = state.applications.find((a) => a.appId === appId);
  if (!app || app.status !== "draft") return false;
  app.status = "submitted";
  app.updatedAt = new Date().toISOString();
  saveState(state);
  return true;
}

export function approveApplication(state: AppState, appId: string): { licenseId: string; eventId: string } | null {
  const app = state.applications.find((a) => a.appId === appId);
  if (!app || app.status !== "submitted") return null;
  const licenseId = nextId(state, "lic", "LIC");
  const eventId = nextId(state, "evt", "EVT");
  app.status = "approved";
  app.licenseId = licenseId;
  app.eventId = eventId;
  app.updatedAt = new Date().toISOString();
  const evt: EventRecord = {
    eventId,
    organizerId: app.organizerId,
    licenseId,
    appId,
    title: app.title,
    venue: app.venue,
    dateTime: app.dateTime,
    capacity: app.capacity,
    tiers: normalizeTierRows(app.tiers, app.capacity),
    city: app.city,
    category: app.category,
    description: app.description,
    poster: app.poster,
    salesChannels: buildDefaultSalesChannels(state),
    status: "approved",
    remaining: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  state.events.push(evt);
  saveState(state);
  return { licenseId, eventId };
}

export function rejectApplication(state: AppState, appId: string): boolean {
  const app = state.applications.find((a) => a.appId === appId);
  if (!app || app.status !== "submitted") return false;
  app.status = "rejected";
  app.updatedAt = new Date().toISOString();
  saveState(state);
  return true;
}

export function publishEvent(state: AppState, eventId: string): boolean {
  const evt = state.events.find((e) => e.eventId === eventId);
  if (!evt || evt.status !== "approved") return false;
  evt.status = "published";
  evt.updatedAt = new Date().toISOString();
  saveState(state);
  return true;
}

export function issueMarks(state: AppState, eventId: string): number {
  const evt = state.events.find((e) => e.eventId === eventId);
  if (!evt || evt.status !== "published") return 0;
  const existing = state.tickets.filter((t) => t.eventId === eventId);
  if (existing.length > 0) return 0;
  const eventSeats = normalizeEventSeats(evt.eventSeats);
  if (eventSeats.length > 0) {
    const now = new Date().toISOString();
    const sellableSeats = eventSeats.filter((seat) => seat.status !== "blocked" && seat.tariffName);
    for (const seat of sellableSeats) {
      const status: TicketStatus = seat.status === "sold" ? "sold" : "issued";
      const ticket: Ticket = {
        ticketId: nextId(state, "tck", "TCK"),
        eventId,
        tier: seat.tariffName || "Стандарт",
        status,
        seatId: seat.seatId,
        seatLabel: seat.label,
        row: seat.row,
        seatNumber: seat.number,
        createdAt: now,
        updatedAt: now,
      };
      if (status === "sold") {
        ticket.soldByChannel = "B2C";
        ticket.soldToUserId = state.users[0]?.userId;
      }
      state.tickets.push(ticket);
    }
    recalcRemaining(state, eventId);
    evt.capacity = sellableSeats.length;
    evt.tiers = normalizeSeatEventTiers(eventSeats, evt.tiers);
    evt.eventSeats = eventSeats;
    evt.updatedAt = now;
    saveState(state);
    return sellableSeats.length;
  }
  const tiers = normalizeTierRows(evt.tiers, evt.capacity).filter((tier) => tier.quantity > 0);
  const totalToIssue = sumTierQuantity(tiers);
  if (totalToIssue <= 0) return 0;
  const now = new Date().toISOString();
  for (let i = 0; i < tiers.length; i++) {
    for (let j = 0; j < tiers[i].quantity; j++) {
      state.tickets.push({
        ticketId: nextId(state, "tck", "TCK"),
        eventId,
        tier: tiers[i].name,
        status: "issued",
        createdAt: now,
        updatedAt: now,
      });
    }
  }
  recalcRemaining(state, eventId);
  evt.capacity = totalToIssue;
  evt.tiers = tiers;
  evt.updatedAt = now;
  saveState(state);
  return totalToIssue;
}

export function sellSeat(state: AppState, eventId: string, seatId: string, channel: string, userId?: string): OpOutcome {
  const event = state.events.find((item) => item.eventId === eventId && item.status === "published");
  const seat = event?.eventSeats?.find((item) => item.seatId === seatId);
  if (!event || !seat || seat.status !== "available" || !seat.tariffName) {
    const op = addOp(state, { type: "sell", eventId, channel, result: "error", reason: "Место недоступно" });
    saveState(state);
    return { ok: false, reason: "Место недоступно", op };
  }
  let ticket = state.tickets.find((item) => item.eventId === eventId && item.seatId === seatId && item.status === "issued");
  const now = new Date().toISOString();
  if (!ticket) {
    ticket = {
      ticketId: nextId(state, "tck", "TCK"),
      eventId,
      tier: seat.tariffName,
      status: "issued",
      seatId: seat.seatId,
      seatLabel: seat.label,
      row: seat.row,
      seatNumber: seat.number,
      createdAt: now,
      updatedAt: now,
    };
    state.tickets.push(ticket);
  }
  seat.status = "sold";
  ticket.status = "sold";
  ticket.tier = seat.tariffName;
  ticket.soldByChannel = channel;
  ticket.soldToUserId = userId || undefined;
  ticket.updatedAt = now;
  const op = addOp(state, { type: "sell", ticketId: ticket.ticketId, eventId, channel, result: "ok" });
  recalcRemaining(state, eventId);
  event.updatedAt = now;
  saveState(state);
  return { ok: true, ticketId: ticket.ticketId, status: ticket.status, op };
}

export function setResellerStatus(state: AppState, resellerId: string, status: ResellerStatus): boolean {
  const reseller = state.resellers.find((item) => item.resellerId === resellerId);
  if (!reseller) return false;
  reseller.status = status;
  reseller.updatedAt = nowIso();
  saveState(state);
  return true;
}

export function setResellerCommission(state: AppState, resellerId: string, commissionPercent: number): boolean {
  const reseller = state.resellers.find((item) => item.resellerId === resellerId);
  if (!reseller) return false;
  const nextValue = Math.max(0, Math.min(100, Number.isFinite(commissionPercent) ? commissionPercent : 0));
  reseller.commissionPercent = Number(nextValue.toFixed(2));
  reseller.updatedAt = nowIso();
  saveState(state);
  return true;
}

export function setPlatformCommissionPercent(state: AppState, commissionPercent: number): boolean {
  state.finance = {
    platformCommissionPercent: normalizePlatformCommissionPercent(commissionPercent),
  };
  saveState(state);
  return true;
}

export type CreateResellerInput = {
  name: string;
  code: string;
  commissionPercent?: number;
  apiConnected?: boolean;
  contractStatus?: ResellerContractStatus;
  status?: ResellerStatus;
  contactPerson?: string;
  email?: string;
  phone?: string;
  legalAddress?: string;
  registrationNumber?: string;
};

function normalizeResellerCode(code: string): string {
  return code.trim().replace(/\s+/g, "");
}

export function createReseller(state: AppState, input: CreateResellerInput): { ok: boolean; reseller?: Reseller; reason?: string } {
  const name = input.name.trim();
  const code = normalizeResellerCode(input.code);
  if (!name) return { ok: false, reason: "Название реселлера обязательно." };
  if (!code) return { ok: false, reason: "Код канала обязателен." };
  if (state.resellers.some((reseller) => reseller.code.toLowerCase() === code.toLowerCase())) {
    return { ok: false, reason: "Код канала должен быть уникальным." };
  }

  const commission = input.commissionPercent ?? 8;
  if (!Number.isFinite(commission) || commission < 0 || commission > 100) {
    return { ok: false, reason: "Комиссия должна быть от 0 до 100%." };
  }

  const now = nowIso();
  const reseller: Reseller = {
    resellerId: quickId("RESELLER"),
    name,
    code,
    status: input.status || "active",
    apiConnected: input.apiConnected ?? true,
    contractStatus: input.contractStatus || "Active",
    commissionPercent: Number(commission.toFixed(2)),
    fullName: name,
    registrationNumber: input.registrationNumber?.trim() || "",
    legalAddress: input.legalAddress?.trim() || "",
    contactPerson: input.contactPerson?.trim() || "",
    email: input.email?.trim() || "",
    phone: input.phone?.trim() || "",
    contractNumber: `TH-${code.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8)}-${new Date().getFullYear()}`,
    contractDate: now.slice(0, 10),
    apiEndpoint: `https://sandbox.api.${code.toLowerCase()}.example/v2/tickethub`,
    webhookEndpoint: `https://sandbox.${code.toLowerCase()}.example/webhooks/tickethub`,
    signatureValidation: input.apiConnected ?? true,
    lastSync: now,
    updatedAt: now,
  };
  state.resellers.push(reseller);
  saveState(state);
  return { ok: true, reseller };
}

export function updateReseller(state: AppState, resellerId: string, patch: Partial<Omit<Reseller, "resellerId">>): boolean {
  const reseller = state.resellers.find((item) => item.resellerId === resellerId);
  if (!reseller) return false;
  if (patch.code && state.resellers.some((item) => item.resellerId !== resellerId && item.code.toLowerCase() === patch.code.toLowerCase())) return false;
  Object.assign(reseller, patch, { updatedAt: nowIso() });
  if (Number.isFinite(reseller.commissionPercent)) {
    reseller.commissionPercent = Math.max(0, Math.min(100, Number(reseller.commissionPercent.toFixed(2))));
  }
  saveState(state);
  return true;
}

export interface OpOutcome {
  ok: boolean;
  reason?: string;
  ticketId?: string;
  status?: TicketStatus;
  op: OpRecord;
}

export interface ResellerSellOutcome {
  ok: boolean;
  reason?: string;
  ticketIds: string[];
}

export interface ResellerRefundOutcome {
  ok: boolean;
  reason?: string;
  ticketId?: string;
}

export function sellTicketsByReseller(
  state: AppState,
  data: { resellerCode: string; eventId: string; tierName: string; quantity: number; buyerName: string }
): ResellerSellOutcome {
  const reseller = state.resellers.find((item) => item.code === data.resellerCode);
  if (!reseller || reseller.status === "disabled") {
    return { ok: false, reason: "Реселлер отключён в Центре Управления. Demo-продажа недоступна.", ticketIds: [] };
  }
  if (!reseller.apiConnected || reseller.contractStatus !== "Active") {
    return { ok: false, reason: "API или договор реселлера не активны.", ticketIds: [] };
  }
  const event = state.events.find((item) => item.eventId === data.eventId);
  if (!event || event.status !== "published") {
    return { ok: false, reason: "Мероприятие не опубликовано или недоступно.", ticketIds: [] };
  }
  if (!isSalesChannelAllowedForEvent(state, event, reseller.code)) {
    return { ok: false, reason: "Реселлер не выбран в каналах продаж этого мероприятия.", ticketIds: [] };
  }
  const safeQuantity = Math.max(1, Math.floor(data.quantity || 1));
  const tickets = state.tickets.filter(
    (ticket) => ticket.eventId === data.eventId && ticket.tier === data.tierName && ticket.status === "issued"
  );
  if (tickets.length < safeQuantity) {
    return { ok: false, reason: "Недостаточно доступных билетов по выбранному тарифу.", ticketIds: [] };
  }

  const soldTicketIds: string[] = [];
  const now = nowIso();
  const buyer = data.buyerName.trim() || "Demo Buyer";
  tickets.slice(0, safeQuantity).forEach((ticket) => {
    ticket.status = "sold";
    ticket.soldByChannel = reseller.code;
    ticket.soldToUserId = buyer;
    ticket.updatedAt = now;
    soldTicketIds.push(ticket.ticketId);
    addOp(state, { type: "sell", ticketId: ticket.ticketId, eventId: data.eventId, channel: reseller.code, result: "ok" });
  });
  reseller.updatedAt = now;
  recalcRemaining(state, data.eventId);
  if (event) event.updatedAt = now;
  saveState(state);
  return { ok: true, ticketIds: soldTicketIds };
}

export function sell(state: AppState, eventId: string, tierName: string, channel: string, userId?: string): OpOutcome {
  const ticket = state.tickets.find((t) => t.eventId === eventId && t.tier === tierName && t.status === "issued");
  if (!ticket) {
    const op = addOp(state, { type: "sell", eventId, channel, result: "error", reason: "Нет доступных билетов" });
    saveState(state);
    return { ok: false, reason: "Нет доступных билетов", op };
  }
  ticket.status = "sold";
  ticket.soldByChannel = channel;
  ticket.soldToUserId = userId || undefined;
  ticket.updatedAt = new Date().toISOString();
  const op = addOp(state, { type: "sell", ticketId: ticket.ticketId, eventId, channel, result: "ok" });
  recalcRemaining(state, eventId);
  saveState(state);
  return { ok: true, ticketId: ticket.ticketId, status: ticket.status, op };
}

function ticketErrorReason(status: TicketStatus): string {
  switch (status) {
    case "issued": return "Билет не продан";
    case "redeemed": return "Билет уже погашен";
    case "refunded": return "Билет уже возвращён";
    default: return "Недопустимый статус";
  }
}

const REFUND_TOO_LATE_REASON = "Возврат невозможен менее чем за 24 часа до начала мероприятия";

export function getTicketRefundBlockReason(state: AppState, ticketId: string): string | null {
  const ticket = state.tickets.find((t) => t.ticketId === ticketId);
  if (!ticket) return "Билет не найден";
  if (ticket.status !== "sold") return ticketErrorReason(ticket.status);
  const event = state.events.find((item) => item.eventId === ticket.eventId);
  if (!event) return "Мероприятие не найдено";
  const eventStart = new Date(event.dateTime).getTime();
  if (!Number.isFinite(eventStart)) return "Дата мероприятия не определена";
  const hoursBeforeStart = (eventStart - Date.now()) / (1000 * 60 * 60);
  if (hoursBeforeStart <= 24) return REFUND_TOO_LATE_REASON;
  return null;
}

export function refund(state: AppState, ticketId: string, channel: string): OpOutcome {
  const ticket = state.tickets.find((t) => t.ticketId === ticketId);
  if (!ticket) {
    const op = addOp(state, { type: "refund", eventId: "", channel, result: "error", reason: "Билет не найден", ticketId });
    saveState(state);
    return { ok: false, reason: "Билет не найден", op };
  }
  const blockReason = getTicketRefundBlockReason(state, ticketId);
  if (blockReason) {
    const reason = blockReason;
    const op = addOp(state, { type: "refund", ticketId, eventId: ticket.eventId, channel, result: "error", reason });
    saveState(state);
    return { ok: false, reason, status: ticket.status, op };
  }
  ticket.status = "refunded";
  ticket.updatedAt = new Date().toISOString();
  state.demoPurchases
    .filter((purchase) => purchase.ticketId === ticketId)
    .forEach((purchase) => {
      purchase.status = "refunded";
    });
  const op = addOp(state, { type: "refund", ticketId, eventId: ticket.eventId, channel, result: "ok" });
  recalcRemaining(state, ticket.eventId);
  saveState(state);
  return { ok: true, ticketId, status: ticket.status, op };
}

export function refundTicketByReseller(state: AppState, data: { resellerCode: string; ticketId: string }): ResellerRefundOutcome {
  const reseller = state.resellers.find((item) => item.code === data.resellerCode);
  if (!reseller || reseller.status === "disabled") {
    return { ok: false, reason: "Реселлер отключён в Центре Управления. Demo-возврат недоступен." };
  }
  if (!reseller.apiConnected || reseller.contractStatus !== "Active") {
    return { ok: false, reason: "API или договор реселлера не активны." };
  }
  const ticket = state.tickets.find((item) => item.ticketId === data.ticketId);
  if (!ticket) {
    const op = addOp(state, { type: "refund", eventId: "", channel: reseller.code, result: "error", reason: "Билет не найден", ticketId: data.ticketId });
    saveState(state);
    return { ok: false, reason: "Билет не найден" };
  }
  if (ticket.soldByChannel !== reseller.code) {
    const reason = "Нельзя вернуть билет, проданный другим каналом";
    addOp(state, { type: "refund", ticketId: ticket.ticketId, eventId: ticket.eventId, channel: reseller.code, result: "error", reason });
    saveState(state);
    return { ok: false, reason };
  }
  const outcome = refund(state, data.ticketId, reseller.code);
  return outcome.ok ? { ok: true, ticketId: outcome.ticketId } : { ok: false, reason: outcome.reason };
}

export function redeem(state: AppState, ticketId: string, channel: string): OpOutcome {
  const ticket = state.tickets.find((t) => t.ticketId === ticketId);
  if (!ticket) {
    const op = addOp(state, { type: "redeem", eventId: "", channel, result: "error", reason: "Билет не найден", ticketId });
    saveState(state);
    return { ok: false, reason: "Билет не найден", op };
  }
  if (ticket.status !== "sold") {
    const reason = ticketErrorReason(ticket.status);
    const op = addOp(state, { type: "redeem", ticketId, eventId: ticket.eventId, channel, result: "error", reason });
    saveState(state);
    return { ok: false, reason, status: ticket.status, op };
  }
  ticket.status = "redeemed";
  ticket.updatedAt = new Date().toISOString();
  const op = addOp(state, { type: "redeem", ticketId, eventId: ticket.eventId, channel, result: "ok" });
  saveState(state);
  return { ok: true, ticketId, status: ticket.status, op };
}

export function verify(state: AppState, ticketId: string, channel: string): OpOutcome {
  const ticket = state.tickets.find((t) => t.ticketId === ticketId);
  if (!ticket) {
    const op = addOp(state, { type: "verify", eventId: "", channel, result: "error", reason: "Билет не найден", ticketId });
    saveState(state);
    return { ok: false, reason: "Билет не найден", op };
  }
  const op = addOp(state, { type: "verify", ticketId, eventId: ticket.eventId, channel, result: "ok" });
  saveState(state);
  return { ok: true, ticketId, status: ticket.status, op };
}

export function createDemoPurchaseTicket(
  state: AppState,
  data: { eventId: string; selectedPriceCategory: string; quantity: number; buyerName: string; seatId?: string }
): DemoPurchaseTicket | null {
  const event = state.events.find((e) => e.eventId === data.eventId && e.status === "published");
  if (!event) return null;
  if (data.seatId) {
    const outcome = sellSeat(state, data.eventId, data.seatId, "B2C", state.users[0]?.userId);
    if (!outcome.ok || !outcome.ticketId) return null;
    const seat = event.eventSeats?.find((item) => item.seatId === data.seatId);
    const [date = "", timeRaw = ""] = event.dateTime.split("T");
    const now = new Date().toISOString();
    const record: DemoPurchaseTicket = {
      ticketId: outcome.ticketId,
      eventId: event.eventId,
      eventTitle: event.title,
      date,
      time: timeRaw ? timeRaw.slice(0, 5) : "",
      city: event.city || "",
      venue: event.venue,
      buyerName: data.buyerName.trim(),
      selectedPriceCategory: seat?.tariffName || data.selectedPriceCategory,
      quantity: 1,
      seatId: seat?.seatId,
      seatLabel: seat?.label,
      row: seat?.row,
      seatNumber: seat?.number,
      purchasedAt: now,
      status: "confirmed",
    };
    state.demoPurchases.push(record);
    saveState(state);
    return record;
  }
  const safeQty = Math.max(1, Math.min(6, Math.floor(data.quantity)));
  const availableIssued = state.tickets.filter(
    (ticket) => ticket.eventId === data.eventId && ticket.tier === data.selectedPriceCategory && ticket.status === "issued"
  ).length;
  if (availableIssued < safeQty) return null;

  const soldTicketIds: string[] = [];
  for (let i = 0; i < safeQty; i++) {
    const outcome = sell(state, data.eventId, data.selectedPriceCategory, "B2C", state.users[0]?.userId);
    if (!outcome.ok || !outcome.ticketId) return null;
    soldTicketIds.push(outcome.ticketId);
  }

  const [date = "", timeRaw = ""] = event.dateTime.split("T");
  const time = timeRaw ? timeRaw.slice(0, 5) : "";
  const now = new Date().toISOString();
  const buyerName = data.buyerName.trim();
  const records = soldTicketIds.map((ticketId): DemoPurchaseTicket => ({
    ticketId,
    eventId: event.eventId,
    eventTitle: event.title,
    date,
    time,
    city: event.city || "",
    venue: event.venue,
    buyerName,
    selectedPriceCategory: data.selectedPriceCategory,
    quantity: 1,
    seatId: state.tickets.find((ticket) => ticket.ticketId === ticketId)?.seatId,
    seatLabel: state.tickets.find((ticket) => ticket.ticketId === ticketId)?.seatLabel,
    row: state.tickets.find((ticket) => ticket.ticketId === ticketId)?.row,
    seatNumber: state.tickets.find((ticket) => ticket.ticketId === ticketId)?.seatNumber,
    purchasedAt: now,
    status: "confirmed",
  }));
  state.demoPurchases.push(...records);
  saveState(state);
  return records[0] || null;
}

// ===== Organizer auth + selectors =====

export type OrganizerLoginResult =
  | { ok: true; organizer: OrganizerAccount }
  | { ok: false; reason: "invalid_credentials" };

export function loginOrganizer(state: AppState, login: string, password: string): OrganizerLoginResult {
  const normalized = login.trim().toLowerCase();
  const organizer = state.organizers.find(
    (o) => o.login.toLowerCase() === normalized && o.password === password
  );
  if (!organizer) return { ok: false, reason: "invalid_credentials" };
  state.currentOrganizerId = organizer.organizerId;
  saveState(state);
  return { ok: true, organizer };
}

export function logoutOrganizer(state: AppState): void {
  state.currentOrganizerId = null;
  saveState(state);
}

export function getCurrentOrganizer(state: AppState): OrganizerAccount | null {
  if (!state.currentOrganizerId) return null;
  return state.organizers.find((o) => o.organizerId === state.currentOrganizerId) || null;
}

export function getOrganizerRegistryRecord(state: AppState, organizerId: string): OrganizerRegistryRecord | null {
  return state.organizerRegistry.find((r) => r.organizerId === organizerId) || null;
}

export function isOrganizerApproved(state: AppState, organizerId: string): boolean {
  return Boolean(getOrganizerRegistryRecord(state, organizerId));
}

export function getMyApplications(state: AppState): Application[] {
  const organizer = getCurrentOrganizer(state);
  if (!organizer) return [];
  return state.applications.filter((a) => a.organizerId === organizer.organizerId);
}

export function getMyEvents(state: AppState): EventRecord[] {
  const organizer = getCurrentOrganizer(state);
  if (!organizer) return [];
  return state.events.filter((e) => e.organizerId === organizer.organizerId);
}

export interface OrganizerSaleRecord {
  saleId: string;
  eventId: string;
  organizerId: string;
  eventTitle: string;
  soldAt: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  channel: string;
  status: "подтверждена" | "возврат" | "погашена";
  priceCategory: string;
}

export function getMySales(state: AppState): OrganizerSaleRecord[] {
  const organizer = getCurrentOrganizer(state);
  if (!organizer) return [];
  const b2cSales = state.demoPurchases
    .map((purchase) => {
      const event = state.events.find((e) => e.eventId === purchase.eventId);
      if (!event || event.organizerId !== organizer.organizerId) return null;
      const ticket = state.tickets.find((item) => item.ticketId === purchase.ticketId);
      const tierPrice = event.tiers.find((tier) => tier.name === purchase.selectedPriceCategory)?.price ?? 0;
      const status = ticket?.status === "refunded" || purchase.status === "refunded" ? "возврат" : "подтверждена";
      return {
        saleId: purchase.ticketId,
        eventId: event.eventId,
        organizerId: organizer.organizerId,
        eventTitle: purchase.eventTitle || event.title,
        soldAt: purchase.purchasedAt,
        quantity: purchase.quantity,
        unitPrice: tierPrice,
        amount: tierPrice * purchase.quantity,
        channel: "B2C",
        status,
        priceCategory: purchase.selectedPriceCategory,
      };
    })
    .filter((row): row is OrganizerSaleRecord => row !== null);

  const resellerSales = state.tickets
    .map((ticket) => {
      if (!ticket.soldByChannel || ticket.soldByChannel === "B2C" || ticket.status === "issued") return null;
      const event = state.events.find((e) => e.eventId === ticket.eventId);
      if (!event || event.organizerId !== organizer.organizerId) return null;
      const tierPrice = event.tiers.find((tier) => tier.name === ticket.tier)?.price ?? 0;
      const soldOp = state.ops.find((op) => op.ticketId === ticket.ticketId && op.type === "sell" && op.result === "ok");
      const status =
        ticket.status === "refunded" ? "возврат" :
        ticket.status === "redeemed" ? "погашена" :
        "подтверждена";
      return {
        saleId: ticket.ticketId,
        eventId: event.eventId,
        organizerId: organizer.organizerId,
        eventTitle: event.title,
        soldAt: soldOp?.ts || ticket.updatedAt,
        quantity: 1,
        unitPrice: tierPrice,
        amount: tierPrice,
        channel: getSalesChannelLabel(state, ticket.soldByChannel),
        status,
        priceCategory: ticket.tier,
      };
    })
    .filter((row): row is OrganizerSaleRecord => row !== null);

  return [...b2cSales, ...resellerSales].sort((a, b) => b.soldAt.localeCompare(a.soldAt));
}

export function getMyOrganizerDocuments(state: AppState): OrganizerDocument[] {
  const organizer = getCurrentOrganizer(state);
  if (!organizer) return [];
  return state.organizerDocuments.filter((d) => d.organizerId === organizer.organizerId);
}
