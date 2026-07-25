import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MapView, type MapController } from './components/MapView';
import { Carousel } from './components/Carousel';
import { ListView } from './components/ListView';
import { PlaceCard } from './components/PlaceCard';
import { PlaceDetail } from './components/PlaceDetail';
import { OriginDialog } from './components/OriginDialog';
import { EMPTY_FILTERS, FilterBar, type Filters } from './components/FilterBar';
import { InfoDialog } from './components/InfoDialog';
import { PLACES, PLACE_BY_ID, withDistances } from './data/places';
import { DEFAULT_HOME } from './data/home';
import { GROUPS } from './data/taxonomy';
import { BASEMAPS, type BasemapId } from './lib/mapStyles';
import { googleDirectionsUrl, type LatLon } from './lib/geo';
import { useLocalStorage } from './lib/useLocalStorage';
import type { Place } from './types';

type View = 'map' | 'list';

function normalize(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
}

function matches(place: Place, filters: Filters): boolean {
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

function placeIdFromHash(): string | null {
  const match = window.location.hash.match(/^#\/lieu\/([a-z0-9]+)$/i);
  return match && PLACE_BY_ID.has(match[1]) ? match[1] : null;
}

export default function App() {
  const [home, setHome] = useLocalStorage<LatLon>('planfoy:home:v1', DEFAULT_HOME);
  const [basemap, setBasemap] = useLocalStorage<BasemapId>('planfoy:basemap:v1', 'plan');
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [view, setView] = useState<View>('map');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [originOpen, setOriginOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const mapRef = useRef<MapController | null>(null);

  const places = useMemo(() => withDistances(PLACES, home), [home]);
  const visible = useMemo(
    () => places.filter((place) => matches(place, filters)),
    [places, filters],
  );
  const active = activeId ? (visible.find((p) => p.id === activeId) ?? null) : null;
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

  const itinerary = useCallback(
    (place: Place) => {
      window.open(
        googleDirectionsUrl(home, { lat: place.lat, lon: place.lon }),
        '_blank',
        'noopener,noreferrer',
      );
    },
    [home],
  );

  const locateFromList = useCallback(
    (id: string) => {
      setView('map');
      setCollapsed(false);
      // Wait for the map to be laid out again before flying to the marker.
      requestAnimationFrame(() => focus(id, false));
    },
    [focus],
  );

  return (
    <div className={`app app--${view}`}>
      <header className="topbar">
        <div className="topbar__brand">
          <span className="topbar__logo" aria-hidden="true">
            🏡
          </span>
          <div>
            <h1>Planfoy 2026</h1>
            <p>
              Pilat, Saint-Étienne &amp; alentours · {PLACES.length} lieux
            </p>
          </div>
        </div>
        <div className="topbar__actions">
          <div className="segmented segmented--view">
            <button
              type="button"
              className={`segmented__item ${view === 'map' ? 'is-on' : ''}`}
              onClick={() => setView('map')}
            >
              🗺️ Carte
            </button>
            <button
              type="button"
              className={`segmented__item ${view === 'list' ? 'is-on' : ''}`}
              onClick={() => setView('list')}
            >
              ☰ Liste
            </button>
          </div>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => setOriginOpen(true)}
            title="Changer le point de départ des itinéraires"
          >
            <span aria-hidden="true">🧭</span>
            <span className="btn__label">Départ</span>
          </button>
          <button
            type="button"
            className="btn btn--ghost btn--icon"
            onClick={() => setInfoOpen(true)}
            aria-label="À propos et légende"
          >
            ⓘ
          </button>
        </div>
      </header>

      <FilterBar filters={filters} onChange={setFilters} resultCount={visible.length} />

      <main className="stage">
        <div className="stage__map" hidden={view !== 'map'}>
          <MapView
            places={visible}
            home={home}
            basemap={basemap}
            activeId={activeId}
            onSelect={(id) => focus(id, false)}
            onMapReady={(controller) => {
              mapRef.current = controller;
            }}
          />

          <div className="map__tools">
            <div className="basemaps">
              {BASEMAPS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={`basemaps__item ${basemap === option.id ? 'is-on' : ''}`}
                  onClick={() => setBasemap(option.id)}
                  title={`Fond de carte : ${option.label}`}
                >
                  <span aria-hidden="true">{option.emoji}</span>
                  <span className="basemaps__label">{option.label}</span>
                </button>
              ))}
            </div>
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

          <div className="map__legend">
            {GROUPS.map((group) => (
              <span key={group.id} className="legend__item">
                <i style={{ background: group.color }} aria-hidden="true" />
                {group.short}
              </span>
            ))}
          </div>

          {collapsed && active && (
            <PlaceCard
              place={active}
              onOpen={() => openDetail(active.id)}
              onClose={() => setActiveId(null)}
              onItinerary={() => itinerary(active)}
            />
          )}

          <Carousel
            places={visible}
            activeId={activeId}
            collapsed={collapsed}
            onToggle={() => setCollapsed(!collapsed)}
            onActivate={(id) => focus(id, true)}
            onOpen={openDetail}
            onItinerary={itinerary}
          />
        </div>

        <div className="stage__list" hidden={view !== 'list'}>
          <ListView
            places={visible}
            activeId={activeId}
            onLocate={locateFromList}
            onOpen={openDetail}
            onItinerary={itinerary}
          />
        </div>
      </main>

      {detail && (
        <PlaceDetail
          place={detail}
          home={home}
          onClose={() => setDetailId(null)}
          onShowOnMap={() => {
            setDetailId(null);
            setView('map');
            setCollapsed(false);
            requestAnimationFrame(() => focus(detail.id, false));
          }}
        />
      )}

      {originOpen && (
        <OriginDialog home={home} onSave={setHome} onClose={() => setOriginOpen(false)} />
      )}
      {infoOpen && <InfoDialog onClose={() => setInfoOpen(false)} />}
    </div>
  );
}
