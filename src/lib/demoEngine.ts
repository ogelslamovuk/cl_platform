import type {
  AppState,
  EventRecord,
  EventComplianceData,
  EventComplianceApplicationRecord,
  OrganizerAccount,
  OrganizerApplicationData,
  OrganizerApplicationRecord,
  MockAttachment,
  PriceTier,
} from "@/lib/store";
import {
  approveApplication,
  buildEventSeatsFromLayout,
  createApplication,
  ensureSeatMapState,
  ensureDefaultResellers,
  ensureOrganizerFinanceState,
  getSeatMapLayout,
  loadState,
  issueMarks,
  publishEvent,
  redeem,
  refund,
  resetState,
  saveState,
  sell,
  sellTicketsByReseller,
} from "@/lib/store";

const DEMO_ORGANIZERS: OrganizerAccount[] = [
  {
    organizerId: "demo_org_minskconcert",
    login: "organizer.minskconcert",
    password: "demo123",
    name: "ГУ «Минскконцерт»",
    fullName: "Государственное учреждение «Минскконцерт»",
    unp: "100600111",
    registryStatus: "зарегистрирован в реестре",
    registryRegisteredAt: "2025-02-12",
    director: "Савицкий Андрей Викторович",
    email: "minskconcert@demo.example",
    phone: "+375 (17) 300-10-10",
    accountStatus: "активен",
    feesStatus: "оплачены",
  },
  {
    organizerId: "demo_org_philharmonic",
    login: "organizer.philharmonic",
    password: "demo123",
    name: "ГУ «Белорусская государственная филармония»",
    fullName: "Государственное учреждение «Белорусская государственная ордена Трудового Красного Знамени филармония»",
    unp: "100600222",
    registryStatus: "зарегистрирован в реестре",
    registryRegisteredAt: "2025-03-20",
    director: "Ковалёва Марина Сергеевна",
    email: "philharmonic@culture-demo.example",
    phone: "+375 (17) 300-20-20",
    accountStatus: "активен",
    feesStatus: "оплачены",
  },
  {
    organizerId: "demo_org_cultural_initiative",
    login: "organizer.culture",
    password: "demo123",
    name: "ООО «Культурная инициатива Беларуси»",
    fullName: "Общество с ограниченной ответственностью «Культурная инициатива Беларуси»",
    unp: "193700333",
    registryStatus: "зарегистрирован в реестре",
    registryRegisteredAt: "2025-09-05",
    director: "Лисовская Наталья Павловна",
    email: "office@culture-initiative.example",
    phone: "+375 (29) 300-30-30",
    accountStatus: "активен",
    feesStatus: "оплачены",
  },
  {
    organizerId: "demo_org_fest_scene",
    login: "organizer.festscene",
    password: "demo123",
    name: "ЧУП «Праздничная сцена»",
    fullName: "Частное унитарное предприятие «Праздничная сцена»",
    unp: "193700444",
    registryStatus: "ожидает включения",
    registryRegisteredAt: null,
    director: "Руденко Олег Николаевич",
    email: "registry@fest-scene.example",
    phone: "+375 (33) 300-40-40",
    accountStatus: "pending",
    feesStatus: "оплачены",
  },
];

type DemoAppSeed = {
  organizerId: string;
  title: string;
  venue: string;
  city: string;
  category: string;
  description: string;
  daysOffset: number;
  time: string;
  poster: string;
  tiers: PriceTier[];
  salesChannels: string[];
  venueId: string;
  hallId: string;
  layoutId?: string;
  capacityOnly?: boolean;
};

const DEMO_POSTERS = {
  vasilkovyKraj: "/demo/posters/vasilkovy-kraj.svg",
  rodnayaZyamlya: "/demo/posters/rodnaya-zyamlya.svg",
  scenaBelarusi: "/demo/posters/scena-belarusi.svg",
  kazkiPalessya: "/demo/posters/kazki-palessya.svg",
  belarusUSertsy: "/demo/posters/belarus-u-sertsy.svg",
  slutskiePoyasa: "/demo/posters/slutskie-poyasa.svg",
  zvonyNesvizha: "/demo/posters/zvony-nesvizha.svg",
  kolaTradycyj: "/demo/posters/kola-tradycyj.svg",
  spadchynaSuchasnast: "/demo/posters/spadchyna-suchasnast.svg",
  kupalskiVianok: "/demo/posters/kupalski-vianok.svg",
  novyyaImiony: "/demo/posters/novyya-imiony.svg",
  siabroustvaKultur: "/demo/posters/siabroustva-kultur.svg",
  dnyaprovskiyaHalasy: "/demo/posters/dnyaprovskiya-halasy.svg",
  grodzenskiyaAbrysy: "/demo/posters/grodzenskiya-abrysy.svg",
  balshayaScenaGala: "/demo/posters/balshaya-scena-gala.svg",
  kamernaPesnya: "/demo/posters/kamerna-pesnya.svg",
  ratushaVechar: "/demo/posters/ratusha-vechar.svg",
} as const;

const ALL_ACTIVE_RESELLER_CHANNELS = ["OWN", "ByCard", "TicketPro", "Bezkassira"];

const DEMO_APPS: DemoAppSeed[] = [
  {
    organizerId: "demo_org_minskconcert",
    title: "Фестиваль «Васільковы край»",
    venue: "Верхний город",
    city: "Минск",
    venueId: "venue_upper_city_open",
    hallId: "hall_upper_city_open",
    capacityOnly: true,
    category: "Фестивали",
    description: "Городской фестиваль народного творчества с ремесленными рядами, музыкальными площадками и семейной программой.",
    daysOffset: 7,
    time: "18:00",
    poster: DEMO_POSTERS.vasilkovyKraj,
    tiers: [{ name: "Вход по приглашению", price: 0, quantity: 120 }, { name: "Основная зона", price: 35, quantity: 880 }, { name: "Партнёрская зона", price: 55, quantity: 200 }],
    salesChannels: ALL_ACTIVE_RESELLER_CHANNELS,
  },
  {
    organizerId: "demo_org_philharmonic",
    title: "Концерт «Песня роднай зямлі»",
    venue: "Белорусская государственная филармония",
    city: "Минск",
    venueId: "venue_demo_philharmonic",
    hallId: "hall_demo_philharmonic",
    layoutId: "layout_demo_philharmonic",
    category: "Концерты",
    description: "Торжественная программа белорусской академической и народной музыки с участием солистов и хора.",
    daysOffset: 10,
    time: "19:00",
    poster: DEMO_POSTERS.rodnayaZyamlya,
    tiers: [{ name: "Партер", price: 75, quantity: 120 }, { name: "Балкон", price: 55, quantity: 80 }, { name: "Ложа", price: 95, quantity: 40 }],
    salesChannels: ["OWN", "ByCard", "TicketPro"],
  },
  {
    organizerId: "demo_org_cultural_initiative",
    title: "Театральный форум «Сцэна Беларусі»",
    venue: "Национальный академический драматический театр имени Якуба Коласа",
    city: "Витебск",
    venueId: "venue_vitebsk_kolas",
    hallId: "hall_vitebsk_kolas",
    layoutId: "layout_vitebsk_kolas",
    category: "Театр",
    description: "Форум региональных театральных постановок и творческих встреч с профессиональными коллективами.",
    daysOffset: 12,
    time: "18:30",
    poster: DEMO_POSTERS.scenaBelarusi,
    tiers: [{ name: "Партер", price: 48, quantity: 110 }, { name: "Амфитеатр", price: 38, quantity: 70 }, { name: "Балкон", price: 28, quantity: 36 }],
    salesChannels: ["OWN", "TicketPro", "Bezkassira"],
  },
  {
    organizerId: "demo_org_fest_scene",
    title: "Детская программа «Казкі Палесся»",
    venue: "Гомельский городской центр культуры",
    city: "Гомель",
    venueId: "venue_gomel_culture_demo",
    hallId: "hall_gomel_culture_demo",
    layoutId: "layout_gomel_culture_demo",
    category: "Детям",
    description: "Познавательная детская программа по мотивам белорусских сказок, музыки и народных игр.",
    daysOffset: 14,
    time: "12:00",
    poster: DEMO_POSTERS.kazkiPalessya,
    tiers: [{ name: "Детский билет", price: 18, quantity: 160 }, { name: "Семейный сектор", price: 30, quantity: 120 }],
    salesChannels: ["OWN"],
  },
  {
    organizerId: "demo_org_minskconcert",
    title: "Концерт мастеров искусств «Беларусь у сэрцы»",
    venue: "Дворец Республики",
    city: "Минск",
    venueId: "venue_palace_demo_chamber",
    hallId: "hall_palace_demo_chamber",
    layoutId: "layout_palace_demo_chamber",
    category: "Концерты",
    description: "Большой концерт мастеров искусств с симфоническим оркестром, хором и сценической программой.",
    daysOffset: 17,
    time: "19:30",
    poster: DEMO_POSTERS.belarusUSertsy,
    tiers: [{ name: "Партер", price: 95, quantity: 160 }, { name: "Балкон", price: 70, quantity: 110 }, { name: "Галерея", price: 45, quantity: 50 }],
    salesChannels: ALL_ACTIVE_RESELLER_CHANNELS,
  },
  {
    organizerId: "demo_org_cultural_initiative",
    title: "Фестиваль ремёсел «Слуцкие пояса»",
    venue: "Дом культуры",
    city: "Слуцк",
    venueId: "venue_slutsk_crafts",
    hallId: "hall_slutsk_crafts",
    layoutId: "layout_slutsk_crafts",
    category: "Фестивали",
    description: "Фестиваль традиционных ремёсел с мастер-классами, демонстрацией тканых мотивов и выставкой работ.",
    daysOffset: 19,
    time: "15:00",
    poster: DEMO_POSTERS.slutskiePoyasa,
    tiers: [{ name: "Входной билет", price: 22, quantity: 360 }, { name: "Мастер-класс", price: 36, quantity: 120 }],
    salesChannels: ["OWN", "ByCard"],
  },
  {
    organizerId: "demo_org_philharmonic",
    title: "Музыкальный вечер «Звоны Нясвіжа»",
    venue: "Замковый комплекс «Несвиж»",
    city: "Несвиж",
    category: "Концерты",
    description: "Камерный музыкальный вечер в историко-культурном пространстве Несвижского замка.",
    daysOffset: 21,
    time: "20:00",
    poster: DEMO_POSTERS.zvonyNesvizha,
    tiers: [{ name: "Камерный зал", price: 68, quantity: 90 }, { name: "Гостевой сектор", price: 84, quantity: 50 }],
    venueId: "venue_nesvizh_castle",
    hallId: "hall_nesvizh_castle",
    layoutId: "layout_nesvizh_castle",
    salesChannels: ["OWN", "Bezkassira"],
  },
  {
    organizerId: "demo_org_fest_scene",
    title: "Хореографическая программа «Кола традыцый»",
    venue: "Гродненский областной драматический театр",
    city: "Гродно",
    venueId: "venue_grodno_drama",
    hallId: "hall_grodno_drama",
    layoutId: "layout_grodno_drama",
    category: "Шоу",
    description: "Сценическая хореографическая программа с народными танцами, современным светом и живой музыкой.",
    daysOffset: 24,
    time: "18:00",
    poster: DEMO_POSTERS.kolaTradycyj,
    tiers: [{ name: "Партер", price: 52, quantity: 120 }, { name: "Амфитеатр", price: 42, quantity: 84 }, { name: "Балкон", price: 30, quantity: 48 }],
    salesChannels: ["OWN", "TicketPro"],
  },
  {
    organizerId: "demo_org_cultural_initiative",
    title: "Выставка «Гродзенскія абрысы»",
    venue: "Центр культуры Гродно",
    city: "Гродно",
    venueId: "venue_grodno_culture",
    hallId: "hall_grodno_main",
    layoutId: "layout_grodno_culture",
    category: "Выставки",
    description: "Небольшая выставочная программа о городских формах, сценографии и современной визуальной культуре Гродно.",
    daysOffset: 25,
    time: "17:30",
    poster: DEMO_POSTERS.grodzenskiyaAbrysy,
    tiers: [{ name: "Входной билет", price: 14, quantity: 16 }, { name: "Льготный", price: 8, quantity: 4 }],
    salesChannels: ["OWN", "Bezkassira"],
  },
  {
    organizerId: "demo_org_cultural_initiative",
    title: "Выставочная программа «Спадчына і сучаснасць»",
    venue: "Брестский областной краеведческий музей",
    city: "Брест",
    venueId: "venue_brest_museum",
    hallId: "hall_brest_museum",
    layoutId: "layout_brest_museum",
    category: "Выставки",
    description: "Музейная программа о преемственности культурного наследия, архивных материалах и современном искусстве.",
    daysOffset: 26,
    time: "11:00",
    poster: DEMO_POSTERS.spadchynaSuchasnast,
    tiers: [{ name: "Взрослый", price: 16, quantity: 180 }, { name: "Льготный", price: 8, quantity: 120 }],
    salesChannels: ["OWN", "ByCard", "Bezkassira"],
  },
  {
    organizerId: "demo_org_fest_scene",
    title: "Областной праздник «Купальскі вянок»",
    venue: "Парк Подниколье",
    city: "Могилёв",
    venueId: "venue_podnikolie_park",
    hallId: "hall_podnikolie_open",
    capacityOnly: true,
    category: "Фестивали",
    description: "Областной праздник с фольклорной сценой, ремесленными подворьями и вечерней купальской программой.",
    daysOffset: 30,
    time: "17:00",
    poster: DEMO_POSTERS.kupalskiVianok,
    tiers: [{ name: "Основной вход", price: 28, quantity: 1000 }, { name: "Семейная зона", price: 40, quantity: 500 }],
    salesChannels: ALL_ACTIVE_RESELLER_CHANNELS,
  },
  {
    organizerId: "demo_org_philharmonic",
    title: "Камерный концерт «Дняпроўскія галасы»",
    venue: "Могилёвский областной дворец культуры",
    city: "Могилёв",
    venueId: "venue_mogilev_culture_palace",
    hallId: "hall_mogilev_culture_palace",
    layoutId: "layout_mogilev_culture_palace",
    category: "Концерты",
    description: "Региональная камерная программа с вокальным ансамблем, инструментальными миниатюрами и вечерним блоком у Днепра.",
    daysOffset: 31,
    time: "19:00",
    poster: DEMO_POSTERS.dnyaprovskiyaHalasy,
    tiers: [{ name: "Партер", price: 44, quantity: 96 }, { name: "Балкон", price: 32, quantity: 72 }, { name: "Льготный", price: 20, quantity: 24 }],
    salesChannels: ["OWN", "ByCard", "Bezkassira"],
  },
  {
    organizerId: "demo_org_philharmonic",
    title: "Конкурс молодых исполнителей «Новыя імёны»",
    venue: "Концертный зал «Витебск»",
    city: "Витебск",
    venueId: "venue_vitebsk_concert_hall",
    hallId: "hall_vitebsk_concert_hall",
    layoutId: "layout_vitebsk_concert_hall",
    category: "Конкурсы",
    description: "Конкурсная программа молодых исполнителей с открытыми прослушиваниями и гала-концертом лауреатов.",
    daysOffset: 33,
    time: "16:30",
    poster: DEMO_POSTERS.novyyaImiony,
    tiers: [{ name: "Основной зал", price: 26, quantity: 300 }, { name: "Балкон", price: 18, quantity: 120 }],
    salesChannels: ["OWN", "TicketPro", "Bezkassira"],
  },
  {
    organizerId: "demo_org_minskconcert",
    title: "Международная программа «Сяброўства культур»",
    venue: "Национальный центр современных искусств",
    city: "Минск",
    venueId: "venue_ncca_minsk",
    hallId: "hall_ncca_minsk",
    layoutId: "layout_ncca_minsk",
    category: "Концерты",
    description: "Международная культурная программа с белорусскими коллективами и приглашённым ансамблем.",
    daysOffset: 36,
    time: "19:00",
    poster: DEMO_POSTERS.siabroustvaKultur,
    tiers: [{ name: "Партер", price: 64, quantity: 150 }, { name: "Балкон", price: 48, quantity: 100 }, { name: "Галерея", price: 32, quantity: 50 }],
    salesChannels: ["OWN", "ByCard", "TicketPro"],
  },
];

const DEMO_ORGANIZER_IDS = new Set(DEMO_ORGANIZERS.map((organizer) => organizer.organizerId));
const REGISTERED_DEMO_ORGANIZERS = DEMO_ORGANIZERS.filter((organizer) => organizer.registryStatus === "зарегистрирован в реестре" && organizer.registryRegisteredAt);
const OLD_DEMO_ORGANIZER_IDS = new Set(["demo_org_1", "demo_org_2"]);
const TODAY_DEMO_EVENT_ID = "demo_event_today";
const TODAY_DEMO_APP_ID = "demo_app_today";
const TODAY_DEMO_CAPACITY = 50;
const TODAY_DEMO_SOLD = 47;
const TODAY_DEMO_TIER = { name: "Камерный зал", price: 45, quantity: TODAY_DEMO_CAPACITY };
const SOLD_OUT_DEMO_EVENT_ID = "demo_event_sold_out";
const SOLD_OUT_DEMO_APP_ID = "demo_app_sold_out";
const SOLD_OUT_DEMO_CAPACITY = 36;
const SOLD_OUT_DEMO_TIER = { name: "Малый зал", price: 32, quantity: SOLD_OUT_DEMO_CAPACITY };
const APPROVED_UNPUBLISHED_EVENT_ID = "demo_event_approved_unpublished";
const APPROVED_UNPUBLISHED_APP_ID = "demo_app_approved_unpublished";
const APPROVED_UNPUBLISHED_TIER = { name: "Основной билет", price: 40, quantity: 120 };
const OLD_DEMO_PHRASES = [
  "\u041e\u0433\u043d\u0438 \u041d\u0435\u0432\u044b",
  "\u042d\u0445\u043e \u0433\u043e\u0440\u043e\u0434\u0430",
  "\u041b\u0435\u0442\u043d\u0438\u0439 \u0438\u043c\u043f\u0443\u043b\u044c\u0441",
  "\u041d\u043e\u0447\u043d\u043e\u0439 \u043f\u0440\u043e\u0441\u043f\u0435\u043a\u0442",
  "\u041f\u043b\u0430\u043d\u0435\u0442\u0430 \u0438\u0433\u0440",
  "\u0413\u043e\u0440\u043e\u0434 \u0438 \u0434\u0436\u0430\u0437",
  ["City", "Lights"].join(" "),
  ["Aurum", "Quartet"].join(" "),
  "\u0421\u0435\u0432\u0435\u0440\u043d\u044b\u0439 \u0421\u0432\u0435\u0442 \u0418\u0432\u0435\u043d\u0442",
  "\u0413\u043e\u0440\u043e\u0434\u0441\u043a\u0430\u044f \u0410\u0444\u0438\u0448\u0430",
];

const DEMO_ORGANIZER_DOCUMENT_TEMPLATES: Array<Omit<AppState["organizerDocuments"][number], "organizerId" | "updatedAt">> = [
  { documentId: "DOC-REGISTRY", title: "Выписка из реестра организаторов мероприятий", type: "реестр", status: "доступен" },
  { documentId: "DOC-CHARTER", title: "Устав организации или положение учреждения", type: "устав", status: "доступен" },
  { documentId: "DOC-PLATFORM", title: "Договор с платформой Центр Управления", type: "договор", status: "доступен" },
  { documentId: "DOC-DETAILS", title: "Регистрационные данные и реквизиты", type: "регистрация", status: "доступен" },
  { documentId: "DOC-FEES", title: "Подтверждение оплаты государственных пошлин", type: "пошлина", status: "доступен" },
];

function hasOldDemoPhrase(value: string | null | undefined): boolean {
  const text = value || "";
  return OLD_DEMO_PHRASES.some((phrase) => text.includes(phrase));
}

function cleanupLegacyDemoData(state: AppState): void {
  const legacyEventIds = new Set(state.events.filter((event) => hasOldDemoPhrase(event.title)).map((event) => event.eventId));
  const legacyAppIds = new Set(state.applications.filter((app) => hasOldDemoPhrase(app.title)).map((app) => app.appId));
  const legacyResellerCodes = new Set([["Kv", "itkiBY"].join("")]);

  state.events = state.events.filter((event) => !legacyEventIds.has(event.eventId));
  state.applications = state.applications.filter((app) => !legacyAppIds.has(app.appId) && !legacyEventIds.has(app.eventId || ""));
  state.tickets = state.tickets.filter((ticket) => !legacyEventIds.has(ticket.eventId) && !legacyResellerCodes.has(ticket.soldByChannel || ""));
  state.ops = state.ops.filter((op) => !legacyEventIds.has(op.eventId) && !legacyResellerCodes.has(op.channel) && op.ticketId !== "DEMO-MISSING-TICKET");
  state.demoPurchases = state.demoPurchases.filter((purchase) => !legacyEventIds.has(purchase.eventId) && !hasOldDemoPhrase(purchase.eventTitle));
  state.eventComplianceApplications = state.eventComplianceApplications.filter((app) => !hasOldDemoPhrase(app.data.title));
  state.organizerRegistry = state.organizerRegistry.filter((row) => !OLD_DEMO_ORGANIZER_IDS.has(row.organizerId));
  state.organizerDocuments = state.organizerDocuments.filter((doc) => !OLD_DEMO_ORGANIZER_IDS.has(doc.organizerId));
  state.organizers = state.organizers.filter((organizer) => !OLD_DEMO_ORGANIZER_IDS.has(organizer.organizerId) && !hasOldDemoPhrase(organizer.name) && !hasOldDemoPhrase(organizer.fullName));
  state.resellers = state.resellers.filter((reseller) => !legacyResellerCodes.has(reseller.code));
}

function ensureDemoOrganizerDocuments(state: AppState): void {
  const now = new Date().toISOString();
  for (const organizer of state.organizers.filter((item) => DEMO_ORGANIZER_IDS.has(item.organizerId))) {
    for (const template of DEMO_ORGANIZER_DOCUMENT_TEMPLATES) {
      const documentId = organizer.organizerId + "-" + template.documentId;
      const existing = state.organizerDocuments.find((doc) => doc.documentId === documentId);
      const nextDoc = { ...template, documentId, organizerId: organizer.organizerId, updatedAt: now };
      if (existing) Object.assign(existing, nextDoc);
      else state.organizerDocuments.push(nextDoc);
    }
  }
}

function toDateTime(daysOffset: number, time: string): string {
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  base.setDate(base.getDate() + daysOffset);
  const [h, m] = time.split(":").map(Number);
  base.setHours(h || 0, m || 0, 0, 0);
  const year = base.getFullYear();
  const month = String(base.getMonth() + 1).padStart(2, "0");
  const day = String(base.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}T${time}`;
}

function cloneDemoTiers(tiers: PriceTier[]): PriceTier[] {
  return tiers.map((tier) => ({ ...tier }));
}

function summarizeEventSeatTiers(eventSeats: NonNullable<EventRecord["eventSeats"]>, fallbackTiers: PriceTier[]): PriceTier[] {
  const fallbackByName = new Map(fallbackTiers.map((tier) => [tier.name, tier]));
  const counts = new Map<string, PriceTier>();
  for (const seat of eventSeats) {
    if (seat.status === "blocked") continue;
    const name = seat.tariffName || fallbackTiers[0]?.name || "Стандарт";
    const source = fallbackByName.get(name) || fallbackTiers[0] || { name, price: 0, quantity: 0 };
    const existing = counts.get(name);
    if (existing) existing.quantity += 1;
    else counts.set(name, { ...source, name, price: Number(seat.price ?? source.price ?? 0), quantity: 1, color: seat.color || source.color });
  }
  return counts.size ? Array.from(counts.values()) : cloneDemoTiers(fallbackTiers);
}

function resolveSeedInventory(state: AppState, seed: DemoAppSeed): { capacity: number; tiers: PriceTier[]; eventSeats: NonNullable<EventRecord["eventSeats"]> } {
  if (seed.capacityOnly || !seed.layoutId) {
    const tiers = cloneDemoTiers(seed.tiers);
    return { capacity: tiers.reduce((acc, tier) => acc + tier.quantity, 0), tiers, eventSeats: [] };
  }
  const layout = getSeatMapLayout(state, seed.layoutId);
  if (!layout) {
    const tiers = cloneDemoTiers(seed.tiers);
    return { capacity: tiers.reduce((acc, tier) => acc + tier.quantity, 0), tiers, eventSeats: [] };
  }
  const eventSeats = buildEventSeatsFromLayout(layout, seed.tiers).map((seat) => ({ ...seat, status: "available" as const }));
  const tiers = summarizeEventSeatTiers(eventSeats, seed.tiers);
  return {
    capacity: eventSeats.filter((seat) => seat.status !== "blocked").length,
    tiers,
    eventSeats,
  };
}

function clearSeedEventTickets(state: AppState, eventId: string): void {
  state.tickets = state.tickets.filter((ticket) => ticket.eventId !== eventId);
  state.ops = state.ops.filter((op) => op.eventId !== eventId);
  state.demoPurchases = state.demoPurchases.filter((purchase) => purchase.eventId !== eventId);
}

function applySeedEventDetails(state: AppState, event: EventRecord, seed: DemoAppSeed): void {
  const previousSeatCount = event.eventSeats?.length || 0;
  const previousLayoutId = event.layoutId || "";
  const previousCapacity = event.capacity || 0;
  const inventory = resolveSeedInventory(state, seed);
  const venue = state.venueRegistry.find((item) => item.venueId === seed.venueId);
  const hall = venue?.halls.find((item) => item.hallId === seed.hallId);
  const shouldRefreshTickets =
    previousLayoutId !== (seed.layoutId || "") ||
    previousSeatCount !== inventory.eventSeats.length ||
    previousCapacity !== inventory.capacity;

  event.venue = venue?.name || seed.venue;
  event.city = venue?.city || seed.city;
  event.category = seed.category;
  event.description = seed.description;
  event.poster = seed.poster;
  event.tiers = inventory.tiers;
  event.capacity = inventory.capacity;
  event.venueId = seed.venueId;
  event.hallId = seed.hallId;
  event.layoutId = seed.capacityOnly ? undefined : seed.layoutId;
  event.eventSeats = seed.capacityOnly ? [] : inventory.eventSeats;
  event.salesChannels = [...seed.salesChannels];
  event.remaining = state.tickets.filter((ticket) => ticket.eventId === event.eventId && ticket.status === "issued").length;
  if (hall && !seed.capacityOnly && event.eventSeats.length > hall.capacity) hall.capacity = event.eventSeats.length;
  if (shouldRefreshTickets) {
    clearSeedEventTickets(state, event.eventId);
    event.remaining = 0;
  }
}

function buildBaselineState(): AppState {
  return loadState();
}

function todayYmd(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function todayDateTime(time = "20:00"): string {
  return `${todayYmd()}T${time}`;
}

function ensureTodayNearSoldOutEvent(state: AppState): void {
  const now = new Date().toISOString();
  const organizerId = "demo_org_philharmonic";
  const eventTitle = "Камерный концерт «Песня роднай зямлі»";
  const tiers = [{ ...TODAY_DEMO_TIER }];

  let app = state.applications.find((item) => item.appId === TODAY_DEMO_APP_ID);
  if (!app) {
    app = {
      appId: TODAY_DEMO_APP_ID,
      organizerId,
      title: eventTitle,
      venue: "Белорусская государственная филармония",
      dateTime: todayDateTime(),
      capacity: TODAY_DEMO_CAPACITY,
      tiers,
      city: "Минск",
      category: "Концерты",
      description: "Камерная программа белорусской академической и народной музыки.",
      poster: DEMO_POSTERS.kamernaPesnya,
      status: "approved",
      licenseId: "LIC-DEMO-TODAY",
      eventId: TODAY_DEMO_EVENT_ID,
      createdAt: now,
      updatedAt: now,
    };
    state.applications.push(app);
  } else {
    Object.assign(app, {
      organizerId,
      title: eventTitle,
      venue: "Белорусская государственная филармония",
      dateTime: todayDateTime(),
      capacity: TODAY_DEMO_CAPACITY,
      tiers,
      city: "Минск",
      category: "Концерты",
      description: "Камерная программа белорусской академической и народной музыки.",
      poster: DEMO_POSTERS.kamernaPesnya,
      status: "approved",
      licenseId: app.licenseId || "LIC-DEMO-TODAY",
      eventId: TODAY_DEMO_EVENT_ID,
      updatedAt: now,
    });
  }

  const nextEvent = {
    eventId: TODAY_DEMO_EVENT_ID,
    organizerId,
    licenseId: "LIC-DEMO-TODAY",
    appId: TODAY_DEMO_APP_ID,
    title: eventTitle,
    venue: "Белорусская государственная филармония",
    dateTime: todayDateTime(),
    capacity: TODAY_DEMO_CAPACITY,
    tiers,
    city: "Минск",
    category: "Концерты",
    description: "Камерная программа белорусской академической и народной музыки.",
    poster: DEMO_POSTERS.kamernaPesnya,
    salesChannels: ["OWN", "ByCard", "TicketPro"],
    status: "published" as const,
    remaining: TODAY_DEMO_CAPACITY - TODAY_DEMO_SOLD,
    createdAt: now,
    updatedAt: now,
  };

  const existingEvent = state.events.find((event) => event.eventId === TODAY_DEMO_EVENT_ID);
  if (existingEvent) Object.assign(existingEvent, nextEvent, { createdAt: existingEvent.createdAt || now });
  else state.events.push(nextEvent);

  state.tickets = state.tickets.filter((ticket) => ticket.eventId !== TODAY_DEMO_EVENT_ID);
  state.ops = state.ops.filter((op) => op.eventId !== TODAY_DEMO_EVENT_ID);

  for (let index = 1; index <= TODAY_DEMO_CAPACITY; index++) {
    const sold = index <= TODAY_DEMO_SOLD;
    const ticketId = `${TODAY_DEMO_EVENT_ID}_ticket_${String(index).padStart(3, "0")}`;
    state.tickets.push({
      ticketId,
      eventId: TODAY_DEMO_EVENT_ID,
      tier: TODAY_DEMO_TIER.name,
      status: sold ? "sold" : "issued",
      soldByChannel: sold ? "B2C" : undefined,
      soldToUserId: sold ? "demo_user_1" : undefined,
      createdAt: now,
      updatedAt: now,
    });
    if (sold) {
      state.ops.push({
        opId: `demo_today_sell_${String(index).padStart(3, "0")}`,
        type: "sell",
        ticketId,
        eventId: TODAY_DEMO_EVENT_ID,
        channel: "B2C",
        result: "ok",
        ts: now,
      });
    }
  }
}

function ensureSoldOutEvent(state: AppState): void {
  const now = new Date().toISOString();
  const organizerId = "demo_org_cultural_initiative";
  const eventTitle = "Спектакль «Тёплый вечер у ратуши»";
  const dateTime = toDateTime(9, "19:00");
  const tiers = [{ ...SOLD_OUT_DEMO_TIER }];

  const nextApp = {
    appId: SOLD_OUT_DEMO_APP_ID,
    organizerId,
    title: eventTitle,
    venue: "Минский областной театр",
    dateTime,
    capacity: SOLD_OUT_DEMO_CAPACITY,
    tiers,
    city: "Минск",
    category: "Театр",
    description: "Камерный театральный вечер с полностью реализованной квотой билетов.",
    poster: DEMO_POSTERS.ratushaVechar,
    status: "approved" as const,
    licenseId: "LIC-DEMO-SOLDOUT",
    eventId: SOLD_OUT_DEMO_EVENT_ID,
    createdAt: now,
    updatedAt: now,
  };
  const existingApp = state.applications.find((item) => item.appId === SOLD_OUT_DEMO_APP_ID);
  if (existingApp) Object.assign(existingApp, nextApp, { createdAt: existingApp.createdAt || now });
  else state.applications.push(nextApp);

  const nextEvent = {
    eventId: SOLD_OUT_DEMO_EVENT_ID,
    organizerId,
    licenseId: "LIC-DEMO-SOLDOUT",
    appId: SOLD_OUT_DEMO_APP_ID,
    title: eventTitle,
    venue: "Минский областной театр",
    dateTime,
    capacity: SOLD_OUT_DEMO_CAPACITY,
    tiers,
    city: "Минск",
    category: "Театр",
    description: "Камерный театральный вечер с полностью реализованной квотой билетов.",
    poster: DEMO_POSTERS.ratushaVechar,
    salesChannels: ["OWN", "ByCard"],
    status: "published" as const,
    remaining: 0,
    createdAt: now,
    updatedAt: now,
  };
  const existingEvent = state.events.find((event) => event.eventId === SOLD_OUT_DEMO_EVENT_ID);
  if (existingEvent) Object.assign(existingEvent, nextEvent, { createdAt: existingEvent.createdAt || now });
  else state.events.push(nextEvent);

  state.tickets = state.tickets.filter((ticket) => ticket.eventId !== SOLD_OUT_DEMO_EVENT_ID);
  state.ops = state.ops.filter((op) => op.eventId !== SOLD_OUT_DEMO_EVENT_ID);

  for (let index = 1; index <= SOLD_OUT_DEMO_CAPACITY; index++) {
    const ticketId = `${SOLD_OUT_DEMO_EVENT_ID}_ticket_${String(index).padStart(3, "0")}`;
    state.tickets.push({
      ticketId,
      eventId: SOLD_OUT_DEMO_EVENT_ID,
      tier: SOLD_OUT_DEMO_TIER.name,
      status: "sold",
      soldByChannel: index % 2 === 0 ? "ByCard" : "B2C",
      soldToUserId: "demo_sold_out_buyer",
      createdAt: now,
      updatedAt: now,
    });
    state.ops.push({
      opId: `demo_sold_out_sell_${String(index).padStart(3, "0")}`,
      type: "sell",
      ticketId,
      eventId: SOLD_OUT_DEMO_EVENT_ID,
      channel: index % 2 === 0 ? "ByCard" : "B2C",
      result: "ok",
      ts: now,
    });
  }
}

function ensureApprovedUnpublishedEvent(state: AppState): void {
  const now = new Date().toISOString();
  const organizerId = "demo_org_minskconcert";
  const eventTitle = "Вечер симфонической музыки";
  const dateTime = toDateTime(15, "19:30");
  const tiers = [{ ...APPROVED_UNPUBLISHED_TIER }];
  const layout = getSeatMapLayout(state, "layout_grand_theatre_v2");
  const eventSeats = layout ? buildEventSeatsFromLayout(layout, tiers).map((seat) => ({ ...seat, status: "available" as const })) : [];
  const tierCounts = eventSeats.length > 0
    ? tiers.map((tier) => ({
        ...tier,
        quantity: eventSeats.filter((seat) => seat.status !== "blocked" && seat.tariffName === tier.name).length,
      }))
    : tiers;
  const capacity = eventSeats.length > 0 ? eventSeats.filter((seat) => seat.status !== "blocked").length : APPROVED_UNPUBLISHED_TIER.quantity;

  const nextApp = {
    appId: APPROVED_UNPUBLISHED_APP_ID,
    organizerId,
    title: eventTitle,
    venue: "Большая концертная сцена",
    dateTime,
    capacity,
    tiers: tierCounts,
    city: "Минск",
    category: "Концерты",
    description: "Одобренное мероприятие, которое ещё не опубликовано и не выпустило билеты.",
    poster: DEMO_POSTERS.balshayaScenaGala,
    status: "approved" as const,
    licenseId: "LIC-DEMO-APPROVED",
    eventId: APPROVED_UNPUBLISHED_EVENT_ID,
    createdAt: now,
    updatedAt: now,
  };
  const existingApp = state.applications.find((item) => item.appId === APPROVED_UNPUBLISHED_APP_ID);
  if (existingApp) Object.assign(existingApp, nextApp, { createdAt: existingApp.createdAt || now });
  else state.applications.push(nextApp);

  const nextEvent = {
    eventId: APPROVED_UNPUBLISHED_EVENT_ID,
    organizerId,
    licenseId: "LIC-DEMO-APPROVED",
    appId: APPROVED_UNPUBLISHED_APP_ID,
    title: eventTitle,
    venue: "Большая концертная сцена",
    dateTime,
    capacity,
    tiers: tierCounts,
    city: "Минск",
    category: "Концерты",
    description: "Одобренное мероприятие, которое ещё не опубликовано и не выпустило билеты.",
    poster: DEMO_POSTERS.balshayaScenaGala,
    salesChannels: ["OWN", "ByCard", "TicketPro"],
    status: "approved" as const,
    remaining: eventSeats.filter((seat) => seat.status === "available").length,
    venueId: "venue_grand_theatre_v2",
    hallId: "hall_grand_theatre_v2",
    layoutId: "layout_grand_theatre_v2",
    eventSeats,
    createdAt: now,
    updatedAt: now,
  };
  const existingEvent = state.events.find((event) => event.eventId === APPROVED_UNPUBLISHED_EVENT_ID);
  if (existingEvent) Object.assign(existingEvent, nextEvent, { createdAt: existingEvent.createdAt || now });
  else state.events.push(nextEvent);

  state.tickets = state.tickets.filter((ticket) => ticket.eventId !== APPROVED_UNPUBLISHED_EVENT_ID);
  state.ops = state.ops.filter((op) => op.eventId !== APPROVED_UNPUBLISHED_EVENT_ID);
}

function seedDemoCatalog(state: AppState): AppState {
  ensureDefaultResellers(state);
  ensureSeatMapState(state);
  cleanupLegacyDemoData(state);
  state.organizers = DEMO_ORGANIZERS.map((organizer) => ({ ...organizer }));
  ensureOrganizerFinanceState(state);
  state.organizerRegistry = REGISTERED_DEMO_ORGANIZERS.map((organizer, index) => ({
    organizerRegistryId: "DEMO-ORGREG-" + String(index + 1).padStart(3, "0"),
    organizerId: organizer.organizerId,
    internalNumber: "DEMO-REG-" + String(index + 1).padStart(3, "0"),
    includedAt: organizer.registryRegisteredAt || todayYmd(),
  }));
  state.organizerDocuments = [];
  ensureDemoOrganizerDocuments(state);
  state.currentOrganizerId = null;

  for (const seed of DEMO_APPS) {
    const inventory = resolveSeedInventory(state, seed);
    const app = createApplication(
      state,
      {
        title: seed.title,
        venue: seed.venue,
        dateTime: toDateTime(seed.daysOffset, seed.time),
        capacity: inventory.capacity,
        tiers: inventory.tiers,
        city: seed.city,
        category: seed.category,
        description: seed.description,
        poster: seed.poster,
      },
      true,
      seed.organizerId,
    );
    const approved = approveApplication(state, app.appId);
    if (!approved) continue;
    const event = state.events.find((item) => item.eventId === approved.eventId);
    if (event) applySeedEventDetails(state, event, seed);
    publishEvent(state, approved.eventId);
    issueMarks(state, approved.eventId);
  }

  ensureOrganizerApplications(state);
  ensureEventComplianceApplications(state);
  ensureSeatMapDemoEvent(state);
  ensureTodayNearSoldOutEvent(state);
  ensureSoldOutEvent(state);
  ensureApprovedUnpublishedEvent(state);
  ensureCertificatesForPublishedEvents(state);
  ensureDemoTicketOperations(state);
  saveState(state);
  return state;
}

export function resetDemoData(): AppState {
  resetState();
  const baseline = buildBaselineState();
  saveState(baseline);
  return baseline;
}

export function generateDemoData(): AppState {
  const state = buildBaselineState();
  enrichDemoData(state);
  saveState(state);
  return state;
}

export function ensureSeatMapDemoFlow(state: AppState): AppState {
  ensureDefaultResellers(state);
  ensureSeatMapState(state);
  ensureDemoOrganizers(state);
  ensureOrganizerRegistry(state);
  ensureDemoOrganizerDocuments(state);
  ensureSeatMapDemoEvent(state);
  ensureApprovedUnpublishedEvent(state);
  ensureCertificatesForPublishedEvents(state);
  ensureTicketsForPublishedEvents(state);
  saveState(state);
  return state;
}

function enrichDemoData(state: AppState): void {
  ensureDefaultResellers(state);
  cleanupLegacyDemoData(state);
  ensureDemoOrganizers(state);
  ensureOrganizerFinanceState(state);
  ensureOrganizerRegistry(state);
  ensureDemoOrganizerDocuments(state);
  ensureSeatMapState(state);
  ensureSeedPublishedEvents(state);
  ensureSeatMapDemoEvent(state);
  ensureOrganizerApplications(state);
  ensureEventComplianceApplications(state);
  ensureTodayNearSoldOutEvent(state);
  ensureSoldOutEvent(state);
  ensureApprovedUnpublishedEvent(state);
  ensureCertificatesForPublishedEvents(state);
  ensureTicketsForPublishedEvents(state);
  ensureDemoTicketOperations(state);
}

function ensureDemoOrganizers(state: AppState): void {
  for (const demo of DEMO_ORGANIZERS) {
    const existing = state.organizers.find((o) => o.organizerId === demo.organizerId || o.login === demo.login);
    if (!existing) {
      state.organizers.push({ ...demo });
      continue;
    }
    Object.assign(existing, demo);
  }
  ensureOrganizerFinanceState(state);
}

function ensureOrganizerRegistry(state: AppState): void {
  const registeredIds = new Set(REGISTERED_DEMO_ORGANIZERS.map((organizer) => organizer.organizerId));
  state.organizerRegistry = state.organizerRegistry.filter((row) => !DEMO_ORGANIZER_IDS.has(row.organizerId) || registeredIds.has(row.organizerId));

  for (const [index, organizer] of REGISTERED_DEMO_ORGANIZERS.entries()) {
    const existing = state.organizerRegistry.find((r) => r.organizerId === organizer.organizerId);
    const nextRecord = {
      organizerRegistryId: "DEMO-ORGREG-" + String(index + 1).padStart(3, "0"),
      organizerId: organizer.organizerId,
      internalNumber: "DEMO-REG-" + String(index + 1).padStart(3, "0"),
      includedAt: organizer.registryRegisteredAt || todayYmd(),
    };
    if (existing) Object.assign(existing, nextRecord);
    else state.organizerRegistry.push(nextRecord);
  }
}

function ensureSeedPublishedEvents(state: AppState): void {
  for (const seed of DEMO_APPS) {
    const existingEvent = state.events.find((event) => event.organizerId === seed.organizerId && event.title === seed.title);
    if (existingEvent) {
      existingEvent.dateTime ||= toDateTime(seed.daysOffset, seed.time);
      applySeedEventDetails(state, existingEvent, seed);
      existingEvent.status = "published";
      if (!state.tickets.some((ticket) => ticket.eventId === existingEvent.eventId)) issueMarks(state, existingEvent.eventId);
      continue;
    }
    const inventory = resolveSeedInventory(state, seed);
    const app = createApplication(
      state,
      {
        title: seed.title,
        venue: seed.venue,
        dateTime: toDateTime(seed.daysOffset, seed.time),
        capacity: inventory.capacity,
        tiers: inventory.tiers,
        city: seed.city,
        category: seed.category,
        description: seed.description,
        poster: seed.poster,
      },
      true,
      seed.organizerId,
    );
    const approved = approveApplication(state, app.appId);
    if (!approved) continue;
    const event = state.events.find((item) => item.eventId === approved.eventId);
    if (event) applySeedEventDetails(state, event, seed);
    publishEvent(state, approved.eventId);
    issueMarks(state, approved.eventId);
  }
}

function ensureSeatMapDemoEvent(state: AppState): void {
  const existing = state.events.find((event) => event.eventId === "EVT-SEAT-MAP-DEMO");
  const layout = getSeatMapLayout(state, "layout_grand_theatre_v2");
  if (!layout) return;
  const tiers: PriceTier[] = [
    { name: "VIP", price: 180, quantity: 0, color: "#F59E0B" },
    { name: "Партер", price: 110, quantity: 0, color: "#2563EB" },
    { name: "Балкон", price: 65, quantity: 0, color: "#7C3AED" },
    { name: "Ложа", price: 240, quantity: 0, color: "#EA580C" },
  ];
  const seats = buildEventSeatsFromLayout(layout, tiers).map((seat, index) => ({
    ...seat,
    status: [7, 19, 86, 149, 203].includes(index)
      ? "sold" as const
      : [142, 233, 271].includes(index)
        ? "blocked" as const
        : "available" as const,
  }));
  const tierCounts = tiers.map((tier) => ({
    ...tier,
    quantity: seats.filter((seat) => seat.status !== "blocked" && seat.tariffName === tier.name).length,
  }));
  const now = new Date().toISOString();
  const next = existing || {
    eventId: "EVT-SEAT-MAP-DEMO",
    organizerId: "demo_org_minskconcert",
    licenseId: "LIC-SEAT-MAP-DEMO",
    appId: "EVAPP-SEAT-MAP-DEMO",
    complianceApplicationId: "EVAPP-SEAT-MAP-DEMO",
    title: "Гала-концерт в Большой концертной сцене",
    venue: "Большая концертная сцена",
    dateTime: toDateTime(16, "19:00"),
    capacity: 0,
    tiers: tierCounts,
    city: "Минск",
    category: "Концерты",
    description: "Концертное событие с партером, боковыми секторами, балконом, ложами и продажей мест по схеме.",
    poster: DEMO_POSTERS.balshayaScenaGala,
    salesChannels: ALL_ACTIVE_RESELLER_CHANNELS,
    status: "published" as const,
    remaining: 0,
    venueId: "venue_grand_theatre_v2",
    hallId: "hall_grand_theatre_v2",
    layoutId: "layout_grand_theatre_v2",
    eventSeats: seats,
    createdAt: now,
    updatedAt: now,
  };
  Object.assign(next, {
    title: "Гала-концерт в Большой концертной сцене",
    venue: "Большая концертная сцена",
    description: "Концертное событие с партером, боковыми секторами, балконом, ложами и продажей мест по схеме.",
    venueId: "venue_grand_theatre_v2",
    hallId: "hall_grand_theatre_v2",
    layoutId: "layout_grand_theatre_v2",
    capacity: seats.filter((seat) => seat.status !== "blocked").length,
    tiers: tierCounts,
    remaining: seats.filter((seat) => seat.status === "available").length,
    eventSeats: seats,
    updatedAt: now,
  });
  if (!existing) state.events.push(next);
  const existingSeatTickets = state.tickets.filter((ticket) => ticket.eventId === next.eventId);
  if (existingSeatTickets.length > 0 && !existingSeatTickets.some((ticket) => seats.some((seat) => seat.seatId === ticket.seatId))) {
    state.tickets = state.tickets.filter((ticket) => ticket.eventId !== next.eventId);
    state.demoPurchases = state.demoPurchases.filter((purchase) => purchase.eventId !== next.eventId);
    state.ops = state.ops.filter((operation) => operation.eventId !== next.eventId);
  }
  if (!state.tickets.some((ticket) => ticket.eventId === next.eventId)) issueMarks(state, next.eventId);
  const existingCompliance = state.eventComplianceApplications.find((app) => app.eventComplianceApplicationId === "EVAPP-SEAT-MAP-DEMO");
  if (!existingCompliance) {
    state.eventComplianceApplications.push({
      eventComplianceApplicationId: "EVAPP-SEAT-MAP-DEMO",
      organizerId: "demo_org_minskconcert",
      status: "approved",
      submittedAt: now,
      reviewedAt: now,
      adminComment: "",
      feePaymentConfirmedByAdmin: true,
      certificateNumber: "EVAPP-SEAT-MAP-DEMO",
      certificateDate: now.slice(0, 10),
      linkedLegacyAppId: null,
      linkedEventId: next.eventId,
      data: {
        title: next.title,
        eventType: "концерт",
        shortDescription: next.description,
        program: "Демо-программа для проверки схемы мест.",
        posterPath: next.poster,
        salesChannels: next.salesChannels,
        dateSlots: [next.dateTime],
        venueName: next.venue,
        venueAddress: "пр-т Независимости, 25",
        venueId: "venue_grand_theatre_v2",
        hallId: "hall_grand_theatre_v2",
        layoutId: "layout_grand_theatre_v2",
        eventSeats: seats,
        performers: [],
        onlyBelarusianPerformers: true,
        hasForeignPerformers: false,
        venueType: "концертный зал",
        projectedCapacity: next.capacity,
        plannedTicketsForSale: next.capacity,
        ticketTiers: tierCounts,
        ageCategory: "6+",
        ageComment: "",
        approvalMode: "certificate_required",
        approvalBasis: "",
        eventDocuments: [],
        salesStartDate: todayYmd(),
        feeExempt: false,
        feeExemptReason: "",
        feePaid: true,
        paymentAttachments: [],
        paymentComment: "",
        adRestrictionConfirmed: true,
        cancelled: false,
        changesDeclared: false,
        executiveCommitteeNotified: false,
        citizensNotified: false,
        notificationsAttachment: [],
        cancellationComment: "",
      },
      createdAt: now,
      updatedAt: now,
    });
  } else {
    existingCompliance.data.venueName = next.venue;
    existingCompliance.data.venueAddress = "пр-т Независимости, 25";
    existingCompliance.data.venueId = "venue_grand_theatre_v2";
    existingCompliance.data.hallId = "hall_grand_theatre_v2";
    existingCompliance.data.layoutId = "layout_grand_theatre_v2";
    existingCompliance.data.eventSeats = seats;
    existingCompliance.data.ticketTiers = tierCounts;
    existingCompliance.data.projectedCapacity = next.capacity;
    existingCompliance.data.plannedTicketsForSale = next.capacity;
    existingCompliance.updatedAt = now;
  }
}

type DemoOrganizerApplicationSeed = {
  id: string;
  organizerId: string;
  status: OrganizerApplicationRecord["status"];
  submittedAt: string;
  reviewedAt: string | null;
  adminComment: string;
  data: OrganizerApplicationData;
};

function attachment(attachmentId: string, name: string, kind: string, uploadedAt: string, isSample = true): MockAttachment {
  return { attachmentId, name, kind, uploadedAt, isSample };
}

function ensureOrganizerApplications(state: AppState): void {
  const seeds: DemoOrganizerApplicationSeed[] = [
    {
      id: "organizerApplication001",
      organizerId: "demo_org_minskconcert",
      status: "approved",
      submittedAt: "2026-04-01T09:00:00",
      reviewedAt: "2026-04-03T11:30:00",
      adminComment: "Заявка согласована. Данные учреждения культуры заполнены корректно.",
      data: {
        legalName: "Государственное учреждение «Минскконцерт»",
        registrationNumber: "100600111",
        postalCode: "220030",
        region: "г. Минск",
        locality: "Минск",
        street: "ул. Раковская",
        houseNumber: "18",
        roomTypeAndNumber: "кабинет 12",
        addressExtra: "административный корпус",
        contactPhone: "+375 (17) 300-10-10",
        website: "https://minskconcert.demo.example",
        email: "minskconcert@demo.example",
        ownershipType: "state",
        director: { fullName: "Савицкий Андрей Викторович", docType: "паспорт", docNumber: "BY-240115-01", issueDate: "2024-01-15", issueAuthority: "орган регистрации" },
        workers: [{ fullName: "Горбач Мария Александровна", docType: "паспорт", docNumber: "BY-240115-02", issueDate: "2024-01-15", issueAuthority: "орган регистрации" }, { fullName: "Курило Павел Иванович", docType: "паспорт", docNumber: "BY-240115-03", issueDate: "2024-01-15", issueAuthority: "орган регистрации" }],
        founders: [],
        activities: ["концертная деятельность", "фестивали", "городские культурные программы"],
        activityOther: "координация городских культурных площадок",
        pastEventsDescription: "Городские концерты, фестивали народного творчества и программы ко Дню Независимости за предыдущий сезон.",
        pastMaterials: [attachment("ORGAPP-001-MAT-1", "Фотоотчёт городского концерта.pdf", "past-materials", "2026-04-01T09:10:00")],
        documents: [attachment("ORGAPP-001-DOC-1", "Устав учреждения.pdf", "charter", "2026-04-01T09:12:00"), attachment("ORGAPP-001-DOC-2", "Выписка из реестра.pdf", "registry", "2026-04-01T09:13:00")],
        confirmations: { isAccurate: true, adminReviewConsent: true },
        accountCredentials: { login: "organizer.minskconcert", password: "demo123" },
      },
    },
    {
      id: "organizerApplication002",
      organizerId: "demo_org_philharmonic",
      status: "approved",
      submittedAt: "2026-04-02T10:00:00",
      reviewedAt: "2026-04-04T12:00:00",
        adminComment: "Государственная организация культуры включена в реестр.",
      data: {
        legalName: "Государственное учреждение «Белорусская государственная ордена Трудового Красного Знамени филармония»",
        registrationNumber: "100600222",
        postalCode: "220005",
        region: "г. Минск",
        locality: "Минск",
        street: "пр-т Независимости",
        houseNumber: "50",
        roomTypeAndNumber: "приёмная",
        addressExtra: "концертный корпус",
        contactPhone: "+375 (17) 300-20-20",
        website: "https://philharmonic.demo.example",
        email: "philharmonic@culture-demo.example",
        ownershipType: "state",
        director: { fullName: "Ковалёва Марина Сергеевна", docType: "паспорт", docNumber: "BY-240115-04", issueDate: "2024-01-15", issueAuthority: "орган регистрации" },
        workers: [{ fullName: "Семенюк Ирина Олеговна", docType: "паспорт", docNumber: "BY-240115-05", issueDate: "2024-01-15", issueAuthority: "орган регистрации" }, { fullName: "Мартынов Денис Викторович", docType: "паспорт", docNumber: "BY-240115-06", issueDate: "2024-01-15", issueAuthority: "орган регистрации" }],
        founders: [],
        activities: ["академическая музыка", "народная музыка", "конкурсы исполнителей"],
        activityOther: "концертное сопровождение государственных культурных программ",
        pastEventsDescription: "Абонементные концерты, камерные вечера и конкурсные программы молодых исполнителей.",
        pastMaterials: [attachment("ORGAPP-002-MAT-1", "Программа концертного сезона.pdf", "past-materials", "2026-04-02T10:10:00")],
        documents: [attachment("ORGAPP-002-DOC-1", "Положение учреждения.pdf", "charter", "2026-04-02T10:12:00"), attachment("ORGAPP-002-DOC-2", "Регистрационные сведения.pdf", "registry", "2026-04-02T10:13:00")],
        confirmations: { isAccurate: true, adminReviewConsent: true },
        accountCredentials: { login: "organizer.philharmonic", password: "demo123" },
      },
    },
    {
      id: "organizerApplication003",
      organizerId: "demo_org_cultural_initiative",
      status: "approved",
      submittedAt: "2026-04-05T09:30:00",
      reviewedAt: "2026-04-08T14:20:00",
      adminComment: "Документы частной организации проверены, опыт проведения культурных мероприятий подтверждён.",
      data: {
        legalName: "Общество с ограниченной ответственностью «Культурная инициатива Беларуси»",
        registrationNumber: "193700333",
        postalCode: "220004",
        region: "г. Минск",
        locality: "Минск",
        street: "ул. Немига",
        houseNumber: "7",
        roomTypeAndNumber: "офис 31",
        addressExtra: "деловой центр",
        contactPhone: "+375 (29) 300-30-30",
        website: "https://culture-initiative.demo.example",
        email: "office@culture-initiative.example",
        ownershipType: "private",
        director: { fullName: "Лисовская Наталья Павловна", docType: "паспорт", docNumber: "BY-240115-07", issueDate: "2024-01-15", issueAuthority: "орган регистрации" },
        workers: [{ fullName: "Бондарь Артём Игоревич", docType: "паспорт", docNumber: "BY-240115-08", issueDate: "2024-01-15", issueAuthority: "орган регистрации" }, { fullName: "Гринкевич Ольга Юрьевна", docType: "паспорт", docNumber: "BY-240115-09", issueDate: "2024-01-15", issueAuthority: "орган регистрации" }],
        founders: [{ fullName: "Лисовская Наталья Павловна", docType: "паспорт", docNumber: "BY-240115-10", issueDate: "2024-01-15", issueAuthority: "орган регистрации" }],
        activities: ["выставочные программы", "театральные фестивали", "ремесленные проекты"],
        activityOther: "партнёрские проекты с музеями и домами культуры",
        pastEventsDescription: "Выставочные программы, театральные форумы и фестивали ремёсел в областных центрах.",
        pastMaterials: [attachment("ORGAPP-003-MAT-1", "Каталог выставочной программы.pdf", "past-materials", "2026-04-05T09:40:00")],
        documents: [attachment("ORGAPP-003-DOC-1", "Устав общества.pdf", "charter", "2026-04-05T09:42:00"), attachment("ORGAPP-003-DOC-2", "Сведения о государственной регистрации.pdf", "registry", "2026-04-05T09:43:00")],
        confirmations: { isAccurate: true, adminReviewConsent: true },
        accountCredentials: { login: "organizer.culture", password: "demo123" },
      },
    },
    {
      id: "organizerApplication004",
      organizerId: "demo_org_fest_scene",
      status: "submitted",
      submittedAt: "2026-04-10T13:15:00",
      reviewedAt: null,
      adminComment: "Заявка ожидает проверки документов и подтверждения опыта проведения областных программ.",
      data: {
        legalName: "Частное унитарное предприятие «Праздничная сцена»",
        registrationNumber: "193700444",
        postalCode: "246050",
        region: "Гомельская область",
        locality: "Гомель",
        street: "ул. Советская",
        houseNumber: "44",
        roomTypeAndNumber: "офис 8",
        addressExtra: "административное помещение",
        contactPhone: "+375 (33) 300-40-40",
        website: "https://fest-scene.demo.example",
        email: "registry@fest-scene.example",
        ownershipType: "private",
        director: { fullName: "Руденко Олег Николаевич", docType: "паспорт", docNumber: "BY-240115-11", issueDate: "2024-01-15", issueAuthority: "орган регистрации" },
        workers: [{ fullName: "Климова Елена Андреевна", docType: "паспорт", docNumber: "BY-240115-12", issueDate: "2024-01-15", issueAuthority: "орган регистрации" }, { fullName: "Сташкевич Роман Петрович", docType: "паспорт", docNumber: "BY-240115-13", issueDate: "2024-01-15", issueAuthority: "орган регистрации" }],
        founders: [{ fullName: "Руденко Олег Николаевич", docType: "паспорт", docNumber: "BY-240115-14", issueDate: "2024-01-15", issueAuthority: "орган регистрации" }],
        activities: ["детские культурные программы", "областные праздники", "хореографические шоу"],
        activityOther: "техническое сопровождение сценических программ",
        pastEventsDescription: "Праздничные программы домов культуры, детские спектакли и хореографические концерты.",
        pastMaterials: [attachment("ORGAPP-004-MAT-1", "Описание реализованных программ.pdf", "past-materials", "2026-04-10T13:20:00")],
        documents: [attachment("ORGAPP-004-DOC-1", "Устав предприятия.pdf", "charter", "2026-04-10T13:22:00"), attachment("ORGAPP-004-DOC-2", "Справка о регистрации.pdf", "registry", "2026-04-10T13:23:00")],
        confirmations: { isAccurate: true, adminReviewConsent: true },
        accountCredentials: { login: "organizer.festscene", password: "demo123" },
      },
    },
  ];

  for (const seed of seeds) {
    const existing = findOrganizerApplication(state, seed.id, seed.data.registrationNumber);
    const now = new Date().toISOString();
    const nextRecord: OrganizerApplicationRecord = {
      organizerApplicationId: seed.id,
      organizerId: seed.organizerId,
      status: seed.status,
      submittedAt: seed.submittedAt,
      reviewedAt: seed.reviewedAt,
      adminComment: seed.adminComment,
      data: seed.data,
      createdAt: seed.submittedAt,
      updatedAt: now,
    };
    if (!existing) state.organizerApplications.push(nextRecord);
    else Object.assign(existing, nextRecord);
  }
}

function findOrganizerApplication(state: AppState, appId: string, registrationNumber: string): OrganizerApplicationRecord | undefined {
  return state.organizerApplications.find((row) => row.organizerApplicationId === appId || row.data.registrationNumber === registrationNumber);
}

function mergeOrganizerApplication(target: OrganizerApplicationRecord, seed: { organizerId: string; submittedAt: string; data: OrganizerApplicationData }): void {
  target.organizerId ||= seed.organizerId;
  target.submittedAt ||= seed.submittedAt;
  target.status = target.status === "draft" ? "submitted" : target.status;
  target.data.legalName ||= seed.data.legalName;
  target.data.registrationNumber ||= seed.data.registrationNumber;
  target.data.contactPhone ||= seed.data.contactPhone;
  target.data.email ||= seed.data.email;
  target.data.postalCode ||= seed.data.postalCode;
  target.data.region ||= seed.data.region;
  target.data.locality ||= seed.data.locality;
  target.data.street ||= seed.data.street;
  target.data.houseNumber ||= seed.data.houseNumber;
  target.data.director.fullName ||= seed.data.director.fullName;
}

type DemoComplianceSeed = {
  id: string;
  organizerId: string;
  status: EventComplianceApplicationRecord["status"];
  submittedAt: string;
  reviewedAt?: string | null;
  adminComment?: string;
  certificateNumber?: string;
  certificateDate?: string;
  title: string;
  age: EventComplianceData["ageCategory"];
  program: string;
  approvalMode?: EventComplianceData["approvalMode"];
  approvalBasis?: string;
  hasForeignPerformers?: boolean;
  feeExempt?: boolean;
  feePaid?: boolean;
  executiveCommitteeNotified?: boolean;
};

function findDemoAppByTitle(title: string): DemoAppSeed | undefined {
  return DEMO_APPS.find((event) => event.title === title);
}

function buildComplianceData(state: AppState, seed: DemoComplianceSeed): EventComplianceData {
  const eventSeed = findDemoAppByTitle(seed.title);
  const hasForeignPerformers = Boolean(seed.hasForeignPerformers);
  const submittedAt = seed.submittedAt;
  const seedInventory = eventSeed ? resolveSeedInventory(state, eventSeed) : { tiers: [{ name: "Стандарт", price: 30, quantity: 100 }], capacity: 100, eventSeats: [] as NonNullable<EventRecord["eventSeats"]> };
  const tiers = seedInventory.tiers.map((tier) => ({ ...tier }));
  const capacity = seedInventory.capacity;
  const venue = eventSeed ? state.venueRegistry.find((item) => item.venueId === eventSeed.venueId) : null;
  const hall = eventSeed && venue ? venue.halls.find((item) => item.hallId === eventSeed.hallId) : null;
  const basePerformers: EventComplianceData["performers"] = [
    { name: "Ансамбль «Спадчына»", performerType: "group", country: "Беларусь", representative: "Координатор программы", comment: "Белорусские исполнители, документы приложены", documentName: "Список исполнителей.pdf", documentStatus: "документ участника приложен" },
  ];
  const performers = hasForeignPerformers
    ? [
        ...basePerformers,
        { name: "Ensemble Baltic Folk", performerType: "group" as const, country: "Литва", representative: "Культурное агентство", comment: "Иностранные исполнители, разрешительные документы приложены", documentName: "Разрешение на въезд.pdf", documentStatus: "виза / разрешение приложены" },
      ]
    : basePerformers;
  const approvalMode = seed.approvalMode || "certificate_required";
  const approvalBasis = seed.approvalBasis ||
    (approvalMode === "notice_only"
      ? "Мероприятие проводится в уведомительном порядке для культурной программы без выдачи удостоверения."
      : approvalMode === "certificate_not_required"
        ? "Культурно-просветительская программа относится к сценарию, где удостоверение не требуется."
        : "Публичное культурно-зрелищное мероприятие с реализацией билетов; требуется удостоверение.");
  const checksReady = Boolean(seed.feePaid || seed.feeExempt || seed.status === "approved");

  return {
    title: seed.title,
    eventType: eventSeed?.category || "Культурная программа",
    shortDescription: eventSeed?.description || "Демонстрационная культурная программа.",
    program: seed.program,
    posterPath: eventSeed?.poster || DEMO_POSTERS.vasilkovyKraj,
    salesChannels: eventSeed?.salesChannels ? [...eventSeed.salesChannels] : ["OWN"],
    dateSlots: eventSeed ? [toDateTime(eventSeed.daysOffset, eventSeed.time)] : ["2026-06-01T19:00"],
    venueName: venue?.name || eventSeed?.venue || "Культурная площадка",
    venueAddress: venue?.address || (eventSeed ? eventSeed.city + ", адрес площадки уточняется" : "г. Минск, адрес площадки уточняется"),
    venueId: eventSeed?.venueId,
    hallId: eventSeed?.hallId,
    layoutId: eventSeed?.capacityOnly ? undefined : eventSeed?.layoutId,
    eventSeats: eventSeed?.capacityOnly ? [] : seedInventory.eventSeats.map((seat) => ({ ...seat })),
    performers,
    onlyBelarusianPerformers: !hasForeignPerformers,
    hasForeignPerformers,
    venueType: venue?.type || (hall?.hasSeatMap ? "зрительный зал" : "open-air"),
    projectedCapacity: capacity,
    plannedTicketsForSale: capacity,
    ticketTiers: tiers,
    ageCategory: seed.age,
    ageComment: "Возрастная категория определена по содержанию программы и информационной продукции.",
    approvalMode,
    approvalBasis,
    eventDocuments: [
      attachment(seed.id + "-program", "Программа мероприятия.pdf", "event-program", submittedAt),
      attachment(seed.id + "-venue", "Договор с площадкой.pdf", "venue-contract", submittedAt),
      attachment(seed.id + "-participation", "Список исполнителей.pdf", "participation-confirmation", submittedAt),
      attachment(seed.id + "-poster", "Афиша мероприятия.pdf", "poster-layout", submittedAt),
    ],
    venueContractStatus: "приложен",
    salesStartDate: "2026-05-12",
    feeExempt: Boolean(seed.feeExempt),
    feeExemptReason: seed.feeExempt ? "Мероприятие проводится в рамках государственной культурной программы; применено освобождение от пошлины." : "Освобождение от пошлины не применяется.",
    feePaid: Boolean(seed.feePaid),
    paymentAttachments: seed.feePaid ? [attachment(seed.id + "-payment", "Квитанция об оплате пошлины.pdf", "fee-payment", submittedAt)] : [],
    paymentComment: seed.feePaid
      ? "Пошлина оплачена по платёжному поручению."
      : seed.feeExempt
        ? "Пошлина не начисляется по заявленному основанию освобождения."
        : "Оплата будет подтверждена после административной проверки.",
    adRestrictionConfirmed: true,
    cancelled: false,
    changesDeclared: false,
    executiveCommitteeNotified: Boolean(seed.executiveCommitteeNotified),
    citizensNotified: true,
    notificationsAttachment: [
      attachment(seed.id + "-notice", "Уведомление местного исполнительного комитета.pdf", "executive-notice", submittedAt),
      attachment(seed.id + "-citizens", "Информация для граждан.pdf", "citizens-notice", submittedAt),
    ],
    interagencyChecks: [
      { checkId: "mvd", agency: "МВД", subject: "Проверка документов участников", status: checksReady ? "Проверено" : "В обработке", updatedAt: submittedAt },
      { checkId: "migration", agency: "Департамент по гражданству и миграции", subject: "Проверка иностранных участников", status: hasForeignPerformers ? (checksReady ? "Проверено" : "В обработке") : "Проверено", updatedAt: submittedAt },
      { checkId: "culture", agency: "Министерство культуры", subject: "Проверка организатора и основания проведения", status: checksReady ? "Проверено" : "В обработке", updatedAt: submittedAt },
      { checkId: "executive", agency: "Исполком", subject: "Уведомление по площадке и проведению мероприятия", status: seed.executiveCommitteeNotified ? "Проверено" : "Отправлено", updatedAt: submittedAt },
    ],
    cancellationComment: "Отмена не заявлялась; изменения программы отсутствуют.",
  };
}

function ensureEventComplianceApplications(state: AppState): void {
  const seeds: DemoComplianceSeed[] = [
    {
      id: "eventApplication001",
      organizerId: "demo_org_minskconcert",
      status: "approved",
      submittedAt: "2026-04-18T09:00:00",
      reviewedAt: "2026-04-20T11:30:00",
      certificateNumber: "CERT-DEMO-BY-001",
      certificateDate: "2026-04-20",
      adminComment: "Заявка согласована, документы и уведомления представлены в полном объёме.",
      title: "Фестиваль «Васільковы край»",
      age: "0+",
      program: "Открытие фестиваля, ремесленные подворья, концерты народных коллективов, семейная программа и вечерний заключительный блок.",
      feeExempt: true,
      executiveCommitteeNotified: true,
    },
    {
      id: "eventApplication002",
      organizerId: "demo_org_philharmonic",
      status: "submitted",
      submittedAt: "2026-04-19T10:00:00",
      adminComment: "Заявка принята и ожидает проверки оплаты пошлины.",
      title: "Концерт «Песня роднай зямлі»",
      age: "6+",
      program: "Увертюра, блок белорусской академической музыки, выступление хора, народные песни в оркестровой обработке.",
      feePaid: true,
    },
    {
      id: "eventApplication003",
      organizerId: "demo_org_cultural_initiative",
      status: "needs_rework",
      submittedAt: "2026-04-20T09:20:00",
      reviewedAt: "2026-04-21T15:10:00",
      adminComment: "Уточните проектную вместимость площадки и схему рассадки.",
      title: "Театральный форум «Сцэна Беларусі»",
      age: "12+",
      program: "Показы спектаклей, творческая встреча с режиссёрами, обсуждение сценографии и итоговая дискуссия.",
      feePaid: true,
    },
    {
      id: "eventApplication004",
      organizerId: "demo_org_fest_scene",
      status: "rejected",
      submittedAt: "2026-04-21T13:00:00",
      reviewedAt: "2026-04-22T09:45:00",
      adminComment: "Не приложена программа мероприятия.",
      title: "Детская программа «Казкі Палесся»",
      age: "0+",
      program: "Интерактивная сказочная программа, музыкальные паузы, игровые станции и финальная встреча с артистами.",
      approvalMode: "certificate_not_required",
    },
    {
      id: "eventApplication005",
      organizerId: "demo_org_minskconcert",
      status: "approved",
      submittedAt: "2026-04-22T08:30:00",
      reviewedAt: "2026-04-24T12:00:00",
      certificateNumber: "CERT-DEMO-BY-005",
      certificateDate: "2026-04-24",
      adminComment: "Состав исполнителей и возрастная категория подтверждены.",
      title: "Концерт мастеров искусств «Беларусь у сэрцы»",
      age: "6+",
      program: "Симфонический пролог, выступления мастеров искусств, хоровой блок и торжественный финал.",
      feePaid: true,
      executiveCommitteeNotified: true,
    },
    {
      id: "eventApplication006",
      organizerId: "demo_org_cultural_initiative",
      status: "submitted",
      submittedAt: "2026-04-23T12:15:00",
      adminComment: "Уведомительный сценарий принят к учёту.",
      title: "Фестиваль ремёсел «Слуцкие пояса»",
      age: "0+",
      program: "Выставка тканых изделий, мастер-классы ремесленников, лекция о слуцких поясах и семейный маршрут.",
      approvalMode: "notice_only",
      feeExempt: true,
      executiveCommitteeNotified: true,
    },
    {
      id: "eventApplication007",
      organizerId: "demo_org_philharmonic",
      status: "approved",
      submittedAt: "2026-04-24T09:10:00",
      reviewedAt: "2026-04-25T10:00:00",
      certificateNumber: "CERT-DEMO-BY-007",
      certificateDate: "2026-04-25",
      adminComment: "Камерная программа согласована без дополнительных замечаний.",
      title: "Музыкальный вечер «Звоны Нясвіжа»",
      age: "12+",
      program: "Камерная инструментальная программа, рассказ о музыкальной традиции Несвижа и заключительное выступление ансамбля.",
      approvalMode: "certificate_not_required",
    },
    {
      id: "eventApplication008",
      organizerId: "demo_org_fest_scene",
      status: "rejected",
      submittedAt: "2026-04-25T14:20:00",
      reviewedAt: "2026-04-26T16:00:00",
      adminComment: "Не подтверждены права на использование сценической площадки.",
      title: "Хореографическая программа «Кола традыцый»",
      age: "6+",
      program: "Народные танцы, современная хореография, сценический блок о календарных традициях и финальный поклон коллективов.",
      feePaid: true,
    },
    {
      id: "eventApplication009",
      organizerId: "demo_org_cultural_initiative",
      status: "needs_rework",
      submittedAt: "2026-04-26T10:30:00",
      reviewedAt: "2026-04-27T11:45:00",
      adminComment: "Требуется уточнить состав исполнителей и возрастную категорию информационной продукции.",
      title: "Выставочная программа «Спадчына і сучаснасць»",
      age: "6+",
      program: "Экскурсионный маршрут, лекция куратора, демонстрация музейных предметов и современная художественная секция.",
      approvalMode: "notice_only",
      executiveCommitteeNotified: true,
    },
    {
      id: "eventApplication010",
      organizerId: "demo_org_minskconcert",
      status: "submitted",
      submittedAt: "2026-04-27T09:40:00",
      adminComment: "Заявка с иностранными исполнителями ожидает проверки состава участников.",
      title: "Международная программа «Сяброўства культур»",
      age: "12+",
      program: "Белорусский музыкальный блок, выступление приглашённого ансамбля, совместный финал и встреча культурных координаторов.",
      hasForeignPerformers: true,
      feePaid: true,
      executiveCommitteeNotified: true,
    },
    {
      id: "eventApplication011",
      organizerId: "demo_org_fest_scene",
      status: "approved",
      submittedAt: "2026-04-28T11:00:00",
      reviewedAt: "2026-04-29T10:20:00",
      certificateNumber: "CERT-DEMO-BY-011",
      certificateDate: "2026-04-29",
      adminComment: "Могилёвская областная программа согласована, площадка и уведомления подтверждены.",
      title: "Областной праздник «Купальскі вянок»",
      age: "0+",
      program: "Фольклорная сцена, ремесленные подворья, семейная зона и вечерний купальский блок в парке Подниколье.",
      feeExempt: true,
      executiveCommitteeNotified: true,
    },
    {
      id: "eventApplication012",
      organizerId: "demo_org_cultural_initiative",
      status: "submitted",
      submittedAt: "2026-04-29T09:30:00",
      adminComment: "Региональная выставочная заявка ожидает финальной выдачи удостоверения.",
      title: "Выставка «Гродзенскія абрысы»",
      age: "6+",
      program: "Кураторская прогулка по городским силуэтам, демонстрация эскизов сценографии, камерная лекция и встреча с авторами.",
      feePaid: true,
      executiveCommitteeNotified: true,
    },
    {
      id: "eventApplication013",
      organizerId: "demo_org_philharmonic",
      status: "submitted",
      submittedAt: "2026-04-30T10:15:00",
      adminComment: "Могилёвская камерная программа оплачена и ждёт административного решения.",
      title: "Камерный концерт «Дняпроўскія галасы»",
      age: "6+",
      program: "Вокальный блок у Днепра, инструментальные миниатюры, региональные песни в камерной обработке и заключительный ансамбль.",
      feePaid: true,
      executiveCommitteeNotified: true,
    },
  ];

  for (const seed of seeds) {
    let row = state.eventComplianceApplications.find((r) => r.eventComplianceApplicationId === seed.id);
    if (!row) row = state.eventComplianceApplications.find((r) => r.organizerId === seed.organizerId && r.data.title === seed.title);
    const data = buildComplianceData(state, seed);
    const now = new Date().toISOString();
    const nextRecord: EventComplianceApplicationRecord = {
      eventComplianceApplicationId: seed.id,
      organizerId: seed.organizerId,
      status: seed.status,
      submittedAt: seed.submittedAt,
      reviewedAt: seed.reviewedAt ?? null,
      adminComment: seed.adminComment || "",
      feePaymentConfirmedByAdmin: Boolean(seed.feePaid || seed.feeExempt || seed.status === "approved"),
      certificateNumber: seed.certificateNumber || "",
      certificateDate: seed.certificateDate || "",
      linkedLegacyAppId: row?.linkedLegacyAppId || null,
      linkedEventId: row?.linkedEventId || null,
      data,
      createdAt: seed.submittedAt,
      updatedAt: now,
    };
    if (!row) state.eventComplianceApplications.push(nextRecord);
    else Object.assign(row, nextRecord);
  }
}

function ensureCertificatesForPublishedEvents(state: AppState): void {
  const publishedOrApproved = state.events.filter((event) => event.status === "published" || event.status === "approved");
  for (let i = 0; i < publishedOrApproved.length; i++) {
    const event = publishedOrApproved[i];
    const certificateNumber = "CERT-DEMO-BY-" + String(i + 1).padStart(3, "0");
    const certificateDate = event.createdAt.slice(0, 10) || "2026-04-30";
    let compliance = state.eventComplianceApplications.find((app) => app.linkedEventId === event.eventId);
    if (!compliance) {
      compliance = state.eventComplianceApplications.find((app) => !app.linkedEventId && app.status === "approved" && app.organizerId === event.organizerId && app.data.title === event.title);
    }
    if (!compliance) {
      const seed: DemoComplianceSeed = {
        id: "mock-cert-" + event.eventId,
        organizerId: event.organizerId,
        status: "approved",
        submittedAt: event.createdAt,
        reviewedAt: event.updatedAt,
        adminComment: "Заявка согласована по опубликованному мероприятию.",
        certificateNumber,
        certificateDate,
        title: event.title,
        age: "6+",
        program: "Основная культурная программа, регистрация зрителей, сценический блок и заключительная часть.",
        feePaid: true,
        executiveCommitteeNotified: true,
      };
      compliance = {
        eventComplianceApplicationId: seed.id,
        organizerId: event.organizerId,
        status: "approved",
        submittedAt: seed.submittedAt,
        reviewedAt: seed.reviewedAt || event.updatedAt,
        adminComment: seed.adminComment || "",
        feePaymentConfirmedByAdmin: true,
        certificateNumber: seed.certificateNumber || "",
        certificateDate: seed.certificateDate || "",
        linkedLegacyAppId: event.appId,
        linkedEventId: event.eventId,
        data: buildComplianceData(state, seed),
        createdAt: event.createdAt,
        updatedAt: event.updatedAt,
      };
      state.eventComplianceApplications.push(compliance);
    }
    compliance.status = compliance.status === "draft" || compliance.status === "submitted" ? "approved" : compliance.status;
    compliance.certificateNumber ||= certificateNumber;
    compliance.certificateDate ||= certificateDate;
    compliance.linkedLegacyAppId ||= event.appId;
    compliance.linkedEventId = event.eventId;
    compliance.data.posterPath = event.poster || compliance.data.posterPath;
    compliance.data.salesChannels = event.salesChannels || compliance.data.salesChannels || ["OWN"];
    compliance.data.venueName = event.venue || compliance.data.venueName;
    compliance.data.venueAddress = state.venueRegistry.find((venue) => venue.venueId === event.venueId)?.address || compliance.data.venueAddress || event.city + ", адрес площадки уточняется";
    compliance.data.venueId = event.venueId;
    compliance.data.hallId = event.hallId;
    compliance.data.layoutId = event.layoutId;
    compliance.data.eventSeats = event.eventSeats?.length ? event.eventSeats.map((seat) => ({ ...seat })) : [];
    compliance.data.projectedCapacity = event.capacity;
    compliance.data.plannedTicketsForSale = event.capacity;
    compliance.data.ticketTiers = event.tiers.map((tier) => ({ ...tier }));
    compliance.data.program ||= "Основная культурная программа, сценический блок и заключительная часть.";
    compliance.data.salesStartDate ||= "2026-05-12";
    compliance.data.ageComment ||= "Возрастная категория подтверждена по программе мероприятия.";
    compliance.data.approvalBasis ||= "Публичное культурно-зрелищное мероприятие с реализацией билетов.";
    compliance.data.eventDocuments = compliance.data.eventDocuments?.length ? compliance.data.eventDocuments : [
      attachment(compliance.eventComplianceApplicationId + "-program", "Программа мероприятия.pdf", "event-program", compliance.submittedAt || event.createdAt),
      attachment(compliance.eventComplianceApplicationId + "-venue", "Договор с площадкой.pdf", "venue-contract", compliance.submittedAt || event.createdAt),
    ];
    compliance.data.venueContractStatus ||= "приложен";
    compliance.data.paymentComment ||= compliance.data.feePaid ? "Пошлина оплачена по платёжному поручению." : "Оплата не требуется или ожидает подтверждения.";
    compliance.data.notificationsAttachment = compliance.data.notificationsAttachment?.length ? compliance.data.notificationsAttachment : [attachment(compliance.eventComplianceApplicationId + "-notice", "Уведомление исполкома.pdf", "executive-notice", compliance.submittedAt || event.createdAt)];
    compliance.feePaymentConfirmedByAdmin = compliance.feePaymentConfirmedByAdmin || compliance.data.feePaid || compliance.data.feeExempt;
    event.complianceApplicationId = compliance.eventComplianceApplicationId;
  }
}

function ensureTicketsForPublishedEvents(state: AppState): void {
  for (const event of state.events) {
    if (event.status !== "published") continue;
    const hasTickets = state.tickets.some((ticket) => ticket.eventId === event.eventId);
    if (!hasTickets) issueMarks(state, event.eventId);
  }
}

function countResellerTickets(state: AppState, resellerCode: string): number {
  return state.tickets.filter((ticket) => ticket.soldByChannel === resellerCode && ticket.status !== "issued").length;
}

function countChannelTickets(state: AppState, channel: string): number {
  return state.tickets.filter((ticket) => ticket.soldByChannel === channel && ticket.status !== "issued").length;
}

function findSeedEvent(state: AppState, seedIndex: number) {
  const seed = DEMO_APPS[seedIndex];
  if (!seed) return null;
  return state.events.find((event) => event.organizerId === seed.organizerId && event.title === seed.title && event.status === "published") || null;
}

function ensureDemoTicketOperations(state: AppState): void {
  const sellTargets = [
    { resellerCode: "ByCard", eventIndex: 0, tierIndex: 1, target: 4, buyer: "Покупатель ByCard" },
    { resellerCode: "TicketPro", eventIndex: 2, tierIndex: 0, target: 3, buyer: "Покупатель TicketPro" },
    { resellerCode: "Bezkassira", eventIndex: 4, tierIndex: 1, target: 3, buyer: "Покупатель bezkassira.by" },
  ];

  for (const target of sellTargets) {
    const event = findSeedEvent(state, target.eventIndex);
    const tier = event?.tiers[target.tierIndex] || event?.tiers[0];
    if (!event || !tier) continue;
    while (countResellerTickets(state, target.resellerCode) < target.target) {
      const outcome = sellTicketsByReseller(state, {
        resellerCode: target.resellerCode,
        eventId: event.eventId,
        tierName: tier.name,
        quantity: 1,
        buyerName: target.buyer,
      });
      if (!outcome.ok) break;
    }
  }

  const ownTargets = [
    { eventIndex: 3, tierIndex: 0, target: 2, buyer: "Покупатель собственного канала" },
    { eventIndex: 8, tierIndex: 0, target: 4, buyer: "Покупатель организатора" },
  ];

  for (const target of ownTargets) {
    const event = findSeedEvent(state, target.eventIndex);
    const tier = event?.tiers[target.tierIndex] || event?.tiers[0];
    if (!event || !tier) continue;
    while (countChannelTickets(state, "OWN") < target.target) {
      const outcome = sell(state, event.eventId, tier.name, "OWN", target.buyer);
      if (!outcome.ok) break;
    }
  }

  if (!state.tickets.some((ticket) => ticket.soldByChannel === "ByCard" && ticket.status === "refunded")) {
    const ticket = state.tickets.find((item) => item.soldByChannel === "ByCard" && item.status === "sold");
    if (ticket) refund(state, ticket.ticketId, "ByCard");
  }

  if (!state.tickets.some((ticket) => ticket.soldByChannel === "TicketPro" && ticket.status === "redeemed")) {
    const ticket = state.tickets.find((item) => item.soldByChannel === "TicketPro" && item.status === "sold");
    if (ticket) redeem(state, ticket.ticketId, "TicketPro");
  }

  if (!state.tickets.some((ticket) => ticket.soldByChannel === "Bezkassira" && ticket.status === "redeemed")) {
    const ticket = state.tickets.find((item) => item.soldByChannel === "Bezkassira" && item.status === "sold");
    if (ticket) redeem(state, ticket.ticketId, "Bezkassira");
  }

}

export function runDemoScenario(): AppState {
  const state = seedDemoCatalog(resetDemoData());
  saveState(state);
  return state;
}
