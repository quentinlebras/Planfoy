import type { LatLon } from '../lib/geo';

/**
 * Trip base. The Airbnb is in Planfoy; the exact pin can be refined in the UI
 * (stored in localStorage) or hard-coded here once known.
 */
export const DEFAULT_HOME: LatLon = { lat: 45.3844, lon: 4.4204 };

export const HOME_LABEL = 'Notre Airbnb — Planfoy';

/** The Google Maps short link shared for the rental. */
export const HOME_SHARE_URL = 'https://maps.app.goo.gl/SNrkfdpufx1VEdWKA';

export const TRIP_START = '2026-08-01';
export const TRIP_END = '2026-08-09';
