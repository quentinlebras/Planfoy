import { GROUP_BY_ID } from '../data/taxonomy';
import { formatDrive, formatKm } from '../lib/geo';
import { PlaceCover } from './PlaceCover';
import type { Place } from '../types';

interface Props {
  place: Place;
  onOpen: () => void;
  onClose: () => void;
  onItinerary: () => void;
}

/**
 * Compact card shown over the map when the carousel is collapsed. Clicking it
 * opens the full-screen sheet.
 */
export function PlaceCard({ place, onOpen, onClose, onItinerary }: Props) {
  const group = GROUP_BY_ID[place.group];
  return (
    <article className="floating" style={{ ['--group' as string]: group.color }}>
      <button
        type="button"
        className="floating__close"
        onClick={onClose}
        aria-label="Fermer la carte du lieu"
      >
        ✕
      </button>
      <button
        type="button"
        className="floating__hit"
        onClick={onOpen}
        aria-label={`Ouvrir la fiche de ${place.name}`}
      >
        <PlaceCover place={place} className="floating__cover" />
        <div className="floating__body">
          <span className="floating__cat">
            <span aria-hidden="true">{place.emoji}</span> {place.categoryLabel} · {place.area}
          </span>
          <h3>{place.name}</h3>
          <p className="floating__why">{place.whyGo}</p>
          <p className="floating__meta">
            🚗 {formatDrive(place.driveMin)} · {formatKm(place.distanceKm)}
            {place.kidFriendly && ' · 🧒 enfants'}
          </p>
        </div>
      </button>
      <div className="floating__actions">
        <button type="button" className="btn btn--primary" onClick={onItinerary}>
          🧭 Itinéraire
        </button>
        <button type="button" className="btn" onClick={onOpen}>
          Plein écran
        </button>
      </div>
    </article>
  );
}
