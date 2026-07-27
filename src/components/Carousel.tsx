import { useCallback, useEffect, useRef } from 'react';
import { GROUP_BY_ID } from '../data/taxonomy';
import { formatDrive, formatKm } from '../lib/geo';
import { PlaceCover } from './PlaceCover';
import type { Place } from '../types';

interface Props {
  places: Place[];
  activeId: string | null;
  visible: boolean;
  onActivate: (id: string) => void;
  onOpen: (id: string) => void;
}

/** Ignore scroll-driven activation for a moment after we scroll programmatically. */
const SUPPRESS_MS = 750;

export function Carousel({
  places,
  activeId,
  visible,
  onActivate,
  onOpen,
}: Props) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const suppressUntil = useRef(0);
  const selfReported = useRef<string | null>(null);
  const frame = useRef(0);

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
    if (!scroller || !visible) return;

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
  }, [activeId, onActivate, places, visible]);

  // A marker click (or list click) scrolls the matching card into the middle.
  useEffect(() => {
    if (!activeId || !visible) return;
    if (selfReported.current === activeId) {
      selfReported.current = null;
      return;
    }
    centerOn(activeId, true);
  }, [activeId, centerOn, visible]);

  if (!visible) return null;
  const tintPlace = places.find((place) => place.id === activeId) ?? places[0];
  const tintGroup = tintPlace ? GROUP_BY_ID[tintPlace.group] : GROUP_BY_ID.nature;

  return (
    <section
      className="carousel"
      aria-label="Lieux"
      style={{
        ['--carousel-tint' as string]: tintGroup.color,
        ['--carousel-tint-dark' as string]: tintGroup.colorDark,
      }}
    >
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
                {place.tripEvents.length > 0 && (
                  <span className="mini__badge" title="Événement pendant le séjour">
                    ★
                  </span>
                )}
              </article>
            );
          })}
      </div>
    </section>
  );
}
