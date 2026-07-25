import { MAX_DRIVE_MIN } from '../data/places';
import type { GroupId, Place } from '../types';

export interface Filters {
  groups: GroupId[];
  categories: string[];
  maxDrive: number;
  kidsOnly: boolean;
  eventsOnly: boolean;
  query: string;
}

export const EMPTY_FILTERS: Filters = {
  groups: [],
  categories: [],
  maxDrive: MAX_DRIVE_MIN,
  kidsOnly: false,
  eventsOnly: false,
  query: '',
};

export const DRIVE_STEPS = [15, 25, 35, 45, 60, 90, MAX_DRIVE_MIN];

export function isDefaultFilters(filters: Filters): boolean {
  return (
    filters.groups.length === 0 &&
    filters.categories.length === 0 &&
    filters.maxDrive === MAX_DRIVE_MIN &&
    !filters.kidsOnly &&
    !filters.eventsOnly &&
    filters.query.trim() === ''
  );
}

export function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

function normalize(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
}

export function matches(place: Place, filters: Filters): boolean {
  if (filters.groups.length > 0 && !filters.groups.includes(place.group)) return false;
  if (filters.categories.length > 0 && !filters.categories.includes(place.category)) return false;
  if (place.driveMin > filters.maxDrive) return false;
  if (filters.kidsOnly && !place.kidFriendly) return false;
  if (filters.eventsOnly && place.tripEvents.length === 0) return false;
  const query = normalize(filters.query.trim());
  if (query.length > 0) {
    const haystack = normalize(
      [place.name, place.area, place.categoryLabel, place.whyGo, place.audience].join(' '),
    );
    if (!query.split(/\s+/).every((token) => haystack.includes(token))) return false;
  }
  return true;
}
