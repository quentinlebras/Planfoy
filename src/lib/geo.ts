export interface LatLon {
  lat: number;
  lon: number;
}

const EARTH_RADIUS_KM = 6371;

export function haversineKm(a: LatLon, b: LatLon): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

const coords = (p: LatLon) => `${p.lat},${p.lon}`;

export function googleDirectionsUrl(from: LatLon, to: LatLon): string {
  const params = new URLSearchParams({
    api: '1',
    origin: coords(from),
    destination: coords(to),
    travelmode: 'driving',
  });
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

export function appleDirectionsUrl(from: LatLon, to: LatLon): string {
  return `https://maps.apple.com/?saddr=${coords(from)}&daddr=${coords(to)}&dirflg=d`;
}

export function wazeUrl(to: LatLon): string {
  return `https://waze.com/ul?ll=${coords(to)}&navigate=yes`;
}

export function googlePlaceUrl(to: LatLon, query: string): string {
  const params = new URLSearchParams({ api: '1', query });
  return `https://www.google.com/maps/search/?${params.toString()}&center=${coords(to)}`;
}

/** Accepts "45.3844, 4.4204", "45.3844 4.4204" or a Google Maps URL containing @lat,lon. */
export function parseLatLon(input: string): LatLon | null {
  const at = input.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  const pair = at ?? input.match(/(-?\d{1,3}(?:\.\d+)?)\s*[,; ]\s*(-?\d{1,3}(?:\.\d+)?)/);
  if (!pair) return null;
  const lat = Number.parseFloat(pair[1]);
  const lon = Number.parseFloat(pair[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lon) > 180) return null;
  return { lat, lon };
}

export function formatKm(km: number): string {
  if (km < 10) return `${km.toFixed(1).replace('.', ',')} km`;
  return `${Math.round(km)} km`;
}

export function formatDrive(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h} h` : `${h} h ${String(m).padStart(2, '0')}`;
}
