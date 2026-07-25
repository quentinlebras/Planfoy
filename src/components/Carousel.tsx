import { useCallback, useEffect, useRef } from 'react';
import { GROUP_BY_ID } from '../data/taxonomy';
import { formatDrive, formatKm } from '../lib/geo';
import { PlaceCover } from './PlaceCover';
import type { Place } from '../types';

interface Props {
  places: Place[];
  activeId: string | null;
  collapsed: boolean;
  onToggle: () => void;
  onActivate: (id: string) => void;
  onOpen: (id: string) => void;
  onItinerary: (place: Place) => void;
}

/** Ignore scroll-driven activation for a moment after we scroll programmatically. */
const SUPPRESS_MS = 750;

export function Carousel({
  places,
  activeId,
  collapsed,
  onToggle,
  onActivate,
  onOpen,
  onItinerary,
}: Props) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const suppressUntil = useRef(0);
  const selfReported = useRef<string | null>(null);
  const frame = useRef(0);

  const activeIndex = places.findIndex((p) => p.id === activeId);

  const centerOn = useCallback((id: string, smooth: boolean) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const card = scroller.querySelector<HTMLElement>(`[data-card-id="${id}"]`);
    if (!card) return;
    const left = card.offsetLeft - (scroller.clientWidth - card.clientWidth) / 2;
    suppressUntil.current = Date.now() + SUPPRESS_MS;
    scroller.scrollTo({ left: Math.max(0, left), behavior: smooth ? 'smooth' : 'auto' });
  }, []);

  // Sliding the carousel moves the map: activate whichever card sits in the middle.
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller || collapsed) return;

    const handleScroll = () => {
      cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(() => {
        if (Date.now() < suppressUntil.current) return;
        const middle = scroller.scrollLeft + scroller.clientWidth / 2;
        let bestId: string | null = null;
        let bestDelta = Number.POSITIVE_INFINITY;
        for (const card of scroller.querySelectorAll<HTMLElement>('[data-card-id]')) {
          const center = card.offsetLeft + card.clientWidth / 2;
          const delta = Math.abs(center - middle);
          if (delta < bestDelta) {
            bestDelta = delta;
            bestId = card.dataset.cardId ?? null;
          }
        }
        if (bestId && bestId !== activeId) {
          selfReported.current = bestId;
          onActivate(bestId);
        }
      });
    };

    scroller.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      scroller.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(frame.current);
    };
  }, [activeId, collapsed, onActivate, places]);

  // A marker click (or list click) scrolls the matching card into the middle.
  useEffect(() => {
    if (!activeId || collapsed) return;
    if (selfReported.current === activeId) {
      selfReported.current = null;
      return;
    }
    centerOn(activeId, true);
  }, [activeId, collapsed, centerOn]);

  const step = (direction: -1 | 1) => {
    if (places.length === 0) return;
    const from = activeIndex >= 0 ? activeIndex : 0;
    const next = Math.min(places.length - 1, Math.max(0, from + direction));
    onActivate(places[next].id);
  };

  return (
    <section className={`carousel ${collapsed ? 'carousel--collapsed' : ''}`} aria-label="Lieux">
      <div className="carousel__handle">
        <button
          type="button"
          className="carousel__grip"
          onClick={onToggle}
          aria-expanded={!collapsed}
        >
          <span className="carousel__grip-bar" aria-hidden="true" />
          <span className="carousel__grip-label">
            {collapsed ? `Afficher les ${places.length} lieux` : 'Masquer le carrousel'}
          </span>
        </button>
        {!collapsed && (
          <div className="carousel__nav">
            <button
              type="button"
              className="round"
              onClick={() => step(-1)}
              disabled={activeIndex <= 0}
              aria-label="Lieu précédent"
            >
              ‹
            </button>
            <span className="carousel__counter">
              {activeIndex >= 0
                ? `${activeIndex + 1} / ${places.length}`
                : `${places.length} lieux`}
            </span>
            <button
              type="button"
              className="round"
              onClick={() => step(1)}
              disabled={activeIndex === places.length - 1}
              aria-label="Lieu suivant"
            >
              ›
            </button>
          </div>
        )}
      </div>

      {!collapsed && (
        <div className="carousel__scroller" ref={scrollerRef}>
          {places.length === 0 && (
            <p className="carousel__empty">Aucun lieu ne correspond aux filtres.</p>
          )}
          {places.map((place) => {
            const group = GROUP_BY_ID[place.group];
            const active = place.id === activeId;
            return (
              <article
                key={place.id}
                data-card-id={place.id}
                className={`mini ${active ? 'mini--active' : ''}`}
                style={{ ['--group' as string]: group.color }}
              >
                <button
                  type="button"
                  className="mini__hit"
                  onClick={() => (active ? onOpen(place.id) : onActivate(place.id))}
                  aria-label={
                    active ? `Ouvrir la fiche de ${place.name}` : `Centrer sur ${place.name}`
                  }
                >
                  <PlaceCover place={place} className="mini__cover" />
                  <div className="mini__body">
                    <span className="mini__cat">
                      <span aria-hidden="true">{place.emoji}</span> {place.categoryLabel}
                    </span>
                    <h3 className="mini__name">{place.name}</h3>
                    <p className="mini__meta">
                      🚗 {formatDrive(place.driveMin)} · {formatKm(place.distanceKm)}
                      {place.kidFriendly && ' · 🧒'}
                    </p>
                  </div>
                </button>
                <div className="mini__actions">
                  <button
                    type="button"
                    className="btn btn--tiny btn--primary"
                    onClick={() => onItinerary(place)}
                  >
                    Itinéraire
                  </button>
                  <button
                    type="button"
                    className="btn btn--tiny"
                    onClick={() => onOpen(place.id)}
                  >
                    Détails
                  </button>
                </div>
                {place.tripEvents.length > 0 && (
                  <span className="mini__badge" title="Événement pendant le séjour">
                    ★
                  </span>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
