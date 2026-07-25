import { haversineKm, type LatLon } from '../lib/geo';
import type { Place, PlaceEvent } from '../types';
import raw from './recommandations.json';
import { CATEGORIES, FALLBACK_CATEGORY } from './taxonomy';
import { FALLBACK_PIN, TRIP_END, TRIP_START } from './home';

interface RawEvent {
  date?: string;
  start?: string;
  end?: string;
  time?: string;
  title: string;
}

interface RawPlace {
  id: string;
  name: string;
  category: string;
  city_or_area: string;
  gps: { lat: number; lon: number; precision: string };
  approx_drive_from_planfoy_min: number;
  audience: string;
  why_go: string;
  opening_hours: string;
  dated_events_2026: RawEvent[];
  official_or_reference_url: string | null;
  image_links: string[];
  verification_status: string;
  notes: string | null;
  warnings: string[];
}

export const META = raw.meta;
export const SOURCES = raw.sources;

function normalizeEvent(event: RawEvent): PlaceEvent {
  const start = event.start ?? event.date ?? '';
  const end = event.end ?? event.date ?? start;
  return {
    start,
    end,
    time: event.time ?? null,
    title: event.title,
    singleDay: start === end,
  };
}

function overlapsTrip(event: PlaceEvent): boolean {
  if (!event.start) return false;
  return event.start <= TRIP_END && event.end >= TRIP_START;
}

/**
 * The dataset describes its audience in prose. Turn it into a usable flag:
 * anything explicitly adult-only or discouraged for toddlers is excluded.
 */
function isKidFriendly(audience: string): boolean {
  const a = audience.toLowerCase();
  if (/déconseillé|expérimentés/.test(a)) return false;
  if (/sans enfant|sans jeunes enfants/.test(a)) return false;
  if (/^adultes\b/.test(a) && !/enfants? (calmes|marcheurs)/.test(a)) return false;
  return /enfant|famille/.test(a);
}

/** Search-friendly label used to look photos up on Wikimedia Commons. */
function imageQuery(place: RawPlace): string {
  const name = place.name
    .replace(/['’]/g, ' ')
    .replace(/\s*[-–]\s*/g, ' ')
    .replace(/\s+et son .*$/i, '')
    .replace(/,.*$/, '')
    .trim();
  const area = place.city_or_area.split('/')[0].trim();
  return area && !name.toLowerCase().includes(area.toLowerCase())
    ? `${name} ${area}`
    : name;
}

function build(place: RawPlace, home: LatLon): Place {
  const meta = CATEGORIES[place.category] ?? FALLBACK_CATEGORY;
  const events = place.dated_events_2026.map(normalizeEvent);
  return {
    id: place.id,
    name: place.name,
    category: place.category,
    categoryLabel: meta.label,
    group: meta.group,
    emoji: meta.emoji,
    area: place.city_or_area || 'Saint-Étienne',
    lat: place.gps.lat,
    lon: place.gps.lon,
    precise: place.gps.precision === 'site',
    precision: place.gps.precision,
    driveMin: place.approx_drive_from_planfoy_min,
    distanceKm: haversineKm(home, { lat: place.gps.lat, lon: place.gps.lon }),
    audience: place.audience,
    kidFriendly: isKidFriendly(place.audience),
    whyGo: place.why_go,
    openingHours: place.opening_hours,
    events,
    tripEvents: events.filter(overlapsTrip),
    officialUrl: place.official_or_reference_url,
    searchLinks: place.image_links.filter((url) => /search|Special:MediaSearch/.test(url)),
    imageQuery: imageQuery(place),
    verified: place.verification_status.startsWith('verified'),
    verificationStatus: place.verification_status,
    notes: place.notes,
    warnings: place.warnings,
  };
}

export const PLACES: Place[] = (raw.places as RawPlace[]).map((p) => build(p, FALLBACK_PIN));

export const PLACE_BY_ID = new Map(PLACES.map((p) => [p.id, p]));

/** Distances depend on the trip base, which the user can move. */
export function withDistances(places: Place[], home: LatLon): Place[] {
  return places.map((p) => ({
    ...p,
    distanceKm: haversineKm(home, { lat: p.lat, lon: p.lon }),
  }));
}

export const MAX_DRIVE_MIN = Math.max(...PLACES.map((p) => p.driveMin));
