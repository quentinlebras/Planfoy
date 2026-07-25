import type { LatLon } from '../lib/geo';

/**
 * The rental's postal address. Routing links use this string rather than
 * coordinates, so Google and Apple resolve the exact building themselves.
 */
export const HOME_ADDRESS = '235 Chemin du Vignolet, 42660 Planfoy, France';

export const HOME_SHORT_ADDRESS = '235 chemin du Vignolet, Planfoy';

export const HOME_LABEL = 'Notre Airbnb';

/**
 * Center of Planfoy. Used for the map pin and for distances until the address
 * above is geocoded in the browser (see lib/useHome.ts).
 */
export const FALLBACK_PIN: LatLon = { lat: 45.3844, lon: 4.4204 };

/** The Google Maps short link shared for the rental. */
export const HOME_SHARE_URL = 'https://maps.app.goo.gl/SNrkfdpufx1VEdWKA';

export const TRIP_START = '2026-08-01';
export const TRIP_END = '2026-08-09';
