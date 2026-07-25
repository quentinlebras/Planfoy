export type GroupId = 'culture' | 'nature' | 'baignade' | 'sorties' | 'enfants' | 'ville';

export interface Group {
  id: GroupId;
  label: string;
  short: string;
  emoji: string;
  color: string;
  colorDark: string;
}

export interface CategoryMeta {
  id: string;
  label: string;
  group: GroupId;
  emoji: string;
}

/** A dated event, normalized: single-day events get start === end. */
export interface PlaceEvent {
  start: string;
  end: string;
  time: string | null;
  title: string;
  singleDay: boolean;
}

export interface Place {
  id: string;
  name: string;
  category: string;
  categoryLabel: string;
  group: GroupId;
  emoji: string;
  area: string;
  lat: number;
  lon: number;
  /** "site" coordinates are precise, "approximate" ones are landmarks only. */
  precise: boolean;
  precision: string;
  driveMin: number;
  /** Straight-line kilometers from the trip base. */
  distanceKm: number;
  audience: string;
  kidFriendly: boolean;
  whyGo: string;
  openingHours: string;
  events: PlaceEvent[];
  /** Events overlapping the trip window. */
  tripEvents: PlaceEvent[];
  officialUrl: string | null;
  searchLinks: string[];
  imageQuery: string;
  verified: boolean;
  verificationStatus: string;
  notes: string | null;
  warnings: string[];
}

export interface Photo {
  title: string;
  thumb: string;
  full: string;
  descriptionUrl: string;
  author: string | null;
  license: string | null;
}
