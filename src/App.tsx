import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MapView, type MapController } from './components/MapView';
import { Carousel } from './components/Carousel';
import { PlaceDetail } from './components/PlaceDetail';
import { FilterBar } from './components/FilterBar';
import { PLACES, PLACE_BY_ID, withDistances } from './data/places';
import { BASEMAPS, type BasemapId } from './lib/mapStyles';
import { EMPTY_FILTERS, matches, type Filters } from './lib/filters';
import { useLocalStorage } from './lib/useLocalStorage';
import { routingOrigin, useHome } from './lib/useHome';
import pilatMark from './assets/pilat.svg';

function placeIdFromHash(): string | null {
  const match = window.location.hash.match(/^#\/lieu\/([a-z0-9]+)$/i);
  return match && PLACE_BY_ID.has(match[1]) ? match[1] : null;
}

export default function App() {
  const { home } = useHome();
  const [basemap, setBasemap] = useLocalStorage<BasemapId>('planfoy:basemap:v1', 'plan');
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [carouselVisible, setCarouselVisible] = useState(true);
  const mapRef = useRef<MapController | null>(null);

  const origin = routingOrigin(home);
  const places = useMemo(() => withDistances(PLACES, home), [home]);
  const visible = useMemo(
    () => places.filter((place) => matches(place, filters)),
    [places, filters],
  );
  const detail = detailId ? (places.find((p) => p.id === detailId) ?? null) : null;

  // Shareable links: #/lieu/<id> opens straight onto a place.
  useEffect(() => {
    const fromHash = placeIdFromHash();
    if (fromHash) {
      setActiveId(fromHash);
      setDetailId(fromHash);
    }
  }, []);

  useEffect(() => {
    if (detailId) {
      window.history.replaceState(null, '', `#/lieu/${detailId}`);
    } else if (window.location.hash.startsWith('#/lieu/')) {
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, [detailId]);

  // Keep the selection valid when filters shrink the list.
  useEffect(() => {
    if (activeId && !visible.some((p) => p.id === activeId)) setActiveId(null);
  }, [visible, activeId]);

  const focus = useCallback((id: string, fromCarousel: boolean) => {
    setActiveId(id);
    const place = PLACE_BY_ID.get(id);
    if (place && mapRef.current) mapRef.current.focus(place, fromCarousel ? undefined : 13);
  }, []);

  const openDetail = useCallback((id: string) => {
    setActiveId(id);
    setDetailId(id);
  }, []);

  return (
    <div className="app">
      <header className="topbar">
        <span
          className="topbar__mark"
          role="img"
          aria-label="Pilat 2026"
          style={{
            maskImage: `url(${pilatMark})`,
            WebkitMaskImage: `url(${pilatMark})`,
          }}
        />
        <div className="basemaps basemaps--header" aria-label="Fond de carte">
          {BASEMAPS.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`basemaps__item ${basemap === option.id ? 'is-on' : ''}`}
              onClick={() => setBasemap(option.id)}
              title={`Fond de carte : ${option.label}`}
              aria-pressed={basemap === option.id}
            >
              <span aria-hidden="true">{option.emoji}</span>
              <span className="basemaps__label">{option.label}</span>
            </button>
          ))}
        </div>
      </header>

      <FilterBar filters={filters} onChange={setFilters} />

      <main className="stage">
        <div className="stage__map">
          <MapView
            places={visible}
            home={home}
            basemap={basemap}
            activeId={activeId}
            onSelect={(id) => {
              setCarouselVisible(true);
              focus(id, false);
            }}
            onPan={() => setCarouselVisible(false)}
            onMapReady={(controller) => {
              mapRef.current = controller;
            }}
          />

          <div className="map__tools">
            <div className="map__buttons">
              <button
                type="button"
                className="round round--lg"
                onClick={() => mapRef.current?.fitAll()}
                title="Voir tous les lieux affichés"
              >
                ⤢
              </button>
              <button
                type="button"
                className="round round--lg"
                onClick={() => mapRef.current?.goHome()}
                title="Recentrer sur l'Airbnb"
              >
                🏡
              </button>
            </div>
          </div>

          <Carousel
            places={visible}
            activeId={activeId}
            visible={carouselVisible}
            onActivate={(id) => focus(id, true)}
            onOpen={openDetail}
          />
        </div>
      </main>

      {detail && (
        <PlaceDetail
          place={detail}
          origin={origin}
          onClose={() => setDetailId(null)}
          onShowOnMap={() => {
            setDetailId(null);
            setCarouselVisible(true);
            requestAnimationFrame(() => focus(detail.id, false));
          }}
        />
      )}
    </div>
  );
}
