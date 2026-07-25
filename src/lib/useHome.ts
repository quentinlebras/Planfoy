import { useCallback, useEffect, useState } from 'react';
import { FALLBACK_PIN, HOME_ADDRESS } from '../data/home';
import type { LatLon } from './geo';

export interface Home extends LatLon {
  /** False once someone pins a custom starting point by hand. */
  useAddress: boolean;
  /** True while the pin is the village fallback rather than the real address. */
  approximate: boolean;
}

const STORE_KEY = 'planfoy:home:v2';
const GEOCODE_KEY = 'planfoy:geocode:v1';
const GEOCODE_TTL_MS = 90 * 24 * 60 * 60 * 1000;
const GEOCODE_RETRY_MS = 24 * 60 * 60 * 1000;

const FALLBACK_HOME: Home = { ...FALLBACK_PIN, useAddress: true, approximate: true };

function read<T>(key: string): T | null {
  try {
    const stored = window.localStorage.getItem(key);
    return stored === null ? null : (JSON.parse(stored) as T);
  } catch {
    return null;
  }
}

function write(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Private browsing or a full quota: stay in memory only.
  }
}

interface GeocodeCache {
  at: number;
  address: string;
  point: LatLon | null;
}

async function nominatim(query: string): Promise<LatLon | null> {
  const params = new URLSearchParams({ format: 'jsonv2', limit: '1', q: query });
  const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`);
  if (!response.ok) return null;
  const results = (await response.json()) as { lat: string; lon: string }[];
  const first = results[0];
  if (!first) return null;
  const lat = Number.parseFloat(first.lat);
  const lon = Number.parseFloat(first.lon);
  return Number.isFinite(lat) && Number.isFinite(lon) ? { lat, lon } : null;
}

/**
 * Resolve the rental's address to a point, once per browser. The postal address
 * drives the routing links either way; this only sharpens the map pin and the
 * distance column, so every failure path just keeps the village fallback.
 */
async function geocodeHome(): Promise<LatLon | null> {
  const cached = read<GeocodeCache>(GEOCODE_KEY);
  if (cached && cached.address === HOME_ADDRESS) {
    const ttl = cached.point ? GEOCODE_TTL_MS : GEOCODE_RETRY_MS;
    if (Date.now() - cached.at < ttl) return cached.point;
  }
  let point: LatLon | null = null;
  try {
    point = await nominatim(HOME_ADDRESS);
    // House numbers on rural lanes are often absent from OSM; the street alone
    // still lands within a few dozen meters.
    if (!point) point = await nominatim('Chemin du Vignolet, 42660 Planfoy, France');
  } catch {
    return null;
  }
  write(GEOCODE_KEY, { at: Date.now(), address: HOME_ADDRESS, point } satisfies GeocodeCache);
  return point;
}

export function useHome() {
  const [home, setHome] = useState<Home>(() => read<Home>(STORE_KEY) ?? FALLBACK_HOME);

  useEffect(() => {
    if (!home.approximate || !home.useAddress) return;
    let active = true;
    geocodeHome().then((point) => {
      if (!active || !point) return;
      const resolved: Home = { ...point, useAddress: true, approximate: false };
      setHome(resolved);
      write(STORE_KEY, resolved);
    });
    return () => {
      active = false;
    };
  }, [home.approximate, home.useAddress]);

  const override = useCallback((point: LatLon) => {
    const next: Home = { ...point, useAddress: false, approximate: false };
    setHome(next);
    write(STORE_KEY, next);
  }, []);

  const reset = useCallback(() => {
    setHome(FALLBACK_HOME);
    write(STORE_KEY, FALLBACK_HOME);
  }, []);

  return { home, override, reset };
}

/** Origin for a routing URL: the postal address wins over raw coordinates. */
export function routingOrigin(home: Home): string {
  return home.useAddress ? HOME_ADDRESS : `${home.lat},${home.lon}`;
}
