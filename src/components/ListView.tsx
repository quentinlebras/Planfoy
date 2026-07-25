import { useMemo, useState } from 'react';
import { GROUPS, GROUP_BY_ID } from '../data/taxonomy';
import { formatDrive, formatKm } from '../lib/geo';
import { PlaceCover } from './PlaceCover';
import type { GroupId, Place } from '../types';

type SortKey = 'drive' | 'distance' | 'name' | 'group';

interface Props {
  places: Place[];
  activeId: string | null;
  onLocate: (id: string) => void;
  onOpen: (id: string) => void;
  onItinerary: (place: Place) => void;
}

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'drive', label: 'Temps de route' },
  { key: 'distance', label: 'Distance' },
  { key: 'name', label: 'Nom' },
  { key: 'group', label: 'Type de lieu' },
];

export function ListView({ places, activeId, onLocate, onOpen, onItinerary }: Props) {
  const [sort, setSort] = useState<SortKey>('drive');

  const sorted = useMemo(() => {
    const copy = [...places];
    switch (sort) {
      case 'distance':
        return copy.sort((a, b) => a.distanceKm - b.distanceKm);
      case 'name':
        return copy.sort((a, b) => a.name.localeCompare(b.name, 'fr'));
      case 'group':
        return copy.sort((a, b) => {
          const order = (id: GroupId) => GROUPS.findIndex((g) => g.id === id);
          return order(a.group) - order(b.group) || a.driveMin - b.driveMin;
        });
      default:
        return copy.sort((a, b) => a.driveMin - b.driveMin || a.distanceKm - b.distanceKm);
    }
  }, [places, sort]);

  return (
    <div className="list">
      <div className="list__toolbar">
        <span className="field__label">Trier par</span>
        <div className="segmented">
          {SORTS.map((option) => (
            <button
              key={option.key}
              type="button"
              className={`segmented__item ${sort === option.key ? 'is-on' : ''}`}
              onClick={() => setSort(option.key)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {sorted.length === 0 && <p className="list__empty">Aucun lieu ne correspond aux filtres.</p>}

      <ul className="list__items">
        {sorted.map((place) => {
          const group = GROUP_BY_ID[place.group];
          return (
            <li
              key={place.id}
              className={`row ${place.id === activeId ? 'row--active' : ''}`}
              style={{ ['--group' as string]: group.color }}
            >
              <button
                type="button"
                className="row__hit"
                onClick={() => onOpen(place.id)}
                aria-label={`Ouvrir la fiche de ${place.name}`}
              >
                <PlaceCover place={place} className="row__cover" />
                <div className="row__text">
                  <span className="row__cat">
                    <span aria-hidden="true">{place.emoji}</span> {place.categoryLabel} ·{' '}
                    {place.area}
                  </span>
                  <h3>{place.name}</h3>
                  <p className="row__why">{place.whyGo}</p>
                  <p className="row__meta">
                    <span>🚗 {formatDrive(place.driveMin)}</span>
                    <span>{formatKm(place.distanceKm)}</span>
                    {place.kidFriendly && <span>🧒 enfants</span>}
                    {place.tripEvents.length > 0 && (
                      <span className="badge badge--star">
                        ★ {place.tripEvents.length} évén.
                      </span>
                    )}
                    {place.warnings.length > 0 && <span>⚠️ {place.warnings.length}</span>}
                  </p>
                </div>
              </button>
              <div className="row__actions">
                <button
                  type="button"
                  className="btn btn--tiny btn--primary"
                  onClick={() => onItinerary(place)}
                >
                  Itinéraire
                </button>
                <button type="button" className="btn btn--tiny" onClick={() => onLocate(place.id)}>
                  Sur la carte
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
