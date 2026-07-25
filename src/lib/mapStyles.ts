import type { StyleSpecification } from 'maplibre-gl';

export type BasemapId = 'plan' | 'relief' | 'satellite';

export interface Basemap {
  id: BasemapId;
  label: string;
  emoji: string;
  style: StyleSpecification;
}

function rasterStyle(
  id: string,
  tiles: string[],
  attribution: string,
  maxzoom: number,
): StyleSpecification {
  return {
    version: 8,
    sources: {
      [id]: {
        type: 'raster',
        tiles,
        tileSize: 256,
        attribution,
        maxzoom,
      },
    },
    layers: [
      { id: 'background', type: 'background', paint: { 'background-color': '#e8e6e1' } },
      { id, type: 'raster', source: id, paint: { 'raster-fade-duration': 200 } },
    ],
  };
}

export const BASEMAPS: Basemap[] = [
  {
    id: 'plan',
    label: 'Plan',
    emoji: '🗺️',
    style: rasterStyle(
      'osm',
      ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      19,
    ),
  },
  {
    id: 'relief',
    label: 'Relief',
    emoji: '⛰️',
    style: rasterStyle(
      'opentopomap',
      [
        'https://a.tile.opentopomap.org/{z}/{x}/{y}.png',
        'https://b.tile.opentopomap.org/{z}/{x}/{y}.png',
        'https://c.tile.opentopomap.org/{z}/{x}/{y}.png',
      ],
      '© <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA), © OpenStreetMap',
      17,
    ),
  },
  {
    id: 'satellite',
    label: 'Satellite',
    emoji: '🛰️',
    style: rasterStyle(
      'esri',
      [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      ],
      'Imagerie © Esri, Maxar, Earthstar Geographics',
      19,
    ),
  },
];

export const BASEMAP_BY_ID = Object.fromEntries(BASEMAPS.map((b) => [b.id, b])) as Record<
  BasemapId,
  Basemap
>;
