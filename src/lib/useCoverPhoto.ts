import { useCallback, useEffect, useState } from 'react';
import type { Photo } from '../types';

const STORAGE_KEY = 'planfoy:cover-photos:v1';
const CHANGE_EVENT = 'planfoy:cover-photo-change';

type CoverSelections = Record<string, string>;

function readSelections(): CoverSelections {
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}') as CoverSelections;
  } catch {
    return {};
  }
}

function readSelection(placeId: string): string | null {
  return readSelections()[placeId] ?? null;
}

function writeSelection(placeId: string, photoUrl: string) {
  const selections = readSelections();
  selections[placeId] = photoUrl;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(selections));
  } catch {
    // Keep the in-memory update when storage is unavailable.
  }
  window.dispatchEvent(
    new CustomEvent(CHANGE_EVENT, { detail: { placeId, photoUrl } }),
  );
}

/** A device-local cover choice shared by cards, lists and the detail sheet. */
export function useCoverPhoto(placeId: string, photos: Photo[]) {
  const [selectedUrl, setSelectedUrl] = useState<string | null>(() => readSelection(placeId));

  useEffect(() => {
    setSelectedUrl(readSelection(placeId));

    const onChange = (event: Event) => {
      const detail = (event as CustomEvent<{ placeId: string; photoUrl: string }>).detail;
      if (detail.placeId === placeId) setSelectedUrl(detail.photoUrl);
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) setSelectedUrl(readSelection(placeId));
    };

    window.addEventListener(CHANGE_EVENT, onChange);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(CHANGE_EVENT, onChange);
      window.removeEventListener('storage', onStorage);
    };
  }, [placeId]);

  const cover = photos.find((photo) => photo.full === selectedUrl) ?? photos[0];
  const chooseCover = useCallback(
    (photo: Photo) => {
      setSelectedUrl(photo.full);
      writeSelection(placeId, photo.full);
    },
    [placeId],
  );

  return { cover, chooseCover };
}
