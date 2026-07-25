# Planfoy 2026

Interactive map of 50 places to visit around **Planfoy** (Loire, France): the Pilat regional park,
Saint-Étienne, swimming spots, summer *guinguettes* and family outings — with driving directions
from the rental for every marker.

Built as a static single-page app, so it is free to host and needs no API key.

## Features

- **Map with three basemaps** — Plan (OpenStreetMap) for the city, Relief (OpenTopoMap) for the
  Pilat ridges and trails, Satellite (Esri) to scout beaches and access roads.
- **Markers colored by universe** (culture, nature, swimming, nightlife, kids, city walks) with a
  per-category icon. Southern pins stack above northern ones, and pins shrink when zoomed out so
  the dense Saint-Étienne cluster stays readable.
- **Filters** — universe, precise category, maximum drive time, "good with kids", "event during the
  trip", plus full-text search across names, areas and descriptions.
- **Bottom carousel** — collapsible; sliding it pans the map, and clicking a marker scrolls the
  matching card into view. Clicking the active card opens the full-screen sheet.
- **List view** — sortable by drive time, straight-line distance, name or universe.
- **Place sheet** — photo gallery with lightbox, opening hours, dated 2026 events (those falling
  inside the trip window are highlighted), warnings, audience, official links.
- **Directions** — Google Maps, Waze and Apple Maps links from the rental to each place. Routing
  uses the rental's postal address (`src/data/home.ts`) rather than coordinates, so the providers
  resolve the exact building themselves. Anyone can start from somewhere else via the 🧭 button,
  which is stored per browser.
- **Home pin** — the map marker needs coordinates, so the address is geocoded once per browser
  against Nominatim and cached for 90 days; until then the pin sits at the village center and says
  so. Routing never depends on that lookup. To skip it entirely, replace `FALLBACK_PIN` in
  `src/data/home.ts` with the exact coordinates.
- **Shareable links** — the address bar carries `#/lieu/<id>`, which opens straight onto a place.
- Responsive, keyboard accessible, light and dark themes.

## Photos

The source dataset only ships image *search* links, not images. The app therefore queries
[Wikimedia Commons](https://commons.wikimedia.org) from the browser — by name and by coordinates,
which is what covers the unnamed natural sites — and caches results in `localStorage` for two
weeks. Photos remain the property of their authors; the lightbox shows author and license. Places
with no freely licensed photo get a tinted cover plus external search links.

## Data

`src/data/recommandations.json` holds the source dataset (places, coordinates, opening hours, 2026
events, warnings, verification status). `src/data/places.ts` normalizes it and `src/data/taxonomy.ts`
maps each of the 42 categories to a universe, a label and an icon. To add or edit a place, edit the
JSON; add its `category` to the taxonomy if it is a new one.

Coordinates marked `approximate` in the dataset are landmarks, not parking entrances, and the sheet
says so. Opening hours and seasonal events should be rechecked 24-48 hours before setting off.

## Development

```bash
npm install
npm run dev      # dev server
npm run build    # type-check + production build to dist/
npm run preview  # serve the production build
npm run lint     # oxlint
```

### Smoke test

`scripts/smoke.mjs` drives the built app in headless Chromium: it counts markers, exercises the
marker → card → sheet path, the filters, the carousel-to-map sync, the collapsed state and the list
view, then writes screenshots to `screenshots/`. It needs Playwright, which is intentionally not a
dependency of this project:

```bash
npm i --no-save playwright
npm run preview &
npm run smoke
```

## Deployment

Pushing to `main` builds the app and publishes it to GitHub Pages via
`.github/workflows/deploy.yml`. The Vite `base` is `/Planfoy/`, matching the repository name;
override it with the `VITE_BASE` environment variable when serving from a different path.

Pages has to be enabled once by hand, before the first successful run: **Settings › Pages › Build
and deployment › Source → GitHub Actions**. The workflow token is not allowed to create the Pages
site itself (`Resource not accessible by integration`), only to deploy to an existing one.

## Credits

Map data © OpenStreetMap contributors · Relief tiles © OpenTopoMap (CC-BY-SA) · Satellite imagery
© Esri, Maxar, Earthstar Geographics · Photos from Wikimedia Commons, credited per image.
