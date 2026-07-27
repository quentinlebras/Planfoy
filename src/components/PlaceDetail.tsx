import { useEffect, useState } from 'react';
import { GROUP_BY_ID } from '../data/taxonomy';
import { TRIP_END, TRIP_START } from '../data/home';
import {
  appleDirectionsUrl,
  formatDrive,
  formatKm,
  googleDirectionsUrl,
  googlePlaceUrl,
  wazeUrl,
} from '../lib/geo';
import { useCoverPhoto } from '../lib/useCoverPhoto';
import { usePhotos } from '../lib/usePhotos';
import { Lightbox } from './Lightbox';
import type { Place, PlaceEvent } from '../types';

interface Props {
  place: Place;
  /** Routing origin: the rental's address, or "lat,lon" if it was overridden. */
  origin: string;
  onClose: () => void;
  onShowOnMap: () => void;
}

const DATE_FORMAT = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'short',
  day: 'numeric',
  month: 'long',
});

function formatEventDates(event: PlaceEvent): string {
  const start = new Date(`${event.start}T12:00:00`);
  if (event.singleDay) return DATE_FORMAT.format(start);
  const end = new Date(`${event.end}T12:00:00`);
  return `du ${DATE_FORMAT.format(start)} au ${DATE_FORMAT.format(end)}`;
}

function duringTrip(event: PlaceEvent): boolean {
  return event.start <= TRIP_END && event.end >= TRIP_START;
}

export function PlaceDetail({ place, origin, onClose, onShowOnMap }: Props) {
  const group = GROUP_BY_ID[place.group];
  const { photos, state } = usePhotos(place);
  const { cover, chooseCover } = useCoverPhoto(place.id, photos);
  const [lightbox, setLightbox] = useState<number | null>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && lightbox === null) onClose();
    };
    window.addEventListener('keydown', onKey);
    document.body.classList.add('is-locked');
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.classList.remove('is-locked');
    };
  }, [onClose, lightbox]);

  const destination = { lat: place.lat, lon: place.lon };

  return (
    <div
      className="sheet"
      role="dialog"
      aria-modal="true"
      aria-label={place.name}
      style={{
        ['--group' as string]: group.color,
        ['--group-dark' as string]: group.colorDark,
      }}
    >
      <div className="sheet__scroll">
        <header className="sheet__hero">
          {cover ? (
            <img className="sheet__hero-img" src={cover.thumb} alt={place.name} />
          ) : (
            <div className="sheet__hero-fallback" aria-hidden="true">
              {place.emoji}
            </div>
          )}
          <button
            type="button"
            className="sheet__close round"
            onClick={onClose}
            aria-label="Fermer la fiche"
          >
            ✕
          </button>
          <div className="sheet__hero-text">
            <span className="badge badge--group">
              <span aria-hidden="true">{place.emoji}</span> {place.categoryLabel}
            </span>
            <h2>{place.name}</h2>
            <p>{place.area}</p>
          </div>
        </header>

        <div className="sheet__body">
          <div className="sheet__actions">
            <a
              className="btn btn--primary"
              href={googleDirectionsUrl(origin, destination)}
              target="_blank"
              rel="noreferrer noopener"
            >
              🧭 Itinéraire depuis l'Airbnb
            </a>
            <button type="button" className="btn" onClick={onShowOnMap}>
              📍 Voir sur la carte
            </button>
            <a
              className="btn"
              href={wazeUrl(destination)}
              target="_blank"
              rel="noreferrer noopener"
            >
              Waze
            </a>
            <a
              className="btn"
              href={appleDirectionsUrl(origin, destination)}
              target="_blank"
              rel="noreferrer noopener"
            >
              Plans (iOS)
            </a>
          </div>

          <dl className="facts">
            <div>
              <dt>Trajet estimé</dt>
              <dd>🚗 {formatDrive(place.driveMin)}</dd>
            </div>
            <div>
              <dt>Distance directe</dt>
              <dd>{formatKm(place.distanceKm)}</dd>
            </div>
            <div>
              <dt>Public</dt>
              <dd>
                {place.kidFriendly ? '🧒 ' : ''}
                {place.audience}
              </dd>
            </div>
            <div>
              <dt>Position GPS</dt>
              <dd>
                {place.precise ? 'Point précis' : 'Repère approximatif'}
                <span className="muted"> · {place.lat.toFixed(4)}, {place.lon.toFixed(4)}</span>
              </dd>
            </div>
          </dl>

          <section className="block">
            <h3>Pourquoi y aller</h3>
            <p>{place.whyGo}</p>
          </section>

          <section className="block">
            <h3>Horaires</h3>
            <p>{place.openingHours}</p>
            {!place.verified && (
              <p className="notice notice--warn">
                Informations « meilleure source disponible » : à revérifier 24-48 h avant de
                partir.
              </p>
            )}
          </section>

          {place.events.length > 0 && (
            <section className="block">
              <h3>Événements 2026</h3>
              <ul className="events">
                {place.events.map((event, index) => (
                  <li key={index} className={duringTrip(event) ? 'events__item--trip' : ''}>
                    <span className="events__date">
                      {formatEventDates(event)}
                      {event.time ? ` · ${event.time}` : ''}
                    </span>
                    <span className="events__title">{event.title}</span>
                    {duringTrip(event) && <span className="badge badge--star">Pendant le séjour</span>}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {place.warnings.length > 0 && (
            <section className="block">
              <h3>À savoir</h3>
              <ul className="warnings">
                {place.warnings.map((warning) => (
                  <li key={warning}>⚠️ {warning}</li>
                ))}
              </ul>
            </section>
          )}

          {place.notes && (
            <section className="block">
              <h3>Notes</h3>
              <p>{place.notes}</p>
            </section>
          )}

          <section className="block">
            <h3>Photos</h3>
            {photos.length > 0 && (
              <p className="muted">Touche l’étoile pour choisir la miniature de ce lieu.</p>
            )}
            {state === 'loading' && <p className="muted">Recherche de photos…</p>}
            {photos.length > 0 && (
              <div className="gallery">
                {photos.map((photo, index) => (
                  <div
                    key={photo.full}
                    className={`gallery__item ${
                      cover?.full === photo.full ? 'gallery__item--cover' : ''
                    }`}
                  >
                    <button
                      type="button"
                      className="gallery__open"
                      onClick={() => setLightbox(index)}
                      aria-label={`Agrandir : ${photo.title}`}
                    >
                      <img src={photo.thumb} alt={photo.title} loading="lazy" />
                    </button>
                    <button
                      type="button"
                      className={`gallery__cover ${
                        cover?.full === photo.full ? 'is-selected' : ''
                      }`}
                      onClick={() => chooseCover(photo)}
                      aria-label={
                        cover?.full === photo.full
                          ? `${photo.title} est la miniature actuelle`
                          : `Choisir ${photo.title} comme miniature`
                      }
                      aria-pressed={cover?.full === photo.full}
                    >
                      ★
                    </button>
                  </div>
                ))}
              </div>
            )}
            {state === 'empty' && (
              <p className="muted">
                Pas de photo libre de droits trouvée pour ce lieu. Les recherches d'images
                ci-dessous ouvrent des résultats externes.
              </p>
            )}
            {state === 'error' && (
              <p className="notice notice--warn">
                Wikimedia Commons est injoignable pour le moment. Réessaie plus tard, ou utilise
                les recherches d'images ci-dessous.
              </p>
            )}
            <div className="links">
              {place.officialUrl && (
                <a
                  className="btn btn--tiny"
                  href={place.officialUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  Site officiel ↗
                </a>
              )}
              {place.searchLinks.map((url) => (
                <a
                  key={url}
                  className="btn btn--tiny"
                  href={url}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  {url.includes('bing')
                    ? 'Images Bing ↗'
                    : url.includes('wikimedia')
                      ? 'Wikimedia ↗'
                      : 'Images Google ↗'}
                </a>
              ))}
              <a
                className="btn btn--tiny"
                href={googlePlaceUrl(destination, place.name)}
                target="_blank"
                rel="noreferrer noopener"
              >
                Ouvrir dans Maps ↗
              </a>
            </div>
          </section>
        </div>
      </div>

      {lightbox !== null && (
        <Lightbox
          photos={photos}
          index={lightbox}
          onIndexChange={setLightbox}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  );
}
