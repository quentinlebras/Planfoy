import { GROUP_BY_ID } from '../data/taxonomy';
import { useCoverPhoto } from '../lib/useCoverPhoto';
import { usePhotos } from '../lib/usePhotos';
import type { Place } from '../types';

interface Props {
  place: Place;
  enabled?: boolean;
  className?: string;
}

/**
 * Cover image for a place. Falls back to a tinted card when Commons has no
 * freely licensed photo, which happens for the smaller natural sites.
 */
export function PlaceCover({ place, enabled = true, className = '' }: Props) {
  const { photos, state } = usePhotos(place, enabled);
  const group = GROUP_BY_ID[place.group];
  const { cover } = useCoverPhoto(place.id, photos);

  return (
    <div
      className={`cover cover--${state} ${className}`}
      style={{ ['--group' as string]: group.color, ['--group-dark' as string]: group.colorDark }}
    >
      {cover ? (
        <img src={cover.thumb} alt={place.name} loading="lazy" decoding="async" />
      ) : (
        <div className="cover__fallback" aria-hidden="true">
          <span className="cover__emoji">{place.emoji}</span>
        </div>
      )}
      {state === 'loading' && <div className="cover__shimmer" aria-hidden="true" />}
    </div>
  );
}
