import type { Photo, Place } from '../types';

const API = 'https://commons.wikimedia.org/w/api.php';
const CACHE_PREFIX = 'planfoy:photos:v2:';
const CACHE_TTL_MS = 14 * 24 * 60 * 60 * 1000;
const EXCLUDED = /\.(svg|pdf|tif|tiff|djvu|ogv|webm|xcf)$/i;
/** Commons is full of maps, coats of arms and signage; they make poor covers. */
const EXCLUDED_TITLE =
  /(carte|map of|blason|coat of arms|logo|plaque|panneau|sign|diagram|graph|flag|drapeau|localisation)/i;

interface CommonsPage {
  title: string;
  imageinfo?: {
    url: string;
    thumburl?: string;
    descriptionurl: string;
    mime?: string;
    extmetadata?: Record<string, { value: string }>;
  }[];
}

function stripHtml(html: string): string {
  const el = document.createElement('div');
  el.innerHTML = html;
  return (el.textContent ?? '').replace(/\s+/g, ' ').trim();
}

function toPhoto(page: CommonsPage): Photo | null {
  const info = page.imageinfo?.[0];
  if (!info) return null;
  if (EXCLUDED.test(page.title) || EXCLUDED_TITLE.test(page.title)) return null;
  if (info.mime && !info.mime.startsWith('image/')) return null;
  const meta = info.extmetadata ?? {};
  const author = meta.Artist ? stripHtml(meta.Artist.value) : null;
  const license = meta.LicenseShortName ? stripHtml(meta.LicenseShortName.value) : null;
  return {
    title: page.title.replace(/^File:/, '').replace(/\.[a-z0-9]+$/i, ''),
    thumb: info.thumburl ?? info.url,
    full: info.url,
    descriptionUrl: info.descriptionurl,
    author: author && author.length < 120 ? author : null,
    license,
  };
}

async function callApi(params: Record<string, string>): Promise<Photo[]> {
  const query = new URLSearchParams({
    action: 'query',
    format: 'json',
    origin: '*',
    formatversion: '1',
    prop: 'imageinfo',
    iiprop: 'url|extmetadata|mime',
    iiurlwidth: '1200',
    ...params,
  });
  const response = await fetch(`${API}?${query.toString()}`);
  if (!response.ok) throw new Error(`Commons ${response.status}`);
  const body = (await response.json()) as { query?: { pages?: CommonsPage[] } };
  const pages = body.query?.pages ?? [];
  return pages.map(toPhoto).filter((p): p is Photo => p !== null);
}

/** Free-text search, which usually nails named venues. */
function searchByName(place: Place) {
  return callApi({
    generator: 'search',
    gsrsearch: `filetype:bitmap ${place.imageQuery}`,
    gsrnamespace: '6',
    gsrlimit: '8',
  });
}

/** Geosearch, which is how natural sites without a well-known name get covered. */
function searchByLocation(place: Place, radius: number) {
  return callApi({
    generator: 'geosearch',
    ggscoord: `${place.lat}|${place.lon}`,
    ggsradius: String(radius),
    ggsnamespace: '6',
    ggslimit: '12',
  });
}

function readCache(id: string): Photo[] | null {
  try {
    const stored = window.localStorage.getItem(CACHE_PREFIX + id);
    if (!stored) return null;
    const parsed = JSON.parse(stored) as { at: number; photos: Photo[] };
    if (Date.now() - parsed.at > CACHE_TTL_MS) return null;
    return parsed.photos;
  } catch {
    return null;
  }
}

function writeCache(id: string, photos: Photo[]) {
  try {
    window.localStorage.setItem(
      CACHE_PREFIX + id,
      JSON.stringify({ at: Date.now(), photos }),
    );
  } catch {
    // Ignore quota errors: photos will simply be refetched.
  }
}

const inFlight = new Map<string, Promise<Photo[]>>();

export async function loadPhotos(place: Place): Promise<Photo[]> {
  const cached = readCache(place.id);
  if (cached) return cached;

  const existing = inFlight.get(place.id);
  if (existing) return existing;

  const request = (async () => {
    const radius = place.precise ? 1200 : 3000;
    const results = await Promise.allSettled([
      searchByName(place),
      searchByLocation(place, radius),
    ]);
    const seen = new Set<string>();
    const photos: Photo[] = [];
    for (const result of results) {
      if (result.status !== 'fulfilled') continue;
      for (const photo of result.value) {
        if (seen.has(photo.full)) continue;
        seen.add(photo.full);
        photos.push(photo);
      }
    }
    const trimmed = photos.slice(0, 12);
    if (trimmed.length > 0) writeCache(place.id, trimmed);
    return trimmed;
  })();

  inFlight.set(place.id, request);
  try {
    return await request;
  } finally {
    inFlight.delete(place.id);
  }
}
