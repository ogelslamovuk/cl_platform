import type { AppState, EventRecord } from "@/lib/store";

export type AdminRegionScope = "all" | "Могилёвская область" | "Гродненская область";

export const ADMIN_REGION_OPTIONS = [
  "Минск",
  "Минская область",
  "Брестская область",
  "Витебская область",
  "Гомельская область",
  "Гродненская область",
  "Могилёвская область",
] as const;

const CITY_REGION: Record<string, string> = {
  Минск: "Минск",
  Брест: "Брестская область",
  Витебск: "Витебская область",
  Гомель: "Гомельская область",
  Гродно: "Гродненская область",
  Могилёв: "Могилёвская область",
  Могилев: "Могилёвская область",
  Слуцк: "Минская область",
  Несвиж: "Минская область",
};

export function normalizeRegion(value?: string): string {
  const clean = (value || "").trim();
  if (!clean) return "Минск";
  if (clean === "Могилевская область") return "Могилёвская область";
  if (clean === "Гродненская обл.") return "Гродненская область";
  if (clean === "г. Минск") return "Минск";
  return clean;
}

export function getRegionForCity(city?: string): string {
  const clean = (city || "").trim();
  return CITY_REGION[clean] || "Минск";
}

export function resolveRegionCity(
  state: AppState,
  input: { venueId?: string; city?: string; region?: string; venueName?: string; venueAddress?: string }
): { region: string; city: string } {
  const venue = input.venueId
    ? state.venueRegistry.find((item) => item.venueId === input.venueId)
    : state.venueRegistry.find((item) => item.name === input.venueName);
  const city = venue?.city || input.city || cityFromAddress(input.venueAddress) || "Минск";
  const region = normalizeRegion(venue?.region || input.region || getRegionForCity(city));
  return { region, city };
}

export function getEventRegionCity(state: AppState, event: EventRecord): { region: string; city: string } {
  return resolveRegionCity(state, {
    venueId: event.venueId,
    city: event.city,
    venueName: event.venue,
  });
}

export function isInAdminScope(region: string, scope: AdminRegionScope = "all"): boolean {
  return scope === "all" || normalizeRegion(region) === scope;
}

export function getRegionFilterOptions(state: AppState): string[] {
  const regions = new Set<string>(ADMIN_REGION_OPTIONS);
  state.venueRegistry.forEach((venue) => regions.add(normalizeRegion(venue.region)));
  state.events.forEach((event) => regions.add(getEventRegionCity(state, event).region));
  state.organizerApplications.forEach((application) => {
    if (application.data.region) regions.add(normalizeRegion(application.data.region));
  });
  return Array.from(regions).sort((a, b) => a.localeCompare(b, "ru"));
}

export function getScopedRegionFilterOptions(state: AppState, scope: AdminRegionScope = "all"): string[] {
  if (scope !== "all") return [scope];
  return getRegionFilterOptions(state);
}

function cityFromAddress(address?: string): string {
  const raw = (address || "").toLowerCase();
  const hit = Object.keys(CITY_REGION).find((city) => raw.includes(city.toLowerCase()));
  return hit || "";
}
