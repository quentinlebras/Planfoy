import { useEffect, useRef } from 'react';
import {
  GeolocateControl,
  LngLatBounds,
  Map as MapLibreMap,
  Marker,
  NavigationControl,
  ScaleControl,
  type LngLatBoundsLike,
} from 'maplibre-gl';
import { GROUP_BY_ID } from '../data/taxonomy';
import { HOME_LABEL, HOME_SHORT_ADDRESS } from '../data/home';
import { BASEMAP_BY_ID, type BasemapId } from '../lib/mapStyles';
import type { Home } from '../lib/useHome';
import type { Place } from '../types';

interface Props {
  places: Place[];
  home: Home;
  basemap: BasemapId;
  activeId: string | null;
  onSelect: (id: string) => void;
  onMapReady: (controller: MapController) => void;
}

export interface MapController {
  focus: (place: Place, zoom?: number) => void;
  fitAll: () => void;
  goHome: () => void;
}

const PLANFOY_VIEW = { center: [4.45, 45.4] as [number, number], zoom: 9.4 };

/**
 * Southern pins sit above northern ones, the usual cartographic convention: it
 * keeps overlapping markers in a predictable order instead of DOM order.
 */
function baseZIndex(place: Place): string {
  return String(1000 + Math.round((46 - place.lat) * 2000));
}

function markerElement(place: Place, onSelect: (id: string) => void): HTMLElement {
  const group = GROUP_BY_ID[place.group];
  const el = document.createElement('button');
  el.type = 'button';
  el.className = 'pin';
  el.dataset.placeId = place.id;
  el.style.setProperty('--pin', group.color);
  el.style.setProperty('--pin-dark', group.colorDark);
  el.setAttribute('aria-label', `${place.name} — ${place.categoryLabel}`);
  // MapLibre owns the root element's transform, so scaling happens on a wrapper.
  el.innerHTML = `<span class="pin__scale"><span class="pin__body"><span class="pin__emoji">${place.emoji}</span></span><span class="pin__tip"></span></span>`;
  el.addEventListener('click', (event) => {
    event.stopPropagation();
    onSelect(place.id);
  });
  return el;
}

function homeElement(approximate: boolean): HTMLElement {
  const el = document.createElement('div');
  el.className = 'pin pin--home';
  el.setAttribute(
    'title',
    approximate
      ? `${HOME_LABEL} — ${HOME_SHORT_ADDRESS} (repère au centre du village)`
      : `${HOME_LABEL} — ${HOME_SHORT_ADDRESS}`,
  );
  el.innerHTML = `<span class="pin__scale"><span class="pin__body"><span class="pin__emoji">🏡</span></span><span class="pin__tip"></span></span>`;
  return el;
}

export function MapView({ places, home, basemap, activeId, onSelect, onMapReady }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef(new Map<string, Marker>());
  const homeMarkerRef = useRef<Marker | null>(null);
  const placesRef = useRef(places);
  const selectRef = useRef(onSelect);
  const homeRef = useRef(home);

  placesRef.current = places;
  selectRef.current = onSelect;
  homeRef.current = home;

  // Create the map once; style, markers and camera are updated by later effects.
  useEffect(() => {
    if (!containerRef.current) return;
    const map = new MapLibreMap({
      container: containerRef.current,
      style: BASEMAP_BY_ID[basemap].style,
      center: PLANFOY_VIEW.center,
      zoom: PLANFOY_VIEW.zoom,
      attributionControl: { compact: true },
      maxZoom: 18,
      minZoom: 6,
    });
    map.addControl(new NavigationControl({ showCompass: false }), 'top-right');
    map.addControl(
      new GeolocateControl({ trackUserLocation: false, showAccuracyCircle: true }),
      'top-right',
    );
    map.addControl(new ScaleControl({ unit: 'metric' }), 'bottom-left');
    mapRef.current = map;

    // Pins shrink when zoomed out so the dense Saint-Étienne cluster stays
    // readable instead of turning into one blob.
    const applyDensity = () => {
      const zoom = map.getZoom();
      const container = map.getContainer();
      container.classList.toggle('map--far', zoom < 10.6);
      container.classList.toggle('map--mid', zoom >= 10.6 && zoom < 12.2);
    };
    applyDensity();
    map.on('zoom', applyDensity);

    const boundsOf = (items: Place[]) => {
      const bounds = new LngLatBounds();
      for (const place of items) bounds.extend([place.lon, place.lat]);
      return bounds;
    };

    onMapReady({
      focus: (place, zoom) => {
        map.flyTo({
          center: [place.lon, place.lat],
          zoom: zoom ?? Math.max(map.getZoom(), 12.5),
          speed: 1.1,
          curve: 1.4,
          padding: { top: 40, bottom: 220, left: 20, right: 20 },
        });
      },
      fitAll: () => {
        const items = placesRef.current;
        if (items.length === 0) return;
        if (items.length === 1) {
          map.flyTo({ center: [items[0].lon, items[0].lat], zoom: 13 });
          return;
        }
        map.fitBounds(boundsOf(items) as LngLatBoundsLike, {
          padding: { top: 90, bottom: 240, left: 40, right: 40 },
          maxZoom: 13,
          duration: 700,
        });
      },
      goHome: () => {
        map.flyTo({ center: [homeRef.current.lon, homeRef.current.lat], zoom: 13.5 });
      },
    });

    const markers = markersRef.current;
    return () => {
      map.off('zoom', applyDensity);
      map.remove();
      mapRef.current = null;
      markers.clear();
      homeMarkerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Basemap switching keeps HTML markers, which live outside the style.
  useEffect(() => {
    mapRef.current?.setStyle(BASEMAP_BY_ID[basemap].style);
  }, [basemap]);

  // Sync markers with the filtered list.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const markers = markersRef.current;
    const wanted = new Set(places.map((p) => p.id));

    for (const [id, marker] of markers) {
      if (!wanted.has(id)) {
        marker.remove();
        markers.delete(id);
      }
    }
    for (const place of places) {
      if (markers.has(place.id)) continue;
      const element = markerElement(place, (id) => selectRef.current(id));
      element.style.zIndex = baseZIndex(place);
      const marker = new Marker({ element, anchor: 'bottom' })
        .setLngLat([place.lon, place.lat])
        .addTo(map);
      markers.set(place.id, marker);
    }
  }, [places]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!homeMarkerRef.current) {
      homeMarkerRef.current = new Marker({
        element: homeElement(home.approximate),
        anchor: 'bottom',
      })
        .setLngLat([home.lon, home.lat])
        .addTo(map);
    } else {
      homeMarkerRef.current.setLngLat([home.lon, home.lat]);
    }
  }, [home]);

  // Highlight the active marker and lift it above its neighbours.
  useEffect(() => {
    for (const place of places) {
      const marker = markersRef.current.get(place.id);
      if (!marker) continue;
      const el = marker.getElement();
      const active = place.id === activeId;
      el.classList.toggle('pin--active', active);
      el.style.zIndex = active ? '99999' : baseZIndex(place);
    }
  }, [activeId, places]);

  return <div className="map" ref={containerRef} />;
}
