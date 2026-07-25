import { useEffect, useState } from 'react';
import { loadPhotos } from './images';
import type { Photo, Place } from '../types';

export type PhotoState = 'idle' | 'loading' | 'ready' | 'empty' | 'error';

/**
 * Photos are fetched lazily so the map stays responsive; pass `enabled: false`
 * for offscreen cards.
 */
export function usePhotos(place: Place | null, enabled = true) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [state, setState] = useState<PhotoState>('idle');

  useEffect(() => {
    if (!place || !enabled) return;
    let active = true;
    setState('loading');
    setPhotos([]);
    loadPhotos(place)
      .then((result) => {
        if (!active) return;
        setPhotos(result);
        setState(result.length > 0 ? 'ready' : 'empty');
      })
      .catch(() => {
        if (active) setState('error');
      });
    return () => {
      active = false;
    };
  }, [place, enabled]);

  return { photos, state };
}
